/**
 * GĐ 2.3 — CACHE TẬP TRUNG (spec 022)
 * =============================================================================
 * Thay cho các biến module-level kiểu `let rulesCache = null` — vốn **sai khi
 * chạy hơn 1 instance**: mỗi instance giữ một bản sao, tự hết hạn vào thời điểm
 * riêng, và không invalidate được từ bên ngoài.
 *
 * KIẾN TRÚC 2 TẦNG
 * -----------------------------------------------------------------------------
 *   L1 — `MemoryCache` in-process: phục vụ hit nội bộ, KHÔNG query DB.
 *   L2 — bảng `cache_entries` trên Postgres (migration 004): nguồn chung cho
 *        mọi instance, đồng thời là kênh invalidate từ xa.
 *
 * ⚠️ NÓI THẬT VỀ LỢI ÍCH: với dữ liệu RẺ (1 query nhỏ), L2 **không nhanh hơn**
 *    bao nhiêu — vẫn tốn 1 round-trip DB. Giá trị thật của L2 nằm ở hai chỗ:
 *      (a) mọi instance nhìn CÙNG MỘT GIÁ TRỊ với cùng thời điểm hết hạn;
 *      (b) invalidate được TỪ XA — xóa 1 dòng là mọi instance mất cache ngay.
 *    Đừng dùng L2 để "tăng tốc". Hãy dùng để "đồng nhất".
 *
 * CỬA SỔ LỆCH (đọc kỹ trước khi chỉnh)
 * -----------------------------------------------------------------------------
 * L1 được cấp TTL ngắn (`min(ttl, L1_MAX_TTL_MS)`, mặc định 30s). Nghĩa là
 * **tối đa 30 giây** hai instance có thể trả hai giá trị khác nhau nếu dữ liệu
 * đổi mà KHÔNG gọi `invalidate()`. Muốn nhất quán ngay lập tức (vd admin sửa
 * thuế suất) → PHẢI gọi `invalidate()` / `invalidatePrefix()`.
 *
 * FAIL-SOFT
 * -----------------------------------------------------------------------------
 * Chưa chạy migration 004, mất mạng, RLS chặn → cache chỉ còn hoạt động ở L1.
 * KHÔNG BAO GIỜ ném lỗi ra ngoài: cache hỏng được phép, nhưng để sập luồng
 * tính tiền/xuất hóa đơn vì không đọc được cache thì KHÔNG được phép.
 *
 * RÀNG BUỘC GIÁ TRỊ
 * -----------------------------------------------------------------------------
 * Giá trị cache đi qua JSON. `Date` → chuỗi ISO, `Map`/`Set`/`undefined` → mất.
 * Producer PHẢI trả dữ liệu JSON-serializable.
 * =============================================================================
 */

import { MemoryCache } from './cache';

// -----------------------------------------------------------------------------
// Kiểu & hằng số
// -----------------------------------------------------------------------------

export interface RpcResult {
  data: unknown;
  error: unknown;
}

/**
 * Đăng ký lắng nghe thay đổi ở L2 để xóa ngay L1 của instance này.
 * Nhận callback `onRemoteChange(fullKey)`; trả hàm hủy đăng ký.
 *
 * Tại sao cần: `invalidate()` xóa được L2 của mọi instance, nhưng KHÔNG chạm
 * được L1 (bộ nhớ) của instance khác → chúng tiếp tục phục vụ dữ liệu cũ cho đến
 * khi L1 tự hết hạn. Với dữ liệu như thuế suất, "đợi 30 giây" là không ổn.
 * Realtime (Supabase đã bật sẵn) giải quyết đúng chỗ đó.
 */
export interface RemoteCacheChange {
  /** Khóa đầy đủ trong DB, dạng `t:<tenant>:<key>`. */
  key: string;
  /** Loại sự kiện Postgres. */
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | string;
}

export type InvalidationListener = (
  onRemoteChange: (change: RemoteCacheChange) => void
) => (() => void) | void;

export interface DistributedCacheDeps {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<RpcResult>;
  log?: (message: string, error?: unknown) => void;
  now?: () => number;
  tenantId?: string;
  /** Cung cấp để bật invalidate TỨC THÌ qua Realtime. Bỏ qua cũng không sao. */
  subscribe?: InvalidationListener;
}

export interface DistributedCacheOptions {
  /** Tenant — khóa cache được prefix theo tenant để không lộ sang tenant khác. */
  tenantId?: string;
  /** TTL mặc định (ms) khi caller không truyền. */
  ttlMs?: number;
  /** Trần TTL của L1 (ms) — chính là cửa sổ lệch tối đa giữa các instance. */
  l1MaxTtlMs?: number;
}

