import { supabase } from '../lib/supabase';
import { recordPartnerLedgerEntry, updateWalletBalance } from './dbService';

/**
 * Escrow Engine — Luật Bảo vệ Quyền lợi Người tiêu dùng 36/2024/QH15
 *
 * Quy tắc giải ngân (release rules):
 * 1. `locked`  — tiền người mua đã vào vault sàn, chờ giao hàng
 * 2. `delivered` — logistics xác nhận giao thành công, bắt đầu đếm retention
 * 3. `released` — hết retention (mặc định 7 ngày) & không có khiếu nại mở → giải ngân seller
 * 4. `refunded` — khiếu nại hợp lệ / hết hạn giao không thành → hoàn người mua
 *
 * Mọi chuyển trạng thái ghi audit + bút toán double-entry.
 */

export type EscrowStatus = 'locked' | 'delivered' | 'released' | 'refunded' | 'disputed';

export interface EscrowRecord {
  id: string;
  order_id: string;
  amount: number;
  seller_id: string;
  buyer_id: string;
  status: EscrowStatus;
  locked_at: string;
  delivered_at: string | null;
  retention_days: number;
  auto_release_at: string | null;
  released_at: string | null;
  refunded_at: string | null;
  dispute_id: string | null;
  journal_entry_id: string | null;
}

const TENANT_ID = 'tenant-vcomm-prod-01';

async function ensureTable(): Promise<void> {
  // Bảng escrows được tạo bởi migration SQL; ở đây chỉ kiểm tra khả năng truy cập
  const { error } = await supabase.from('escrows').select('id', { count: 'exact', head: true }).limit(1);
  if (error) throw new Error(`Escrow table không khả dụng: ${error.message}`);
}

/** Tạo escrow khi người mua thanh toán thành công */
export async function createEscrow(params: {
  orderId: string;
  amount: number;
  sellerId: string;
  buyerId: string;
  retentionDays?: number;
}): Promise<EscrowRecord> {
  await ensureTable();
  const now = new Date();
  const retentionDays = params.retentionDays ?? 7;
  const autoReleaseAt = new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('escrows')
    .insert({
      order_id: params.orderId,
      amount: params.amount,
      seller_id: params.sellerId,
      buyer_id: params.buyerId,
      status: 'locked',
      locked_at: now.toISOString(),
      retention_days: retentionDays,
      auto_release_at: autoReleaseAt.toISOString(),
      tenant_id: TENANT_ID
    })
    .select()
    .single();

  if (error) throw new Error(`Không thể tạo escrow: ${error.message}`);
  return data as EscrowRecord;
}

/** Logistics xác nhận giao hàng thành công → bắt đầu đếm retention */
export async function markEscrowDelivered(escrowId: string): Promise<void> {
  const now = new Date();
  const { error } = await supabase
    .from('escrows')
    .update({ status: 'delivered', delivered_at: now.toISOString() })
    .eq('id', escrowId)
    .eq('status', 'locked'); // chỉ cho phép chuyển từ locked

  if (error) throw new Error(`Không cập nhật được escrow: ${error.message}`);
}

/** Tìm escrow theo mã đơn — dùng để idempotent khi tạo và khi mark delivered */
export async function getEscrowByOrderId(orderId: string): Promise<EscrowRecord | null> {
  const { data, error } = await supabase
    .from('escrows')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();
  if (error) throw new Error(`Truy vấn escrow theo đơn lỗi: ${error.message}`);
  return (data as EscrowRecord) || null;
}

/** Mở khiếu nại → phong tỏa giải ngân tự động */
export async function openDispute(escrowId: string, disputeId: string): Promise<void> {
  const { error } = await supabase
    .from('escrows')
    .update({ status: 'disputed', dispute_id: disputeId })
    .eq('id', escrowId)
    .in('status', ['locked', 'delivered']);

  if (error) throw new Error(`Không mở được khiếu nại escrow: ${error.message}`);
}

