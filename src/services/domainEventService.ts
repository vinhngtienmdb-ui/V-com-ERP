/**
 * ============================================================================
 *  domainEventService.ts — GĐ 2.1: Outbox pattern (hàng đợi sự kiện nghiệp vụ)
 * ============================================================================
 *
 *  Vấn đề (spec 022 GĐ2.1): các nghiệp vụ GỌI CHÉO NHAU TRỰC TIẾP. Đặc biệt
 *  5 chỗ gọi kế toán ngay trong luồng UI:
 *      Orders.tsx:1263             postOrderJournalEntries
 *      Settlement.tsx:107/135/351  postWithdrawalJournalEntries
 *      VCommSupermarket.tsx:269    postOrderJournalEntries
 *
 *  Hậu quả:
 *    · Ghi sổ lỗi (mất cân đối Nợ/Có, khóa sổ, timeout, mất mạng) → **kẹt luôn**
 *      việc chính. TT99 Điều 12 bắt buộc ghi kép, nhưng kế toán là việc PHỤ —
 *      không được quyền chặn hoàn tất đơn hay duyệt chi.
 *    · Không retry: lỗi nhất thời = MẤT BÚT TOÁN vĩnh viễn, không ai biết.
 *    · Không truy vết: không có chỗ nào trả lời "sự kiện nào đang kẹt?".
 *
 *  Giải pháp: nghiệp vụ chỉ GHI 1 DÒNG vào outbox (rẻ, gần như không thể lỗi).
 *  Worker chạy nền lấy việc → xử lý → done / retry luỹ thừa / dead.
 *
 *  ⚠️ NGUYÊN TẮC SỐNG CÒN: **FAIL-SOFT.**
 *    Migration 002 có thể CHƯA được apply (do user chạy tay trên Supabase).
 *    Khi đó `publishDomainEvent()` trả `{ ok: false, reason: 'unavailable' }`
 *    và **caller PHẢI rơi về đường đồng bộ cũ**. Tuyệt đối không được để outbox
 *    chưa có mà làm mất nghiệp vụ — luồng tiền mất còn tệ hơn chưa tách.
 *      const r = await publishOrderCompleted(order);
 *      if (!r.ok) await postOrderJournalEntries(order);   // đường cũ
 *
 *  🔧 THIẾT KẾ: không import `supabase` ở top-level của phần thuần; phần DB
 *     nhận deps inject được (giống `fullTextSearchService`) để test offline.
 * ============================================================================
 */

/* -------------------------------------------------------------------------- */
/*  Kiểu dữ liệu                                                              */
/* -------------------------------------------------------------------------- */

export type OutboxStatus = 'pending' | 'processing' | 'done' | 'failed' | 'dead';

/** Các loại sự kiện hiện có. Thêm loại mới → thêm handler trong `server.ts`. */
export const OUTBOX_EVENT_TYPES = {
  /** Đơn online chuyển sang `completed`. */
  ORDER_COMPLETED: 'order.completed',
  /** Bán tại quầy POS (VCommSupermarket) — thu tiền ngay, phải ghi sổ ngay. */
  POS_SALE_COMPLETED: 'pos.sale.completed',
  /** Duyệt chi: hoa hồng CTV / phí vận hành Điểm nhận hàng / rút tiền. */
  WITHDRAWAL_APPROVED: 'withdrawal.approved',
} as const;

export type OutboxEventType =
  (typeof OUTBOX_EVENT_TYPES)[keyof typeof OUTBOX_EVENT_TYPES];

export interface OutboxEvent {
  id: string;
  tenantId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  dedupeKey: string | null;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  attempts: number;
  maxAttempts: number;
  availableAt: string;
  createdAt: string;
  lastError: string | null;
}

