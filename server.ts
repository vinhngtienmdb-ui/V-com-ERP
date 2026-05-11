
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_INSTRUCTION = `
You are a helpful customer support AI for VComm, a major e-commerce marketplace in Vietnam.
Your goal is to help users with their orders, product questions, and general inquiries.

Context:
- You are integrated into the ERP system.
- You should provide concise, helpful, and professional answers in Vietnamese.
- If a user asks about an order, ask for their Order ID if they haven't provided it.
- If a user asks about a product, ask for the Product Name or Category.
- You can act as a representative for Zalo OA, Facebook Messenger, or Live Chat.
`;

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!aiInstance) aiInstance = new GoogleGenAI({ apiKey: key });
  return aiInstance;
}

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(windowMs: number, max: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count++;
    if (entry.count > max) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    next();
  };
}

// Auth middleware — verifies x-internal-key header
function requireInternalAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const apiKey = req.headers['x-internal-key'];
  const expectedKey = process.env.INTERNAL_API_KEY;
  if (!expectedKey) {
    console.warn('INTERNAL_API_KEY not set — API endpoints are unprotected!');
    return next();
  }
  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  // --- AI Routes ---
  app.post(
    '/api/ai/chat',
    requireInternalAuth,
    rateLimit(60_000, 30),
    async (req: express.Request, res: express.Response) => {
      const { message, history = [] } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'message is required' });
      }

      const ai = getAI();
      if (!ai) {
        return res.json({ text: 'Xin chào! (Chưa cấu hình GEMINI_API_KEY trên server)' });
      }

      try {
        const contents = [
          ...(history as { role: string; content: string }[]).map(h => ({
            role: h.role === 'model' ? 'model' : 'user',
            parts: [{ text: h.content }],
          })),
          { role: 'user', parts: [{ text: message }] },
        ];

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: contents as Parameters<GoogleGenAI['models']['generateContent']>[0]['contents'],
          config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.7 },
        });

        res.json({ text: response.text?.trim() || 'Xin lỗi, vui lòng thử lại.' });
      } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({ error: 'AI service error' });
      }
    }
  );

  app.post(
    '/api/ai/rma',
    requireInternalAuth,
    rateLimit(60_000, 20),
    async (req: express.Request, res: express.Response) => {
      const { order } = req.body;
      if (!order?.id) return res.status(400).json({ error: 'order.id is required' });

      const ai = getAI();
      if (!ai) return res.json({ text: 'Chưa cấu hình GEMINI_API_KEY' });

      try {
        const prompt = `Soạn thảo phản hồi chuyên nghiệp cho khách hàng về yêu cầu hoàn trả (RMA) của đơn hàng ${order.id}. Đơn hàng có phương thức thanh toán: ${order.paymentMethod}. Hãy lịch sự, xin lỗi về sự cố và đề xuất hướng giải quyết dựa trên chính sách sàn.`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.7 },
        });
        res.json({ text: response.text?.trim() || '' });
      } catch (error) {
        console.error('AI RMA error:', error);
        res.status(500).json({ error: 'AI service error' });
      }
    }
  );

  app.post(
    '/api/ai/customer-care',
    requireInternalAuth,
    rateLimit(60_000, 20),
    async (req: express.Request, res: express.Response) => {
      const { customer } = req.body;
      if (!customer?.name) return res.status(400).json({ error: 'customer.name is required' });

      const ai = getAI();
      if (!ai) return res.json({ text: 'Chưa cấu hình GEMINI_API_KEY' });

      try {
        const prompt = `Hãy soạn một tin nhắn chăm sóc khách hàng cá nhân hóa cho khách hàng ${customer.name}.
Thông tin khách hàng:
- Tổng chi tiêu: ${customer.totalSpent} VNĐ
- Số đơn hàng: ${customer.orderCount}
- Chỉ số RFM: Recency=${customer.rfmScore?.recency}, Frequency=${customer.rfmScore?.frequency}, Monetary=${customer.rfmScore?.monetary}

Mục tiêu: Gửi lời cảm ơn, hỏi thăm sự hài lòng và đề xuất họ quay lại sàn xem các ưu đãi mới. Văn phong lịch sự, thân thiện, mang tính cá nhân cao.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.7 },
        });
        res.json({ text: response.text?.trim() || '' });
      } catch (error) {
        console.error('AI customer-care error:', error);
        res.status(500).json({ error: 'AI service error' });
      }
    }
  );

  // --- SePay Routes ---
  app.post('/api/sepay-webhook', rateLimit(60_000, 100), (req: express.Request, res: express.Response) => {
    const signature = req.headers['x-sepay-signature'] as string;
    const secret = process.env.SEPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error('SEPAY_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    const payload = JSON.stringify(req.body);
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // TODO: Update order status in Firestore via firebase-admin
    res.status(200).json({ status: 'success' });
  });

  app.get('/api/sepay/transactions', requireInternalAuth, async (req: express.Request, res: express.Response) => {
    try {
      const response = await fetch('https://api.sepay.vn/v1/bank/transactions', {
        headers: {
          Authorization: `Bearer ${process.env.SEPAY_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        return res.status(response.status).json({ error: 'SePay API error' });
      }
      const data = await response.json();
      res.json(data);
    } catch {
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // OAuth token exchange — keeps client_secret server-side only
  app.post('/api/sepay/oauth/token', requireInternalAuth, async (req: express.Request, res: express.Response) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code is required' });

    try {
      const response = await fetch('https://api.sepay.vn/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          client_id: process.env.SEPAY_CLIENT_ID,
          client_secret: process.env.SEPAY_CLIENT_SECRET,
        }),
      });
      const data = await response.json();
      res.json(data);
    } catch {
      res.status(500).json({ error: 'OAuth token exchange failed' });
    }
  });

  // Vite middleware for development
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
  });
}

startServer();
