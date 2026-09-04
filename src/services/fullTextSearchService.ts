/**
 * ============================================================================
 *  fullTextSearchService.ts — GĐ 4.2: tìm kiếm toàn văn (có fallback)
 * ============================================================================
 *
 *  Lớp dịch vụ phía trên `searchQuery.ts` (dựng tsquery an toàn) và migration
 *  `specs/022-chuan-hoa-nen-tang/migrations/001_full_text_search.sql`
 *  (unaccent + cột search_vector + GIN index + RPC vcomm_search_*).
 *
 *  🔴 NGUYÊN TẮC BẢO MẬT (không được phá vỡ):
 *     Chuỗi gửi xuống `to_tsquery` là CÚ PHÁP, KHÔNG PHẢI DỮ LIỆU → không thể
 *     bind parameter. MỌI đầu vào người dùng BẮT BUỘC đi qua `buildTsQuery()`
 *     (escape + bọc nháy đơn) trước khi tới RPC. Không bao giờ nối thô input.
 *     Phía DB còn một lớp chắn nữa: `vcomm_to_tsquery_safe()` trả về tsquery rỗng
 *     thay vì ném lỗi cú pháp.
 *
 *  🔧 FALLBACK (fail-soft, nhưng ồn ào):
 *     Migration 001 chưa được apply → RPC `vcomm_search_products` chưa tồn tại
 *     (PostgREST trả PGRST202). Khi đó service rơi về `.or(ilike...)` như cũ để
 *     chức năng KHÔNG CHẾT, đồng thời bắn cảnh báo. Lưu ý fallback:
 *       · KHÔNG bỏ dấu tiếng Việt → "ao thun" không tìm thấy "áo thun"
 *       · KHÔNG dùng index → seq scan, chậm
 *     → Fallback là băng keo cá nhân, APPLY MIGRATION để có tìm kiếm đúng.
 *
 *  Tại sao không dùng filter `?fts=` của PostgREST?
 *     PostgREST `fts` gọi `to_tsquery` trên giá trị thô, KHÔNG chạy `unaccent`
 *     → không giải được bài toán bỏ dấu. Ta tự dựng tsquery và gọi RPC.
 * ============================================================================
 */

import { supabase } from '../lib/supabase';
import { buildTsQuery, isSearchable, type SearchMode } from './searchQuery';

export const DEFAULT_TENANT_ID = 'tenant-vcomm-prod-01';

/**
 * Mã lỗi "RPC CHƯA TỒN TẠI" (tức migration chưa apply) → được phép fallback ILIKE.
 *   PGRST202 = PostgREST không tìm thấy function trong schema cache
 *   42883    = Postgres `undefined_function`
 * ⚠️ KHÔNG đưa PGRST301 (JWT expired) hay 42501 (permission denied) vào đây:
 *    đó là lỗi QUYỀN, fallback ILIKE rồi cũng 401/403 → chỉ làm chậm và che khuất
 *    nguyên nhân thật.
 */
const RPC_MISSING_CODES = new Set(['PGRST202', '42883']);

export interface SearchParams {
  /** Từ khoá NGƯỜI DÙNG gõ (chưa escape) — service tự escape. */
  term: string;
  tenantId?: string;
  limit?: number;
  offset?: number;
  /** 'and' (mặc định) · 'or' · 'prefix' (gõ tiếp). */
  mode?: SearchMode;
  /** Độ dài tối thiểu để chạy tìm kiếm (tránh query 1 ký tự quét bảng). */
  minLength?: number;
}

export interface RankedId {
  id: string;
  rank: number;
}

export interface SearchOutcome {
  ids: string[];
  /** Thứ tự đã xếp theo độ khớp (rank giảm dần). */
  ranked: RankedId[];
  /**
   * Tổng số bản ghi khớp (dùng cho phân trang). Chỉ có khi đi bằng FTS
   * (RPC trả `count(*) OVER()`). Fallback ILIKE để `undefined` → caller tự count.
   */
  total?: number;
  /** true = đi bằng FTS (GIN index, bỏ dấu) · false = fallback ILIKE hoặc rỗng. */
  usedFts: boolean;
  /** Lý do không dùng FTS (để log/telemetry). */
  reason?: 'empty_term' | 'below_min_length' | 'rpc_missing' | 'rpc_error' | 'no_results';
}

