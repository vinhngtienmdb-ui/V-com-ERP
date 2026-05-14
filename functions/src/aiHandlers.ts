import { onRequest } from 'firebase-functions/v2/https';
import { GoogleGenAI } from '@google/genai';
import { verifyAuth, HttpAuthError } from './auth.js';
import { GEMINI_API_KEY, GEMINI_MODEL, REGION } from './config.js';

const SYSTEM_INSTRUCTION = `
Bạn là trợ lý AI nội bộ của VComm — sàn TMĐT tại Việt Nam.
- Trả lời ngắn gọn, lịch sự, bằng tiếng Việt.
- Nếu hỏi về đơn hàng, yêu cầu Order ID nếu chưa có.
- Nếu hỏi về sản phẩm, yêu cầu tên/danh mục.
- Không tiết lộ thông tin nội bộ hệ thống hoặc cấu hình.
`;

function getClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

async function callGemini(
  apiKey: string,
  model: string,
  prompt: string,
  history: { role: 'user' | 'model'; content: string }[] = [],
): Promise<string> {
  const ai = getClient(apiKey);
  const contents = [
    ...history.map((h) => ({ role: h.role, parts: [{ text: h.content }] })),
    { role: 'user' as const, parts: [{ text: prompt }] },
  ];
  const response = await ai.models.generateContent({
    model,
    contents: contents as any,
    config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.7 },
  });
  return response.text?.trim() ?? '';
}

type ExpressResponse = import('express').Response;

function setCors(res: ExpressResponse) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function handleError(res: ExpressResponse, err: unknown) {
  if (err instanceof HttpAuthError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(502).json({ error: 'AI upstream failed' });
}

export const aiChat = onRequest(
  { region: REGION, secrets: [GEMINI_API_KEY], cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
    try {
      await verifyAuth(req);
      const { message, history } = req.body ?? {};
      if (typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ error: 'message bắt buộc' });
        return;
      }
      const text = await callGemini(GEMINI_API_KEY.value(), GEMINI_MODEL.value(), message, history ?? []);
      res.json({ text });
    } catch (err) {
      handleError(res, err);
    }
  },
);

export const aiRma = onRequest(
  { region: REGION, secrets: [GEMINI_API_KEY], cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
    try {
      await verifyAuth(req);
      const { order } = req.body ?? {};
      if (!order?.id) { res.status(400).json({ error: 'order.id bắt buộc' }); return; }
      const prompt = `Soạn phản hồi chuyên nghiệp về RMA cho đơn ${order.id}. Phương thức TT: ${order.paymentMethod ?? 'N/A'}. Lịch sự, xin lỗi, đề xuất hướng giải quyết theo chính sách sàn.`;
      const text = await callGemini(GEMINI_API_KEY.value(), GEMINI_MODEL.value(), prompt);
      res.json({ text });
    } catch (err) {
      handleError(res, err);
    }
  },
);

export const aiCare = onRequest(
  { region: REGION, secrets: [GEMINI_API_KEY], cors: true },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
    try {
      await verifyAuth(req);
      const { customer } = req.body ?? {};
      if (!customer?.name) { res.status(400).json({ error: 'customer.name bắt buộc' }); return; }
      const prompt = `Soạn tin chăm sóc cá nhân hóa cho khách ${customer.name}. Tổng chi tiêu: ${customer.totalSpent ?? 0}đ. Số đơn: ${customer.orderCount ?? 0}. RFM: R=${customer.rfmScore?.recency ?? '-'} F=${customer.rfmScore?.frequency ?? '-'} M=${customer.rfmScore?.monetary ?? '-'}. Cảm ơn, hỏi thăm sự hài lòng, mời quay lại xem ưu đãi.`;
      const text = await callGemini(GEMINI_API_KEY.value(), GEMINI_MODEL.value(), prompt);
      res.json({ text });
    } catch (err) {
      handleError(res, err);
    }
  },
);
