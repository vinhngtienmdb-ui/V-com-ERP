/**
 * ============================================================================
 *  accountingOutbox.ts — GĐ 2.2: Tách coupling kế toán khỏi luồng UI
 * ============================================================================
 *
 *  Vấn đề (spec 022 GĐ2.2): 5 chỗ gọi kế toán NGAY TRONG LUỒNG UI:
 *      Orders.tsx:1263             postOrderJournalEntries
 *      Settlement.tsx:107/135/351  postWithdrawalJournalEntries
 *      VCommSupermarket.tsx:269    postOrderJournalEntries
 *  → Ghi sổ lỗi (mất cân đối Nợ/Có · khóa sổ · timeout) làm **KẸT LUÔN** việc
 *    chính: không hoàn tất được đơn, không duyệt được chi. Kế toán là việc PHỤ,
 *    không được quyền chặn việc CHÍNH.
 *
 *  Cách sửa: chỗ gọi đổi thành `postJournalViaOutbox()`:
 *    ① Ghi 1 dòng vào outbox (rẻ, gần như không thể lỗi) → xong ngay.
 *    ② Worker nền (`outboxWorker.ts`) ghi sổ sau, có retry luỹ thừa.
 *
 *  ⭐ FAIL-SOFT BẮT BUỘC: migration `002_outbox_domain_events.sql` do user chạy
 *    tay trên Supabase. Chưa chạy → `publishDomainEvent` trả `unavailable` →
 *    hàm này rơi về **đường đồng bộ cũ**. Nghiệp vụ chính KHÔNG BAO GIỜ được
 *    chết vì outbox chưa tồn tại.
 * ============================================================================
 */

import { supabase } from '../lib/supabase';
import {
  depsFromClient,
  publishDomainEvent,
  dedupeKeyOf,
  OUTBOX_EVENT_TYPES,
  type OutboxDeps,
  type PublishEventInput,
  type PublishOutcome,
} from './domainEventService';

/** Deps mặc định: client Supabase của trình duyệt. */
export const outboxDeps: OutboxDeps = depsFromClient(supabase);

export type PostOutcome =
  /** Đã xếp hàng — worker sẽ ghi sổ. */
  | 'queued'
  /** Đã có trong hàng từ trước (double-click / webhook lặp) — không xếp thêm. */
  | 'deduped'
  /** Outbox chưa sẵn sàng → đã ghi sổ theo đường CŨ (đồng bộ). */
  | 'fallback';

/* -------------------------------------------------------------------------- */
/*  Các sự kiện kế toán                                                       */
/* -------------------------------------------------------------------------- */

/** Đơn online hoàn thành → hạch toán doanh thu. */
export function publishOrderCompleted(
  order: Record<string, any>,
  tenantId?: string | null
): Promise<PublishOutcome> {
  return publishDomainEvent(
    {
      eventType: OUTBOX_EVENT_TYPES.ORDER_COMPLETED,
      aggregateType: 'order',
      aggregateId: String(order?.id ?? ''),
      payload: order,
      dedupeKey: dedupeKeyOf(OUTBOX_EVENT_TYPES.ORDER_COMPLETED, String(order?.id ?? '')),
      tenantId,
    },
    outboxDeps
  );
}

/** Bán tại quầy POS → hạch toán doanh thu (tiền thu ngay). */
export function publishPosSaleCompleted(
  sale: Record<string, any>,
  tenantId?: string | null
): Promise<PublishOutcome> {
  return publishDomainEvent(
    {
      eventType: OUTBOX_EVENT_TYPES.POS_SALE_COMPLETED,
      aggregateType: 'pos_order',
      aggregateId: String(sale?.id ?? ''),
      payload: sale,
      dedupeKey: dedupeKeyOf(OUTBOX_EVENT_TYPES.POS_SALE_COMPLETED, String(sale?.id ?? '')),
      tenantId,
    },
    outboxDeps
  );
}

/** Duyệt chi: hoa hồng CTV / phí vận hành Điểm nhận hàng / rút tiền ví. */
export function publishWithdrawalApproved(
  withdrawal: { id: string; userId?: string; userType?: string; amount: number; refType?: string },
  tenantId?: string | null
): Promise<PublishOutcome> {
  return publishDomainEvent(
    {
      eventType: OUTBOX_EVENT_TYPES.WITHDRAWAL_APPROVED,
      aggregateType: 'withdrawal',
      aggregateId: String(withdrawal.id),
      payload: withdrawal,
      dedupeKey: dedupeKeyOf(OUTBOX_EVENT_TYPES.WITHDRAWAL_APPROVED, String(withdrawal.id)),
      tenantId,
    },
    outboxDeps
  );
}

