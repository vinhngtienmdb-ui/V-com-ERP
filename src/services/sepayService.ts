import { auth } from '../lib/firebase';

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || '';

export interface SePayTransaction {
  id: string;
  bank_account_number: string;
  amount_in: number;
  amount_out: number;
  accumulated_balance: number;
  transaction_content: string;
  reference_number: string;
  transaction_date: string;
}

export interface SePayVirtualAccount {
  account_number: string;
  bank_name: string;
  account_name: string;
  qr_code_url: string;
}

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

class SePayService {
  /** Bank Hub: lịch sử giao dịch — proxy qua server, KHÔNG để token client. */
  async getTransactions(): Promise<SePayTransaction[]> {
    const res = await fetch(`${API_BASE}/api/sepay/transactions`, { headers: await authHeader() });
    if (!res.ok) throw new Error(`getTransactions failed (${res.status})`);
    const data = await res.json();
    return (data?.transactions ?? []) as SePayTransaction[];
  }

  /** Tạo virtual account cho 1 đơn — proxy qua server. */
  async createVirtualAccount(orderId: string, amount: number): Promise<SePayVirtualAccount> {
    const res = await fetch(`${API_BASE}/api/sepay/virtual-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ order_id: orderId, amount }),
    });
    if (!res.ok) throw new Error(`createVirtualAccount failed (${res.status})`);
    return (await res.json()) as SePayVirtualAccount;
  }

  /** SoundBox: trigger qua server (giữ token ở server). */
  async triggerSoundBox(amount: number, content: string, boxId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/sepay/soundbox`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ amount, content, box_id: boxId }),
    });
    if (!res.ok) throw new Error(`triggerSoundBox failed (${res.status})`);
  }

  /** eInvoice: tạo hóa đơn điện tử qua server. */
  async createInvoice(invoiceData: Record<string, unknown>): Promise<any> {
    const res = await fetch(`${API_BASE}/api/sepay/invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(invoiceData),
    });
    if (!res.ok) throw new Error(`createInvoice failed (${res.status})`);
    return res.json();
  }

  /**
   * QR thanh toán: dùng VietQR public — không cần secret.
   * Bank ID & account phải lấy từ cấu hình store/tenant (sẽ wire ở GĐ 1.5 multi-tenant).
   * Cho phép gọi 2-arg (legacy) hoặc 4-arg để không vỡ caller cũ; nhưng nên migrate sang 4-arg.
   */
  createPaymentQR(arg1: number | string, arg2: string | number, arg3?: number, arg4?: string): string {
    let bankId: string;
    let accountNo: string;
    let amount: number;
    let description: string;
    if (typeof arg1 === 'number') {
      // Legacy: createPaymentQR(amount, description)
      bankId = (import.meta as any).env.VITE_DEFAULT_BANK_ID || '970436';
      accountNo = (import.meta as any).env.VITE_DEFAULT_BANK_ACCOUNT || '0000000000';
      amount = arg1;
      description = String(arg2);
    } else {
      bankId = arg1;
      accountNo = String(arg2);
      amount = arg3 ?? 0;
      description = arg4 ?? '';
    }
    const safeDesc = description.replace(/[^a-zA-Z0-9]/g, '');
    return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(safeDesc)}&accountName=VComm`;
  }
}

export const sePayService = new SePayService();
