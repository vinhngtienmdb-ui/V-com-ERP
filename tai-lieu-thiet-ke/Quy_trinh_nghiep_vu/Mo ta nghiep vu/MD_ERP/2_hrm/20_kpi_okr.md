# Đặc tả nghiệp vụ: Phân hệ Đánh giá hiệu suất (KPI/OKR)

## 1. Trường dữ liệu (Data Fields)

### 1.1 Chu kỳ đánh giá (Evaluation Cycles)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `cycle_id` | UUID | Yes | Mã chu kỳ |
| `cycle_name` | String | Yes | Tên (VD: Đánh giá Quý 3/2023) |
| `start_date` | Date | Yes | Từ ngày |
| `end_date` | Date | Yes | Đến ngày |
| `status` | Enum | Yes | PLANNING, EXECUTING, EVALUATING, CLOSED |

### 1.2 Mục tiêu/KPI (Goals)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `goal_id` | UUID | Yes | Mã mục tiêu |
| `employee_id` | UUID | Yes | Của nhân viên nào |
| `cycle_id` | UUID | Yes | Thuộc chu kỳ nào |
| `parent_goal_id`| UUID | No | Mapping với mục tiêu của Quản lý/Công ty (Alignment) |
| `title` | String | Yes | Tên mục tiêu (VD: Đạt doanh số 1 tỷ) |
| `weight` | Decimal | Yes | Trọng số (%) |
| `target_value` | Decimal | Yes | Con số mục tiêu cần đạt |
| `actual_value` | Decimal | No | Kết quả thực tế |
| `unit` | String | Yes | Đơn vị (VND, %, Báo cáo...) |

### 1.3 Phiếu đánh giá (Evaluation Sheets)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `evaluation_id` | UUID | Yes | Mã phiếu |
| `employee_id` | UUID | Yes | Người được đánh giá |
| `evaluator_id` | UUID | Yes | Người đánh giá (Manager, Peer) |
| `self_score` | Decimal | No | Điểm NV tự đánh giá |
| `manager_score` | Decimal | No | Điểm Quản lý đánh giá |
| `final_grade` | Enum | No | Xếp loại (A, B, C, D) |
| `feedback` | Text | No | Lời nhận xét (Continuous feedback) |

### Master Data
- Thang điểm đánh giá (Rating Scales: 1-5, Xếp loại A-E).
- Bộ tiêu chí năng lực (Competency Framework - ASK: Attitude, Skill, Knowledge) cho đánh giá 360 độ.

---

## 2. Quy trình (Business Processes)

1. **Thiết lập mục tiêu (Planning)**: Đầu kỳ, Giám đốc giao mục tiêu xuống Trưởng phòng, Trưởng phòng phân bổ (Cascade) hoặc NV tự đề xuất mục tiêu (Bottom-up) -> Quản lý duyệt.
2. **Cập nhật tiến độ (Check-in)**: Định kỳ (hàng tuần/tháng), NV vào cập nhật số liệu `actual_value` và để lại comment tiến độ.
3. **Đánh giá cuối kỳ (Review)**: 
   - NV tự đánh giá (Self-review).
   - Quản lý trực tiếp đánh giá (Manager review).
   - Đánh giá đồng nghiệp/360 độ (Peer review - Optional).
4. **Hiệu chỉnh (Calibration)**: Hội đồng (BOD + HR) họp điều chỉnh điểm số để tránh tình trạng "phòng chấm lỏng, phòng chấm chặt", xếp loại cuối cùng theo quy tắc phân phối chuẩn (Bell Curve).
5. **Ghi nhận kết quả**: Chốt xếp loại, truyền dữ liệu sang Lương thưởng.

**Phân quyền (Roles):**
- `Employee`: Set mục tiêu cá nhân, check-in, tự đánh giá, đánh giá đồng nghiệp.
- `Manager`: Giao mục tiêu, duyệt mục tiêu NV, chấm điểm NV cấp dưới.
- `HR / Admin`: Quản lý chu kỳ, mở/đóng cổng đánh giá, theo dõi tiến độ toàn công ty.

---

## 3. Luồng nghiệp vụ (Business Workflows)

- **Workflow Cascading (Liên kết mục tiêu)**: Trưởng phòng có Goal: "Tuyển 10 Dev". Cấp dưới (Recruiter A) tạo Goal: "Tuyển 5 Dev", chọn `parent_goal` là Goal của Trưởng phòng. Khi Recruiter A đạt 5/5 -> Goal của Trưởng phòng tự động cộng tiến độ tương ứng.
- **Workflow Phê duyệt cuối kỳ**: Self-review -> Submitted -> Manager Review -> Approved -> HR Calibrate -> Finalized -> Trigger gửi Email kết quả đánh giá cho nhân viên.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1 API Endpoints (RESTful)
- `GET /api/v1/performance/goals/tree`: Lấy sơ đồ mục tiêu phân nhánh (Company -> Dept -> Individuals).
- `POST /api/v1/performance/goals/{id}/check-in`: Cập nhật tiến độ thực tế.
- `POST /api/v1/performance/evaluations`: Submit phiếu đánh giá.

### 4.2 Ràng buộc logic (Business Rules)
- Tổng trọng số (`weight`) của tất cả mục tiêu trong 1 chu kỳ của 1 nhân viên phải = 100%. Nếu != 100%, không cho phép submit mục tiêu đầu kỳ.
- Không cho phép check-in hoặc sửa kết quả khi Chu kỳ đánh giá đã chuyển sang trạng thái `CLOSED` hoặc `EVALUATING`.
- Điểm đánh giá cuối cùng = Tổng (Điểm từng mục tiêu * Trọng số).

### 4.3 Điểm tích hợp (Integrations)
- **Phân hệ Sales / ERP**: Nếu mục tiêu là "Doanh số", tự động kéo `actual_value` từ phần mềm Bán hàng (CRM/Sales) realtime mà NV không cần tự gõ.
- **Phân hệ Lương Thưởng**: Xếp loại A, B, C sẽ link với cấu hình Lương KPI, Thưởng cuối năm. (Vd: Loại A hưởng 120% lương KPI, Loại C hưởng 70%).

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1 Layouts
- **Goal Tree (Sơ đồ liên kết mục tiêu)**: Giao diện dạng Mindmap hoặc Hierarchy Chart. Cho thấy sự đóng góp của NV vào mục tiêu phòng/công ty.
- **Check-in Dashboard**: Thanh tiến độ (Progress bar) nhiều màu: Xanh (On track), Vàng (At risk), Đỏ (Off track). 
- **Review Form**: Chia 2 cột dọc. Cột trái: NV tự nhận xét. Cột phải: Quản lý nhận xét (readonly với NV cho đến khi publish).

### 5.2 UI Components
- `Slider / Stepper`: Để nhân viên kéo thả chọn % hoàn thành.
- `Radar Chart (Biểu đồ mạng nhện)`: Dùng trong Đánh giá Năng lực (Competency) để so sánh điểm Thực tế vs Điểm chuẩn của chức danh.
- `9-Box Grid`: Biểu đồ Nhân tài (Tiềm năng - Hiệu suất) dành cho BOD/HR xem xét quy hoạch cán bộ.

### 5.3 UX Feedback
- Tự động lưu nháp form đánh giá (form thường rất dài).
- Khuyến khích (Nudge): Nổi popup nhắc nhở "Đã 2 tuần bạn chưa check-in mục tiêu, hãy cập nhật tiến độ nhé!".
