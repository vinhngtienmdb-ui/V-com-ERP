# Đặc tả nghiệp vụ: Phân hệ Cơ hội bán hàng (Opportunities)

> **Quy ước tham chiếu:** "MISA AMIS" và các sản phẩm MISA được nhắc tới trong tài liệu này là **sản phẩm tham khảo** để minh họa cách làm nghiệp vụ, **không phải yêu cầu bắt buộc**. VComm tự xây dựng tính năng tương đương trên nền tảng của mình.

## 1. Trường dữ liệu (Data Fields)

### Bảng chính: `crm_opportunities`
Quản lý các thương vụ bán hàng (Deal) đang diễn ra. Đây là nơi theo dõi quá trình biến tiềm năng/khách hàng thành doanh thu.

| Tên trường | Mã trường (Database) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **ID Cơ hội** | `opportunity_id` | UUID | Có | Khóa chính |
| **Tên cơ hội** | `opportunity_name` | String(255) | Có | Vd: "Triển khai phần mềm AMIS Kế toán cho FPT" |
| **Khách hàng** | `account_id` | UUID (FK) | Có | Account liên kết với thương vụ này |
| **Liên hệ chính** | `primary_contact_id` | UUID (FK) | Không | Người đại diện giao dịch chính |
| **Giai đoạn** | `stage_id` | UUID (FK) | Có | Bước trong quy trình bán hàng (Sales Pipeline) |
| **Xác suất (%)** | `probability` | Integer | Có | Xác suất thành công (0-100%), gắn cứng theo Giai đoạn hoặc nhập tay |
| **Doanh số kỳ vọng**| `expected_revenue` | Decimal | Có | Giá trị dự kiến của thương vụ |
| **Doanh số tính toán**| `weighted_revenue` | Decimal | Không | = Doanh số kỳ vọng * Xác suất (Read-only) |
| **Ngày kết thúc dự kiến**| `expected_close_date` | Date | Có | Thời hạn dự kiến chốt deal |
| **Chiến dịch** | `campaign_id` | UUID (FK) | Không | Nguồn/Chiến dịch marketing mang lại cơ hội |
| **Sản phẩm quan tâm**| `product_interest` | Text | Không | (Hoặc dùng bảng chi tiết line-items) |
| **Nhân viên quản lý**| `owner_id` | UUID (FK) | Có | NV Sale phụ trách chốt deal |
| **Lý do Thắng/Thua**| `reason_id` | UUID (FK) | Có (khi đóng)| Bắt buộc nhập khi chuyển stage sang Thắng/Thua |
| **Ghi chú lý do** | `reason_note` | Text | Không | Diễn giải thêm lý do |

### Master Data tham chiếu
*   `crm_sales_stages`: Cấu hình Pipeline bán hàng (VD: 1. Đánh giá nhu cầu -> 2. Demo -> 3. Báo giá -> 4. Thương lượng -> 5. Thắng / 6. Thua).
*   `crm_loss_reasons`: Danh mục Lý do thua (Giá cao, Chọn đối thủ, Ngân sách không đủ...).

---

## 2. Quy trình (Business Processes)

### Quy trình Chốt Sales (Sales Pipeline Management)
1.  **Tạo mới Cơ hội:** Sale mở Cơ hội khi nhận thấy Khách hàng có nhu cầu rõ ràng, có ngân sách và thời gian mua hàng cụ thể.
2.  **Dịch chuyển Giai đoạn (Stage Progression):** Sales thực hiện các hoạt động (Họp, Demo, Báo giá) và kéo Cơ hội đi qua từng giai đoạn của Pipeline.
3.  **Dự báo Doanh thu (Forecasting):** Quản lý dùng danh sách Cơ hội và "Ngày kết thúc dự kiến" + "Xác suất" để dự báo dòng tiền và doanh thu đạt được trong tháng/quý.
4.  **Đóng Cơ hội (Closed Won/Lost):**
    *   **Thắng (Closed Won):** Hợp đồng được ký/tiền được thanh toán. Cơ hội sinh ra Báo giá/Đơn hàng.
    *   **Thua (Closed Lost):** Khách hàng từ chối. Bắt buộc nhập lý do thất bại để phân tích.

### Phân quyền (Roles & Permissions)
*   **Sales Rep:** Quản lý Cơ hội của mình. Chuyển giai đoạn. Không được sửa "Doanh số kỳ vọng" nếu đã gắn với Báo giá/Hợp đồng đã duyệt.
*   **Sales Manager:** Theo dõi Pipeline của cả đội. Chỉnh sửa hạn mức dự báo (Quota).

