# Đặc tả nghiệp vụ: Phân hệ Đào tạo (Training & Development)

> **Quy ước tham chiếu:** "MISA AMIS" và các sản phẩm MISA được nhắc tới trong tài liệu này là **sản phẩm tham khảo** để minh họa cách làm nghiệp vụ, **không phải yêu cầu bắt buộc**. VComm tự xây dựng tính năng tương đương trên nền tảng của mình.

## 1. Trường dữ liệu (Data Fields)

### 1.1 Khóa học / Chương trình đào tạo (Courses)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `course_id` | UUID | Yes | Mã khóa học |
| `course_name` | String | Yes | Tên khóa học |
| `type` | Enum | Yes | Loại: INTERNAL (Nội bộ), EXTERNAL (Thuê ngoài) |
| `trainer_name` | String | No | Tên giảng viên (hoặc mã NV nếu nội bộ) |
| `cost_per_pax` | Decimal | No | Chi phí trên 1 học viên |
| `duration_hours`| Integer | Yes | Thời lượng (giờ) |
| `is_mandatory` | Boolean | Yes | Bắt buộc học (VD: Đào tạo hội nhập) hay Tự nguyện |

### 1.2 Lớp học / Phiên đào tạo (Sessions/Classes)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `session_id` | UUID | Yes | Mã lớp học |
| `course_id` | UUID | Yes | Thuộc khóa học |
| `start_time` | DateTime | Yes | Thời gian bắt đầu |
| `location` | String | Yes | Địa điểm (Phòng họp hoặc Link Zoom) |
| `max_capacity` | Integer | Yes | Số lượng học viên tối đa |
| `status` | Enum | Yes | UPCOMING, ONGOING, COMPLETED, CANCELLED |

### 1.3 Hồ sơ học viên (Trainees / Enrollments)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `enrollment_id`| UUID | Yes | Mã đăng ký |
| `session_id` | UUID | Yes | Thuộc lớp học nào |
| `employee_id` | UUID | Yes | Mã nhân viên |
| `attendance` | Boolean | No | Điểm danh (Có mặt/Vắng mặt) |
| `test_score` | Decimal | No | Điểm bài test sau khóa học |
| `is_passed` | Boolean | No | Đạt / Không đạt |

### Master Data
- Danh mục Kỹ năng (Skills Directory).
- Thư viện tài liệu / Bài giảng đính kèm.

---

## 2. Quy trình (Business Processes)

1. **Lập Kế hoạch Đào tạo**: Cuối năm, các phòng ban gửi Nhu cầu đào tạo lên HR. HR tổng hợp thành Kế hoạch Đào tạo năm và dự toán ngân sách trình duyệt.
2. **Tổ chức Khóa học**: HR tạo lớp học trên hệ thống, thêm tài liệu, setup giảng viên.
3. **Đăng ký học**: NV chủ động đăng ký tham gia trên Portal, hoặc HR/Quản lý chỉ định (Assign) bắt buộc vào lớp học.
4. **Thực hiện Đào tạo**: Giảng viên tiến hành giảng dạy, điểm danh, phát bài kiểm tra. NV làm bài test.
5. **Ghi nhận & Cam kết**: Cập nhật kết quả (Pass/Fail) vào hồ sơ NV. Nếu là khóa học External chi phí lớn, NV phải ký Cam kết đào tạo (Làm việc tối thiểu 1-2 năm, nghỉ sớm phải đền bù).

**Phân quyền (Roles):**
- `L&D Specialist (Đào tạo)`: Tạo khóa học, lập kế hoạch, điểm danh, quản lý ngân sách.
- `Trainer`: Xem danh sách học viên lớp mình, chấm điểm, đánh giá.
- `Employee`: Đăng ký học, làm bài test, đánh giá chất lượng giảng viên.
- `Manager`: Phê duyệt cho nhân viên đi học (để sắp xếp công việc).

---

## 3. Luồng nghiệp vụ (Business Workflows)

- **Workflow Đăng ký Khóa học**: NV thấy khóa học Mở đăng ký -> Bấm Join -> Gửi Request tới Manager duyệt -> Gửi tới L&D duyệt -> Đưa vào danh sách chính thức -> Tự động thêm lịch vào Calendar của NV.
- **Workflow Onboarding Training**: Nhân viên mới gia nhập (Phân hệ Onboarding) -> Tự động Auto-enroll vào khóa "Đào tạo Hội nhập Văn hóa Công ty".
- **Workflow Bồi hoàn đào tạo**: Nhân viên nộp đơn xin nghỉ việc (Offboarding) -> Hệ thống tự quét kiểm tra có khóa học `is_mandatory` bồi hoàn nào chưa hết hạn cam kết -> Tự động tính số tiền cần đền bù (Pro-rata theo số ngày còn lại) -> Gửi sang Kế toán trừ vào lương cuối.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1 API Endpoints (RESTful)
- `POST /api/v1/training/courses`: Tạo khóa học.
- `POST /api/v1/training/sessions/{id}/enroll`: Đăng ký tham gia lớp học.
- `PUT /api/v1/training/sessions/{id}/attendance`: Cập nhật trạng thái điểm danh (Bulk update).

### 4.2 Ràng buộc logic (Business Rules)
- Không thể đăng ký lớp học nếu `current_enrollments >= max_capacity`.
- Nếu khóa học bị trùng lịch (Conflict) với thời gian làm ca hoặc lớp học khác của nhân viên, hệ thống phải cảnh báo.
- Chứng chỉ (Certificates) chỉ được cấp và lưu vào Hồ sơ nhân sự khi `attendance = True` VÀ `is_passed = True`.

### 4.3 Điểm tích hợp (Integrations)
- **E-Learning (LMS) System**: Nếu MISA có tích hợp Moodle/Canvas, user click "Học" sẽ SSO sang LMS. LMS gửi Webhook điểm bài test trả về HRM.
- **Microsoft Teams / Zoom API**: Khi tạo lớp Online, tự động gọi API sinh link meeting và gửi cho học viên.
- **Google Calendar/Outlook**: Đồng bộ lịch học.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1 Layouts
- **Course Catalog (Cổng học tập)**: Layout giống Udemy/Coursera. Các khóa học hiển thị dạng Card (Ảnh cover, Tên, Giảng viên, Đánh giá sao).
- **My Learning Journey**: Hành trình học tập của cá nhân. Các khóa đang học (Có % tiến độ), các khóa đã hoàn thành (Hiển thị Chứng chỉ dạng khung tranh).
- **Trainer Dashboard**: Bảng quản lý cho Giảng viên xem danh sách điểm danh, thống kê điểm số bài thi (Biểu đồ phổ điểm).

### 5.2 UI Components
- `QR Code Generator/Scanner`: Giảng viên show QR Code lên màn hình, học viên dùng App MISA AMIS quét để tự động điểm danh (Attendance check-in).
- `Star Rating / Survey Form`: Cuối khóa học, popup Form khảo sát mức độ hài lòng về giảng viên và nội dung.

### 5.3 UX Feedback
- Trạng thái "Fully Booked" (Hết chỗ) rõ ràng trên Card khóa học, nút "Đăng ký" chuyển thành "Đưa vào danh sách chờ" (Waitlist).
- Tự động sinh Certificate dạng hình ảnh (PDF/PNG) đẹp mắt, có nút "Share to LinkedIn".