export interface PublishEventInput {
  eventType: OutboxEventType | string;
  /** 'order' | 'withdrawal' | 'escrow' — để truy vết theo đối tượng. */
  aggregateType: string;
  aggregateId: string;
  payload?: Record<string, unknown>;
  tenantId?: string | null;
  /**
   * Khoá chống trùng. Cùng khoá = chỉ ghi 1 lần (double-click, webhook gửi lặp).
   * Bỏ trống nếu MỖI lần phát sinh là 1 sự kiện hợp lệ.
   */
  dedupeKey?: string | null;
  /** Hoãn xử lý (ms) — dùng khi cần chờ dữ liệu khác chốt. */
  delayMs?: number;
  maxAttempts?: number;
}

/**
 * ⚠️ Dùng `interface` + field OPTIONAL, KHÔNG dùng discriminated union:
 * `tsconfig` đang để `strict: false` → `strictNullChecks` TẮT → TypeScript
 * KHÔNG thu hẹp được union bằng `if (r.ok)`. Truy cập bằng optional field
 * (quy ước chung của VComm, xem `.workbuddy-ai/memory/MEMORY.md`).
 */
export interface PublishOutcome {
  ok: boolean;
  /** Có khi `ok === true`. */
  eventId?: string;
  /** Có khi `ok === true`. true = đã có trong hàng từ trước, không ghi thêm. */
  deduped?: boolean;
  /** Có khi `ok === false`: 'unavailable' = chưa chạy migration; 'error' = lỗi thật. */
  reason?: 'unavailable' | 'error';
  /** Có khi `ok === false`. */
  message?: string;
}

/* -------------------------------------------------------------------------- */
/*  Hằng số & hàm thuần (test offline được)                                   */
/* -------------------------------------------------------------------------- */

export const DEFAULT_TENANT_ID = 'tenant-vcomm-prod-01';
export const DEFAULT_MAX_ATTEMPTS = 5;
export const DEFAULT_CLAIM_LIMIT = 20;
export const DEFAULT_POLL_INTERVAL_MS = 5_000;
/** Worker bị coi là chết nếu giữ lock quá 15 phút. */
export const STUCK_LOCK_MINUTES = 15;

const BACKOFF_BASE_MS = 5_000;
const BACKOFF_MAX_MS = 300_000; // 5 phút
const BACKOFF_JITTER = 0.2; // ±20% — tránh cả đàn worker retry cùng nhịp

/**
 * Mã lỗi "chưa có migration". Cố tình KHÔNG gồm PGRST301/42501 (lỗi phân quyền):
 * lỗi phân quyền là LỖI THẬT cần ồn ào, không được bị nuốt thành "chưa cài".
 */
const RPC_MISSING_CODES = new Set(['PGRST202', '42883', '42P01', 'PGRST205']);

const RPC_MISSING_MESSAGE = /could not find the function|function .* does not exist|relation .* does not exist|Could not find the table/i;

/** Build khoá chống trùng chuẩn: `order.completed:ORD-123`. */
export function dedupeKeyOf(eventType: string, aggregateId: string): string {
  return `${eventType}:${aggregateId}`;
}

/**
 * Thời gian chờ trước lần thử tiếp theo — LUỸ THỪA + JITTER.
 *   lần 1: ~5s · 2: ~10s · 3: ~20s · 4: ~40s · 5: ~80s (tối đa 5 phút)
 *
 * @param attempts Số lần ĐÃ thử (sau khi vừa thất bại).
 * @param now      inject được để test không cần giả lập đồng hồ.
 * @param rand     inject được để test jitter xác định.
 */
export function nextRetryDelayMs(attempts: number, rand: number = Math.random()): number {
  const step = Math.max(0, attempts - 1);
  const raw = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** step);
  const jitter = 1 + (rand * 2 - 1) * BACKOFF_JITTER;
  return Math.max(1_000, Math.round(raw * jitter));
}

export function nextRetryAt(
  attempts: number,
  now: Date = new Date(),
  rand: number = Math.random()
): Date {
  return new Date(now.getTime() + nextRetryDelayMs(attempts, rand));
}

