/**
 * ============================================================================
 *  hubService.ts — #19: Hub "bán hàng" = CẢ HAI (bán tại trạm + nhận đơn hộ)
 * ============================================================================
 *
 *  Quyết định #19 (spec 030, 02/09/2026): Hub vừa bán hàng có sẵn tại trạm
 *  (cần kho + POS), vừa nhận đơn hộ gửi về kho.
 *
 *  Thiết kế offline-first (yêu cầu #17): mọi luồng có thể mất mạng BẮT BUỘC
 *  dùng HĐ **KHÔNG MÃ** (ký tự đầu 'K') — ND 254/2026 Điều 14.1 (HĐ có mã hỏng
 *  phải đến trực tiếp CQT, không có đường offline). Tại trạm dùng mẫu 1
 *  `1K26TYY` (Điều 6.1.c khoảng trừ: đã đăng ký HĐĐT thường → miễn máy tính tiền).
 *
 *  Mọi hàm sinh dữ liệu ở đây là THUẦN (không chạm DB) để dễ test và tái dùng
 *  cả ở luồng online lẫn offline (POS sinh client_txn_id làm idempotency key).
 * ============================================================================
 */

import { resolveInvoiceShape, type InvoiceChannel } from './einvoiceTax';

export type HubOwnership = 'vcomm' | 'consignment';
export type TransferEdocForm = '6N' | '6B'; // 6N = nội bộ, 6B = gửi bán đại lý
export type OfflineReason = 'system_incident' | 'force_majeure';

export interface InternalIssueVoucher {
  edocForm: TransferEdocForm;
  symbol: string;
  docNo: string;
  fromLocation: string;
  toHubId: string;
  sellerId?: string;
  /** ND 254 Điều 14: nếu lập khi mất mạng → gán thời hạn truyền bù. */
  offlineQueuedAt?: string;
  transmitDueAt?: string;
  legalBasis: string;
}

/**
 * Sinh chứng từ mẫu số 6 (PXK nội bộ / gửi bán đại lý).
 *  - 6N (nội bộ, hàng VComm)   → '6K26NAB'
 *  - 6B (gửi đại lý, ký gửi)   → '6K26BAB'
 * Ký tự đầu LUÔN 'K' (không mã) để được phép offline.
 */
export function buildInternalIssueVoucher(params: {
  edocForm: TransferEdocForm;
  docNo: string;
  fromLocation: string;
  toHubId: string;
  sellerId?: string;
  issueDate?: Date;
  offline?: boolean;
  offlineReason?: OfflineReason;
}): InternalIssueVoucher {
  if (params.edocForm === '6B' && !params.sellerId) {
    throw new Error('Chứng từ mẫu 6B (gửi bán đại lý) bắt buộc có seller_id (bên ký gửi).');
  }
  const yy = String((params.issueDate || new Date()).getUTCFullYear()).slice(-2);
  const symbol = params.edocForm === '6B' ? `6K${yy}BAB` : `6K${yy}NAB`;

  let offlineQueuedAt: string | undefined;
  let transmitDueAt: string | undefined;
  if (params.offline) {
    const now = params.issueDate || new Date();
    offlineQueuedAt = now.toISOString();
    transmitDueAt = computeTransmitDueAt(now, params.offlineReason || 'system_incident').toISOString();
  }

  return {
    edocForm: params.edocForm,
    symbol,
    docNo: params.docNo,
    fromLocation: params.fromLocation,
    toHubId: params.toHubId,
    sellerId: params.sellerId,
    offlineQueuedAt,
    transmitDueAt,
    legalBasis: 'TT 91/2026/TT-BTC Phụ lục I (mẫu số 6)',
  };
}

/** ND 254 Điều 14.4 (sự cố hệ thống): +02 ngày làm việc; 14.5 (bất khả kháng): +03. */
export function computeTransmitDueAt(from: Date, reason: OfflineReason): Date {
  const days = reason === 'force_majeure' ? 3 : 2;
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  let added = 0;
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) added++; // chỉ đếm ngày làm việc
  }
  return d;
}

export interface PosOrderInput {
  hubId: string;
  shiftId?: string;
  ownership: HubOwnership;
  sellerId?: string;
  items: Array<{ productId: string; name: string; qty: number; unitPrice: number; vatRate?: number }>;
  paymentMethod?: 'cash' | 'qr_dynamic' | 'card' | 'wallet';
  clientTxnId: string;
  offline?: boolean;
}

export interface PosOrder {
  hubId: string;
  shiftId?: string;
  ownership: HubOwnership;
  sellerId?: string;
  items: Array<{
    productId: string;
    name: string;
    qty: number;
    unitPrice: number;
    vatRate: number;
    vatAmount: number;
    lineTotal: number;
  }>;
  subtotal: number;
  vatAmount: number;
  total: number;
  paymentMethod: 'cash' | 'qr_dynamic' | 'card' | 'wallet';
  /** Hình thức HĐ tại trạm: luôn mẫu 1, KHÔNG MÃ (offline-safe). */
  invoiceForm: string;
  invoiceSymbol: string;
  offline: boolean;
  clientTxnId: string;
}

/**
 * Tạo đơn bán tại quầy (POS). HĐ tại trạm luôn dùng resolveInvoiceShape(channel='hub_pos')
 * → mẫu 1, ký hiệu `1K26TYY` (KHÔNG MÃ) theo ND 254 Điều 6.1.c + Điều 14.
 * `clientTxnId` là idempotency key do POS sinh khi offline (unique per hub).
 */
export function createPosOrder(input: PosOrderInput): PosOrder {
  if (input.ownership === 'consignment' && !input.sellerId) {
    throw new Error('Đơn ký gửi (consignment) bắt buộc có seller_id.');
  }
  const shape = resolveInvoiceShape({ channel: 'hub_pos' as InvoiceChannel, issueDate: new Date() });

  const items = input.items.map((it) => {
    const vatRate = it.vatRate ?? 0.1;
    const lineTotal = it.qty * it.unitPrice;
    const vatAmount = Math.round(lineTotal * vatRate * 100) / 100;
    return {
      productId: it.productId,
      name: it.name,
      qty: it.qty,
      unitPrice: it.unitPrice,
      vatRate,
      vatAmount,
      lineTotal: Math.round((lineTotal + vatAmount) * 100) / 100,
    };
  });

  const subtotal = Math.round(items.reduce((a, i) => a + i.qty * i.unitPrice, 0) * 100) / 100;
  const vatAmount = Math.round(items.reduce((a, i) => a + i.vatAmount, 0) * 100) / 100;

  return {
    hubId: input.hubId,
    shiftId: input.shiftId,
    ownership: input.ownership,
    sellerId: input.sellerId,
    items,
    subtotal,
    vatAmount,
    total: Math.round((subtotal + vatAmount) * 100) / 100,
    paymentMethod: input.paymentMethod || 'cash',
    invoiceForm: shape.formNo,
    invoiceSymbol: shape.symbol,
    offline: input.offline || false,
    clientTxnId: input.clientTxnId,
  };
}

/** Mở ca thu ngân. diff = expected - closing (tính sau khi chốt). */
export function openShift(params: {
  hubId: string;
  openedBy: string;
  openingCash?: number;
}): { hubId: string; openedBy: string; openingCash: number; openedAt: string } {
  return {
    hubId: params.hubId,
    openedBy: params.openedBy,
    openingCash: params.openingCash || 0,
    openedAt: new Date().toISOString(),
  };
}
