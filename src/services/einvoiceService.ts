import { requireReadyProvider, getIntegrationConfig } from './integrationConfigService';
import { computeOrderTax, LineItemTax } from './taxService';
import { db, doc, updateDoc } from './dbService';

/**
 * E-Invoice Adapter — TT 78/2021/TT-BTC
 * Nhà cung cấp được CQT cấp phép qua config: MISA / VNPT / FPT.
 *
 * Luồng phát hành chuẩn TT 78:
 * 1. Tạo hóa đơn_draft (mẫu BC22 đã đăng ký) từ order
 * 2. Ký số bằng chứng thư của DN (provider lo phần ký)
 * 3. Gửi CQT mã hóa đơn (provider tự truyền tải)
 * 4. Nhận mã tra cứu + ngày ký → lưu vào order
 *
 * Khi chưa add key → throw 'not configured' rõ ràng, UI hiển thị hướng dẫn.
 */

export interface EInvoiceDraft {
  invoiceTemplate: string;
  invoiceSeries: string;
  invoiceNumber: string;
  issueDate: string;
  sellerInfo: { name: string; taxCode: string; address: string };
  buyerInfo: { name: string; taxCode?: string; email?: string; phone?: string };
  items: Array<{ name: string; quantity: number; unitPrice: number; vatRate: number; vatAmount: number }>;
  subtotal: number;
  vatAmount: number;
  totalWithVat: number;
  currency: 'VND';
  paymentMethod: string;
  orderRef: string;
}

export interface EInvoiceResult {
  success: boolean;
  invoiceNumber?: string;
  lookupCode?: string;      // mã tra cứu CQT
  signedAt?: string;
  xmlBlob?: string;          // XML gốc từ provider (tải về in)
  providerMessage?: string;
}

/** Tạo payload hóa đơn chuẩn từ order — độc lập provider */
export function buildEInvoiceDraft(order: any, items: LineItemTax[], legalInfo: {
  companyName: string; taxCode: string; address: string;
}): EInvoiceDraft {
  const tax = computeOrderTax(items);
  const now = new Date();
  return {
    invoiceTemplate: '1/2024/TT78-MST',
    invoiceSeries: 'AA/26E',
    invoiceNumber: `HD-${now.getFullYear()}-${Date.now().toString().slice(-8)}`,
    issueDate: now.toISOString(),
    sellerInfo: {
      name: legalInfo.companyName,
      taxCode: legalInfo.taxCode,
      address: legalInfo.address
    },
    buyerInfo: {
      name: order.customerName || 'Khách lẻ',
      taxCode: order.buyerTaxCode || undefined,
      email: order.customerEmail || undefined,
      phone: order.customerPhone || undefined
    },
    items: tax.lines.map(l => ({
      name: l.name,
      quantity: l.qty,
      unitPrice: l.price,
      vatRate: l.vatRate ?? 0,
      vatAmount: l.lineVat
    })),
    subtotal: tax.subtotal,
    vatAmount: tax.vatAmount,
    totalWithVat: tax.subtotal + tax.vatAmount,
    currency: 'VND',
    paymentMethod: order.paymentMethod || 'cod',
    orderRef: order.id
  };
}

/** Kiểm tra sẵn sàng (không throw) — UI dùng để disable nút phát hành */
export async function isEInvoiceReady(): Promise<boolean> {
  try {
    const cfg = await getIntegrationConfig('einvoice');
    return !!(cfg?.is_enabled && cfg.config.endpoint && cfg.config.api_key);
  } catch {
    return false;
  }
}

/**
 * Phát hành hóa đơn điện tử qua provider đã cấu hình.
 * Gọi server proxy /api/einvoice/issue — key nằm ở server, client chỉ gửi draft.
 */
export async function issueEInvoice(orderId: string, order: any, items: LineItemTax[], legalInfo: {
  companyName: string; taxCode: string; address: string;
}): Promise<EInvoiceResult> {
  // Gate: bắt lỗi friendly khi chưa add key
  await requireReadyProvider('einvoice');

  const draft = buildEInvoiceDraft(order, items, legalInfo);

  const res = await fetch('/api/einvoice/issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, draft })
  });
  const data = await res.json();

  if (!res.ok || data.status !== 'success') {
    throw new Error(data.message || 'Provider từ chối phát hành hóa đơn.');
  }

  // Lưu kết quả vào order (giữ schema hiện tại Orders.tsx: einvoiceStatus/Xml/LookupCode/SignedAt)
  const orderRef = { path: `orders/${orderId}`, tableName: 'orders', id: orderId } as any;
  await updateDoc(orderRef, {
    einvoiceStatus: 'issued',
    einvoiceXml: data.xmlBlob || null,
    einvoiceLookupCode: data.lookupCode || null,
    einvoiceSignedAt: data.signedAt || new Date().toISOString()
  });

  return {
    success: true,
    invoiceNumber: data.invoiceNumber,
    lookupCode: data.lookupCode,
    signedAt: data.signedAt,
    xmlBlob: data.xmlBlob,
    providerMessage: data.message
  };
}

/** Hủy/thay thế hóa đơn theo TT 78 Điều 19 — bắt buộc khi sai sót */
export async function cancelEInvoice(orderId: string, reason: string): Promise<void> {
  await requireReadyProvider('einvoice');
  if (!reason.trim()) throw new Error('Lý do hủy hóa đơn là bắt buộc theo TT 78 Điều 19.');

  const res = await fetch('/api/einvoice/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, reason })
  });
  const data = await res.json();
  if (!res.ok || data.status !== 'success') {
    throw new Error(data.message || 'Hủy hóa đơn thất bại.');
  }

  const orderRef = { path: `orders/${orderId}`, tableName: 'orders', id: orderId } as any;
  await updateDoc(orderRef, {
    einvoiceStatus: 'cancelled',
    einvoiceCancelReason: reason,
    einvoiceCancelledAt: new Date().toISOString()
  });
}
