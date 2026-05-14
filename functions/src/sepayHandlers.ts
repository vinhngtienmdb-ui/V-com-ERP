import { onRequest } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import crypto from 'node:crypto';
import { verifyAuth, HttpAuthError } from './auth.js';
import { SEPAY_API_TOKEN, SEPAY_WEBHOOK_SECRET, REGION } from './config.js';

const SEPAY_BASE = 'https://api.sepay.vn/v1';

type ExpressResponse = import('express').Response;

function setCors(res: ExpressResponse) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Sepay-Signature');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

function sepayHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function handleError(res: ExpressResponse, err: unknown, ctx: string) {
  if (err instanceof HttpAuthError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(`[${ctx}]`, err);
  res.status(502).json({ error: 'Upstream failed' });
}

// ── Proxy: GET /sepay/transactions ───────────────────────────────────────────
export const sepayTransactions = onRequest(
  { region: REGION, secrets: [SEPAY_API_TOKEN], cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }
    try {
      await verifyAuth(req);
      const r = await fetch(`${SEPAY_BASE}/bank/transactions`, { headers: sepayHeaders(SEPAY_API_TOKEN.value()) });
      const data = await r.json();
      res.json(data);
    } catch (err) {
      handleError(res, err, 'sepay/transactions');
    }
  },
);

// ── Proxy: POST /sepay/virtual-account ───────────────────────────────────────
export const sepayVirtualAccount = onRequest(
  { region: REGION, secrets: [SEPAY_API_TOKEN], cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
    try {
      await verifyAuth(req);
      const { order_id, amount } = req.body ?? {};
      if (!order_id || typeof amount !== 'number') {
        res.status(400).json({ error: 'order_id và amount bắt buộc' });
        return;
      }
      const r = await fetch(`${SEPAY_BASE}/virtual-account/create`, {
        method: 'POST',
        headers: sepayHeaders(SEPAY_API_TOKEN.value()),
        body: JSON.stringify({ order_id, amount }),
      });
      const data = await r.json();
      res.json(data);
    } catch (err) {
      handleError(res, err, 'sepay/virtual-account');
    }
  },
);

// ── Proxy: POST /sepay/soundbox ──────────────────────────────────────────────
export const sepaySoundbox = onRequest(
  { region: REGION, secrets: [SEPAY_API_TOKEN], cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
    try {
      await verifyAuth(req);
      const r = await fetch(`${SEPAY_BASE}/soundbox/trigger`, {
        method: 'POST',
        headers: sepayHeaders(SEPAY_API_TOKEN.value()),
        body: JSON.stringify(req.body ?? {}),
      });
      const data = await r.json();
      res.json(data);
    } catch (err) {
      handleError(res, err, 'sepay/soundbox');
    }
  },
);

// ── Proxy: POST /sepay/invoice ───────────────────────────────────────────────
export const sepayInvoice = onRequest(
  { region: REGION, secrets: [SEPAY_API_TOKEN], cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
    try {
      await verifyAuth(req);
      const r = await fetch(`${SEPAY_BASE}/einvoice/create`, {
        method: 'POST',
        headers: sepayHeaders(SEPAY_API_TOKEN.value()),
        body: JSON.stringify(req.body ?? {}),
      });
      const data = await r.json();
      res.json(data);
    } catch (err) {
      handleError(res, err, 'sepay/invoice');
    }
  },
);

// ── Webhook: POST /sepay-webhook ────────────────────────────────────────────
function verifySignature(raw: Buffer, signature: string | undefined, secret: string): boolean {
  if (!signature || !secret) return false;
  const computed = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

export const sepayWebhook = onRequest(
  { region: REGION, secrets: [SEPAY_WEBHOOK_SECRET], cors: false },
  async (req, res) => {
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    // Firebase Functions cung cấp req.rawBody cho HTTPS triggers — dùng nó để HMAC.
    const rawBody: Buffer | undefined = (req as any).rawBody;
    const signature = req.headers['x-sepay-signature'] as string | undefined;
    if (!rawBody || !verifySignature(rawBody, signature, SEPAY_WEBHOOK_SECRET.value())) {
      console.warn('[sepayWebhook] invalid signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    let payload: any;
    try { payload = JSON.parse(rawBody.toString('utf8')); }
    catch { res.status(400).json({ error: 'Invalid JSON' }); return; }

    // Idempotency: ghi vào /sepay_events/{eventId}, nếu tồn tại thì coi như duplicate.
    const eventId = String(payload.event_id || payload.reference_number || payload.id || crypto.randomUUID());
    const db = admin.firestore();
    const ref = db.collection('sepay_events').doc(eventId);
    const existing = await ref.get();
    if (existing.exists) {
      res.status(200).json({ status: 'duplicate', eventId });
      return;
    }
    await ref.set({
      eventId,
      payload,
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'received',
    });
    console.log('[sepayWebhook] stored event', eventId);
    res.status(200).json({ status: 'ok', eventId });
  },
);
