/**
 * GĐ 2.6 — CHUẨN HÓA AUDIT TRAIL  (spec 022)
 * =============================================================================
 * MỤC TIÊU CỦA SPEC: "Gộp về một writer và một định dạng, tránh 2 nơi".
 *
 * ── Thực trạng trước khi chuẩn hóa (đã rà toàn bộ `src/`) ───────────────────
 * Có 4 nơi nhận bản ghi audit, 3 định dạng khác nhau:
 *
 *   1. `admin_audit_logs`    ← AuthContext.logAdminAudit, RequestHub
 *   2. `tenant_audit_logs`   ← AuthContext (qua subcollection
 *                              `tenants/{id}/audit_logs`) · ĐỌC bởi Settings.tsx
 *   3. `audit_logs`          ← hooks/useAuditLog · ĐỌC bởi ActivityFeed.tsx
 *   4. `acc_audit_log`       ← TRIGGER Postgres (chuỗi băm SHA256, TT99 Điều 28)
 *                             · ĐỌC bởi services/tt99Service.ts
 *
 * ── Quyết định ──────────────────────────────────────────────────────────────
 *
 * (A) (1) và (2) GỘP THÀNH MỘT. Hai bảng này có **schema Y HỆT NHAU và policy
 *     RLS Y HỆT NHAU** (xem migration 008_audit_tenants.sql dòng 19-20 và 53-55:
 *     cùng `USING (tenant_id = jwt.tenant_id OR tenant_id = 'tenant-vcomm-prod-01')`).
 *     Nghĩa là comment cũ trong AuthContext — "Log to nested tenant subcollection
 *     for isolated Zero-Trust access checks" — **không đúng sự thật**: ghi cả 2
 *     bảng không tạo thêm bất kỳ cách ly nào, chỉ nhân đôi dữ liệu và nhân đôi
 *     cơ hội lệch pha (bảng này ghi được, bảng kia lỗi).
 *     → Chọn `tenant_audit_logs` làm **sink duy nhất** vì nó là bảng CÓ NGƯỜI ĐỌC
 *       (Settings.tsx). `admin_audit_logs` hiện **không có reader nào** trong code.
 *     → Vẫn giữ công tắc `AUDIT_MIRROR_TO_ADMIN_LOGS` (mặc định `false`) để bật
 *       lại ngay nếu sau này có job/BI đang đọc trực tiếp `admin_audit_logs`.
 *
 * (B) (3) GIỮ RIÊNG nhưng **cùng writer, cùng định dạng**. Đây là activity feed
 *     (ai tạo đơn, ai sửa sản phẩm…) — khác mục đích với nhật ký an ninh
 *     (đăng nhập, luân chuyển chứng từ). Trộn chung sẽ làm Settings.tsx đầy rác
 *     và ActivityFeed lộ thông tin đăng nhập. Hai sink, MỘT định dạng.
 *
 * (C) (4) `acc_audit_log` **KHÔNG gộp**, cố ý. Đây là chuỗi băm append-only do
 *     TRIGGER Postgres duy trì (`hash = SHA256(prev_hash || payload)`, migration
 *     018). Ghi từ tầng ứng dụng sẽ **phá vỡ chuỗi băm** — mất luôn bằng chứng
 *     toàn vẹn mà TT99 Điều 28(1) yêu cầu. Muốn ghi nhận thêm từ app thì dùng cột
 *     `reason`/`actor` của chính bảng đó qua SQL, không qua writer này.
 *
 * ── Nguyên tắc chung ────────────────────────────────────────────────────────
 * · **Fail-soft**: `recordAudit()` KHÔNG BAO GIỜ ném lỗi. Audit hỏng được phép,
 *   nhưng chặn luồng nghiệp vụ (đăng nhập, duyệt đơn) vì không ghi được log thì
 *   KHÔNG được phép.
 * · **Pure + injectable**: `normalizeAudit` / `detectBrowser` là hàm thuần.
 *   Mọi I/O (ghi DB, lấy IP, đọc navigator) đều inject qua `AuditDeps` để test
 *   được mà không cần mạng.
 * · Thời gian lấy từ `deps.now()` — không gọi `new Date()` ngầm, để test xác định.
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// Hằng số & kiểu
// -----------------------------------------------------------------------------

/** Tenant mặc định — khớp giá trị mặc định trong các migration. */
export const DEFAULT_AUDIT_TENANT = 'tenant-vcomm-prod-01';