export const DEFAULT_TTL_MS = 5 * 60 * 1000;
export const L1_MAX_TTL_MS = 30 * 1000;
export const DEFAULT_TENANT = 'tenant-vcomm-prod-01';

/**
 * Cửa sổ (ms) bỏ qua sự kiện Realtime do CHÍNH instance này vừa gây ra.
 * 3s là đủ cho một round-trip Realtime bình thường; đặt quá nhỏ → tự xóa mất
 * L1 của mình, đặt quá lớn → bỏ sót thay đổi thật của instance khác.
 */
export const SELF_ECHO_WINDOW_MS = 3_000;

/**
 * Mã lỗi nghĩa là "chưa chạy migration 004" → tắt hẳn L2, chỉ dùng L1.
 *
 * ⚠️ CỐ Ý KHÔNG liệt kê `PGRST301` (JWT hết hạn) hay `42501` (permission denied
 * cho table): đó là lỗi CẤU HÌNH/PHÂN QUYỀN, nếu nuốt sẽ biến thành "cache im
 * lặng không hoạt động" mà không ai biết. Phải để nó ồn ào.
 */
const MISSING_MIGRATION_CODES = new Set(['PGRST202', '42883', '42P01', 'PGRST205']);

export function isMigrationMissing(error: unknown): boolean {
  if (!error) return false;
  const code =
    (error as { code?: string })?.code ??
    (error as { error?: { code?: string } })?.error?.code ??
    '';
  if (typeof code === 'string' && MISSING_MIGRATION_CODES.has(code)) return true;
  // Phòng khi PostgREST trả message thay vì code.
  const message = String((error as { message?: string })?.message ?? '');
  return /vcomm_cache_get|relation "cache_entries"|does not exist/i.test(message);
}

/** TTL thực tế của L1 — không vượt quá trần, để giới hạn cửa sổ lệch. */
export function l1TtlOf(ttlMs: number, l1MaxTtlMs: number = L1_MAX_TTL_MS): number {
  const safe = Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : DEFAULT_TTL_MS;
  return Math.max(1, Math.min(safe, l1MaxTtlMs));
}

// -----------------------------------------------------------------------------
// Lớp cache
// -----------------------------------------------------------------------------

export class DistributedCache {
  private readonly l1: MemoryCache<unknown>;
  private readonly deps: DistributedCacheDeps;
  private readonly tenantId: string;
  private readonly ttlMs: number;
  private readonly l1MaxTtlMs: number;
  /** Single-flight: nhiều caller cùng key → producer chỉ chạy 1 lần. */
  private readonly inFlight = new Map<string, Promise<unknown>>();
  /** Đã phát hiện thiếu migration → không thử L2 nữa (tránh spam RPC mỗi request). */
  private l2Disabled = false;
  /** Hủy đăng ký Realtime (gọi khi không dùng cache nữa). */
  private detach: (() => void) | null = null;
  /**
   * Key → thời điểm CHÍNH instance này vừa ghi L2.
   *
   * ⚠️ BẮT BUỘC: Realtime phát lại sự kiện cho CẢ người gây ra nó. Nếu không
   * chặn, instance A ghi L2 → nhận lại sự kiện của chính mình → xóa L1 vừa ghi
   * → hit L1 không bao giờ xảy ra, cache mất tác dụng. (Lỗi này đã bị test bắt
   * được khi viết: "hit L1 → KHÔNG query L2" đỏ.)
   */
  private readonly selfEcho = new Map<string, number>();

  constructor(deps: DistributedCacheDeps, options: DistributedCacheOptions = {}) {
    this.deps = deps;
    this.tenantId = options.tenantId ?? deps.tenantId ?? DEFAULT_TENANT;
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.l1MaxTtlMs = options.l1MaxTtlMs ?? L1_MAX_TTL_MS;
    this.l1 = new MemoryCache<unknown>({ ttlMs: this.l1MaxTtlMs, maxEntries: 1000 });
    if (deps.subscribe) this.attachInvalidationListener(deps.subscribe);
  }

