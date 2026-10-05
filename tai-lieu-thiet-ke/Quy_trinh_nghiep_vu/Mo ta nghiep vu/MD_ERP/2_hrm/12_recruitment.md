# Đặc tả nghiệp vụ: Phân hệ Tuyển dụng (Recruitment)

## 1. Trường dữ liệu (Data Fields)

### 1.1 Kế hoạch tuyển dụng (Recruitment Plans)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `plan_id` | UUID | Yes | Mã kế hoạch tuyển dụng |
| `department_id` | UUID | Yes | Phòng ban yêu cầu (FK) |
| `position_id` | UUID | Yes | Vị trí cần tuyển (FK) |
| `quantity` | Integer | Yes | Số lượng cần tuyển |
| `budget` | Decimal | No | Ngân sách dự kiến |
| `start_date` | Date | Yes | Ngày bắt đầu tuyển |
| `end_date` | Date | Yes | Ngày dự kiến hoàn thành |
| `status` | Enum | Yes | Trạng thái: DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, IN_PROGRESS, COMPLETED |

### 1.2 Hồ sơ ứng viên (Candidates)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `candidate_id` | UUID | Yes | Mã ứng viên |
| `full_name` | String | Yes | Họ và tên ứng viên |
| `email` | String | Yes | Email liên hệ (Dùng để check trùng) |
| `phone_number` | String | Yes | Số điện thoại (Dùng để check trùng) |
| `cv_attachment_url` | String | Yes | Link file CV đính kèm |
| `source_id` | UUID | Yes | Nguồn ứng viên (VietnamWorks, TopCV, Referral...) |
| `job_posting_id` | UUID | Yes | Tin tuyển dụng ứng tuyển (FK) |
| `status` | Enum | Yes | Trạng thái: NEW, SCREENING, INTERVIEWING, OFFERING, HIRED, REJECTED |

### 1.3 Lịch phỏng vấn (Interviews)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `interview_id` | UUID | Yes | Mã lịch phỏng vấn |
| `candidate_id` | UUID | Yes | Mã ứng viên (FK) |
| `interviewers` | Array<UUID> | Yes | Danh sách người phỏng vấn (Employee IDs) |
| `interview_time` | DateTime | Yes | Thời gian phỏng vấn |
| `round` | Integer | Yes | Vòng phỏng vấn (1, 2, 3...) |
| `evaluation_result` | JSON | No | Kết quả đánh giá theo tiêu chí |
| `result` | Enum | No | Kết quả vòng: PASS, FAIL, CONSIDER |

### Master Data
- Nguồn ứng viên (Candidate Sources)
- Tiêu chí đánh giá phỏng vấn (Evaluation Criteria)
- Lý do từ chối (Rejection Reasons)

---

## 2. Quy trình (Business Processes)

1. **Lập yêu cầu tuyển dụng**: Trưởng bộ phận (Manager) lập yêu cầu khi phát sinh nhu cầu nhân sự.
2. **Phê duyệt yêu cầu**: Giám đốc/HR Head phê duyệt dựa trên định biên nhân sự (Headcount) và ngân sách.
3. **Đăng tuyển & Thu thập CV**: Chuyên viên tuyển dụng (Recruiter) đăng tin lên các kênh, hệ thống tự động gom CV từ email/API (nếu có).
4. **Sơ loại hồ sơ**: Recruiter lọc CV, chuyển cho Manager xem xét.
5. **Phỏng vấn**: Đặt lịch, gửi email mời ứng viên, thực hiện phỏng vấn và đánh giá trên hệ thống.
6. **Đề xuất tuyển dụng (Offer)**: Recruiter lập thư mời việc, trình duyệt mức lương, gửi ứng viên.
7. **Chuyển Onboarding**: Ứng viên đồng ý Offer, hệ thống chuyển dữ liệu sang phân hệ Tiếp nhận.

**Phân quyền (Roles):**
- `Department Manager`: Lập yêu cầu, xem CV phòng mình, đánh giá phỏng vấn.
- `Recruiter`: Quản lý toàn bộ luồng, tạo lịch, gửi email, lập offer.
- `HR Manager / C-Level`: Phê duyệt yêu cầu tuyển dụng, phê duyệt Offer vượt khung.