/* -------------------------------------------------------------------------- */
/*  Deps — inject được để test                                                */
/* -------------------------------------------------------------------------- */

export interface RpcResult {
  data: unknown;
  error: { code?: string; message?: string; details?: string } | null;
}

export interface OutboxDeps {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<RpcResult>;
  /** Ghi log có ngữ cảnh. Mặc định: console.warn (được phép vì đây là hạ tầng). */
  log?: (level: 'warn' | 'error', message: string, detail?: unknown) => void;
}

/**
 * Dựng deps từ MỘT supabase client BẤT KỲ (browser hay server).
 * Tách ra để module này KHÔNG import `../lib/supabase` ở top-level:
 *   · giữ phần thuần test được offline
 *   · tránh kéo theo client browser vào server (Node) và ngược lại
 */
export function depsFromClient(client: { rpc: (fn: string, args: unknown) => any }, log?: OutboxDeps['log']): OutboxDeps {
  return {
    // `client.rpc` của supabase-js trả PostgrestFilterBuilder (thenable), KHÔNG
    // phải Promise — khai báo kiểu Promise sẽ đánh sập `tsc`. Cứ `await` bình thường.
    rpc: async (fn, args) => (await client.rpc(fn, args as never)) as unknown as RpcResult,
    log,
  };
}

function defaultLog(level: 'warn' | 'error', message: string, detail?: unknown): void {
  // eslint-disable-next-line no-console
  (level === 'error' ? console.error : console.warn)(message, detail ?? '');
}

/** Có phải lỗi "chưa chạy migration 002" không? */
export function isMigrationMissing(error: RpcResult['error']): boolean {
  if (!error) return false;
  if (error.code && RPC_MISSING_CODES.has(error.code)) return true;
  return RPC_MISSING_MESSAGE.test(error.message ?? '');
}

/* -------------------------------------------------------------------------- */
/*  Map row (snake_case từ Postgres) → OutboxEvent                            */
/* -------------------------------------------------------------------------- */

