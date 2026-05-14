import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import admin from 'firebase-admin';
import { verifyAuth, requireRole, HttpAuthError } from './auth.js';
import { REGION } from './config.js';

type ExpressResponse = import('express').Response;

function setCors(res: ExpressResponse) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function handleError(res: ExpressResponse, err: unknown, ctx: string) {
  if (err instanceof HttpAuthError) { res.status(err.status).json({ error: err.message }); return; }
  console.error(`[${ctx}]`, err);
  res.status(500).json({ error: 'Internal error' });
}

/**
 * HTTPS: Manager+/Admin duyệt KYC cho 1 seller.
 *   POST /api/sellers/verify-kyc { sellerId, approved: boolean, reason?: string }
 *
 * Server-side để: (1) gắn auditor uid, (2) validate state machine,
 * (3) tạo wallet seller nếu approved.
 */
export const sellerVerifyKyc = onRequest(
  { region: REGION, cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
    try {
      const auth = await verifyAuth(req);
      requireRole(auth, ['admin', 'director', 'manager']);

      const { sellerId, approved, reason } = req.body ?? {};
      if (!sellerId || typeof approved !== 'boolean') {
        res.status(400).json({ error: 'sellerId + approved bắt buộc' });
        return;
      }
      if (!approved && !reason?.trim()) {
        res.status(400).json({ error: 'reason bắt buộc khi từ chối' });
        return;
      }

      const db = admin.firestore();
      const sellerRef = db.collection('sellers').doc(sellerId);
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(sellerRef);
        if (!snap.exists) throw new HttpAuthError(404, `Seller ${sellerId} không tồn tại`);
        const seller = snap.data() as any;
        if (seller.status !== 'pending_verification') {
          throw new HttpAuthError(409, `Seller ở trạng thái ${seller.status}, không thể verify`);
        }

        if (approved) {
          tx.update(sellerRef, {
            status: 'verified',
            verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          // Tạo wallet seller (idempotent)
          const walletId = `seller_${sellerId}`;
          tx.set(db.collection('wallets').doc(walletId), {
            ownerType: 'seller',
            ownerId: sellerId,
            balance: 0,
            pendingBalance: 0,
            currency: 'VND',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        } else {
          tx.update(sellerRef, {
            status: 'rejected',
            suspendedReason: reason,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });

      res.json({ ok: true, sellerId, newStatus: approved ? 'verified' : 'rejected' });
    } catch (err) {
      handleError(res, err, 'sellerVerifyKyc');
    }
  },
);

/**
 * Trigger Firestore: tự tạo wallet khi seller đạt status 'active' lần đầu
 * (an toàn nếu verify-kyc đã tạo rồi — set { merge: true }).
 */
export const sellerEnsureWallet = onDocumentCreated(
  { region: REGION, document: 'sellers/{sellerId}' },
  async (event) => {
    const sellerId = event.params.sellerId;
    const db = admin.firestore();
    const walletId = `seller_${sellerId}`;
    await db.collection('wallets').doc(walletId).set(
      {
        ownerType: 'seller',
        ownerId: sellerId,
        balance: 0,
        pendingBalance: 0,
        currency: 'VND',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    console.log(`[sellerEnsureWallet] wallet ${walletId} ready`);
  },
);

/**
 * HTTPS: Admin cộng/trừ tiền vào wallet thủ công (vd: nạp commission, hoàn tiền).
 *   POST /api/wallet/adjust { walletId, amount, description }
 */
export const walletAdjust = onRequest(
  { region: REGION, cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
    try {
      const auth = await verifyAuth(req);
      requireRole(auth, ['admin', 'director']);

      const { walletId, amount, description } = req.body ?? {};
      if (!walletId || typeof amount !== 'number' || amount === 0 || !description?.trim()) {
        res.status(400).json({ error: 'walletId + amount (!=0) + description bắt buộc' });
        return;
      }

      const db = admin.firestore();
      const walletRef = db.collection('wallets').doc(walletId);
      const txId = `${walletId}_adj_${Date.now()}`;
      const txRef = db.collection('wallet_transactions').doc(txId);

      await db.runTransaction(async (tx) => {
        const snap = await tx.get(walletRef);
        if (!snap.exists) throw new HttpAuthError(404, `Wallet ${walletId} không tồn tại`);
        tx.update(walletRef, {
          balance: admin.firestore.FieldValue.increment(amount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        tx.set(txRef, {
          walletId,
          type: 'adjustment',
          amount,
          description,
          staffId: auth.uid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      res.json({ ok: true, txId });
    } catch (err) {
      handleError(res, err, 'walletAdjust');
    }
  },
);