---

## 3. Luồng nghiệp vụ (Business Workflows)

### Luồng Duyệt Báo Giá từ Cơ hội (Quote Generation Workflow)
*   Từ giao diện chi tiết Cơ hội, NV Kinh doanh chọn "Tạo Báo giá".
*   Hệ thống copy toàn bộ thông tin: Account, Contact, Danh sách Sản phẩm quan tâm, Mức chiết khấu từ Cơ hội sang Báo giá mới.
*   Khi Báo giá được Phê duyệt và Gửi cho Khách, trạng thái Cơ hội tự động chuyển sang "Đã báo giá / Thương lượng".
*   Giá trị `expected_revenue` của Cơ hội tự động cập nhật bằng Tổng tiền của Báo giá cuối cùng.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### API Endpoints Đề xuất
*   `GET /api/v1/crm/opportunities`: List (Hỗ trợ định dạng trả về kiểu Kanban board).
*   `POST /api/v1/crm/opportunities`: Tạo mới.
*   `PATCH /api/v1/crm/opportunities/{id}/stage`: API chuyển giai đoạn (Kéo thả Kanban). Payload cần chứa `stage_id`.
*   `POST /api/v1/crm/opportunities/{id}/close`: API đóng deal (Win/Loss), yêu cầu payload chứa `status` (Won/Lost) và `reason_id`.

### Ràng buộc logic (Business Rules)
*   **Ràng buộc giai đoạn:** Xác suất (%) tự động nhảy theo Giai đoạn. VD: Báo giá (50%), Thương lượng (80%), Thắng (100%), Thua (0%). Người dùng có quyền ghi đè (override) số % này.
*   **Cảnh báo quá hạn:** Nếu `expected_close_date` < Ngày hiện tại mà Cơ hội vẫn chưa đóng (Chưa Thắng/Thua), hệ thống đánh dấu đỏ là "Quá hạn", cảnh báo NV cần cập nhật lại ngày dự kiến.
*   **Validation lúc Đóng:** Không cho phép chuyển sang "Thua" nếu không chọn `reason_id`. Không cho phép chuyển "Thắng" nếu chưa điền `expected_revenue`.

### Điểm tích hợp (Integrations)
*   **AMIS Hợp đồng (eContract):** Tạo hợp đồng điện tử trực tiếp từ Cơ hội. Khi hợp đồng được ký điện tử, Cơ hội tự động chuyển thành "Thắng".
*   **BI & Analytics:** Đẩy dữ liệu vào kho dữ liệu để vẽ biểu đồ Phễu bán hàng (Sales Funnel) và dự báo doanh số.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### Layouts
*   **Kanban View (Mặc định cho Cơ hội):**
    *   Mỗi Giai đoạn (Stage) là 1 cột dọc.
    *   Mỗi Cơ hội là 1 thẻ (Card) nằm trong cột. Trên thẻ hiển thị: Tên Cơ hội, Tên Khách hàng, Giá trị tiền, Ngày kết thúc dự kiến.
    *   Tổng hợp Doanh thu dự kiến ở trên Header của từng Cột.
    *   Hỗ trợ Kéo & Thả (Drag & Drop) thẻ giữa các cột để chuyển Giai đoạn.
*   **Detail View:**
    *   Tương tự Leads, có thanh trạng thái (Sales Path) nằm ngang nổi bật ở trên cùng.

### UI Components
*   **Sales Path Bar:** Thanh tiến trình các bước. Khi click hoàn thành 1 bước, hiển thị animation mượt mà chuyển sang bước tiếp theo. Bước cuối cùng có 2 nút to: "Thắng" (Xanh lá) và "Thua" (Đỏ).
*   **Drag & Drop Area:** Hiệu ứng hover khi kéo thẻ Kanban, cột đích được highlight màu nền nhẹ để user biết chỗ thả.

### UX Feedback
*   Khi kéo một Cơ hội vào cột "Thắng", hiển thị màn hình chúc mừng nhỏ (Overlay) có pháo giấy (Confetti effect) trước khi yêu cầu điền thông tin doanh thu cuối cùng.
*   Nếu kéo vào "Thua", hiện Modal Dialog bắt buộc (Required Modal) chọn Lý do thua từ Dropdown. Nút "Lưu" sẽ bị disable nếu chưa chọn lý do.