---

## 3. Luồng nghiệp vụ (Business Workflows)

- **Luồng luân chuyển dữ liệu**: Kế hoạch tuyển dụng (Department) -> Tin tuyển dụng (HR) -> Hồ sơ ứng viên (HR) -> Kết quả phỏng vấn (Manager + HR) -> Offer (HR + C-Level) -> Hồ sơ nhân viên (HR).
- **Luồng check trùng CV**: Khi ứng viên mới vào hệ thống, Trigger kiểm tra theo (Email HOẶC Số điện thoại). Nếu trùng trong vòng 6 tháng -> Cảnh báo cho Recruiter để gộp hồ sơ hoặc đánh dấu blacklist/duplicate.
- **Luồng phê duyệt Offer**: 
  - Nếu mức lương đề xuất <= Khung lương chuẩn: Trưởng phòng HR duyệt.
  - Nếu mức lương đề xuất > Khung lương chuẩn: Đẩy lên luồng Giám đốc (CEO/BOD) duyệt.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1 API Endpoints (RESTful)
- `POST /api/v1/recruitment/plans`: Tạo kế hoạch tuyển dụng.
- `GET /api/v1/recruitment/candidates`: Lấy danh sách ứng viên (hỗ trợ filter, pagination, full-text search).
- `POST /api/v1/recruitment/candidates/check-duplicate`: API check trùng lặp (email, phone).
- `POST /api/v1/recruitment/interviews`: Lên lịch phỏng vấn và trigger gửi email.

### 4.2 Ràng buộc logic (Business Rules)
- `Validate Budget`: Tổng lương dự kiến của Kế hoạch không được vượt quá Ngân sách phòng ban còn lại.
- `Status Transitions`: Ứng viên chỉ được chuyển trạng thái theo chiều xuôi (VD: Không thể từ HIRED lùi về SCREENING, trừ phi có quyền Admin rollback).
- Tự động huỷ (Auto-reject): Kế hoạch tuyển dụng quá hạn `end_date` mà chưa hoàn thành sẽ cảnh báo hoặc tự động close.

### 4.3 Điểm tích hợp (Integrations)
- **Email Server (SMTP/Graph API)**: Gửi thư mời phỏng vấn, thư cảm ơn, thư Offer.
- **Calendar (Google/Outlook)**: Đồng bộ lịch phỏng vấn vào lịch của người phỏng vấn.
- **Webhooks**: Nhận CV tự động từ TopCV, VietnamWorks, Landing Page công ty.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1 Layouts
- **Candidate Board (Kanban Layout)**: Giao diện kéo thả ứng viên giữa các cột trạng thái (Mới -> Đang lọc -> Phỏng vấn vòng 1 -> Đề xuất -> Đã tuyển).
- **Recruitment Dashboard**: Biểu đồ hình phễu (Funnel) hiển thị tỷ lệ chuyển đổi từ CV -> Phỏng vấn -> Offer -> Nhận việc. Biểu đồ tròn nguồn ứng viên hiệu quả.
- **List View**: Dành cho Quản lý yêu cầu tuyển dụng với các bộ lọc (Phòng ban, Trạng thái).
- **Form View**: Giao diện chia 2 cột: Cột trái (Thông tin ứng viên & Form đánh giá), Cột phải (Preview file PDF của CV) để người phỏng vấn vừa xem CV vừa chấm điểm.

### 5.2 UI Components
- `Drag-and-Drop Board`: Cho Kanban view.
- `PDF Viewer`: Tích hợp sẵn để xem CV không cần tải về.
- `Rich Text Editor`: Để soạn thảo nội dung tin tuyển dụng, nội dung Offer email.
- `Date & Time Picker`: Kèm hiển thị múi giờ để chọn lịch phỏng vấn.

### 5.3 UX Feedback
- Khi kéo thả ứng viên sang cột "Reject", popup yêu cầu chọn "Lý do từ chối" (Dropdown).
- Khi check trùng CV thành công (có trùng), highlight màu đỏ và có nút "Xem hồ sơ gốc".
- Tự động lưu nháp (Auto-save) khi đang nhập Form đánh giá phỏng vấn để tránh mất dữ liệu.
