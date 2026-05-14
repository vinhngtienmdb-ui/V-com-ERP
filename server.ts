import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import admin from 'firebase-admin';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Firebase Admin (server-side) ───────────────────────────────────────────
// Trong dev có thể chưa có service account; degrade gracefully thay vì crash.
let adminEnabled = false;
try {
  if (!admin.apps.length) {
    // Hỗ trợ 2 cách cấu hình:
    //  (1) GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json
    //  (2) FIREBASE_SERVICE_ACCOUNT_JSON='{ ... }' (nhúng vào env)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
      });
      adminEnabled = true;
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
      adminEnabled = true;
    }
  } else {
    adminEnabled = true;
  }
} catch (err) {
  console.warn('[firebase-admin] init failed:', (err as Error).message);
}

if (!adminEnabled) {
  console.warn(
    '[firebase-admin] Service account chưa cấu hình — endpoints /api/* sẽ TỪ CHỐI request có ý nghĩa khi NODE_ENV=production. Trong dev cho phép bypass.',
  );
}

// ─── Gemini (server-side) ───────────────────────────────────────────────────
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (geminiClient) return geminiClient;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  geminiClient = new GoogleGenAI({ apiKey: key });
  return geminiClient;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION = `
Bạn là trợ lý AI nội bộ của VComm — sàn TMĐT tại Việt Nam.
- Trả lời ngắn gọn, lịch sự, bằng tiếng Việt.
- Nếu hỏi về đơn hàng, yêu cầu Order ID nếu chưa có.
- Nếu hỏi về sản phẩm, yêu cầu tên/danh mục.
- Không tiết lộ thông tin nội bộ hệ thống hoặc cấu hình.
`;

async function callGemini(
  prompt: string,
  history: { role: 'user' | 'model'; content: string }[] = [],
): Promise<string> {
  const ai = getGemini();
  if (!ai) {
    return 'Mock response: GEMINI_API_KEY chưa cấu hình trên server. Vui lòng đặt vào .env / env Cloud Run.';
  }
  const contents = [
    ...history.map((h) => ({ role: h.role, parts: [{ text: h.content }] })),
    { role: 'user' as const, parts: [{ text: prompt }] },
  ];
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: contents as any,
    config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.7 },
  });
  return response.text?.trim() ?? '';
}

// ─── Middleware: verify Firebase ID token ───────────────────────────────────
interface AuthedRequest extends Request {
  uid?: string;
  email?: string;
}

async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing bearer token' });
    return;
  }
  const token = header.substring('Bearer '.length);

  if (!adminEnabled) {
    if (process.env.NODE_ENV === 'production') {
      res.status(503).json({ error: 'Auth backend not configured' });
      return;
    }
    // Dev: skip verification but log
    console.warn('[requireAuth] DEV MODE — bypassing token verification');
    req.uid = 'dev-bypass';
    next();
    return;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.email = decoded.email;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid ID token' });
  }
}