/* -------------------------------------------------------------------------- */
/*  Hàm thuần (test được, không cần DB)                                        */
/* -------------------------------------------------------------------------- */

/**
 * Escape giá trị dùng trong filter `.or('name.ilike.%v%,...')` của PostgREST.
 *
 * Hai rủi ro cần chặn:
 *  1. **VỠ CÚ PHÁP FILTER** — PostgREST phân tích `.or()` bằng DẤU PHẨY và các ký tự
 *     điều khiển `, . ( ) * : ' " \` → người dùng gõ "Dâu, Sữa" sẽ bị hiểu nhầm thành
 *     2 điều kiện riêng, hoặc trả 400.
 *  2. **MATCH-ALL** — nếu thay ký tự đặc biệt bằng `%` (wildcard), đầu vào chỉ gồm dấu
 *     phẩy (`",,"`) sẽ biến thành `%%` → ILIKE khớp TOÀN BỘ BẢNG. Đã từng mắc lỗi này.
 *
 * Cách xử lý: thay mỗi CHÙM ký tự đặc biệt bằng MỘT KHOẢNG TRẮNG, gom khoảng trắng
 * rồi trim → đầu vào toàn dấu câu cho ra chuỗi RỖNG (caller phải bỏ qua tìm kiếm).
 * Không dùng `%` thay thế để không bao giờ sinh ra wildcard từ input.
 */
