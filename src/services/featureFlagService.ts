/**
 * ============================================================================
 *  featureFlagService.ts — GĐ 3.2: Feature flag HAI LỚP (DB đè lên config)
 * ============================================================================
 *
 *  🚨 VÌ SAO LẠI CÓ "HAI LỚP" — đọc trước khi dùng, kẻo tưởng là trùng lặp.
 *
 *  Đã có sẵn `src/config/featureFlags.ts` (đang nối vào `accountingService` qua
 *  `isTt99BridgeEnabled()`). Module đó là **ĐỒNG BỘ**, đọc ENV + override +
 *  mặc định, có rollout % theo tenant. Nhược điểm duy nhất: **muốn đổi phải
 *  deploy**.
 *
 *  Bảng `feature_flags` (migration `003_feature_flags.sql`) sinh ra để đổi flag
 *  KHÔNG CẦN deploy, theo từng tenant. Hai bên được gộp làm MỘT ở đây:
 *
 *  ```
 *   ① DB (mỗi tenant, đổi không cần deploy)  ──► có hàng: BẬT / TẮT  (xong)
 *                                              └─ không có hàng: NULL
 *   ② src/config/featureFlags.ts (env + override + mặc định)  ◄── NULL
 *   ③ Cả hai đều không biết  ──► false (FAIL-CLOSED)
 *  ```
 *
 *  ⭐ HỆ QUẢ CỰC KỲ QUAN TRỌNG CỦA THIẾT KẾ NÀY:
 *    Chạy migration 003 **KHÔNG** làm thay đổi hành vi hiện tại, vì các flag
 *    đang chạy (`tt99_bridge`) **không được seed** → DB trả NULL → lớp config
 *    tiếp tục quyết định như cũ.
 *    (Ngược lại, nếu RPC trả `false` cho flag chưa khai báo thì chỉ cần chạy
 *    migration là TẮT SẠCH mọi tính năng — đúng là thảm họa rollout.)
 *
 *  ⭐ CACHE 30 GIÂY:
 *    Flag thường được hỏi trong render; nếu mỗi lần 1 request thì một trang có
 *    10 flag sẽ sinh 10 request mỗi lần mở. Cache làm mờ đi nhưng vẫn đủ nhanh:
 *    đổi flag trên Supabase → hiệu lực trong vòng 30 giây.
 *    ⚠️ Không cache kết quả "rơi về lớp ②": nếu cache lại, một lỗi tạm thời
 *    (mất mạng) sẽ đóng băng flag dù DB thực sự đang bật.
 *
 *  🔧 Module KHÔNG import `../lib/supabase` ở top-level (import động trong
 *     `defaultFeatureFlagDeps()`) để giữ test offline được.
 * ============================================================================
 */

import { defaultCache } from '../lib/cache';
import { depsFromClient, type OutboxDeps } from './domainEventService';
import { isEnabled as isEnabledLocally } from '../config/featureFlags';

/* -------------------------------------------------------------------------- */
/*  Tên flag — ⚠️ PHẢI TRÙNG với key trong `src/config/featureFlags.ts`        */
/* -------------------------------------------------------------------------- */

export const FEATURE_FLAGS = {
  /** Ghi lưu vết Điều 28 (TT99) song song. Đang mặc định BẬT ở lớp config. */
  TT99_BRIDGE: 'tt99_bridge',
  /** Hóa đơn điện tử thật. Cần hợp đồng MISA/VNPT + đăng ký BC22 với CQT. */
  EINVOICE: 'einvoice',
  /** Khấu trừ thuế hộ người bán (NĐ 252/2026 Điều 43.1 + 44). Cần KYC. */
  PLATFORM_TAX_WITHHOLDING: 'platform_tax_withholding',
} as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

/** TTL cache: đổi flag trên Supabase → hiệu lực trong vòng 30 giây. */
export const FLAG_CACHE_TTL_MS = 30_000;

function cacheKeyOf(key: string, tenantId: string, subject: string | null): string {
  return `flag:${tenantId}:${subject ?? '*'}:${key}`;
}