export function fromOutboxRow(row: Record<string, any>): OutboxEvent {
  return {
    id: String(row.id ?? ''),
    tenantId: String(row.tenant_id ?? DEFAULT_TENANT_ID),
    eventType: String(row.event_type ?? ''),
    aggregateType: String(row.aggregate_type ?? 'generic'),
    aggregateId: String(row.aggregate_id ?? ''),
    dedupeKey: row.dedupe_key ?? null,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    status: (row.status ?? 'pending') as OutboxStatus,
    attempts: Number(row.attempts ?? 0),
    maxAttempts: Number(row.max_attempts ?? DEFAULT_MAX_ATTEMPTS),
    availableAt: String(row.available_at ?? new Date().toISOString()),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    lastError: row.last_error ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/*  API — PUBLISH                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Ghi 1 sự kiện vào outbox.
 *
 * ⚠️ KHÔNG BAO GIỜ ném lỗi: outbox là việc phụ, không được làm gãy nghiệp vụ
 * chính. Luôn kiểm tra `ok` và rơi về đường đồng bộ cũ khi `ok === false`.
 */
export async function publishDomainEvent(
  input: PublishEventInput,
  deps: OutboxDeps
): Promise<PublishOutcome> {
  const log = deps.log ?? defaultLog;
  const tenantId = input.tenantId || DEFAULT_TENANT_ID;

  try {
    const res = await deps.rpc('vcomm_publish_domain_event', {
      p_tenant_id: tenantId,
      p_event_type: input.eventType,
      p_aggregate_type: input.aggregateType,
      p_aggregate_id: input.aggregateId,
      p_dedupe_key: input.dedupeKey ?? null,
      p_payload: input.payload ?? {},
      p_max_attempts: input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      p_delay_seconds: Math.max(0, Math.round((input.delayMs ?? 0) / 1000)),
    });

    if (res.error) {
      if (isMigrationMissing(res.error)) {
        return {
          ok: false,
          reason: 'unavailable',
          message: 'Outbox chưa sẵn sàng (chưa chạy migration 002_outbox_domain_events.sql).',
        };
      }
      log(
        'error',
        `[GĐ 2.1][outbox] Ghi sự kiện thất bại (${input.eventType}): ${res.error.message}`,
        { aggregateId: input.aggregateId }
      );
      return { ok: false, reason: 'error', message: res.error.message ?? 'Lỗi không xác định' };
    }

    // RPC trả TABLE(event_id, inserted) → PostgREST bọc thành mảng.
    const row = Array.isArray(res.data) ? res.data[0] : (res.data as any);
    const eventId = String(row?.event_id ?? '');
    const inserted = row?.inserted !== false; // thiếu field thì coi như đã ghi

    return { ok: true, eventId, deduped: !inserted };
  } catch (err: any) {
    // Lỗi mạng / client chưa khởi tạo — cũng KHÔNG được ném.
    log('error', `[GĐ 2.1][outbox] Ghi sự kiện ném ngoại lệ (${input.eventType}):`, err?.message ?? err);
    return { ok: false, reason: 'error', message: err?.message ?? String(err) };
  }
}

/* -------------------------------------------------------------------------- */
/*  API — WORKER                                                              */
/* -------------------------------------------------------------------------- */

export type OutboxHandler = (event: OutboxEvent) => Promise<void>;
export type OutboxHandlers = Record<string, OutboxHandler | undefined>;

export interface OutboxRunResult {
  /** Số sự kiện lấy được từ hàng đợi. */
  claimed: number;
  succeeded: number;
  /** Thất bại nhưng CÒN LƯỢT THỬ → sẽ retry. */
  failed: number;
  /** Hết lượt thử → chuyển `dead`, CẦN NGƯỜI XỬ LÝ (cảnh báo đỏ). */
  dead: number;
  /** Sự kiện không có handler đăng ký → đẩy sang `dead` (tránh kẹt hàng đợi). */
  unhandled: number;
  /** Số dòng kẹt do worker chết được thu hồi. */
  requeued: number;
  /** true khi migration chưa chạy → worker nên giảm tần suất poll. */
  unavailable: boolean;
  errors: Array<{ id: string; eventType: string; message: string }>;
}

export interface OutboxRunOptions {
  workerId?: string;
  limit?: number;
  /** Gọi hàm thu hồi sự kiện bị kẹt ở `processing`. Mặc định: bật. */
  requeueStuck?: boolean;
  now?: Date;
}

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return typeof err === 'string' ? err : JSON.stringify(err);
}

/**
 * Chạy MỘT nhịp của worker: claim → dispatch → ack/fail → thu hồi dòng kẹt.
 *
 * ⭐ Mỗi sự kiện được xử lý ĐỘC LẬP trong try/catch: 1 sự kiện lỗi KHÔNG được
 *   làm gãy cả lô (nếu không, 1 đơn lỗi sẽ kẹt vĩnh viễn 19 đơn còn lại).
 */
export async function runOutboxOnce(
  deps: OutboxDeps,
  handlers: OutboxHandlers,
  opts: OutboxRunOptions = {}
): Promise<OutboxRunResult> {
  const log = deps.log ?? defaultLog;
  const workerId = opts.workerId ?? `worker-${Math.random().toString(36).slice(2, 8)}`;
  const limit = opts.limit ?? DEFAULT_CLAIM_LIMIT;
  const now = opts.now ?? new Date();

  const result: OutboxRunResult = {
    claimed: 0,
    succeeded: 0,
    failed: 0,
    dead: 0,
    unhandled: 0,
    requeued: 0,
    unavailable: false,
    errors: [],
  };

  /* --- 0. Thu hồi các dòng bị kẹt do worker chết (deploy/OOM/mất điện) --- */
  if (opts.requeueStuck !== false) {
    try {
      const res = await deps.rpc('vcomm_requeue_stuck_domain_events', {
        p_stuck_minutes: STUCK_LOCK_MINUTES,
      });
      if (res.error) {
        if (!isMigrationMissing(res.error)) {
          log('warn', '[GĐ 2.1][outbox] Thu hồi sự kiện kẹt thất bại:', res.error.message);
        }
      } else {
        result.requeued = Number(res.data ?? 0) || 0;
        if (result.requeued > 0) {
          log('warn', `[GĐ 2.1][outbox] Đã thu hồi ${result.requeued} sự kiện bị kẹt (worker chết).`);
        }
      }
    } catch (err: any) {
      log('warn', '[GĐ 2.1][outbox] Thu hồi sự kiện kẹt ném ngoại lệ:', err?.message ?? err);
    }
  }

  /* --- 1. Claim một lô --- */
  let claimedRows: OutboxEvent[] = [];
  try {
    const res = await deps.rpc('vcomm_claim_domain_events', {
      p_worker: workerId,
      p_limit: limit,
    });

    if (res.error) {
      if (isMigrationMissing(res.error)) {
        result.unavailable = true;
        return result;
      }
      log('error', '[GĐ 2.1][outbox] Claim thất bại:', res.error.message);
      result.errors.push({ id: '-', eventType: '-', message: res.error.message ?? 'claim failed' });
      return result;
    }

    const rows = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
    claimedRows = (rows as Record<string, any>[]).map(fromOutboxRow);
  } catch (err: any) {
    log('error', '[GĐ 2.1][outbox] Claim ném ngoại lệ:', err?.message ?? err);
    result.errors.push({ id: '-', eventType: '-', message: errMessage(err) });
    return result;
  }

  result.claimed = claimedRows.length;
  if (claimedRows.length === 0) return result;

  /* --- 2. Dispatch từng sự kiện --- */
  for (const event of claimedRows) {
    const handler = handlers[event.eventType];

    // Không có handler: đánh `dead` NGAY, nếu không sự kiện sẽ kẹt ở
    // `processing` cho đến khi hàm thu hồi chạy (15 phút) rồi lại retry vô ích.
    if (!handler) {
      result.unhandled += 1;
      log(
        'error',
        `[GĐ 2.1][outbox] KHÔNG CÓ HANDLER cho sự kiện "${event.eventType}" (id=${event.id}). ` +
          'Đánh dead — đăng ký handler trong server.ts rồi gọi retryDomainEvent().'
      );
      await markDead(deps, event.id, `Không có handler cho sự kiện "${event.eventType}"`);
      continue;
    }

    try {
      await handler(event);
      await ackEvent(deps, event.id);
      result.succeeded += 1;
    } catch (err: any) {
      const message = errMessage(err);
      result.errors.push({ id: event.id, eventType: event.eventType, message });

      const attempts = event.attempts + 1;
      const isDead = attempts >= event.maxAttempts;

      if (isDead) {
        result.dead += 1;
        log(
          'error',
          `🔴 [GĐ 2.1][outbox] SỰ KIỆN CHẾT SAU ${attempts} LẦN — cần người xử lý: ` +
            `${event.eventType} (id=${event.id}, aggregate=${event.aggregateId}): ${message}`
        );
        await markDead(deps, event.id, message);
      } else {
        result.failed += 1;
        const retryAt = nextRetryAt(attempts, now);
        log(
          'warn',
          `[GĐ 2.1][outbox] Thất bại (lần ${attempts}/${event.maxAttempts}) ` +
            `${event.eventType} id=${event.id} → thử lại lúc ${retryAt.toISOString()}: ${message}`
        );
        await markFailed(deps, event.id, message, retryAt);
      }
    }
  }

  return result;
}

async function ackEvent(deps: OutboxDeps, id: string): Promise<void> {
  const res = await deps.rpc('vcomm_ack_domain_event', { p_id: id });
  if (res.error) {
    (deps.log ?? defaultLog)('error', `[GĐ 2.1][outbox] Ack thất bại (id=${id}):`, res.error.message);
  }
}

async function markFailed(
  deps: OutboxDeps,
  id: string,
  message: string,
  retryAt: Date
): Promise<void> {
  const res = await deps.rpc('vcomm_fail_domain_event', {
    p_id: id,
    p_last_error: message,
    p_retry_at: retryAt.toISOString(),
    p_is_dead: false,
  });
  if (res.error) {
    (deps.log ?? defaultLog)('error', `[GĐ 2.1][outbox] Đánh dấu thất bại lỗi (id=${id}):`, res.error.message);
  }
}

async function markDead(deps: OutboxDeps, id: string, message: string): Promise<void> {
  const res = await deps.rpc('vcomm_fail_domain_event', {
    p_id: id,
    p_last_error: message,
    p_retry_at: new Date().toISOString(),
    p_is_dead: true,
  });
  if (res.error) {
    (deps.log ?? defaultLog)('error', `[GĐ 2.1][outbox] Đánh dấu dead lỗi (id=${id}):`, res.error.message);
  }
}

/* -------------------------------------------------------------------------- */
/*  API — vòng lặp worker                                                     */
/* -------------------------------------------------------------------------- */

export interface OutboxWorkerOptions extends OutboxRunOptions {
  intervalMs?: number;
  /** Khi migration chưa chạy, poll chậm lại (tránh spam lỗi mỗi 5 giây). */
  idleIntervalMsWhenUnavailable?: number;
  onResult?: (r: OutboxRunResult) => void;
  /**
   * Điều kiện chạy nhịp. Trả false → bỏ qua nhịp này, thử lại sau.
   * Dùng để: bỏ qua khi MẤT MẠNG, hoặc khi CHƯA ĐĂNG NHẬP (worker ghi sổ kế
   * toán — không được chạy bằng session ẩn danh).
   */
  shouldRun?: () => boolean;
}

export interface OutboxWorkerHandle {
  stop: () => void;
  isRunning: () => boolean;
  /** Chạy ngay 1 nhịp (để test hoặc trigger thủ công). */
  tick: () => Promise<OutboxRunResult>;
}

/**
 * Bắt đầu worker chạy nền.
 *
 * Dùng `setTimeout` đệ quy thay vì `setInterval`: nếu một nhịp xử lý lâu hơn
 * chu kỳ, `setInterval` sẽ xếp chồng các nhịp → hàng đợi bị xử lý nhiều lần
 * cùng lúc. `setTimeout` đệ quy đảm bảo chỉ 1 nhịp chạy tại một thời điểm.
 */
export function startOutboxWorker(
  deps: OutboxDeps,
  handlers: OutboxHandlers,
  opts: OutboxWorkerOptions = {}
): OutboxWorkerHandle {
  const intervalMs = opts.intervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const slowIntervalMs = opts.idleIntervalMsWhenUnavailable ?? 60_000;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let stopped = false;

  const tick = async (): Promise<OutboxRunResult> => {
    const r = await runOutboxOnce(deps, handlers, opts);
    opts.onResult?.(r);
    return r;
  };

  const schedule = async () => {
    if (stopped) return;
    let delay = intervalMs;

    // Mất mạng / chưa đăng nhập → không đập DB, đợi chu kỳ sau.
    if (opts.shouldRun && !opts.shouldRun()) {
      if (!stopped) {
        timer = setTimeout(schedule, delay);
        (timer as any)?.unref?.();
      }
      return;
    }

    try {
      const r = await tick();
      if (r.unavailable) delay = slowIntervalMs;
    } catch (err) {
      // runOutboxOnce đã tự bắt; đây là lưới an toàn cuối.
      (deps.log ?? defaultLog)('error', '[GĐ 2.1][outbox] Nhịp worker ném ngoại lệ:', err);
      delay = slowIntervalMs;
    } finally {
      running = false;
      if (!stopped) {
        timer = setTimeout(schedule, delay);
        // Node: không giữ process sống chỉ vì worker.
        (timer as any)?.unref?.();
      }
    }
  };

  running = true;
  timer = setTimeout(schedule, intervalMs);
  (timer as any)?.unref?.();

  return {
    stop: () => {
      stopped = true;
      running = false;
      if (timer) clearTimeout(timer);
      timer = null;
    },
    isRunning: () => running,
    tick,
  };
}

/* -------------------------------------------------------------------------- */
/*  API — cứu hộ sự kiện `dead` (đều do con người quyết định)                  */
/* -------------------------------------------------------------------------- */

/**
 * Liệt kê sự kiện để soát tay. Mặc định: chỉ lấy sự kiện `dead` — những cái
 * CẦN NGƯỜI, vì worker đã bỏ cuộc sau `max_attempts` lần.
 *
 * Dùng dbService (không phải RPC) để tận dụng sẵn cơ chế map camelCase →
 * snake_case, và chỉ gọi khi cần (trang quản trị), không nằm trên đường nóng.
 */
export async function listOutboxEvents(
  opts: { status?: OutboxStatus | 'all'; limit?: number } = {}
): Promise<OutboxEvent[]> {
  const { db, collection, getDocs, query, orderBy, limit, where } = await import('./dbService');
  const constraints: any[] = [];

  if (opts.status && opts.status !== 'all') {
    constraints.push(where('status', '==', opts.status));
  }
  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(Math.min(Math.max(1, opts.limit ?? 50), 500)));

  const snap = await getDocs(query(collection(db, 'domain_events'), ...constraints));
  return (snap.docs ?? []).map((d: any) => fromOutboxRow({ id: d.id, ...(d.data?.() ?? {}) }));
}

