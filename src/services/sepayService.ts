
import axios from 'axios';

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
 private apiToken: string;

 constructor() {
 // In client-side Vite, we use import.meta.env
 // In server-side (if we move to full-stack), we use process.env
 // For now, these are placeholder logic. Real keys should be in .env
 this.apiToken = (import.meta as any).env.VITE_SEPAY_API_TOKEN || '';
 }

 private get headers() {
 return {
 'Authorization': `Bearer ${this.apiToken}`,
 'Content-Type': 'application/json',
 };
 }

 /**
 * Bank Hub: Get transaction history
 */
 async getTransactions(params?: { limit?: number; page?: number; bank_account?: string }) {
 try {
 const response = await axios.get(`${SEPAY_BASE_URL}/bank/transactions`, {
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
 * SoundBox API: Trigger a notification sound
 */
 async triggerSoundBox(amount: number, content: string, boxId: string) {
 try {
 const response = await axios.post(`${SEPAY_BASE_URL}/soundbox/trigger`, {
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
 * eInvoice API: Create a new invoice
 */
 async createInvoice(invoiceData: any) {
 try {
 const response = await axios.post(`${SEPAY_BASE_URL}/einvoice/create`, invoiceData, {
 headers: this.headers,
 });
 return response.data;
 } catch (error) {
 console.error('SePay createInvoice error:', error);
 throw error;
 }
 }

 /**
 * Virtual Account: Create a virtual account for a specific order
 */
 async createVirtualAccount(orderId: string, amount: number) {
 try {
 const response = await axios.post(`${SEPAY_BASE_URL}/virtual-account/create`, {
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
 client_id: (import.meta as any).env.VITE_SEPAY_CLIENT_ID,
 client_secret: (import.meta as any).env.VITE_SEPAY_CLIENT_SECRET,
 });
 return response.data;
 } catch (error) {
 console.error('SePay OAuth Error:', error);
 throw error;
 }
 }
}

export const sePayService = new SePayService();
