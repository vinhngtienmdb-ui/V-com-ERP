# TÀI LIỆU HƯỚNG DẪN TÍCH HỢP AI VÀO HỆ THỐNG VCOMM ERP
*Tài liệu kỹ thuật đặc tả kiến trúc tầng AI, cấu hình, cách mở rộng các tính năng thông minh và xử lý lỗi phục vụ các nhà phát triển và AI Studio*

> [!NOTE]
> Để có hướng dẫn kỹ thuật chi tiết nhất về tích hợp, cấu trúc trường dữ liệu đầy đủ, quy trình nghiệp vụ liên thông (Order-to-Cash, Procure-to-Pay, Request-to-Payment) và thiết kế tầng AI, vui lòng tham khảo **[VComm_MISA_AI_Technical_Blueprint.md](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/VComm_MISA_AI_Technical_Blueprint.md)**.


---

## MỤC LỤC
1. [1. Tổng Quan Kiến Trúc AI Layer](#1-tổng-quan-kiến-trúc-ai-layer)
2. [2. Đặc Tả Các Tính Năng AI Hiện Tại (VComm ERP)](#2-đặc-tả-các-tính-năng-ai-hiện-tại-vcomm-erp)
3. [3. Hướng Dẫn Cấu Hình & Kích Hoạt](#3-hướng-dẫn-cấu-hình--kích-hoạt)
4. [4. Hướng Dẫn Mở Rộng Tính Năng AI (AI Integration Recipes)](#4-hướng-dẫn-mở-rộng-tính-năng-ai-ai-integration-recipes)
5. [5. Cơ Chế Xử Lý Lỗi & Dự Phòng (Rate Limits & Resilience)](#5-cơ-chế-xử-lý-lỗi--dự-phòng-rate-limits--resilience)

---

## 1. TỔNG QUAN KIẾN TRÚC AI LAYER

Tầng trí tuệ nhân tạo (AI Layer) trong **VComm ERP** được xây dựng trên bộ công cụ phát triển phần mềm chính thức mới nhất của Google (`@google/genai`) và mô hình ngôn ngữ lớn **Gemini 3.5 Flash** để thực hiện các tác vụ xử lý ngôn ngữ tự nhiên, tự động hóa phản hồi và phân tích hành vi khách hàng theo thời gian thực.

### Sơ đồ dòng chảy dữ liệu AI (Data Flow)

```mermaid
graph TD
    %% Khối Frontend UI
    subgraph Frontend ["Giao diện người dùng (React 19)"]
        UI_Chat["AIChatBot (Trợ lý CSKH)"]
        UI_CSKH["CustomerService (Gợi ý RMA/Phản hồi)"]
        UI_Ops["AIOperations (Bảng cấu hình & Thống kê)"]
    end

    %% Khối Services & Config
    subgraph CoreService ["Tầng Dịch vụ & Nghiệp vụ"]
        Service_Gemini["geminiService.ts (Gemini SDK Wrapper)"]
        Storage["safeLocalStorage (api_gemini_api_key)"]
    end

    %% Khối AI API & Fallback
    subgraph ExternalAI ["Google Gemini API (Cloud)"]
        GeminiAPI["gemini-3.5-flash Model"]
    end
    
    subgraph FallbackEngine ["Bộ đệm dự phòng nội bộ"]
        Offline_Mock["Offline Assist Mode (Simulated Replies)"]
    end

    %% Luồng liên kết
    UI_Chat --> Service_Gemini
    UI_CSKH --> Service_Gemini
    UI_Ops --> Service_Gemini
    Storage -.->|Đọc API Key| Service_Gemini
    Service_Gemini -->|1. Request (API Key hợp lệ)| GeminiAPI
    Service_Gemini -.->|2. Fallback (Không Key / Lỗi 429)| Offline_Mock
```

---

## 2. ĐẶC TẢ CÁC TÍNH NĂNG AI HIỆN TẠI (VCOMM ERP)

Hiện tại, hệ thống VComm ERP đã tích hợp thành công AI vào 3 cấu phần quan trọng sau:

### 2.1. Trợ lý CSKH Đa kênh Thông minh (`AIChatBot.tsx`)
*   **Vị trí hiển thị:** Widget trò chuyện bong bóng nổi ở góc dưới bên phải giao diện ứng dụng.
*   **Mục tiêu:** Hỗ trợ nhân viên CSKH hoặc khách hàng cuối trả lời nhanh các thông tin về:
    *   Trạng thái đơn hàng (yêu cầu cung cấp Order ID).
    *   Thông tin sản phẩm/Danh mục sản phẩm (PIM).
    *   Thông tin giao hàng, khiếu nại đổi trả (RMA).
*   **Mã nguồn tham chiếu:** [AIChatBot.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/AIChatBot.tsx)

### 2.2. Bảng điều khiển Hoạt động AI (`AIOperations.tsx`)
*   **Vị trí hiển thị:** Phân hệ `/ai-ops` trên menu Sidebar.
*   **Mục tiêu:** Quản lý cấu hình mô hình, giám sát lưu lượng cuộc gọi API (Requests count), thời gian phản hồi (Latency), tỷ lệ lỗi và cấu hình các tham số như `temperature`, `topK`, `topP`.
*   **Mã nguồn tham chiếu:** [AIOperations.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/AIOperations.tsx)

### 2.3. Tự động soạn phản hồi RMA & Chiến dịch Marketing (`CustomerService.tsx`)
*   **Vị trí hiển thị:** Phân hệ Chăm sóc khách hàng `/cskh`.
*   **Mục tiêu:**
    *   **Phản hồi RMA tự động:** Khi khách hàng gửi yêu cầu đổi trả hàng lỗi, AI sẽ đọc thông tin đơn hàng, lý do trả và phương thức thanh toán để soạn thảo một thư phản hồi xin lỗi lịch sự, đề xuất hướng xử lý theo đúng quy trình.
    *   **Viết tin nhắn chăm sóc khách hàng cá nhân hóa:** AI phân tích chỉ số RFM (Recency - độ mới, Frequency - tần suất, Monetary - số tiền tiêu dùng) để tự sinh các tin nhắn cảm ơn, thăm dò ý kiến và khuyến mãi riêng biệt cho từng khách hàng nhằm tối ưu hiệu quả giữ chân đối tác.
*   **Mã nguồn dịch vụ:** [geminiService.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/services/geminiService.ts)

---

## 3. HƯỚNG DẪN CẤU HÌNH & KÍCH HOẠT

Hệ thống hỗ trợ cấu hình API Key linh hoạt ở cả Client-side và Server-side để phục vụ các môi trường triển khai khác nhau:

### 3.1. Cấu hình tại Client-side (Local Storage)
Để nhanh chóng thử nghiệm trên môi trường phát triển cục bộ mà không cần triển khai Server:
1.  Truy cập vào ứng dụng VComm ERP.
2.  Mở **F12 Developer Tools** -> Chọn tab **Console**.
3.  Chạy lệnh sau để lưu API Key vào bộ nhớ trình duyệt:
    ```javascript
    localStorage.setItem('api_gemini_api_key', 'YOUR_GEMINI_API_KEY_HERE');
    ```
4.  F5 tải lại trang. Tầng AI sẽ tự động đọc khóa này thông qua thư viện [storage.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/lib/storage.ts).

### 3.2. Cấu hình tại Server-side (Môi trường Production)
Khi triển khai ứng dụng lên các nền tảng như Vercel, Netlify hoặc Server Docker:
1.  Sao chép file `.env.example` thành `.env.local` ở thư mục gốc của dự án.
2.  Khai báo biến môi trường:
    ```env
    GEMINI_API_KEY=AIzaSyD...your_real_key...
    ```
3.  Ứng dụng sẽ tự động tải cấu hình này khi xây dựng (Build) hoặc khởi chạy máy chủ.

> [!WARNING]
> **Bảo mật API Key:** Tuyệt đối không bao giờ cam kết (commit) file chứa API Key thật lên hệ thống quản lý mã nguồn Git công khai để tránh nguy cơ rò rỉ khóa và mất chi phí ngoài ý muốn.

---

## 4. HƯỚNG DẪN MỞ RỘNG TÍNH NĂNG AI (AI INTEGRATION RECIPES)

Để tích hợp thêm các tính năng thông minh vào các phân hệ khác (Kho, Nhân sự, Tài chính), nhà phát triển hãy áp dụng các công thức thiết kế dưới đây trong file `geminiService.ts`:

### 4.1. Tích hợp phân hệ Kho: Dự báo & Phân loại tồn kho lỗi
Khi phát sinh nghiệp vụ nhập xuất kho, cần AI hỗ trợ đề xuất phân loại hàng hóa hoặc cảnh báo tồn kho:

```typescript
// Thêm hàm vào src/services/geminiService.ts
export async function suggestStockReorder(item: { code: string; name: string; currentStock: number; minStock: number }) {
  const prompt = `Hàng hóa '${item.name}' (Mã: ${item.code}) hiện có lượng tồn là ${item.currentStock}, chạm ngưỡng tồn tối thiểu ${item.minStock}. 
  Hãy phân tích và viết một đề xuất ngắn gọn gửi Trưởng bộ phận mua hàng để lập kế hoạch nhập thêm hàng, kèm theo một số lưu ý về thời gian vận chuyển và chu kỳ bán hàng dịp cuối năm.`;
  return await getAiChatResponse(prompt);
}
```

### 4.2. Tích hợp phân hệ Nhân sự (HR): Tự sinh nhận xét đánh giá hiệu suất
Phục vụ phân hệ Đánh giá Xếp loại nhân sự (`Performance.tsx`):

```typescript
// Thêm hàm vào src/services/geminiService.ts
export async function generatePerformanceReview(employee: { name: string; kpiScore: number; achievements: string[] }) {
  const prompt = `Soạn thảo nhận xét đánh giá hiệu suất năm cho nhân sự ${employee.name}.
  - Điểm KPI: ${employee.kpiScore}/100
  - Thành tích nổi bật: ${employee.achievements.join(', ')}
  
  Yêu cầu: Lời nhận xét mang tính xây dựng, nêu bật điểm mạnh, khuyến khích các điểm cần cải thiện nhẹ nhàng, văn phong công sở chuyên nghiệp, lịch thiệp bằng tiếng Việt.`;
  return await getAiChatResponse(prompt);
}
```

### 4.3. Tích hợp phân hệ Tài chính (Finance): Diễn giải biến động dòng tiền
AI tự động đọc dữ liệu số dư và giao dịch để xuất bản bản tin tài chính tóm tắt:

```typescript
// Thêm hàm vào src/services/geminiService.ts
export async function summarizeCashFlow(cashIn: number, cashOut: number, netChange: number) {
  const prompt = `Báo cáo dòng tiền tháng này ghi nhận:
  - Tổng thu (Cash-in): ${cashIn.toLocaleString('vi-VN')} VND
  - Tổng chi (Cash-out): ${cashOut.toLocaleString('vi-VN')} VND
  - Thay đổi ròng (Net cash flow): ${netChange.toLocaleString('vi-VN')} VND
  
  Hãy đóng vai là một Giám đốc Tài chính (CFO), phân tích nhanh ý nghĩa của các con số trên, cảnh báo nếu dòng tiền ròng âm và đưa ra 3 khuyến nghị tối ưu hóa chi tiêu ngắn hạn.`;
  return await getAiChatResponse(prompt);
}
```

---

## 5. CƠ CHẾ XỬ LÝ LỖI & DỰ PHÒNG (RATE LIMITS & RESILIENCE)

Để đảm bảo hệ thống ERP VComm luôn hoạt động ổn định và không bao giờ bị treo giao diện người dùng khi gặp sự cố mạng hoặc vượt quá hạn mức API của Google (Rate limit `HTTP 429`), lớp dịch vụ AI áp dụng mô hình dự phòng thông minh **Offline Assist Mode**.

### Quy tắc xử lý lỗi chi tiết trong `geminiService.ts`

1.  **Bắt lỗi (Try-Catch):** Mọi cuộc gọi API đều được bọc trong khối lệnh `try...catch` để cô lập lỗi.
2.  **Nhận diện lỗi Rate Limit:**
    *   Lớp dịch vụ tự động quét nội dung thông báo lỗi từ Google. Nếu phát hiện các từ khóa liên quan đến tần suất cuộc gọi như `429`, `Quota`, `Rate limit` hoặc `Resource exhausted`.
3.  **Kích hoạt Trợ lý Ngoại tuyến (Offline Assist):**
    *   Hệ thống sẽ ngay lập tức chuyển sang phân tích cục bộ nội dung tin nhắn của người dùng bằng biểu thức chính quy (Regex) và trả về các phản hồi nhanh được định nghĩa sẵn.
    *   *Ví dụ:* Nếu người dùng hỏi về "đơn hàng", hệ thống ngoại tuyến sẽ hướng dẫn họ kiểm tra mã đơn hoặc dẫn link đến trang RMA. Nếu hỏi về "vận chuyển", hệ thống khuyên tra cứu mã vận đơn trên GHN/GHTK.
4.  **Gắn thẻ cảnh báo hệ thống:**
    *   Mích phản hồi dự phòng đều được tự động đính kèm dòng thông báo: `*(Lưu ý: Cuộc gọi vừa qua đã kích hoạt bộ đệm tự động thông minh do Hệ thống AI chính đang đạt ngưỡng trần lưu lượng tối đa)*` để thông báo cho người vận hành biết trạng thái tải của API.