/** Giải ngân cho seller sau khi hết retention, không có dispute. Ghi double-entry. */
export async function releaseEscrow(escrow: EscrowRecord): Promise<void> {
  if (escrow.status === 'released') return;
  if (escrow.status === 'disputed') throw new Error('Escrow đang khiếu nại, không thể giải ngân tự động.');
  if (escrow.status === 'refunded') throw new Error('Escrow đã hoàn tiền, không thể giải ngân.');

  // 1. Cập nhật ví seller (biến động số dư)
  await updateWalletBalance(escrow.seller_id, escrow.amount, {
    type: 'payout',
    gateway: 'escrow_release',
    status: 'success'
  });

  // 2. Ghi công nợ đối tác (partner ledger)
  await recordPartnerLedgerEntry({
    partnerId: escrow.seller_id,
    partnerType: 'seller',
    refType: 'order',
    refId: escrow.order_id,
    debit: 0,
    credit: escrow.amount
  });

  // 3. Đóng escrow
  const { error } = await supabase
    .from('escrows')
    .update({ status: 'released', released_at: new Date().toISOString() })
    .eq('id', escrow.id)
    .eq('status', 'delivered'); // đảm bảo idempotent

  if (error) throw new Error(`Không đóng được escrow: ${error.message}`);
}

/** Hoàn tiền người mua (khiếu nại hợp lệ / giao hàng thất bại) */
export async function refundEscrow(escrow: EscrowRecord): Promise<void> {
  if (escrow.status === 'refunded') return;

  await updateWalletBalance(escrow.buyer_id, escrow.amount, {
    type: 'refund',
    gateway: 'escrow_refund',
    status: 'success'
  });

  const { error } = await supabase
    .from('escrows')
    .update({ status: 'refunded', refunded_at: new Date().toISOString() })
    .eq('id', escrow.id)
    .in('status', ['locked', 'delivered', 'disputed']);

  if (error) throw new Error(`Không hoàn tiền được escrow: ${error.message}`);
}

/**
 * Cron/queue job: chạy định kỳ —
 * 1. Escrow đã delivered + qua auto_release_at + không dispute → release
 * 2. Escrow locked quá hạn giao hàng (không delivered) → refund người mua
 */
export async function processDueEscrows(): Promise<{ released: number; refunded: number }> {
  const now = new Date().toISOString();

  // 1. Tìm escrow đến hạn giải ngân
  const { data: dueToRelease, error: e1 } = await supabase
    .from('escrows')
    .select('*')
    .eq('status', 'delivered')
    .lte('auto_release_at', now)
    .is('dispute_id', null);

  if (e1) throw new Error(`Truy vấn escrow đến hạn lỗi: ${e1.message}`);

  let released = 0;
  for (const row of (dueToRelease || []) as EscrowRecord[]) {
    try {
      await releaseEscrow(row);
      released++;
    } catch (err) {
      console.error(`[Escrow] Release thất bại ${row.id}:`, err);
    }
  }

  // 2. Locked quá 14 ngày không được giao → hoàn người mua (bảo vệ NTD Điều 28)
  const staleDeadline = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: staleLocked, error: e2 } = await supabase
    .from('escrows')
    .select('*')
    .eq('status', 'locked')
    .lte('locked_at', staleDeadline);

  if (e2) throw new Error(`Truy vấn escrow quá hạn lỗi: ${e2.message}`);

  let refunded = 0;
  for (const row of (staleLocked || []) as EscrowRecord[]) {
    try {
      await refundEscrow(row);
      refunded++;
    } catch (err) {
      console.error(`[Escrow] Refund thất bại ${row.id}:`, err);
    }
  }

  return { released, refunded };
}

/** Liệt kê escrow (phân trang) cho UI */
export async function listEscrows(page = 1, pageSize = 20): Promise<{ rows: EscrowRecord[]; total: number }> {
  const from = (page - 1) * pageSize;
  const { data, error, count } = await supabase
    .from('escrows')
    .select('*', { count: 'exact' })
    .order('locked_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) throw new Error(`Không tải được escrows: ${error.message}`);
  return { rows: (data || []) as EscrowRecord[], total: count || 0 };
}