/**
 * Hai sink còn lại sau khi chuẩn hóa.
 * · `security` — nhật ký an ninh/quản trị (đăng nhập, phân quyền, luân chuyển).
 * · `activity` — nhật ký hoạt động nghiệp vụ (tạo/sửa đơn, sản phẩm…).
 */
export type AuditSink = 'security' | 'activity';

export const AUDIT_SINK_TABLE: Record<AuditSink, string> = {
  security: 'tenant_audit_logs',
  activity: 'audit_logs',
};

/**
 * Công tắc tương thích ngược: ghi MIRROR sang `admin_audit_logs` (bảng cũ, hiện
 * không có reader trong code). Mặc định TẮT — xem mục (A) ở đầu file.
 * Bật lại bằng cách set = true nếu có job/BI đọc trực tiếp bảng đó.
 */
export const AUDIT_MIRROR_TO_ADMIN_LOGS = false;

export type AuditStatus = 'Success' | 'Failed';

/** Nguồn sinh bản ghi — để truy vết ai (module nào) sinh log. */
export type AuditSource = 'auth' | 'workflow' | 'app' | string;

export interface AuditActor {
  email?: string | null;
  uid?: string | null;
  name?: string | null;
}

export interface AuditInput {
  /** Mã hành động, dạng `domain.verb` — vd `auth.login`, `request.routed`. */
  action: string;
  status?: AuditStatus;
  source?: AuditSource;
  actor?: AuditActor;
  tenantId?: string | null;
  /** Đối tượng bị tác động (id đơn hàng, id chứng từ…). */
  targetId?: string | null;
  /** Tên hiển thị của đối tượng — để đọc log không cần join. */
  targetLabel?: string | null;
  /** Thông tin bổ sung. KHÔNG đưa dữ liệu nhạy cảm (mật khẩu, token) vào đây. */
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  /** Đường dẫn màn hình sinh ra hành động. */
  path?: string | null;
  /**
   * Chỉ đích danh sink. Không truyền → tự suy ra từ `source`
   * (`auth`/`workflow` → security, còn lại → activity).
   * NÊN truyền tường minh ở mọi nơi gọi mới.
   */
  sink?: AuditSink;
  /** Thời điểm xảy ra (mặc định = lúc ghi). ISO string hoặc Date. */
  at?: Date | string | null;
}

/** Suy ra sink từ source khi người gọi không chỉ định. HÀM THUẦN. */
export function sinkOf(input: Pick<AuditInput, 'sink' | 'source'>): AuditSink {
  if (input.sink === 'security' || input.sink === 'activity') return input.sink;
  return input.source === 'auth' || input.source === 'workflow' ? 'security' : 'activity';
}

/** ĐỊNH DẠNG CHUẨN DUY NHẤT của mọi bản ghi audit do ứng dụng sinh ra. */
export interface AuditRecord {
  /**
   * Tên hành động **giữ nguyên để hiển thị** (vd `Login Failed`,
   * `Circulate Document [REQ-9] to Kế toán`).
   * ⚠️ KHÔNG lower-case/canonical trường này: Settings.tsx render trực tiếp
   * và còn so khớp `action.includes('Failed')` / `action === 'Logout'`.
   * Muốn query/gom nhóm dùng `actionKey` bên dưới.
   */
  action: string;
  /** Khóa query được sinh từ `action` (lower-case, `[a-z0-9._-]`). */
  actionKey: string;
  status: AuditStatus;
  source: string;
  tenantId: string;
  actorEmail: string | null;
  actorUid: string | null;
  actorName: string | null;
  targetId: string | null;
  targetLabel: string | null;
  /** Luôn là object hoặc null — không bao giờ là chuỗi/mảng để query JSONB được. */
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  browser: string | null;
  path: string | null;
  /** ISO-8601. Giữ chuỗi, KHÔNG format sẵn — nơi đọc gọi `new Date(...)`. */
  timestamp: string;
}