// ─── SePay webhook signature verify ─────────────────────────────────────────
function verifySePaySignature(rawBody: Buffer, signature: string | undefined): boolean {
  const secret = process.env.SEPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[sepay] SEPAY_WEBHOOK_SECRET chưa cấu hình — từ chối webhook');
    return false;
  }
  if (!signature) return false;
  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Body parsers — webhook cần raw buffer để verify HMAC.
  app.use('/api/sepay-webhook', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '1mb' }));

  // ── SePay webhook (HMAC verify + idempotency) ─────────────────────────────
  const processedWebhookIds = new Set<string>();
  app.post('/api/sepay-webhook', async (req, res) => {
    const signature = req.headers['x-sepay-signature'] as string | undefined;
    const rawBody = req.body as Buffer;
    if (!verifySePaySignature(rawBody, signature)) {
      console.warn('[sepay-webhook] signature invalid — từ chối');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }
    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      res.status(400).json({ error: 'Invalid JSON' });
      return;
    }

    // Idempotency: SePay event_id hoặc reference_number
    const eventId = payload.event_id || payload.reference_number || payload.id;
    if (eventId && processedWebhookIds.has(eventId)) {
      res.status(200).json({ status: 'duplicate', eventId });
      return;
    }
    if (eventId) processedWebhookIds.add(eventId);

    // TODO (GĐ 2): ghi Firestore /sepay_events/{eventId} + reconcile order
    console.log('[sepay-webhook] verified payload:', { eventId, amount: payload.amount_in });
    res.status(200).json({ status: 'ok', eventId });
  });

  // ── SePay proxy endpoints (đã verify auth) ────────────────────────────────
  const sepayHeaders = () => ({
    Authorization: `Bearer ${process.env.SEPAY_API_TOKEN ?? ''}`,
    'Content-Type': 'application/json',
  });

  app.get('/api/sepay/transactions', requireAuth, async (_req, res) => {
    try {
      const r = await fetch('https://api.sepay.vn/v1/bank/transactions', { headers: sepayHeaders() });
      const data = await r.json();
      res.json(data);
    } catch (err) {
      console.error('[sepay/transactions]', err);
      res.status(502).json({ error: 'Upstream failed' });
    }
  });

  app.post('/api/sepay/virtual-account', requireAuth, async (req, res) => {
    try {
      const { order_id, amount } = req.body ?? {};
      if (!order_id || typeof amount !== 'number') {
        res.status(400).json({ error: 'order_id và amount bắt buộc' });
        return;
      }
      const r = await fetch('https://api.sepay.vn/v1/virtual-account/create', {
        method: 'POST',
        headers: sepayHeaders(),
        body: JSON.stringify({ order_id, amount }),
      });
      const data = await r.json();
      res.json(data);
    } catch (err) {
      console.error('[sepay/virtual-account]', err);
      res.status(502).json({ error: 'Upstream failed' });
    }
  });

  app.post('/api/sepay/soundbox', requireAuth, async (req, res) => {
    try {
      const { amount, content, box_id } = req.body ?? {};
      const r = await fetch('https://api.sepay.vn/v1/soundbox/trigger', {
        method: 'POST',
        headers: sepayHeaders(),
        body: JSON.stringify({ amount, content, box_id }),
      });
      const data = await r.json();
      res.json(data);
    } catch (err) {
      console.error('[sepay/soundbox]', err);
      res.status(502).json({ error: 'Upstream failed' });
    }
  });

  app.post('/api/sepay/invoice', requireAuth, async (req, res) => {
    try {
      const r = await fetch('https://api.sepay.vn/v1/einvoice/create', {
        method: 'POST',
        headers: sepayHeaders(),
        body: JSON.stringify(req.body ?? {}),
      });
      const data = await r.json();
      res.json(data);
    } catch (err) {
      console.error('[sepay/invoice]', err);
      res.status(502).json({ error: 'Upstream failed' });
    }
  });

  // ── AI endpoints (Gemini, server-side key) ────────────────────────────────
  app.post('/api/ai/chat', requireAuth, async (req: AuthedRequest, res) => {
    const { message, history } = req.body ?? {};
    if (typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'message bắt buộc' });
      return;
    }
    try {
      const text = await callGemini(message, history ?? []);
      res.json({ text });
    } catch (err) {
      console.error('[ai/chat]', err);
      res.status(502).json({ error: 'AI upstream failed' });
    }
  });

  app.post('/api/ai/rma', requireAuth, async (req, res) => {
    const { order } = req.body ?? {};
    if (!order?.id) {
      res.status(400).json({ error: 'order.id bắt buộc' });
      return;
    }
    const prompt = `Soạn phản hồi chuyên nghiệp về RMA cho đơn ${order.id}. Phương thức TT: ${order.paymentMethod ?? 'N/A'}. Lịch sự, xin lỗi, đề xuất hướng giải quyết theo chính sách sàn.`;
    try {
      res.json({ text: await callGemini(prompt) });
    } catch (err) {
      console.error('[ai/rma]', err);
      res.status(502).json({ error: 'AI upstream failed' });
    }
  });

  app.post('/api/ai/care', requireAuth, async (req, res) => {
    const { customer } = req.body ?? {};
    if (!customer?.name) {
      res.status(400).json({ error: 'customer.name bắt buộc' });
      return;
    }
    const prompt = `Soạn tin chăm sóc cá nhân hóa cho khách ${customer.name}. Tổng chi tiêu: ${customer.totalSpent ?? 0}đ. Số đơn: ${customer.orderCount ?? 0}. RFM: R=${customer.rfmScore?.recency ?? '-'} F=${customer.rfmScore?.frequency ?? '-'} M=${customer.rfmScore?.monetary ?? '-'}. Cảm ơn, hỏi thăm sự hài lòng, mời quay lại xem ưu đãi.`;
    try {
      res.json({ text: await callGemini(prompt) });
    } catch (err) {
      console.error('[ai/care]', err);
      res.status(502).json({ error: 'AI upstream failed' });
    }
  });

  // ── Healthcheck ────────────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      adminEnabled,
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      sepayWebhookConfigured: !!process.env.SEPAY_WEBHOOK_SECRET,
    });
  });

  // ── Vite middleware (dev) / static (prod) ─────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`  firebase-admin: ${adminEnabled ? 'ENABLED' : 'DISABLED (dev)'}`);
    console.log(`  GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'SET' : 'MISSING'}`);
    console.log(`  SEPAY_WEBHOOK_SECRET: ${process.env.SEPAY_WEBHOOK_SECRET ? 'SET' : 'MISSING'}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
