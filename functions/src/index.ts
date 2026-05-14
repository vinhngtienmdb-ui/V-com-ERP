import admin from 'firebase-admin';

// Khởi Firebase Admin một lần — các function-side handlers dùng chung.
admin.initializeApp();

// ── AI ───────────────────────────────────────────────────────────────────
export { aiChat, aiRma, aiCare } from './aiHandlers.js';

// ── SePay ────────────────────────────────────────────────────────────────
export {
  sepayTransactions,
  sepayVirtualAccount,
  sepaySoundbox,
  sepayInvoice,
  sepayWebhook,
} from './sepayHandlers.js';

// ── Reconciliation (đối soát SePay) ──────────────────────────────────────
export { reconcileSepayEvent } from './reconciliation.js';

// ── Sellers (KYC, Wallet) ────────────────────────────────────────────────
export { sellerVerifyKyc, sellerEnsureWallet, walletAdjust } from './sellerHandlers.js';

// ── Invoices (e-Invoice TT 78/2021) + Tax reports (NĐ 117/2025) ──────────
export { issueInvoice, monthlySellerTaxAggregation } from './invoiceHandlers.js';

// ── Audit logs (Firestore triggers) ──────────────────────────────────────
export {
  auditProducts,
  auditOrders,
  auditTransactions,
  auditStaff,
  auditStores,
  auditCustomers,
  auditSepayEvents,
} from './auditLog.js';

// ── Healthcheck ──────────────────────────────────────────────────────────
import { onRequest } from 'firebase-functions/v2/https';
import { REGION } from './config.js';

export const health = onRequest({ region: REGION, cors: true }, (_req, res) => {
  res.json({ status: 'ok', service: 'vcomm-erp-functions', timestamp: Date.now() });
});