  /**
   * Lắng nghe thay đổi ở L2 → xóa L1 của instance này ngay lập tức.
   *
   * Bổ sung cho L1 TTL ngắn: TTL là LƯỚI AN TOÀN khi Realtime mất kết nối,
   * còn đường chính là invalidate tức thì qua sự kiện.
   */
  attachInvalidationListener(subscribe: InvalidationListener): void {
    if (this.detach) this.detach();
    const prefix = `t:${this.tenantId}:`;
    const unsubscribe = subscribe((change) => {
      const fullKey = change?.key;
      if (typeof fullKey !== 'string' || !fullKey.startsWith(prefix)) return;
      const key = fullKey.slice(prefix.length);

      // ⚠️ CHỈ chặn echo với INSERT/UPDATE — tức là tiếng vang do CHÍNH MÌNH
      // vừa ghi (`vcomm_cache_set`). DELETE **không bao giờ** bị chặn:
      // DELETE chỉ sinh ra từ `invalidate()`/`invalidatePrefix()`/`prune()`,
      // tức là hành động chủ động của instance KHÁC muốn xóa cache — nếu nuốt
      // nó thì mất đúng tính năng cốt lõi ("admin sửa thuế → mọi instance cập
      // nhật ngay"). Test "vẫn NHẬN invalidate từ instance khác" khóa chặt điều này.
      if (change.eventType !== 'DELETE') {
        const own = this.selfEcho.get(key);
        if (own != null && Date.now() - own < SELF_ECHO_WINDOW_MS) return;
      }

      this.l1.delete(key);
    });
    if (typeof unsubscribe === 'function') this.detach = unsubscribe;
  }

  /** Ngừng lắng nghe Realtime. */
  dispose(): void {
    if (this.detach) {
      this.detach();
      this.detach = null;
    }
  }

  // -- L2 (Postgres) ----------------------------------------------------------

  private async l2Get(key: string): Promise<unknown> {
    if (this.l2Disabled) return undefined;
    try {
      const res = await this.deps.rpc('vcomm_cache_get', {
        p_key: key,
        p_tenant_id: this.tenantId,
      });
      if (res?.error) {
        if (isMigrationMissing(res.error)) {
          this.l2Disabled = true;
          this.deps.log?.('[cache] Chưa chạy migration 004 → chỉ dùng L1 (in-process)', res.error);
        } else {
          this.deps.log?.('[cache] Lỗi đọc L2, dùng L1', res.error);
        }
        return undefined;
      }
      return res?.data ?? undefined;
    } catch (error) {
      this.deps.log?.('[cache] Lỗi đọc L2 (bỏ qua)', error);
      return undefined;
    }
  }

  private async l2Set(key: string, value: unknown, ttlMs: number): Promise<void> {
    if (this.l2Disabled) return;
    // Ghi nhận trước khi gọi RPC: sự kiện Realtime có thể về ngay lập tức.
    this.selfEcho.set(key, Date.now());
    try {
      const res = await this.deps.rpc('vcomm_cache_set', {
        p_key: key,
        p_value: value as never,
        p_ttl_seconds: Math.max(1, Math.ceil(ttlMs / 1000)),
        p_tenant_id: this.tenantId,
      });
      if (res?.error) {
        if (isMigrationMissing(res.error)) {
          this.l2Disabled = true;
          this.deps.log?.('[cache] Chưa chạy migration 004 → chỉ dùng L1 (in-process)', res.error);
        } else {
          this.deps.log?.('[cache] Lỗi ghi L2, giá trị vẫn nằm ở L1', res.error);
        }
      }
    } catch (error) {
      this.deps.log?.('[cache] Lỗi ghi L2 (bỏ qua)', error);
    }
  }

  // -- API công khai ----------------------------------------------------------

  /**
   * Đọc cache; nếu miss thì gọi `producer`, lưu cả L1 và L2 rồi trả kết quả.
   * Single-flight: N request đồng thời cùng key → producer chạy ĐÚNG 1 lần.
   *
   * Producer ném lỗi → lỗi được NÉM TIẾP (không nuốt): đây là lỗi NGHIỆP VỤ,
   * không phải lỗi cache. Chỉ lỗi cache mới bị nuốt.
   */
  async getOrSet<T>(key: string, producer: () => Promise<T>, ttlMs?: number): Promise<T> {
    const effectiveTtl = ttlMs ?? this.ttlMs;

    const fromL1 = this.l1.get(key);
    if (fromL1 !== undefined) return fromL1 as T;

    const existing = this.inFlight.get(key);
    if (existing) return existing as Promise<T>;

    const run = (async (): Promise<T> => {
      const fromL2 = await this.l2Get(key);
      if (fromL2 !== undefined) {
        this.l1.set(key, fromL2, l1TtlOf(effectiveTtl, this.l1MaxTtlMs));
        return fromL2 as T;
      }

      const value = await producer();
      if (value !== undefined) {
        this.l1.set(key, value, l1TtlOf(effectiveTtl, this.l1MaxTtlMs));
        await this.l2Set(key, value, effectiveTtl);
      }
      return value;
    })();

    this.inFlight.set(key, run as Promise<unknown>);
    try {
      return await run;
    } finally {
      this.inFlight.delete(key);
    }
  }

