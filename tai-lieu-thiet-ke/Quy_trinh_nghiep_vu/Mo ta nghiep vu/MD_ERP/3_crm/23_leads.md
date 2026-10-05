# Đặc tả nghiệp vụ: Phân hệ Tiềm năng (Leads)

> **Quy ước tham chiếu:** "MISA AMIS" và các sản phẩm MISA được nhắc tới trong tài liệu này là **sản phẩm tham khảo** để minh họa cách làm nghiệp vụ, **không phải yêu cầu bắt buộc**. VComm tự xây dựng tính năng tương đương trên nền tảng của mình.

## 1. Trường dữ liệu (Data Fields)

### Bảng chính: `crm_leads`
Lưu trữ thông tin các khách hàng tiềm năng chưa được xác thực hoặc chưa có giao dịch chính thức.

| Tên trường | Mã trường (Database) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **ID Tiềm năng** | `lead_id` | UUID | Có | Khóa chính |
| **Mã tiềm năng** | `lead_code` | String(50) | Có | Mã sinh tự động (vd: LD-0001) |
| **Tên tiềm năng** | `full_name` | String(255) | Có | Họ và tên khách hàng tiềm năng |
| **Tên công ty** | `company_name` | String(255) | Không | Tên tổ chức/công ty của tiềm năng |
| **Chức danh** | `job_title` | String(100) | Không | Chức vụ của người liên hệ |
| **Số điện thoại** | `mobile` | String(20) | Có* | *Bắt buộc ít nhất 1 thông tin liên lạc (SĐT/Email) |
| **Email** | `email` | String(100) | Có* | *Bắt buộc ít nhất 1 thông tin liên lạc (SĐT/Email) |
| **Nguồn gốc** | `source_id` | UUID (FK) | Không | ID nguồn sinh ra tiềm năng (Master Data) |
| **Tình trạng** | `status_id` | UUID (FK) | Có | Trạng thái hiện tại của tiềm năng (Master Data) |
| **Ngành nghề** | `industry_id` | UUID (FK) | Không | Lĩnh vực kinh doanh |
| **Nhân viên quản lý** | `owner_id` | UUID (FK) | Có | ID nhân viên sale phụ trách |
| **Đánh giá (Rating)** | `rating` | Enum | Không | Đánh giá độ nóng (Nóng, Ấm, Lạnh) |
| **Mô tả/Ghi chú** | `description` | Text | Không | Thông tin thêm về nhu cầu |
| **Zalo ZNS** | `zalo_id` | String(50) | Không | ID liên kết Zalo OA |
| **Ngày tạo** | `created_at` | DateTime | Có | |
| **Ngày cập nhật** | `updated_at` | DateTime | Có | |

### Master Data tham chiếu
*   `crm_lead_sources`: Nguồn (Quảng cáo Facebook, Google, Hội thảo, Giới thiệu, Cold Call...)
*   `crm_lead_statuses`: Tình trạng (Chưa liên hệ, Đã liên hệ, Đang theo dõi, Chuyển đổi thành công, Đóng - Thất bại)

---

## 2. Quy trình (Business Processes)

### Quy trình Xử lý Tiềm năng (Lead Nurturing Process)
1.  **Tạo mới/Thu thập (Capture):** Tiềm năng được nhập thủ công, import từ Excel, hoặc đổ về tự động qua Webform/API/Zalo/Facebook.
2.  **Phân bổ (Assignment):** Trưởng phòng (Sales Manager) hoặc hệ thống tự động chia tiềm năng cho Nhân viên kinh doanh (Sales Rep) dựa trên lãnh thổ hoặc vòng lặp (Round Robin).
3.  **Tiếp cận (Contact/Nurture):** Nhân viên thực hiện gọi điện, gửi email, Zalo, ghi nhận Lịch sử chăm sóc (Call log, Meeting, Note).
4.  **Phân loại (Qualification):** Cập nhật tình trạng tiềm năng, đánh giá mức độ nóng.
5.  **Chuyển đổi (Conversion):** Nếu tiềm năng có nhu cầu rõ ràng và xác thực thông tin, thực hiện **Chuyển đổi**. Tiềm năng sẽ được chuyển thành **Khách hàng (Account)**, **Liên hệ (Contact)**, và (tùy chọn) sinh ra **Cơ hội (Opportunity)**.
6.  **Đóng (Closure):** Nếu tiềm năng không hợp lệ, sai số, hoặc từ chối, cập nhật tình trạng "Thất bại" kèm lý do.

### Phân quyền (Roles & Permissions)
*   **Sales Rep (Nhân viên KD):** Xem/Sửa tiềm năng của mình; Chuyển đổi tiềm năng; Ghi chú chăm sóc. Không được xóa.
*   **Sales Manager (Trưởng phòng KD):** Xem toàn bộ tiềm năng của phòng/ban; Chuyển giao/Phân bổ lại (Reassign) tiềm năng; Xóa tiềm năng.
*   **Marketing (Nhân viên Marketing):** Import tiềm năng, xem báo cáo chuyển đổi.

