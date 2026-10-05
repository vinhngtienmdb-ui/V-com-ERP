# Đặc tả nghiệp vụ: Phân hệ Liên hệ (Contacts)

> **Quy ước tham chiếu:** "MISA AMIS" và các sản phẩm MISA được nhắc tới trong tài liệu này là **sản phẩm tham khảo** để minh họa cách làm nghiệp vụ, **không phải yêu cầu bắt buộc**. VComm tự xây dựng tính năng tương đương trên nền tảng của mình.

## 1. Trường dữ liệu (Data Fields)

### Bảng chính: `crm_contacts`
Lưu trữ thông tin chi tiết về các cá nhân (người đại diện, người liên lạc, người ra quyết định) thuộc một Khách hàng (Account). Trong mô hình B2B, một Account có thể có nhiều Contacts.

| Tên trường | Mã trường (Database) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **ID Liên hệ** | `contact_id` | UUID | Có | Khóa chính |
| **Mã liên hệ** | `contact_code` | String(50) | Có | Sinh tự động |
| **Họ và đệm** | `last_name` | String(100) | Không | |
| **Tên** | `first_name` | String(100) | Có | Tên cá nhân liên hệ |
| **Họ và tên** | `full_name` | String(255) | Có | Sinh tự động (Last Name + First Name) |
| **Khách hàng (Tổ chức)**| `account_id` | UUID (FK) | Không* | *Trường hợp B2C thì Liên hệ có thể là KH độc lập không cần Account |
| **Chức danh** | `job_title` | String(100) | Không | Giám đốc, Trưởng phòng, Kế toán... |
| **Điện thoại di động** | `mobile` | String(20) | Có* | *Bắt buộc 1 thông tin liên lạc (Mobile/Email) |
| **Điện thoại cơ quan** | `work_phone` | String(20) | Không | Máy lẻ |
| **Email** | `email` | String(100) | Có* | *Bắt buộc 1 thông tin liên lạc (Mobile/Email) |
| **Zalo/Mạng xã hội** | `social_links` | JSON | Không | Link FB, Zalo ID, LinkedIn |
| **Vai trò mua hàng** | `buying_role_id` | UUID (FK) | Không | Master Data: Người QĐ, Người sử dụng, Người ảnh hưởng... |
| **Ngày sinh** | `birth_date` | Date | Không | Quản lý sinh nhật để CSKH |
| **Giới tính** | `gender` | Enum | Không | Nam / Nữ / Khác |
| **Phân loại liên hệ** | `contact_type_id` | UUID (FK) | Không | VIP, Thường xuyên, Ít liên hệ... |
| **Nhân viên quản lý** | `owner_id` | UUID (FK) | Có | NV phụ trách liên hệ này |

### Master Data tham chiếu
*   `crm_buying_roles`: Vai trò mua hàng (Decision Maker, Evaluator, User, Champion). Rất quan trọng cho Sales B2B.

---

## 2. Quy trình (Business Processes)

### Quy trình Quản lý Liên hệ
1.  **Thu thập & Phân loại:** Khi sinh ra Account, NV kinh doanh phải cố gắng thu thập càng nhiều Contact trong công ty đó càng tốt để lập sơ đồ tổ chức khách hàng (Account Mapping).
2.  **Đánh giá Vai trò:** Xác định ai là người có quyền ra quyết định (Decision Maker), ai là người dùng cuối (End User) để có kịch bản Sale phù hợp.
3.  **Tương tác cá nhân hóa:** Nhân viên lưu lịch sử gặp gỡ, gọi điện riêng với từng cá nhân. Hệ thống tự động nhắc nhở Ngày sinh nhật của Liên hệ để gửi email/SMS chúc mừng.
4.  **Liên kết vào Cơ hội (Opportunity Contact Roles):** Khi mở 1 Cơ hội bán hàng, Sales cần chọn ra những Contact nào tham gia vào thương vụ đó và vai trò của họ.