  /**
   * Xóa 1 key ở CẢ L1 lẫn L2 → mọi instance mất cache ngay lập tức.
   * Đây là hàm phải gọi sau khi sửa dữ liệu gốc (vd admin đổi thuế suất).
   */
  async invalidate(key: string): Promise<boolean> {
    this.l1.delete(key);
    if (this.l2Disabled) return false;
    try {
      const res = await this.deps.rpc('vcomm_cache_del', {
        p_key: key,
        p_tenant_id: this.tenantId,
      });
      if (res?.error) {
        this.deps.log?.('[cache] Lỗi invalidate L2 (L1 đã xóa)', res.error);
        return false;
      }
      return res?.data === true;
    } catch (error) {
      this.deps.log?.('[cache] Lỗi invalidate L2 (L1 đã xóa)', error);
      return false;
    }
  }

  /** Xóa hàng loạt theo prefix (vd `tax_rules:`), CẢ L1 lẫn L2. */
  async invalidatePrefix(prefix: string): Promise<number> {
    let removedL1 = 0;
    for (const key of this.l1.keys()) {
      if (key.startsWith(prefix)) {
        this.l1.delete(key);
        removedL1 += 1;
      }
    }
    if (this.l2Disabled) return removedL1;
    try {
      const res = await this.deps.rpc('vcomm_cache_del_prefix', {
        p_prefix: prefix,
        p_tenant_id: this.tenantId,
      });
      if (res?.error) {
        this.deps.log?.('[cache] Lỗi invalidatePrefix L2 (L1 đã xóa)', res.error);
        return removedL1;
      }
      return removedL1 + (typeof res?.data === 'number' ? res.data : 0);
    } catch (error) {
      this.deps.log?.('[cache] Lỗi invalidatePrefix L2 (L1 đã xóa)', error);
      return removedL1;
    }
  }

  /** Dọn bản ghi L2 hết hạn. Gọi định kỳ (cron) — không gọi trong request. */
  async prune(limit = 10_000): Promise<number> {
    if (this.l2Disabled) return 0;
    try {
      const res = await this.deps.rpc('vcomm_cache_prune', { p_limit: limit });
      if (res?.error) {
        this.deps.log?.('[cache] Lỗi prune L2', res.error);
        return 0;
      }
      return typeof res?.data === 'number' ? res.data : 0;
    } catch (error) {
      this.deps.log?.('[cache] Lỗi prune L2', error);
      return 0;
    }
  }

  /** Đang chạy được L2 hay không (để hiển thị ở trang chẩn đoán). */
  isL2Available(): boolean {
    return !this.l2Disabled;
  }
}

// -----------------------------------------------------------------------------
// Factory
// -----------------------------------------------------------------------------

/**
 * Deps mặc định: client Supabase của trình duyệt.
 * Import LAZY — `lib/supabase` đọc `import.meta.env`, sẽ nổ trong môi trường Node.
 */
export async function defaultDistributedCacheDeps(): Promise<DistributedCacheDeps> {
  const { supabase } = await import('./supabase');
  return {
    rpc: async (fn, args) => (await supabase.rpc(fn, args as never)) as unknown as RpcResult,
    log: (message, error) => {
      if (typeof console !== 'undefined') console.warn(message, error ?? '');
    },
    /**
     * Realtime: bất kỳ instance nào xóa/sửa một dòng `cache_entries` → mọi
     * instance đang lắng nghe xóa ngay key đó khỏi L1.
     *
     * ⚠️ Điều kiện: migration 004 phải có câu
     * `ALTER PUBLICATION supabase_realtime ADD TABLE public.cache_entries;`
     * và Realtime phải được bật cho bảng. Thiếu → chỉ còn lưới an toàn là L1 TTL.
     *
     * Lắng nghe cả DELETE lẫn UPDATE: `vcomm_cache_set` dùng upsert nên việc
     * đổi giá trị cũng sinh UPDATE — cần bỏ cache cũ đi ngay.
     */
    subscribe: (onRemoteChange) => {
      const channel = supabase
        .channel('vcomm-cache-invalidation')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'cache_entries' },
          (payload: any) => {
            const key = payload?.old?.key ?? payload?.new?.key;
            if (key) onRemoteChange({ key: String(key), eventType: payload?.eventType ?? '' });
          }
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    },
  };
}

let cachedInstance: DistributedCache | null = null;

/** Instance dùng chung cho toàn app (singleton, lazy). */
export async function getDistributedCache(
  options?: DistributedCacheOptions
): Promise<DistributedCache> {
  if (!cachedInstance) {
    cachedInstance = new DistributedCache(await defaultDistributedCacheDeps(), options);
  }
  return cachedInstance;
}

/** Test/SSR: thay instance (hoặc truyền `null` để reset). */
export function setDistributedCache(instance: DistributedCache | null): void {
  cachedInstance = instance;
}
