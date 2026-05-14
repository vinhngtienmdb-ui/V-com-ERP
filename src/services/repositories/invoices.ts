import { auth } from '../../lib/firebase';

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || '';

async function bearer(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  return { Authorization: `Bearer ${await user.getIdToken()}` };
}

export interface IssueInvoiceParams {
  orderId: string;
  sellerTaxCode: string;
  sellerName: string;
  sellerAddress?: string;
}

export interface IssueInvoiceResult {
  ok: true;
  invoiceId: string;
  invoiceNumber: string;
  serial: string;
  subtotal: number;
  vatTotal: number;
  total: number;
}

/**
 * Gọi Cloud Function issueInvoice tạo hóa đơn điện tử cho 1 order.
 * Yêu cầu order đã ở status 'delivered' hoặc 'completed'.
 */
export async function issueInvoice(params: IssueInvoiceParams): Promise<IssueInvoiceResult> {
  const res = await fetch(`${API_BASE}/api/invoices/issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await bearer()) },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown' }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}
