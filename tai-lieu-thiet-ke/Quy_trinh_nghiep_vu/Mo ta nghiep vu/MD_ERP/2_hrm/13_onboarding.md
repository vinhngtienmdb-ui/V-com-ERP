# Đặc tả nghiệp vụ: Phân hệ Tiếp nhận (Onboarding)

## 1. Trường dữ liệu (Data Fields)

### 1.1 Kế hoạch Tiếp nhận (Onboarding Sessions/Plans)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `onboarding_id` | UUID | Yes | Mã luồng tiếp nhận |
| `candidate_id` | UUID | Yes | Mã ứng viên (từ Tuyển dụng) |
| `employee_id` | UUID | No | Mã nhân viên (sinh ra khi tiếp nhận thành công) |
| `join_date` | Date | Yes | Ngày bắt đầu làm việc (nhận việc) |
| `buddy_id` | UUID | No | Người hướng dẫn (Mentor/Buddy) |
| `status` | Enum | Yes | Trạng thái: PREPARING, IN_PROGRESS, COMPLETED, CANCELLED |

### 1.2 Công việc Tiếp nhận (Onboarding Tasks / Checklist)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `task_id` | UUID | Yes | Mã công việc |
| `onboarding_id` | UUID | Yes | Thuộc luồng tiếp nhận nào |
| `assignee_id` | UUID | Yes | Người phụ trách (IT, HCNS, Trưởng phòng) |
| `task_name` | String | Yes | Tên công việc (Vd: Cấp máy tính, Tạo tài khoản email) |
| `due_date` | Date | Yes | Hạn chót hoàn thành |
| `is_completed` | Boolean | Yes | Đã hoàn thành chưa |

### 1.3 Đánh giá thử việc (Probation Evaluation)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `evaluation_id` | UUID | Yes | Mã đánh giá |
| `onboarding_id` | UUID | Yes | Thuộc luồng tiếp nhận nào |
| `evaluator_id` | UUID | Yes | Người đánh giá (Quản lý trực tiếp) |
| `criteria_scores` | JSON | Yes | Điểm theo từng tiêu chí (Chuyên môn, Thái độ...) |
| `final_recommendation` | Enum | Yes | Đề xuất: PASS (Ký HĐ), EXTEND (Gia hạn), FAIL (Chấm dứt) |

### Master Data
- Mẫu Checklist Onboarding (Template theo phòng ban/vị trí)
- Tiêu chí đánh giá thử việc (Probation Criteria)

---

## 2. Quy trình (Business Processes)

1. **Chuẩn bị trước khi nhận việc (Pre-onboarding)**: Hệ thống sinh Checklist dựa trên Template. Giao task cho IT (cấp thiết bị, tài khoản), HCNS (chỗ ngồi, thẻ xe), Manager (Chuẩn bị plan training).
2. **Ngày đầu tiên (Day 1)**: Nhân sự mới check-in, cập nhật hồ sơ cá nhân qua portal, nhận bàn giao tài sản.
3. **Quá trình thử việc (Probation)**: Thực hiện đào tạo hội nhập, theo dõi bởi Buddy/Manager.
4. **Đánh giá thử việc**: Trước khi hết hạn thử việc (thường 7-15 ngày), hệ thống tự động gửi thông báo cho Manager và Nhân sự để làm form đánh giá.
5. **Chính thức hoá**: Duyệt đánh giá đạt -> Ký hợp đồng lao động chính thức -> Chuyển thành Nhân viên chính thức trên hệ thống.

**Phân quyền (Roles):**
- `HR Admin`: Quản lý template checklist, theo dõi tiến độ tổng thể.
- `IT/Admin Staff`: Xử lý các task cấp phát tài sản, tài khoản.
- `Department Manager`: Đánh giá thử việc, giao việc trong thời gian thử việc.
- `New Hire (Nhân sự mới)`: Đăng nhập portal giới hạn để điền thông tin cá nhân, xem checklist của mình.

