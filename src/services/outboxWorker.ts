/**
 * ============================================================================
 *  outboxWorker.ts — GĐ 2.1/2.2: Worker xử lý outbox phía TRÌNH DUYỆT
 * ============================================================================
 *
 *  ⭐ VÌ SAO WORKER CHẠY Ở TRÌNH DUYỆT MÀ KHÔNG PHẢI SERVER?
 *
 *  Lý tưởng là worker chạy trên server (luôn bật). Nhưng ở VComm điều đó RẤT
 *  NGUY HIỂM với trạng thái code hiện tại:
 *    · `accountingService` → `dbService` → `src/lib/supabase.ts`, mà file này
 *      đọc `import.meta.env` (chỉ có trong Vite). Chạy trong Node qua `tsx`
 *      thì các biến đó là `undefined` → rủi ro rơi vào CHẾ ĐỘ DEMO.
 *    · Hậu quả tệ nhất: worker server claim được sự kiện, handler lỗi → đốt hết
 *      `max_attempts` → đánh **`dead`** → sự kiện KHÔNG BAO GIỜ được xử lý nữa.
 *      Mất bút toán âm thầm còn tệ hơn chưa tách coupling.
 *  Nên: worker chính chạy trong trình duyệt — CÙNG môi trường với code đang
 *  chạy hôm nay, không đổi hành vi. Sự kiện nằm trong Postgres nên có retry
 *  an toàn: mở app lại là tiếp tục xử lý cái còn dang dở.
 *
 *  Worker phía server có sẵn trong `server.ts`, nhưng **TẮT MẶC ĐỊNH**, chỉ bật
 *  bằng `OUTBOX_WORKER=1` sau khi đã kiểm chứng `accountingService` chạy được
 *  trong Node.
 *
 *  🔴 ĐIỀU KIỆN CHẠY (bắt buộc, vì worker GHI SỔ KẾ TOÁN):
 *    · Phải CÓ MẠNG
 *    · Phải ĐÃ ĐĂNG NHẬP (session hợp lệ) — tuyệt đối không ghi sổ bằng
 *      session ẩn danh. Nếu không, bất kỳ ai mở trang cũng có thể kích hoạt
 *      hạch toán.
 * ============================================================================
 */

import { supabase } from '../lib/supabase';
import {
  depsFromClient,
  startOutboxWorker,
  OUTBOX_EVENT_TYPES,
  type OutboxHandlers,
  type OutboxWorkerHandle,
} from './domainEventService';
import { createLogger } from '../lib/logger';

const log = createLogger('services/outboxWorker');

/* -------------------------------------------------------------------------- */
/*  Đăng ký handler                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Map `event_type` → hàm xử lý.
 *
 * ⚠️ Mỗi handler ném lỗi = sự kiện được retry (luỹ thừa). Ném lỗi có chủ ý để
 *    báo "chưa xử lý được, thử lại" — KHÔNG được nuốt lỗi ở đây, nếu không
 *    sự kiện sai sẽ bị đánh `done` và mất bút toán vĩnh viễn.
 */
export const accountingOutboxHandlers: OutboxHandlers = {
  [OUTBOX_EVENT_TYPES.ORDER_COMPLETED]: async (event) => {
    const { postOrderJournalEntries } = await import('./accountingService');
    await postOrderJournalEntries(event.payload as any);
  },

  [OUTBOX_EVENT_TYPES.POS_SALE_COMPLETED]: async (event) => {
    const { postOrderJournalEntries } = await import('./accountingService');
    await postOrderJournalEntries(event.payload as any);
  },

  [OUTBOX_EVENT_TYPES.WITHDRAWAL_APPROVED]: async (event) => {
    const { postWithdrawalJournalEntries } = await import('./accountingService');
    await postWithdrawalJournalEntries(event.payload as any);
  },
};

/* -------------------------------------------------------------------------- */
/*  Trạng thái đăng nhập                                                      */
/* -------------------------------------------------------------------------- */

let hasSession = false;

if (typeof window !== 'undefined') {
  supabase.auth
    .getSession()
    .then(({ data }: any) => {
      hasSession = Boolean(data?.session);
    })
    .catch(() => {
      hasSession = false;
    });

  try {
    supabase.auth.onAuthStateChange((_event: string, session: unknown) => {
      hasSession = Boolean(session);
    });
  } catch (e) {
    // Không đăng ký được listener → worker KHÔNG BAO GIỜ biết là đã đăng nhập
    // và sẽ không chạy. Đây là lỗi cần thấy, không phải chuyện bình thường.
    log.error('không đăng ký được onAuthStateChange — outbox worker sẽ KHÔNG chạy', {}, e);
  }
}

function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
}

/* -------------------------------------------------------------------------- */
/*  Khởi động / dừng                                                          */
/* -------------------------------------------------------------------------- */

let handle: OutboxWorkerHandle | null = null;

export interface ClientOutboxWorkerOptions {
  intervalMs?: number;
  handlers?: OutboxHandlers;
}

/**
 * Bắt đầu worker. Gọi nhiều lần cũng chỉ có MỘT worker chạy (idempotent).
 * Trả về hàm dừng.
 */
export function startClientOutboxWorker(opts: ClientOutboxWorkerOptions = {}): () => void {
  if (handle) return stopClientOutboxWorker;

  handle = startOutboxWorker(depsFromClient(supabase), opts.handlers ?? accountingOutboxHandlers, {
    // 10 giây: đủ nhanh để kế toán thấy bút toán, đủ thưa để không đập DB.
    intervalMs: opts.intervalMs ?? 10_000,
    // Chưa chạy migration → poll 5 phút/lần thay vì 10 giây/lần.
    idleIntervalMsWhenUnavailable: 300_000,
    workerId: `web-${Math.random().toString(36).slice(2, 8)}`,
    shouldRun: () => isOnline() && hasSession,
  });

  return stopClientOutboxWorker;
}

export function stopClientOutboxWorker(): void {
  handle?.stop();
  handle = null;
}

export function isClientOutboxWorkerRunning(): boolean {
  return Boolean(handle?.isRunning());
}
