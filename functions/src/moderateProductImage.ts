import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY, REGION } from './config.js';

/**
 * Trigger: khi product mới được tạo và có image URL, gọi Gemini Vision
 * kiểm duyệt. Nếu flagged → set product.status='pending_approval' và ghi
 * /moderation_logs/{id} cho admin review.
 *
 * Throttle: chỉ chạy cho ảnh public HTTP/HTTPS (skip data URL, base64).
 * Quota safe: max 1 call mỗi product onCreate (không retry).
 */

const SYSTEM_PROMPT = `
Bạn là moderator cho sàn TMĐT VComm tại Việt Nam. Kiểm tra ảnh sản phẩm
xem có vi phạm chính sách không. Cảnh báo nếu phát hiện:
- Hàng cấm (vũ khí, ma túy, động vật hoang dã)
- Hàng giả (nhái thương hiệu, logo bị mờ)
- Nội dung phản cảm (khỏa thân, bạo lực)
- Cờ/biểu tượng nhạy cảm chính trị
- Vi phạm bản quyền hiển nhiên

Trả về JSON:
{
  "flagged": boolean,
  "reasons": string[],
  "severity": "low" | "medium" | "high"
}
Không thêm text ngoài JSON.
`;

interface ModerationResult {
  flagged: boolean;
  reasons: string[];
  severity: 'low' | 'medium' | 'high';
}

async function fetchImageBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > 5 * 1024 * 1024) return null; // skip > 5 MB
    return { data: buffer.toString('base64'), mimeType: contentType };
  } catch {
    return null;
  }
}

export const moderateProductImage = onDocumentCreated(
  { region: REGION, document: 'products/{productId}', secrets: [GEMINI_API_KEY] },
  async (event) => {
    const productId = event.params.productId;
    const product = event.data?.data();
    if (!product?.image || typeof product.image !== 'string') return;
    if (!product.image.startsWith('http')) return;

    const db = admin.firestore();
    const apiKey = GEMINI_API_KEY.value();
    if (!apiKey) {
      console.warn('[moderate] GEMINI_API_KEY missing, skip');
      return;
    }

    const img = await fetchImageBase64(product.image);
    if (!img) {
      console.warn(`[moderate] không fetch được ảnh ${product.image}`);
      return;
    }

    let result: ModerationResult;
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [
            { text: SYSTEM_PROMPT },
            { inlineData: { mimeType: img.mimeType, data: img.data } },
          ],
        }] as any,
        config: { temperature: 0.2, responseMimeType: 'application/json' } as any,
      });
      const text = response.text?.trim() ?? '{}';
      result = JSON.parse(text);
    } catch (err) {
      console.error('[moderate] Gemini call failed:', err);
      return; // fail-open: không block product
    }

    // Log mọi kết quả vào /moderation_logs
    await db.collection('moderation_logs').add({
      productId,
      productName: product.name ?? '',
      imageUrl: product.image,
      result,
      reviewed: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Nếu flagged severity >= medium → set status='pending_approval' để admin review
    if (result.flagged && (result.severity === 'medium' || result.severity === 'high')) {
      await db.collection('products').doc(productId).update({
        status: 'pending_approval',
        moderationFlagged: true,
        moderationReasons: result.reasons,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`[moderate] flagged ${productId} (${result.severity}): ${result.reasons.join(', ')}`);
    } else {
      console.log(`[moderate] ${productId} OK (flagged=${result.flagged})`);
    }
  },
);