### Phân quyền (Roles & Permissions)
*   **Rule kế thừa:** Mặc định, Nhân viên quản lý Account sẽ có quyền xem/sửa tất cả Contacts thuộc Account đó.
*   **Chia sẻ (Sharing):** Contact có thể được chia sẻ cho các cá nhân hoặc phòng ban khác để cùng chăm sóc.

---

## 3. Luồng nghiệp vụ (Business Workflows)

### Luồng Chăm sóc Khách hàng Tự động (Birthdays & Events)
*   **Trigger:** Hệ thống chạy background job mỗi ngày lúc 00:01 AM.
*   **Condition:** Ngày hiện tại trùng với `Ngày và Tháng` của trường `birth_date` của Contact.
*   **Action:**
    *   Tự động sinh ra 1 Task (Công việc) giao cho NV quản lý: "Chúc mừng sinh nhật khách hàng [Tên liên hệ]".
    *   (Nếu có tích hợp AMIS aiMarketing) Tự động gửi Email/Zalo ZNS kịch bản Chúc mừng sinh nhật.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### API Endpoints Đề xuất
*   `GET /api/v1/crm/contacts`: Lấy danh sách liên hệ (Hỗ trợ lọc Contact không có Account, lọc theo Ngày sinh nhật).
*   `POST /api/v1/crm/contacts`: Tạo liên hệ.
*   `PUT /api/v1/crm/contacts/{id}`: Cập nhật.
*   `GET /api/v1/crm/accounts/{accountId}/contacts`: API lấy toàn bộ Contact thuộc 1 Account cụ thể.

### Ràng buộc logic (Business Rules)
*   **Kiểm tra trùng lặp:** Kiểm tra SĐT di động hoặc Email để tránh tạo 1 người nhiều lần trong hệ thống.
*   **Đồng bộ Owner:** Cấu hình tùy chọn (Setting): Khi thay đổi `owner_id` (Người quản lý) của Account, có tự động thay đổi `owner_id` của toàn bộ Contacts thuộc Account đó theo hay không.

### Điểm tích hợp (Integrations)
*   **Zalo ZNS / SMS Brandname:** Gửi tin nhắn chăm sóc cá nhân hóa (OTP, Sinh nhật, Khuyến mãi).
*   **Google Workspace / Office 365:** Đồng bộ 2 chiều danh bạ (Sync Contacts) giữa CRM và điện thoại/Email cá nhân của Sales.
*   **Card Scanner (Mobile App):** Tính năng OCR trên app di động MISA AMIS CRM cho phép chụp ảnh Danh thiếp (Business Card) và tự động bóc tách text điền vào các trường Tên, Chức danh, SĐT, Email để tạo Contact.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### Layouts
*   **List View:**
    *   Hiển thị dạng bảng. Cho phép lọc nhanh "Khách hàng sinh nhật trong tháng này".
    *   Cột Avatar/Initials nhỏ ở đầu tên Liên hệ.
*   **Detail View:**
    *   Tương tự Khách hàng nhưng đơn giản hơn.
    *   Có Widget hiển thị **Sơ đồ tổ chức khách hàng (Org Chart)**: Vẽ dạng tree-view để sale nhìn thấy Contact này báo cáo cho Contact nào (thuộc cùng 1 Account).

### UI Components
*   **Inline Call & Email Button:** Ngay cạnh trường Số điện thoại và Email trong Form chi tiết, có nút (Icon) xanh lá để Click-to-call, hoặc Click-to-email. Mở popup gọi điện hoặc soạn mail ngay không chuyển trang.
*   **Avatar Placeholder:** Nếu Contact không có ảnh đại diện, tự động generate ảnh lấy chữ cái đầu của Tên trên nền màu ngẫu nhiên (Ví dụ: Chữ A trên nền cam).

### UX Feedback
*   Trong Form Thêm mới Liên hệ, có Autocomplete dropdown cho trường "Khách hàng (Account)". Khi chọn Account, trường "Địa chỉ cơ quan" của Contact tự động fill bằng địa chỉ của Account (giúp tiết kiệm thời gian gõ).
