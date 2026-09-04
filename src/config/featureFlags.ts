/**
 * ============================================================================
 *  featureFlags.ts — GĐ 4.3: feature flag (rollout theo tenant)
 * ============================================================================
 *
 *  Vấn đề: các công tắc nhạy cảm (vd `TT99_BRIDGE_ENABLED`) đang là HẰNG SỐ biên dịch →
 *  muốn bật cho một tenant phải deploy lại, và không thể rollout dần để quan sát rủi ro.
 *
 *  Module này cung cấp:
 *   - Đăng ký flag có mô tả + giá trị mặc định (`defineFlag`).
 *   - Bật/tắt theo: override runtime (admin/test) → biến môi trường → mặc định.
 *   - **Rollout theo % tenant**: `VCOMM_FLAG_TT99_BRIDGE=25` → bật cho 25% tenant,
 *     dùng hash ỔN ĐỊNH (cùng tenant luôn cùng quyết định, không bị nhảy giữa các lần gọi).
 *   - ⚠️ Flag chưa đăng ký → NÉM lỗi. Tránh lỗi chính tả bị hiểu ngầm là "tắt".
 *
 *  Quy ước tên biến môi trường: `VCOMM_FLAG_<KEY_UPPERCASE_WITH_UNDERSCORE>`.
 *    - 'true' / 'false'  → bật/tắt toàn bộ
 *    - số 0..100         → rollout theo % tenant
 *
 *  Lưu ý: đây là quyết định KỸ THUẬT (rollout an toàn), không thay đổi nghĩa vụ pháp lý.
 *  Dùng sai flag không được phép làm sai lệch sổ cái — chỉ quyết định CÓ GHI THÊM
 *  lưu vết TT99 hay không.
 * ============================================================================
 */

export interface FlagDefinition {
  key: string;
  description: string;
  /** Giá trị khi không có env/override. */
  defaultValue: boolean;
}

/** Ngữ cảnh quyết định — luôn truyền tenantId khi có thể. */
export interface FlagContext {
  tenantId?: string | null;
}

const registry = new Map<string, FlagDefinition>();
const overrides = new Map<string, boolean | number>();

/** Đăng ký flag. Ghi đè nếu key đã tồn tại. */
export function defineFlag(def: FlagDefinition): void {
  registry.set(def.key, def);
}

/** Liệt kê flag đã đăng ký (trang admin). */
export function listFlags(): FlagDefinition[] {
  return [...registry.values()];
}

/**
 * Ghi đè runtime (admin bật/tắt, test). Truyền `undefined` để xoá override.
 * Có thể truyền số 0..100 để rollout theo %.
 */
export function setOverride(key: string, value: boolean | number | undefined): void {
  if (value === undefined) overrides.delete(key);
  else overrides.set(key, value);
}

/** Xoá toàn bộ override (dọn dẹp giữa các test). */
export function resetOverrides(): void {
  overrides.clear();
}

/** Tiền tố env. */
const ENV_PREFIX = 'VCOMM_FLAG_';

/** Hash ổn định (FNV-1a 32-bit) → bucket 0..99. Cùng tenant luôn cùng bucket. */
function bucketOf(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % 100;
}

function readEnv(key: string): boolean | number | undefined {
  const raw = process.env[ENV_PREFIX + key.toUpperCase().replace(/-/g, '_')];
  if (raw === undefined || raw === '') return undefined;
  const lower = raw.trim().toLowerCase();
  if (lower === 'true' || lower === '1' || lower === 'on') return true;
  if (lower === 'false' || lower === '0' || lower === 'off') return false;
  const pct = Number(lower);
  if (!Number.isNaN(pct) && pct >= 0 && pct <= 100) return pct;
  // Giá trị rác → ném để không âm thầm hiểu sai
  throw new Error(
    `Giá trị feature flag không hợp lệ: ${ENV_PREFIX}${key.toUpperCase()}='${raw}'. ` +
    `Dùng true/false hoặc số 0..100 (rollout %).`,
  );
}

/**
 * Quyết định flag có bật không.
 *  Thứ tự ưu tiên: override → env → mặc định.
 *  ⚠️ Flag chưa đăng ký → NÉM (tránh typo bị hiểu là false).
 */
export function isEnabled(key: string, ctx: FlagContext = {}): boolean {
  const def = registry.get(key);
  if (!def) {
    throw new Error(
      `Feature flag '${key}' chưa được đăng ký. Gọi defineFlag() khi khởi tạo ứng dụng. ` +
      `Đã đăng ký: [${[...registry.keys()].join(', ')}].`,
    );
  }

  const raw = overrides.has(key) ? overrides.get(key) : readEnv(key);
  if (raw === undefined) return def.defaultValue;
  if (typeof raw === 'boolean') return raw;

  // Rollout theo % — cần tenantId. Không có tenantId → KHÔNG bật (an toàn:
  // không bật ngầm cho mọi tenant khi thiếu ngữ cảnh).
  const tenantId = ctx.tenantId;
  if (!tenantId) return false;
  if (raw <= 0) return false;
  if (raw >= 100) return true;
  return bucketOf(tenantId) < raw;
}

// ─────────────────────────────────────────────────────────────────────────────
// Các flag của hệ thống
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ghi lưu vết TT99 (Điều 28) song song khi ghi sổ cái.
 *  Mặc định `true` để GIỮ NGUYÊN hành vi hiện tại của `TT99_BRIDGE_ENABLED`.
 *  Rollout an toàn: đặt `VCOMM_FLAG_TT99_BRIDGE=25` để bật cho 25% tenant,
 *  quan sát rủi ro rồi tăng dần lên 100.
 */
export const FLAG_TT99_BRIDGE = 'tt99_bridge';

defineFlag({
  key: FLAG_TT99_BRIDGE,
  description:
    'Ghi lưu vết Điều 28 (TT99) song song khi ghi sổ cái. Rollout theo % tenant: VCOMM_FLAG_TT99_BRIDGE=0..100.',
  defaultValue: true,
});

/** Tiện ích: TT99 bridge có bật cho tenant này không. */
export function isTt99BridgeEnabled(tenantId?: string | null): boolean {
  return isEnabled(FLAG_TT99_BRIDGE, { tenantId });
}
