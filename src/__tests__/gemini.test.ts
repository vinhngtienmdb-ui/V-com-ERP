import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  generateRMAResponse, 
  generateCustomerCareMessage, 
  getAiChatResponse,
  suggestStockReorder,
  generatePerformanceReview,
  summarizeCashFlow
} from '../services/geminiService';
import { safeLocalStorage } from '../lib/storage';

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: async () => {
          return {
            text: 'Phản hồi giả lập từ Gemini AI'
          };
        }
      };
    }
  };
});

describe('Gemini Service Tests', () => {
  beforeEach(() => {
    safeLocalStorage.removeItem('api_gemini_api_key');
  });

  it('nên trả về thông báo lỗi khi chưa cấu hình khóa API', async () => {
    const res = await getAiChatResponse('Xin chào');
    expect(res).toContain('Chưa cấu hình GEMINI_API_KEY');
  });

  it('nên sinh phản hồi thành công khi đã cấu hình khóa API (chế độ dự phòng ngoại tuyến)', async () => {
    safeLocalStorage.setItem('api_gemini_api_key', 'test-api-key-123');
    const res = await getAiChatResponse('Xin chào');
    expect(res).toContain('Chế độ Trợ lý Ngoại tuyến');
  });

  it('nên sinh phản hồi RMA phù hợp cho đơn hàng (chế độ dự phòng ngoại tuyến)', async () => {
    safeLocalStorage.setItem('api_gemini_api_key', 'test-api-key-123');
    const order = { id: 'ORD-1001', paymentMethod: 'cash' };
    const res = await generateRMAResponse(order);
    expect(res).toContain('Quản lý Đơn hàng');
  });

  it('nên sinh lời nhắn chăm sóc khách hàng cá nhân hóa dựa trên RFM (chế độ dự phòng ngoại tuyến)', async () => {
    safeLocalStorage.setItem('api_gemini_api_key', 'test-api-key-123');
    const customer = {
      name: 'Nguyễn Văn A',
      totalSpent: 5000000,
      orderCount: 15,
      rfmScore: { recency: 5, frequency: 5, monetary: 5 }
    };
    const res = await generateCustomerCareMessage(customer);
    expect(res).toContain('Quản lý Đơn hàng');
  });

  it('nên sinh phản hồi đề xuất tồn kho bằng AI (chế độ dự phòng ngoại tuyến)', async () => {
    safeLocalStorage.setItem('api_gemini_api_key', 'test-api-key-123');
    const item = { code: 'SP-001', name: 'Sữa tươi', currentStock: 5, minStock: 20 };
    const res = await suggestStockReorder(item);
    expect(res).toContain('tồn kho chạm ngưỡng tối thiểu');
  });

  it('nên sinh phản hồi đánh giá năng lực bằng AI (chế độ dự phòng ngoại tuyến)', async () => {
    safeLocalStorage.setItem('api_gemini_api_key', 'test-api-key-123');
    const employee = { name: 'Nguyễn Văn Minh', kpiScore: 95, achievements: ['Đạt KPI'] };
    const res = await generatePerformanceReview(employee);
    expect(res).toContain('Nhận xét đánh giá hiệu suất năm');
  });

  it('nên sinh phản hồi tóm tắt dòng tiền bằng AI (chế độ dự phòng ngoại tuyến)', async () => {
    safeLocalStorage.setItem('api_gemini_api_key', 'test-api-key-123');
    const res = await summarizeCashFlow(50000000, 30000000, 20000000);
    expect(res).toContain('Phân tích dòng tiền của Giám đốc Tài chính (CFO)');
  });
});
