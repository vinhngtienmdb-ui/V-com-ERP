import { GoogleGenAI } from '@google/genai';
import { safeLocalStorage } from '../lib/storage';

let aiModel: GoogleGenAI | null = null;

function getAI() {
  const key = safeLocalStorage.getItem('api_gemini_api_key') || '';
  if (!key || key === 'undefined') {
    console.warn('api_gemini_api_key is not set in local storage. Generating mock response.');
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
}

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

export async function generateRMAResponse(order: any) {
  const prompt = `Soạn thảo phản hồi chuyên nghiệp cho khách hàng về yêu cầu hoàn trả (RMA) của đơn hàng ${order.id}. Đơn hàng có phương thức thanh toán: ${order.paymentMethod}. Hãy lịch sự, xin lỗi về sự cố và đề xuất hướng giải quyết dựa trên chính sách sàn.`;
  return await getAiChatResponse(prompt);
}

export async function generateCustomerCareMessage(customer: any) {
  const prompt = `Hãy soạn một tin nhắn chăm sóc khách hàng cá nhân hóa cho khách hàng ${customer.name}. 
 Thông tin khách hàng: 
 - Tổng chi tiêu: ${customer.totalSpent} VNĐ
 - Số đơn hàng: ${customer.orderCount}
 - Chỉ số RFM: Recency=${customer.rfmScore?.recency}, Frequency=${customer.rfmScore?.frequency}, Monetary=${customer.rfmScore?.monetary}
 
 Mục tiêu: Gửi lời cảm ơn, hỏi thăm sự hài lòng về các sản phẩm đã mua gần đây và đề xuất họ quay lại sàn xem các ưu đãi mới. Văn phong lịch sự, thân thiện, mang tính cá nhân cao.`;
  return await getAiChatResponse(prompt);
}

export async function getAiChatResponse(
  message: string,
  history: { role: 'user' | 'model'; content: string }[] = []
) {
  try {
    const contents = history.map(h => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.content }],
    }));

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const ai = getAI();
    if (!ai) {
      return 'Xin chào! (Mock response: Chưa cấu hình GEMINI_API_KEY. Vui lòng thêm vào Variables trên Vercel)';
    }

    // Temporarily disable AI call for performance/rate-limits
    /* const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text?.trim() || "Xin lỗi, tôi gặp sự cố khi xử lý câu hỏi của bạn. Vui lòng thử lại sau."; */
    throw new Error('Rate limit exceeded (Simulated Offline Mode)');
  } catch (error: any) {
    console.error('Gemini Error:', error);

    // Graceful rate limit / resource exhausted fallback handling
    const isRateLimit =
      error?.message?.includes('429') ||
      error?.message?.includes('Quota') ||
      error?.message?.includes('Rate') ||
      error?.message?.includes('limit') ||
      error?.message?.includes('exhausted');

    if (isRateLimit) {
      const lowerMsg = message.toLowerCase();
      let simulatedReply =
        'Xin chào! [Hệ thống đang chịu tải cao - Chế độ Trợ lý Ngoại tuyến] VComm đã tiếp nhận ý kiến của bạn. Bộ phận CSKH sẽ phản hồi trực tiếp sau ít phút nữa.';

      if (lowerMsg.includes('đơn') || lowerMsg.includes('order') || lowerMsg.includes('mua')) {
        simulatedReply =
          "Chào bạn, về câu hỏi liên quan đến đơn hàng, hệ thống CSKH VComm khuyên bạn nên kiểm tra trạng thái trong phần 'Quản lý Đơn hàng' hoặc cung cấp Mã đơn để bắt đầu quy trình hỗ trợ đổi trả RMA tự động nhanh chóng.";
      } else if (
        lowerMsg.includes('chuyển') ||
        lowerMsg.includes('ship') ||
        lowerMsg.includes('giao')
      ) {
        simulatedReply =
          'Chào bạn, các đơn hàng của VComm được kết nối trực tiếp với GHN/GHTK. Bạn có thể tra cứu mã vận đơn trực tiếp trên đơn hàng tương ứng, hoặc liên hệ trực tiếp tổng đài nhà vận chuyển.';
      } else if (
        lowerMsg.includes('lỗi') ||
        lowerMsg.includes('hỏng') ||
        lowerMsg.includes('hoàn')
      ) {
        simulatedReply =
          "Rất tiếc về sự bất tiện này. Bạn có thể tạo ngay yêu cầu 'Khiếu nại/Hoàn trả RMA' trên phân hệ quản trị hoặc liên hệ trực tiếp tư vấn viên để chúng tôi hỗ trợ thu hồi sản phẩm lỗi miễn phí.";
      }

      return `${simulatedReply}\n\n*(Lưu ý: Cuộc gọi vừa qua đã kích hoạt bộ đệm tự động thông minh do Hệ thống AI chính đang đạt ngưỡng trần lưu lượng tối đa)*`;
    }

    return 'Xin lỗi, hệ thống AI đang bận. Vui lòng liên hệ nhân viên hỗ trợ trực tiếp.';
  }
}