/* -------------------------------------------------------------------------- */
/*  Hàm dùng tại các điểm gọi                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Ghi sổ kế toán: **thử qua outbox trước**, rơi về đồng bộ nếu outbox chưa có.
 *
 * @param input    Sự kiện cần xếp hàng.
 * @param fallback Đường cũ (gọi trực tiếp `postXxxJournalEntries`).
 *                 CHỈ được chạy khi outbox chưa sẵn sàng.
 * @throws Lỗi của `fallback` (nếu có) — để các `catch` hiện tại xử lý như cũ.
 *
 * Ví dụ tại Orders.tsx:
 * ```ts
 * const r = await postJournalViaOutbox(
 *   { eventType: ..., aggregateType: 'order', aggregateId: order.id, payload: order,
 *     dedupeKey: `order.completed:${order.id}` },
 *   () => postOrderJournalEntries(order),
 * );
 * ```
 */
export async function postJournalViaOutbox(
  input: PublishEventInput,
  fallback: () => Promise<void>,
  deps: OutboxDeps = outboxDeps
): Promise<PostOutcome> {
  const r = await publishDomainEvent(input, deps);

  if (r.ok) return r.deduped ? 'deduped' : 'queued';

  // Outbox chưa sẵn sàng (chưa chạy migration) hoặc lỗi → đường CŨ.
  // Ném lỗi của fallback ra ngoài để caller xử lý y như trước khi tách.
  await fallback();
  return 'fallback';
}

/* -------------------------------------------------------------------------- */
/*  Hàm tiện dụng cho đúng 5 điểm gọi hiện tại                                */
/* -------------------------------------------------------------------------- */

/** Orders.tsx — đơn online hoàn thành. */
export function postOrderJournalViaOutbox(
  order: Record<string, any>,
  tenantId?: string | null
): Promise<PostOutcome> {
  return postJournalViaOutbox(
    {
      eventType: OUTBOX_EVENT_TYPES.ORDER_COMPLETED,
      aggregateType: 'order',
      aggregateId: String(order?.id ?? ''),
      payload: order,
      dedupeKey: dedupeKeyOf(OUTBOX_EVENT_TYPES.ORDER_COMPLETED, String(order?.id ?? '')),
      tenantId,
    },
    async () => {
      const { postOrderJournalEntries } = await import('./accountingService');
      await postOrderJournalEntries(order as any);
    }
  );
}

/** VCommSupermarket.tsx — bán tại quầy POS. */
export function postPosSaleJournalViaOutbox(
  sale: Record<string, any>,
  tenantId?: string | null
): Promise<PostOutcome> {
  return postJournalViaOutbox(
    {
      eventType: OUTBOX_EVENT_TYPES.POS_SALE_COMPLETED,
      aggregateType: 'pos_order',
      aggregateId: String(sale?.id ?? ''),
      payload: sale,
      dedupeKey: dedupeKeyOf(OUTBOX_EVENT_TYPES.POS_SALE_COMPLETED, String(sale?.id ?? '')),
      tenantId,
    },
    async () => {
      const { postOrderJournalEntries } = await import('./accountingService');
      await postOrderJournalEntries(sale as any);
    }
  );
}

/** Settlement.tsx — duyệt chi (hoa hồng CTV / phí vận hành / rút tiền). */
export function postWithdrawalJournalViaOutbox(
  withdrawal: { id: string; userId?: string; userType?: string; amount: number; refType?: string },
  tenantId?: string | null
): Promise<PostOutcome> {
  return postJournalViaOutbox(
    {
      eventType: OUTBOX_EVENT_TYPES.WITHDRAWAL_APPROVED,
      aggregateType: 'withdrawal',
      aggregateId: String(withdrawal.id),
      payload: withdrawal,
      dedupeKey: dedupeKeyOf(OUTBOX_EVENT_TYPES.WITHDRAWAL_APPROVED, String(withdrawal.id)),
      tenantId,
    },
    async () => {
      const { postWithdrawalJournalEntries } = await import('./accountingService');
      await postWithdrawalJournalEntries(withdrawal as any);
    }
  );
}