// Giới hạn độ dài: tránh một userAgent/path dị làm phình hàng và vỡ index.
const MAX_ACTION = 200;
const MAX_LABEL = 300;
const MAX_TEXT = 500;

// -----------------------------------------------------------------------------
// Hàm thuần (pure) — test được không cần môi trường
// -----------------------------------------------------------------------------

function truncate(value: string | null | undefined, max: number): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

/**
 * Nhận diện trình duyệt từ user-agent.
 *
 * ⚠️ THỨ TỰ KIỂM TRA LÀ SỐNG CÒN — đây là lỗi có thật ở bản cũ (AuthContext):
 * Chromium Edge có UA chứa CẢ `"Chrome/120..."` LẪN `"Edg/120..."`. Bản cũ xếp
 * `Chrome` trước `Edge` → **mọi người dùng Edge bị ghi nhận nhầm là Chrome**.
 * Cùng lý do, Chrome/Safari mới đều chứa chuỗi `"Safari"` → `Safari` phải xếp CUỐI.
 */
export function detectBrowser(userAgent: string | null | undefined): string {
  const ua = userAgent || '';
  if (!ua) return 'Unknown Browser';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/OPR\/|Opera/i.test(ua)) return 'Opera';
  if (/Edg\/|Edge\//i.test(ua)) return 'Edge'; // PHẢI đứng trước Chrome
  if (/Chrome\//i.test(ua)) return 'Chrome';
  if (/Safari\//i.test(ua)) return 'Safari'; // PHẢI đứng cuối
  return 'Unknown Browser';
}

/**
 * Tên hành động để HIỂN THỊ: chỉ gọn khoảng trắng + cắt dài, giữ nguyên chữ.
 * (Xem chú thích tại `AuditRecord.action` — đừng canonical ở đây.)
 */
export function readableAction(action: string | null | undefined): string {
  const raw = (action || '').replace(/\s+/g, ' ').trim();
  if (!raw) return 'unknown';
  return raw.length > MAX_ACTION ? `${raw.slice(0, MAX_ACTION - 1)}…` : raw;
}

/**
 * Khóa hành động để QUERY/GOM NHÓM: lower-case, chỉ giữ `[a-z0-9._-]`.
 * Giữ dấu `.` để tách miền (`order.status_changed`).
 * Mục đích: cùng một hành động do người dùng gõ tự do (hoặc có kèm id, tiếng
 * Việt) vẫn gom được một nhóm, thay vì sinh ra vô số biến thể không lọc nổi.
 */
export function canonicalAction(action: string | null | undefined): string {
  const raw = readableAction(action);
  return raw.toLowerCase().replace(/[^a-z0-9._-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function toIso(at: Date | string | null | undefined, now: () => Date): string {
  if (at instanceof Date) return at.toISOString();
  if (typeof at === 'string' && at.trim()) {
    // Chuỗi đã là ISO → giữ nguyên. Chuỗi khác → thử parse, hỏng thì lấy now().
    const parsed = new Date(at);
    return Number.isNaN(parsed.getTime()) ? now().toISOString() : parsed.toISOString();
  }
  return now().toISOString();
}

/**
 * Biến đầu vào tự do thành `AuditRecord` chuẩn. HÀM THUẦN — không I/O.
 * `ctx.now` bắt buộc truyền vào để kết quả xác định (test không phụ thuộc đồng hồ).
 */
export function normalizeAudit(
  input: AuditInput,
  ctx: { tenantId?: string; now?: () => Date; source?: AuditSource } = {}
): AuditRecord {
  const now = ctx.now || (() => new Date());
  const userAgent = input.userAgent ?? null;

  return {
    action: readableAction(input.action),
    actionKey: canonicalAction(input.action),
    status: input.status === 'Failed' ? 'Failed' : 'Success',
    source: input.source || ctx.source || 'app',
    tenantId: input.tenantId || ctx.tenantId || DEFAULT_AUDIT_TENANT,
    actorEmail: truncate(input.actor?.email, MAX_TEXT),
    actorUid: truncate(input.actor?.uid, MAX_TEXT),
    actorName: truncate(input.actor?.name, MAX_TEXT),
    targetId: truncate(input.targetId, MAX_TEXT),
    targetLabel: truncate(input.targetLabel, MAX_LABEL),
    details: input.details && typeof input.details === 'object' ? input.details : null,
    ipAddress: truncate(input.ipAddress, 64),
    userAgent: truncate(userAgent, MAX_TEXT),
    browser: detectBrowser(userAgent),
    path: truncate(input.path, MAX_TEXT),
    timestamp: toIso(input.at, now),
  };
}

// -----------------------------------------------------------------------------
// Writer
// -----------------------------------------------------------------------------

export interface AuditDeps {
  /**
   * Ghi 1 bản ghi vào sink. Ném lỗi → `recordAudit` nuốt và trả `ok: false`.
   * Tách riêng khỏi service để test không cần Supabase.
   */
  write: (sink: AuditSink, record: AuditRecord) => Promise<unknown>;
  /** Ghi mirror sang `admin_audit_logs` khi `mirror` bật. */
  writeMirror?: (record: AuditRecord) => Promise<unknown>;
  /**
   * Bật/tắt mirror. Mặc định lấy từ hằng số `AUDIT_MIRROR_TO_ADMIN_LOGS`.
   * Override ở đây để test phủ được nhánh mirror mà không cần đổi hằng số.
   */
  mirror?: boolean;
  log?: (message: string, error?: unknown) => void;
  now?: () => Date;
  tenantId?: string;
}

/**
 * ⚠️ `strict: false` → TS KHÔNG narrow discriminated union bằng literal boolean.
 * Vì vậy kết quả trả về dùng MỘT interface với field optional, không dùng union.
 */
export interface AuditWriteResult {
  ok: boolean;
  sink: string;
  record: AuditRecord;
  id?: string;
  error?: unknown;
}

let cachedDeps: AuditDeps | null = null;

/**
 * Deps mặc định — import `dbService` LAZY để module này không kéo theo
 * `lib/supabase` (file đó đọc `import.meta.env`, sẽ nổ trong môi trường Node/test).
 */
export function defaultAuditDeps(): AuditDeps {
  if (cachedDeps) return cachedDeps;
  cachedDeps = {
    write: async (sink, record) => {
      const { addDoc, collection, db } = await import('./dbService');
      if (sink === 'security') {
        // Đi theo subcollection để dbService map sang `tenant_audit_logs`
        // KÈM tenantId — đúng như cách Settings.tsx đang đọc.
        return addDoc(collection(db, 'tenants', record.tenantId, 'audit_logs'), record);
      }
      return addDoc(collection(db, AUDIT_SINK_TABLE.activity), record);
    },
    writeMirror: async (record) => {
      const { addDoc, collection, db } = await import('./dbService');
      return addDoc(collection(db, 'admin_audit_logs'), record);
    },
    log: (message, error) => {
      // Audit lỗi chỉ được phép cảnh báo — KHÔNG được ném.
      if (typeof console !== 'undefined') console.warn(`[audit] ${message}`, error ?? '');
    },
  };
  return cachedDeps;
}

/** Test/SSR: thay toàn bộ deps mặc định. */
export function setAuditDeps(deps: AuditDeps | null): void {
  cachedDeps = deps;
}

/**
 * ĐIỂM GHI DUY NHẤT cho audit do ứng dụng sinh ra.
 * Không bao giờ ném lỗi — luồng nghiệp vụ không được chết vì log.
 */
export async function recordAudit(input: AuditInput, deps?: AuditDeps): Promise<AuditWriteResult> {
  const d = deps || defaultAuditDeps();
  const record = normalizeAudit(input, { now: d.now, tenantId: d.tenantId });
  const sink = sinkOf(input);

  try {
    const result: any = await d.write(sink, record);
    const id = typeof result === 'string' ? result : result?.id || undefined;

    const mirrorEnabled = d.mirror ?? AUDIT_MIRROR_TO_ADMIN_LOGS;
    if (mirrorEnabled && d.writeMirror) {
      // Mirror lỗi KHÔNG được làm hỏng kết quả chính.
      try {
        await d.writeMirror(record);
      } catch (mirrorError) {
        d.log?.('Ghi mirror admin_audit_logs thất bại (bỏ qua)', mirrorError);
      }
    }

    return { ok: true, sink: AUDIT_SINK_TABLE[sink], record, ...(id ? { id } : {}) };
  } catch (error) {
    d.log?.('Ghi audit trail thất bại (bỏ qua, không chặn nghiệp vụ)', error);
    return { ok: false, sink: AUDIT_SINK_TABLE[sink], record, error };
  }
}

// -----------------------------------------------------------------------------
// Các hàm chuyên biệt — gọi chung về recordAudit
// -----------------------------------------------------------------------------

export interface LoginAuditParams {
  email: string;
  action: string;
  status: AuditStatus;
  userId?: string | null;
  tenantId?: string | null;
  /** Injectable: mặc định hỏi api.ipify.org với timeout 1.5s. */
  fetchIp?: () => Promise<string>;
  userAgent?: string | null;
}

const FALLBACK_IP = '127.0.0.1';

/** Mặc định lấy IP public; mất mạng/offline → trả IP loopback, không ném. */
export async function fetchPublicIp(): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();
    return data?.ip || FALLBACK_IP;
  } catch {
    return FALLBACK_IP;
  }
}

/**
 * Nhật ký đăng nhập/đăng xuất/xác thực (sink `security`).
 * Thay thế `logAdminAudit` cũ trong AuthContext — vốn ghi trùng 2 bảng.
 */
export async function logLoginAudit(
  params: LoginAuditParams,
  deps?: AuditDeps
): Promise<AuditWriteResult> {
  const d = deps || defaultAuditDeps();
  let ipAddress = FALLBACK_IP;
  try {
    ipAddress = await (params.fetchIp || fetchPublicIp)();
  } catch {
    ipAddress = FALLBACK_IP;
  }

  return recordAudit(
    {
      action: params.action,
      status: params.status,
      source: 'auth',
      sink: 'security',
      actor: {
        email: params.email,
        uid: params.userId ?? null,
        name: params.email,
      },
      tenantId: params.tenantId || DEFAULT_AUDIT_TENANT,
      ipAddress,
      userAgent:
        params.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : null),
    },
    d
  );
}

/** Nhật ký hoạt động nghiệp vụ (sink `activity`) — dùng bởi `useAuditLog`. */
export async function logActivity(
  params: {
    action: string;
    actor?: AuditActor;
    targetId?: string | null;
    targetLabel?: string | null;
    details?: Record<string, unknown> | null;
    path?: string | null;
    tenantId?: string | null;
  },
  deps?: AuditDeps
): Promise<AuditWriteResult> {
  return recordAudit(
    {
      action: params.action,
      status: 'Success',
      source: 'app',
      sink: 'activity',
      actor: params.actor,
      tenantId: params.tenantId,
      targetId: params.targetId,
      targetLabel: params.targetLabel,
      details: params.details,
      path: params.path ?? (typeof window !== 'undefined' ? window.location.pathname : null),
    },
    deps
  );
}