export function escapePostgrestValue(value: string): string {
  return value
    .replace(/[,.*:()'"\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Dựng filter `.or()` cho nhiều cột, mỗi giá trị đã escape. */
export function buildIlikeFilter(columns: string[], term: string): string {
  const safe = escapePostgrestValue(term);
  if (!safe) return '';
  return columns.map((col) => `${col}.ilike.%${safe}%`).join(',');
}

/** Chuẩn hoá tham số trước khi gọi DB. */
export function normalizeSearchParams(p: SearchParams): {
  query: string;
  tenantId: string;
  limit: number;
  offset: number;
  mode: SearchMode;
} {
  return {
    query: buildTsQuery(p.term ?? '', { mode: p.mode ?? 'and' }),
    tenantId: p.tenantId || DEFAULT_TENANT_ID,
    limit: Math.max(1, Math.min(p.limit ?? 50, 200)),
    offset: Math.max(0, p.offset ?? 0),
    mode: p.mode ?? 'and',
  };
}

/* -------------------------------------------------------------------------- */
/*  Kiểu phụ thuộc (để test có thể inject, không cần Supabase thật)            */
/* -------------------------------------------------------------------------- */

export interface RpcResult {
  data: Array<{ id: string; rank: number | string | null; total_count?: number | string | null }> | null;
  error: { code?: string; message?: string } | null;
}

export interface IlikeResult {
  data: Array<{ id: string }> | null;
  error: { code?: string; message?: string } | null;
}

export interface SearchDeps {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<RpcResult>;
  ilike: (filter: string, limit: number, offset: number) => Promise<IlikeResult>;
  onFallback?: (reason: string, detail?: string) => void;
}

function isRpcMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code && RPC_MISSING_CODES.has(error.code)) return true;
  // Một số phiên bản PostgREST không trả code chuẩn → khớp theo thông điệp.
  return /could not find the function|function .* does not exist/i.test(error.message ?? '');
}

/* -------------------------------------------------------------------------- */
/*  Engine chính                                                              */
/* -------------------------------------------------------------------------- */

async function searchVia(
  rpcName: string,
  columns: string[],
  p: SearchParams,
  deps: SearchDeps
): Promise<SearchOutcome> {
  const minLength = p.minLength ?? 1;
  if (!isSearchable(p.term ?? '', minLength)) {
    return {
      ids: [],
      ranked: [],
      usedFts: false,
      reason: (p.term ?? '').trim().length > 0 ? 'below_min_length' : 'empty_term',
    };
  }

  const { query, tenantId, limit, offset } = normalizeSearchParams(p);
  if (!query) return { ids: [], ranked: [], usedFts: false, reason: 'empty_term' };

  const res = await deps.rpc(rpcName, {
    p_query: query,
    p_tenant: tenantId,
    p_limit: limit,
    p_offset: offset,
  });

  if (res.error && isRpcMissing(res.error)) {
    deps.onFallback?.('rpc_missing', `${rpcName}: ${res.error.message ?? ''}`);
    const filter = buildIlikeFilter(columns, p.term);
    if (!filter) return { ids: [], ranked: [], usedFts: false, reason: 'empty_term' };
    const fb = await deps.ilike(filter, limit, offset);
    if (fb.error) {
      deps.onFallback?.('rpc_error', fb.error.message ?? '');
      return { ids: [], ranked: [], usedFts: false, reason: 'rpc_error' };
    }
    const ids = (fb.data ?? []).map((r) => r.id).filter(Boolean);
    return {
      ids,
      ranked: ids.map((id) => ({ id, rank: 0 })),
      usedFts: false,
      reason: ids.length ? 'rpc_missing' : 'no_results',
    };
  }

  if (res.error) {
    deps.onFallback?.('rpc_error', res.error.message ?? '');
    return { ids: [], ranked: [], usedFts: false, reason: 'rpc_error' };
  }

  const ranked = (res.data ?? [])
    .filter((r) => !!r.id)
    .map((r) => ({ id: r.id, rank: Number(r.rank ?? 0) || 0 }))
    .sort((a, b) => b.rank - a.rank);

  // total_count nằm trên MỖI dòng (window count(*) OVER()) → lấy ở dòng đầu.
  const rawTotal = (res.data ?? [])[0]?.total_count;
  const total = rawTotal == null ? undefined : Number(rawTotal);

  return {
    ids: ranked.map((r) => r.id),
    ranked,
    total: Number.isFinite(total as number) ? (total as number) : undefined,
    usedFts: true,
    reason: ranked.length ? undefined : 'no_results',
  };
}

/* -------------------------------------------------------------------------- */
/*  API công khai — sản phẩm & khách hàng                                     */
/* -------------------------------------------------------------------------- */

const PRODUCT_COLUMNS = ['name', 'sku', 'barcode', 'brand', 'category'];
const CUSTOMER_COLUMNS = ['name', 'phone', 'email'];

export async function searchProducts(p: SearchParams, deps?: SearchDeps): Promise<SearchOutcome> {
  return searchVia('vcomm_search_products', PRODUCT_COLUMNS, p, deps ?? supabaseDeps('products'));
}

export async function searchCustomers(p: SearchParams, deps?: SearchDeps): Promise<SearchOutcome> {
  return searchVia('vcomm_search_customers', CUSTOMER_COLUMNS, p, deps ?? supabaseDeps('customers'));
}

/**
 * Deps thật dùng Supabase. Tách riêng để test inject giả lập được
 * (không cần kết nối, không treo như các test tích hợp cũ).
 */
export function supabaseDeps(table: 'products' | 'customers'): SearchDeps {
  return {
    rpc: async (fn, args) =>
      (await supabase.rpc(fn, args as never)) as unknown as RpcResult,
    ilike: async (filter, limit, offset) => {
      const res = await supabase
        .from(table)
        .select('id')
        .or(filter)
        .range(offset, offset + limit - 1);
      return res as unknown as IlikeResult;
    },
    onFallback: (reason, detail) => {
      // Cảnh báo ồn ào có chủ đích: fallback ILIKE là băng keo, phải apply migration.
      // eslint-disable-next-line no-console
      console.warn(`[GĐ 4.2][fullTextSearch] Rơi về ILIKE (${reason}). ${detail ?? ''}`.trim());
    },
  };
}
