
import axios from 'axios';

const INTERNAL_API_KEY = import.meta.env.VITE_INTERNAL_API_KEY || '';

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

class SePayService {
  private get internalHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-internal-key': INTERNAL_API_KEY,
    };
  }

  // Proxied through backend to protect API token
  async getTransactions(params?: { limit?: number; page?: number; bank_account?: string }) {
    try {
      const query = params
        ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
        : '';
      const response = await fetch(`/api/sepay/transactions${query}`, {
        headers: this.internalHeaders,
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json() as { transactions: SePayTransaction[] };
      return data.transactions;
    } catch (error) {
      console.error('SePay getTransactions error:', error);
      throw error;
    }
  }

  async triggerSoundBox(amount: number, content: string, boxId: string) {
    try {
      const response = await axios.post('/api/sepay/soundbox', { amount, content, box_id: boxId }, {
        headers: this.internalHeaders,
      });
      return response.data;
    } catch (error) {
      console.error('SePay triggerSoundBox error:', error);
      throw error;
    }
  }

  async createInvoice(invoiceData: Record<string, unknown>) {
    try {
      const response = await axios.post('/api/sepay/einvoice', invoiceData, {
        headers: this.internalHeaders,
      });
      return response.data;
    } catch (error) {
      console.error('SePay createInvoice error:', error);
      throw error;
    }
  }

  async createVirtualAccount(orderId: string, amount: number) {
    try {
      const response = await axios.post('/api/sepay/virtual-account', { order_id: orderId, amount }, {
        headers: this.internalHeaders,
      });
      return response.data as SePayVirtualAccount;
    } catch (error) {
      console.error('SePay createVirtualAccount error:', error);
      throw error;
    }
  }

  createPaymentQR(amount: number, description: string) {
    const bankId = import.meta.env.VITE_SEPAY_BANK_ID || '970436';
    const accountNo = import.meta.env.VITE_SEPAY_ACCOUNT_NO || '123456789';
    return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(description.replace(/[^a-zA-Z0-9]/g, ''))}&accountName=Khach`;
  }

  // OAuth exchange now proxied through backend — client_secret stays server-side
  async exchangeOAuthToken(code: string) {
    try {
      const response = await fetch('/api/sepay/oauth/token', {
        method: 'POST',
        headers: this.internalHeaders,
        body: JSON.stringify({ code }),
      });
      if (!response.ok) throw new Error('OAuth token exchange failed');
      return response.json();
    } catch (error) {
      console.error('SePay OAuth Error:', error);
      throw error;
    }
  }
}

export const sePayService = new SePayService();
