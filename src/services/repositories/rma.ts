import { auth } from '../../lib/firebase';

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || '';

async function bearer(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  return { Authorization: `Bearer ${await user.getIdToken()}` };
}

export interface ProcessReturnParams {
  orderId: string;
  action: 'approve' | 'reject';
  reason?: string;
}

export interface ProcessReturnResult {
  ok: true;
  orderId: string;
  action: 'approve' | 'reject';
  refundAmount: number;
  itemsReturned: number;
}

/** Manager+ duyệt RMA. Approve = hoàn tiền + trả stock. Reject = revert delivered. */
export async function processReturn(params: ProcessReturnParams): Promise<ProcessReturnResult> {
  const res = await fetch(`${API_BASE}/api/orders/process-return`, {
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