export interface IsEnabledOptions {
  tenantId?: string | null;
  /** Mã user để chia bucket canary. Bỏ trống = đánh giá cấp tenant. */
  subject?: string | null;
  /**
   * Giá trị khi CẢ HAI lớp đều không trả lời được. Mặc định **false**
   * (fail-closed). Chỉ truyền `true` cho flag dùng để TẮT một tính năng đã
   * chạy ổn định lâu năm.
   */
  fallback?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Deps                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Feature flag chỉ cần năng lực `rpc` + `log` — đúng hình dạng `FeatureFlagDeps`.
 * Đặt alias để chỗ dùng không mang tên outbox (dễ hiểu nhầm là phụ thuộc GĐ 2.1;
 * thực ra hai module độc lập, chỉ chung kiểu hàm).
 */
export type FeatureFlagDeps = OutboxDeps;

let cachedDeps: FeatureFlagDeps | null = null;

/** Deps mặc định: client Supabase của trình duyệt. */
export async function defaultFeatureFlagDeps(): Promise<FeatureFlagDeps> {
  if (cachedDeps) return cachedDeps;
  const { supabase } = await import('../lib/supabase');
  cachedDeps = depsFromClient(supabase);
  return cachedDeps;
}

export function setFeatureFlagDeps(deps: FeatureFlagDeps | null): void {
  cachedDeps = deps;
}

/* -------------------------------------------------------------------------- */
/*  Lớp ② — config nội bộ (env + override + mặc định)                        */
/* -------------------------------------------------------------------------- */

/**
 * Hỏi lớp config. Trả `undefined` khi flag CHƯA được đăng ký ở đó
 * (module config ném lỗi trong trường hợp này — ta đổi thành undefined để
 * không làm gãy màn hình, và không nuốt luôn các lỗi khác).
 */
function askLocalConfig(key: string, tenantId: string): boolean | undefined {
  try {
    return isEnabledLocally(key, { tenantId });
  } catch (err: unknown) {
    if (err instanceof Error && /chưa được đăng ký/.test(err.message)) return undefined;
    // Lỗi khác (ENV gõ sai giá trị…) → coi như không biết, KHÔNG ném ra render.
    return undefined;
  }
}

/**
 * Lớp ① (DB) chỉ dùng được khi có client Supabase.
 *
 * ⚠️ Không tự tạo client trong môi trường KHÔNG PHẢI TRÌNH DUYỆT (test, SSR,
 *    Node): nếu tự tạo, mỗi bài test gọi đến flag sẽ sinh một request mạng thật
 *    → test chậm, flaky, và có thể ghi nhầm lên project Supabase thật.
 *    Ở môi trường đó flag do lớp ② (env + override) quyết định — là đủ.
 *    Muốn layer DB ở server, truyền `deps` tường minh.
 */
function canUseDbLayer(deps?: FeatureFlagDeps): boolean {
  if (deps) return true;
  return typeof window !== 'undefined';
}

/* -------------------------------------------------------------------------- */
/*  API                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Flag có bật không? KHÔNG BAO GIỜ ném lỗi — lỗi đọc flag không được làm gãy
 * màn hình đang render.
 */
export async function isFeatureEnabled(
  key: FeatureFlagKey | string,
  opts: IsEnabledOptions = {},
  deps?: FeatureFlagDeps
): Promise<boolean> {
  const tenantId = opts.tenantId || 'tenant-vcomm-prod-01';
  const subject = opts.subject ?? null;
  const fallback = opts.fallback ?? false;
  const cacheKey = cacheKeyOf(key, tenantId, subject);

  // `MemoryCache.get()` KHÔNG phải hàm generic — kiểu được gán khi tạo instance.
  // Cache này chỉ lưu boolean (xem các nhánh `set` bên dưới) → ép kiểu an toàn.
  const cached = defaultCache.get(cacheKey) as boolean | undefined;
  if (cached !== undefined) return cached;

  if (!canUseDbLayer(deps)) {
    const local = askLocalConfig(key, tenantId);
    return local === undefined ? fallback : local;
  }

  try {
    const client = deps ?? (await defaultFeatureFlagDeps());
    const res = await client.rpc('vcomm_feature_flag', {
      p_flag_key: key,
      p_tenant_id: tenantId,
      p_subject: subject,
    });

    if (!res?.error) {
      const dbValue = res?.data;
      if (dbValue === true || dbValue === 'true' || dbValue === 't') {
        defaultCache.set(cacheKey, true, FLAG_CACHE_TTL_MS);
        return true;
      }
      if (dbValue === false || dbValue === 'false' || dbValue === 'f') {
        defaultCache.set(cacheKey, false, FLAG_CACHE_TTL_MS);
        return false;
      }
      // NULL / undefined = flag CHƯA KHAI BÁO trong DB → rơi xuống lớp ②
    }

    // Không có câu trả lời từ DB (chưa khai báo / chưa chạy migration / lỗi)
    // → hỏi lớp config. ⚠️ KHÔNG cache nhánh này (xem chú thích đầu file).
    const local = askLocalConfig(key, tenantId);
    return local === undefined ? fallback : local;
  } catch {
    return fallback;
  }
}

/**
 * Đọc NHIỀU flag cùng lúc — tránh N request khi một trang dùng nhiều flag.
 */
export async function areFeaturesEnabled(
  keys: ReadonlyArray<FeatureFlagKey | string>,
  opts: IsEnabledOptions = {},
  deps?: FeatureFlagDeps
): Promise<Record<string, boolean>> {
  const entries = await Promise.all(
    keys.map(async (k) => [k, await isFeatureEnabled(k, opts, deps)] as const)
  );
  return Object.fromEntries(entries);
}

/** Xoá cache flag — gọi ngay sau khi đổi flag để thấy kết quả lập tức. */
export function clearFeatureFlagCache(): void {
  defaultCache.clear();
}
