# Đặc tả nghiệp vụ: Phân hệ Hợp đồng lao động (Labor Contracts)

> **Quy ước tham chiếu:** "MISA AMIS" và các sản phẩm MISA được nhắc tới trong tài liệu này là **sản phẩm tham khảo** để minh họa cách làm nghiệp vụ, **không phải yêu cầu bắt buộc**. VComm tự xây dựng tính năng tương đương trên nền tảng của mình.

## 1. Trường dữ liệu (Data Fields)

### 1.1 Hợp đồng lao động (Contracts)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `contract_id` | UUID | Yes | Mã hợp đồng |
| `contract_number` | String | Yes | Số hợp đồng (Sinh tự động hoặc nhập tay, Vd: HD-2023/001) |
| `employee_id` | UUID | Yes | Mã nhân viên (FK) |
| `contract_type_id` | UUID | Yes | Loại hợp đồng (Thử việc, 1 năm, Không xác định thời hạn...) |
| `start_date` | Date | Yes | Ngày bắt đầu hiệu lực |
| `end_date` | Date | No | Ngày hết hạn (Null nếu là không xác định thời hạn) |
| `basic_salary` | Decimal | Yes | Lương cơ bản ghi trên hợp đồng (dùng tính BHXH) |
| `status` | Enum | Yes | Trạng thái: DRAFT, ACTIVE, EXPIRED, TERMINATED |
| `signer_id` | UUID | Yes | Người đại diện công ty ký (FK to Employee) |
| `attachment_url` | String | No | File scan hợp đồng đã ký (PDF) |

### 1.2 Phụ lục hợp đồng (Contract Appendices)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `appendix_id` | UUID | Yes | Mã phụ lục |
| `contract_id` | UUID | Yes | Thuộc hợp đồng nào |
| `appendix_number` | String | Yes | Số phụ lục |
| `change_content` | Text | Yes | Nội dung thay đổi (Vd: Tăng lương cơ bản lên 15M) |
| `effective_date` | Date | Yes | Ngày bắt đầu hiệu lực của phụ lục |

### Master Data
- Danh mục Loại hợp đồng (Contract Types)
- Quy tắc sinh số hợp đồng tự động (Contract Number Sequences)

---

## 2. Quy trình (Business Processes)

1. **Khởi tạo Hợp đồng**: HR tạo hợp đồng cho nhân viên mới (từ Onboarding) hoặc nhân viên gia hạn.
2. **Sinh File & In ấn**: Hệ thống merge dữ liệu vào Template Word/PDF để in ra bản cứng trình ký. (Ký điện tử nếu có tích hợp).
3. **Theo dõi Hợp đồng**: Hệ thống tự động theo dõi thời hạn hợp đồng, báo cáo các hợp đồng sắp hết hạn.
4. **Gia hạn/Ký mới**: Trước khi hết hạn 30-45 ngày, HR tạo luồng đánh giá gia hạn. Nếu đạt -> Sinh hợp đồng mới hoặc Phụ lục.
5. **Chấm dứt Hợp đồng**: Khi nhân viên nghỉ việc hoặc thoả thuận chấm dứt, đổi trạng thái Hợp đồng hiện tại thành `TERMINATED`.

**Phân quyền (Roles):**
- `HR C&B / HR Admin`: Tạo, sửa, in, và quản lý file hợp đồng.
- `Employee`: Chỉ xem danh sách hợp đồng của chính mình và tải bản PDF mềm.
- `Legal/BOD`: Phê duyệt các điều khoản hợp đồng đặc thù, ký hợp đồng.

---

## 3. Luồng nghiệp vụ (Business Workflows)

- **Workflow Nhắc việc Hết hạn**: Cronjob chạy hàng ngày, check `end_date` - current_date <= 30 ngày (cấu hình được) -> Sinh Notification/Email gửi cho HR và Manager trực tiếp. "Nhân sự Nguyễn Văn A sắp hết hạn HĐLĐ vào ngày DD/MM/YYYY".
- **Workflow Tạo Hợp đồng từ Đánh giá thử việc**: Khi Đánh giá thử việc `PASS` (từ Onboarding) -> Nút Action "Sinh hợp đồng chính thức" -> Tự map thông tin (Tên, CMND, Lương đề xuất) vào Form Hợp đồng mới.
- **Workflow Phụ lục Tăng lương**: Khi có Quyết định tăng lương (Phân hệ Hồ sơ) -> Tự động sinh Phụ lục hợp đồng đính kèm vào Hợp đồng gốc hiện tại.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1 API Endpoints (RESTful)
- `GET /api/v1/contracts`: Danh sách hợp đồng (Lọc theo trạng thái, sắp hết hạn).
- `POST /api/v1/contracts`: Tạo mới HĐ.
- `POST /api/v1/contracts/{id}/generate-pdf`: Merge data vào template và trả về file PDF/Word.
- `PUT /api/v1/contracts/{id}/terminate`: Chấm dứt HĐ.

### 4.2 Ràng buộc logic (Business Rules)
- Một nhân viên tại một thời điểm chỉ có tối đa 1 Hợp đồng trạng thái `ACTIVE`.
- `end_date` phải lớn hơn `start_date`.
- Nếu Loại hợp đồng là "Không xác định thời hạn", không yêu cầu nhập `end_date`.
- Tự động check chuyển trạng thái sang `EXPIRED` khi qua ngày `end_date` mà chưa có hành động gia hạn.

### 4.3 Điểm tích hợp (Integrations)
- **Tích hợp E-Signature (AMIS WeSign/VNPT/Bkav)**: Đẩy file PDF sang hệ thống Ký điện tử, nhận Webhook trả về file đã ký số hợp lệ và tự động lưu vào `attachment_url`.
- **Phân hệ Tính Lương & BHXH**: Thông tin `basic_salary` và `contract_type_id` quyết định tỷ lệ đóng BHXH và thuế.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1 Layouts
- **Contracts Dashboard**: Biểu đồ hình tròn tỷ lệ các loại hợp đồng, Widget "Hợp đồng sắp hết hạn trong 30 ngày tới" (Bảng top list).
- **List View**: Cột cảnh báo màu sắc: Xanh (Đang hiệu lực), Vàng (Sắp hết hạn), Đỏ (Đã hết hạn/Chấm dứt).
- **Detail View**: 
  - Bên trái: Thông tin Form dữ liệu.
  - Bên phải: Preview file văn bản Hợp đồng thực tế.
  - Tab bên dưới: Danh sách các Phụ lục đính kèm.

### 5.2 UI Components
- `Rich Document Template Editor`: Trình soạn thảo cho phép kéo thả các biến (Variables) như `{{EmployeeName}}`, `{{BasicSalary}}` vào mẫu Hợp đồng.
- `PDF Viewer`: Xem trực tiếp bản scan đã ký.
- `Alert Banner`: Cảnh báo ngay trên đầu trang hồ sơ nhân sự nếu người này chưa có hợp đồng hợp lệ.

### 5.3 UX Feedback
- Sinh số hợp đồng thông minh: Khi người dùng chọn Loại hợp đồng, ô Số HĐ tự động điền gợi ý (VD: HD-TV-001) và có thể overwrite.
- Bulk Action: Cho phép tick chọn nhiều nhân viên sắp hết hạn và nhấn "Gửi yêu cầu đánh giá gia hạn" hàng loạt.