---

## 3. Luồng nghiệp vụ (Business Workflows)

- **Workflow tạo Checklist tự động**: Khi Offer được "Accept" -> Kích hoạt Onboarding -> Đọc Template cấu hình sẵn theo `position_id` hoặc `department_id` -> Generate ra N task -> Gắn `due_date` tự động (VD: Day 1, Day -3...).
- **Luồng phê duyệt đánh giá thử việc**: Nhân viên tự đánh giá -> Quản lý trực tiếp đánh giá & đề xuất mức lương chính thức -> Trưởng phòng HR duyệt -> Giám đốc duyệt (nếu có thay đổi lương so với Offer).
- **Luồng cảnh báo**: Hệ thống trigger cảnh báo (Notification/Email) khi task chuẩn bị (VD: cấp máy tính) bị trễ hạn so với ngày nhân viên gia nhập.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1 API Endpoints (RESTful)
- `POST /api/v1/onboarding/sessions`: Khởi tạo phiên tiếp nhận mới.
- `GET /api/v1/onboarding/tasks`: Lấy danh sách task cần làm của user hiện tại (Dùng cho IT, HR).
- `PUT /api/v1/onboarding/tasks/{id}/complete`: Đánh dấu task hoàn thành.
- `POST /api/v1/onboarding/probations/evaluate`: Submit form đánh giá thử việc.

### 4.2 Ràng buộc logic (Business Rules)
- Không thể hoàn thành `Onboarding Session` nếu vẫn còn `Task` trạng thái bắt buộc chưa `is_completed`.
- Ngày đánh giá thử việc phải diễn ra <= ngày kết thúc thử việc được ghi nhận trong Offer.
- Khi đánh giá là `PASS`, hệ thống phải validate hồ sơ nhân sự bắt buộc (CMND/CCCD, Mã số thuế) trước khi cho phép chuyển sang phân hệ Hợp đồng.

### 4.3 Điểm tích hợp (Integrations)
- **Identity & Access Management (IAM / Active Directory)**: Khi IT tick hoàn thành task "Tạo tài khoản email", tự động gọi API sinh user trên AD/Google Workspace.
- **Phân hệ Quản lý tài sản (Asset Management)**: Liên kết biên bản bàn giao thiết bị.
- **Phân hệ Hồ sơ (Employee Records)**: Sync dữ liệu từ Candidate -> Employee Profile.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1 Layouts
- **HR Tracking Dashboard**: Bảng tiến độ Onboarding của toàn bộ nhân viên mới (Progress bar %).
- **New Hire Portal**: Giao diện chào mừng "Welcome aboard", kèm Timeline/Roadmap 60 ngày thử việc (Checklist những việc nhân viên mới cần làm: Nộp hồ sơ giấy, Đọc nội quy...).
- **Task List View**: Cho IT/Hành chính xem dạng To-do list, nhóm theo từng nhân viên mới.

### 5.2 UI Components
- `Progress Bar / Circular Gauge`: Hiển thị % hoàn thành checklist.
- `Vertical Stepper`: Hiển thị lộ trình Onboarding (Tuần 1, Tuần 2, Tháng 1, Tháng 2...).
- `Star Rating / Slider`: Dùng trong Form đánh giá thử việc (chấm điểm 1-5).
- `Confetti Animation`: Hiệu ứng pháo giấy chúc mừng khi hoàn thành Onboarding và được nhận chính thức.

### 5.3 UX Feedback
- Nút "Hoàn thành task" thay đổi trạng thái ngay lập tức (Optimistic UI) và hiện toast "Đã cập nhật".
- Form đánh giá thử việc nếu chưa điền đủ các trường bắt buộc, highlight đỏ và tự động cuộn (scroll) tới trường lỗi đầu tiên.
- Email nhắc nhở thiết kế đẹp, rõ ràng Call-to-Action (VD: "Click vào đây để đánh giá nhân viên A").