---

## 3. Luồng nghiệp vụ (Business Workflows)

### Luồng chuyển đổi tiềm năng (Lead Conversion Workflow)
*   **Trigger:** User click "Chuyển đổi" trên giao diện chi tiết Tiềm năng.
*   **Input:** Hệ thống yêu cầu xác nhận việc tạo Khách hàng, Liên hệ, Cơ hội.
*   **Action:**
    *   Tạo bản ghi mới trong `crm_accounts` (lấy từ trường Tên công ty, SĐT, Email).
    *   Tạo bản ghi mới trong `crm_contacts` (lấy từ Tên tiềm năng, Chức danh, SĐT cá nhân).
    *   (Optionally) Tạo `crm_opportunities` liên kết với Account và Contact vừa tạo.
    *   Đổi `status_id` của Lead sang "Chuyển đổi thành công".
    *   Chuyển toàn bộ lịch sử chăm sóc (Activities, Notes, Tasks) từ Lead sang Account/Contact mới.
*   **Output:** Điều hướng người dùng sang màn hình chi tiết Khách hàng hoặc Cơ hội vừa sinh ra.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### API Endpoints Đề xuất
*   `GET /api/v1/crm/leads`: Lấy danh sách (hỗ trợ filter, pagination, sort theo ngày tạo, tình trạng, nhân viên).
*   `POST /api/v1/crm/leads`: Tạo mới tiềm năng (Dùng cho Webform, API tích hợp từ Landing Page).
*   `PUT /api/v1/crm/leads/{id}`: Cập nhật thông tin tiềm năng.
*   `POST /api/v1/crm/leads/{id}/convert`: API thực hiện luồng chuyển đổi tiềm năng.
*   `POST /api/v1/crm/leads/{id}/activities`: Ghi nhận lịch sử tương tác (cuộc gọi, ghi chú).

### Ràng buộc logic (Business Rules)
*   **Kiểm tra trùng lặp (Deduplication):** Trước khi Insert/Update, hệ thống cảnh báo hoặc chặn nếu SĐT hoặc Email đã tồn tại trong Lead hoặc Contact khác. Quy tắc trùng lặp có thể cấu hình (chặn cứng hoặc chỉ cảnh báo).
*   **Ràng buộc trạng thái:** Tiềm năng đã "Chuyển đổi thành công" thì trạng thái là **Read-only**, không thể chỉnh sửa thông tin.
*   **Bắt buộc thông tin liên lạc:** Phải có ít nhất 1 trong 2 trường Số điện thoại hoặc Email để lưu thành công.

### Điểm tích hợp (Integrations)
*   **Tổng đài IP (Call Center):** Click-to-call từ SĐT của tiềm năng. Popup hiển thị thông tin Lead khi có cuộc gọi đến.
*   **Marketing Automation / AMIS aiMarketing:** Đồng bộ luồng chiến dịch email, chấm điểm tiềm năng (Lead Scoring).
*   **Webform / Landing page:** Nhận webhook tự động tạo Lead.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### Layouts
*   **List View (Danh sách):**
    *   Hỗ trợ chế độ xem Bảng (Table) và Kanban (cột là các Tình trạng: Mới -> Đang chăm sóc -> Chuyển đổi).
    *   Bộ lọc nhanh (Quick Filters) ở sidebar trái: Tiềm năng của tôi, Tiềm năng mới hôm nay, Theo tình trạng, Theo thẻ (Tag).
    *   Cho phép Inline Edit (Sửa nhanh trực tiếp trên dòng của Table).
*   **Detail View (Form chi tiết):**
    *   Chia làm 2 cột: Cột trái (70%) hiển thị Timeline (Lịch sử chăm sóc, công việc, email); Cột phải (30%) hiển thị Thông tin chi tiết của Lead (SĐT, Email, Nguồn, Ngành nghề).
    *   Header chứa Tên tiềm năng, Tình trạng hiện tại (dạng Chevron path/Stepper để nhấn mạnh tiến trình) và nút Hành động chính ("Chuyển đổi", "Ghi chú", "Gọi điện").

### UI Components
*   **Tình trạng (Status Path):** Sử dụng component dạng mũi tên liên hoàn để thể hiện Lead đang ở bước nào (Chưa liên hệ > Đang chăm sóc > Đã báo giá). Click vào từng bước để chuyển trạng thái nhanh.
*   **Activity Timeline:** Component list dọc, icon theo loại (📞 Cuộc gọi, ✉️ Email, 📝 Ghi chú), hiển thị theo thứ tự thời gian mới nhất lên đầu.

### UX Feedback
*   Khi có cảnh báo trùng lặp lúc nhập SĐT, hiển thị thông báo inline màu vàng "Số điện thoại này đã tồn tại trong Tiềm năng Nguyễn Văn A. Bạn có muốn xem?".
*   Hiệu ứng confetti (tùy chọn) hoặc thông báo Success rõ ràng màu xanh lá khi thao tác "Chuyển đổi" thành công.