/**
 * Đưa sự kiện `dead`/`failed` trở lại hàng đợi để worker xử lý lại.
 * Dùng SAU KHI đã sửa nguyên nhân (VD: sửa dữ liệu, mở khóa sổ, bổ sung handler).
 *
 * ⚠️ Reset `attempts` về 0 — nếu không, sự kiện sẽ bị đánh `dead` lại ngay lập tức.
 */
export async function retryOutboxEvent(id: string): Promise<void> {
  const { db, doc, updateDoc } = await import('./dbService');
  await updateDoc(doc(db, 'domain_events', id), {
    status: 'pending' as OutboxStatus,
    attempts: 0,
    availableAt: new Date().toISOString(),
    lockedAt: null,
    lockedBy: null,
    lastError: null,
  });
}

/* -------------------------------------------------------------------------- */
/*  API — thống kê (phục vụ /metrics)                                         */
/* -------------------------------------------------------------------------- */

export interface OutboxStats {
  byStatus: Record<string, { count: number; oldestAgeMinutes: number }>;
  unavailable: boolean;
}

export async function outboxStats(deps: OutboxDeps): Promise<OutboxStats> {
  try {
    const res = await deps.rpc('vcomm_outbox_stats', {});
    if (res.error) {
      if (isMigrationMissing(res.error)) return { byStatus: {}, unavailable: true };
      return { byStatus: {}, unavailable: true };
    }
    const rows = (Array.isArray(res.data) ? res.data : []) as Array<{
      status: string;
      cnt: number | string;
      oldest_age_min: number | string;
    }>;
    const byStatus: OutboxStats['byStatus'] = {};
    rows.forEach((r) => {
      byStatus[r.status] = {
        count: Number(r.cnt) || 0,
        oldestAgeMinutes: Number(r.oldest_age_min) || 0,
      };
    });
    return { byStatus, unavailable: false };
  } catch {
    return { byStatus: {}, unavailable: true };
  }
}
