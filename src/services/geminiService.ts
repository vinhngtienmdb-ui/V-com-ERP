import { GoogleGenAI } from "@google/genai";

let aiModel: GoogleGenAI | null = null;

function getAI() {
  const key = localStorage.getItem('api_gemini_api_key') || '';
  if (!key || key === 'undefined') {
    console.warn("api_gemini_api_key is not set in local storage. Generating mock response.");
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

export async function getAiChatResponse(message: string, history: { role: 'user' | 'model', content: string }[] = []) {
 try {
 const contents = history.map(h => ({
 role: h.role === 'model' ? 'model' : 'user',
 parts: [{ text: h.content }]
 }));

 // Add current message
 contents.push({
 role: 'user',
 parts: [{ text: message }]
 });

 const ai = getAI();
 if (!ai) {
 return "Xin chào! (Mock response: Chưa cấu hình GEMINI_API_KEY. Vui lòng thêm vào Variables trên Vercel)";
 }

 const response = await ai.models.generateContent({
 model: "gemini-3-flash-preview",
 contents: contents as any,
 config: {
 systemInstruction: SYSTEM_INSTRUCTION,
 temperature: 0.7,
 },
 });

 return response.text?.trim() || "Xin lỗi, tôi gặp sự cố khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.";
 } catch (error) {
 console.error("Gemini Error:", error);
 return "Xin lỗi, hệ thống AI đang bận. Vui lòng liên hệ nhân viên hỗ trợ trực tiếp.";
 }
}
