
import axios from 'axios';
import { safeLocalStorage } from '../lib/storage';

const SEPAY_BASE_URL = 'https://api.sepay.vn/v1';

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
  private get apiToken() {
    return safeLocalStorage.getItem('api_sepay_api_token') || '';
  }

  private get clientId() {
    return safeLocalStorage.getItem('api_sepay_client_id') || '';
  }

  private get clientSecret() {
    return safeLocalStorage.getItem('api_sepay_client_secret') || '';
  }

  private get headers() {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

 /**
 * Bank Hub: Get transaction history (routed via local API proxy to prevent CORS)
 */
 async getTransactions(params?: { limit?: number; page?: number; bank_account?: string }) {
 try {
 const response = await axios.get('/api/sepay/transactions', {
 headers: this.headers,
 params,
 });
 return response.data.transactions as SePayTransaction[];
 } catch (error) {
 console.error('SePay getTransactions error:', error);
 throw error;
 }
 }

 /**
 * SoundBox API: Trigger a notification sound (routed via local API proxy to prevent CORS)
 */
 async triggerSoundBox(amount: number, content: string, boxId: string) {
 try {
 const response = await axios.post('/api/sepay/soundbox/trigger', {
 amount,
 content,
 box_id: boxId,
 }, { headers: this.headers });
 return response.data;
 } catch (error) {
 console.error('SePay triggerSoundBox error:', error);
 throw error;
 }
 }

 /**
 * eInvoice API: Create a new invoice (routed via local API proxy to prevent CORS)
 */
 async createInvoice(invoiceData: any) {
 try {
 const response = await axios.post('/api/sepay/einvoice/create', invoiceData, {
 headers: this.headers,
 });
 return response.data;
 } catch (error) {
 console.error('SePay createInvoice error:', error);
 throw error;
 }
 }

 /**
 * Virtual Account: Create a virtual account for a specific order (routed via local API proxy to prevent CORS)
 */
 async createVirtualAccount(orderId: string, amount: number) {
 try {
 const response = await axios.post('/api/sepay/virtual-account/create', {
 order_id: orderId,
 amount,
 }, { headers: this.headers });
 return response.data as SePayVirtualAccount;
 } catch (error) {
 console.error('SePay createVirtualAccount error:', error);
 throw error;
 }
 }

 /**
 * Get simulated/live webhook events from local backend
 */
 async getWebhookEvents() {
   try {
     const response = await axios.get('/api/sepay/webhook-events');
     return response.data.events || [];
   } catch (error) {
     console.error('SePay getWebhookEvents error:', error);
     return [];
   }
 }

 /**
 * Clear processed webhook events on backend
 */
 async clearWebhookEvents(ids: number[]) {
   try {
     const response = await axios.post('/api/sepay/webhook-events/clear', { ids });
     return response.data;
   } catch (error) {
     console.error('SePay clearWebhookEvents error:', error);
   }
 }

 /**
 * Create Payment URL / QR
 */
 createPaymentQR(amount: number, description: string) {
 // This is often a client-side generation using VietQR standard or SePay helper
 const bankId = '970436'; // Example Bank ID (VCB)
 const accountNo = '123456789';
 return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(description.replace(/[^a-zA-Z0-9]/g, ''))}&accountName=Khach`;
 }

 /**
 * OAuth2: Handling token exchange (Client-side part)
 */
 async exchangeOAuthToken(code: string) {
 // This should ideally happen on the server to protect client_secret
 // But providing the structure here
 try {
 const response = await axios.post(`${SEPAY_BASE_URL}/oauth/token`, {
 grant_type: 'authorization_code',
 code,
 client_id: this.clientId,
 client_secret: this.clientSecret,
 });
 return response.data;
 } catch (error) {
 console.error('SePay OAuth Error:', error);
 throw error;
 }
 }
}

export const sePayService = new SePayService();
