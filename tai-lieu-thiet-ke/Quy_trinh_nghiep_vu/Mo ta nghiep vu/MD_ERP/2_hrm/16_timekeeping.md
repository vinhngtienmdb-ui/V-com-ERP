# Đặc tả nghiệp vụ: Phân hệ Chấm công (Timekeeping)

> **Quy ước tham chiếu:** "MISA AMIS" và các sản phẩm MISA được nhắc tới trong tài liệu này là **sản phẩm tham khảo** để minh họa cách làm nghiệp vụ, **không phải yêu cầu bắt buộc**. VComm tự xây dựng tính năng tương đương trên nền tảng của mình.

## 1. Trường dữ liệu (Data Fields)

### 1.1 Ca làm việc (Shifts)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `shift_id` | UUID | Yes | Mã ca làm việc |
| `shift_name` | String | Yes | Tên ca (Ca hành chính, Ca sáng, Ca đêm) |
| `start_time` | Time | Yes | Giờ bắt đầu (VD: 08:00) |
| `end_time` | Time | Yes | Giờ kết thúc (VD: 17:30) |
| `break_start_time` | Time | No | Giờ bắt đầu nghỉ giữa ca |
| `break_end_time` | Time | No | Giờ kết thúc nghỉ giữa ca |
| `standard_workdays`| Decimal | Yes | Số công chuẩn của ca (VD: 1.0 hoặc 0.5) |
| `allowed_late_mins`| Integer | No | Số phút cho phép đi muộn |

### 1.2 Dữ liệu Chấm công thô (Time Logs)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `log_id` | UUID | Yes | Mã log |
| `employee_id` | UUID | Yes | Mã nhân viên |
| `log_time` | DateTime | Yes | Thời gian quét vân tay/check-in |
| `device_id` | String | Yes | Mã thiết bị (Máy chấm công, IP, GPS) |
| `type` | Enum | Yes | Loại: IN, OUT |

### 1.3 Bảng công chi tiết (Timesheet)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `timesheet_id` | UUID | Yes | Mã bảng công |
| `employee_id` | UUID | Yes | Mã nhân viên |
| `date` | Date | Yes | Ngày ghi nhận |
| `shift_id` | UUID | Yes | Ca làm việc được phân bổ |
| `time_in` | Time | No | Giờ vào (lấy từ Time Logs) |
| `time_out` | Time | No | Giờ ra (lấy từ Time Logs) |
| `late_mins` | Integer | No | Số phút đi muộn |
| `early_leave_mins` | Integer | No | Số phút về sớm |
| `workday_count` | Decimal | Yes | Công thực tế (VD: 1.0, 0.5, 0) |
| `leave_type_id` | UUID | No | Nếu có xin nghỉ (Phép năm, Ốm...) |
| `is_manual_edit` | Boolean | Yes | Đánh dấu nếu có sửa tay |

### Master Data
- Danh mục Ca làm việc (Shifts)
- Danh mục Loại nghỉ (Leave Types: Phép năm, Nghỉ không lương, Thai sản...)
- Danh mục Ngày lễ (Holidays)

---

## 2. Quy trình (Business Processes)

1. **Thiết lập Cấu hình**: HR phân ca làm việc cho nhân sự (Cố định, Xoay ca). Khai báo các ngày nghỉ lễ trong năm.
2. **Ghi nhận dữ liệu**: Nhân viên check-in/out qua máy vân tay, app mobile (GPS/Wifi) hoặc face ID.
3. **Đồng bộ & Tính toán**: Hệ thống tự động kéo dữ liệu thô (Logs), ghép vào ca làm việc để tính ra `time_in`, `time_out`, số phút đi muộn, về sớm, công thực tế.
4. **Xử lý ngoại lệ**: Nhân viên làm đơn Giải trình chấm công (Quên chấm công, đi công tác), Đơn xin nghỉ phép. Quản lý duyệt đơn.
5. **Chốt công**: Cuối tháng, hệ thống update lại Timesheet dựa trên các đơn đã duyệt. HR khoá (Lock) bảng công để chuyển sang Tính lương.

**Phân quyền (Roles):**
- `Employee`: Check-in/out trên App, xem bảng công cá nhân, tạo đơn nghỉ phép/giải trình.
- `Line Manager`: Duyệt đơn nghỉ phép/giải trình của nhân viên, xem bảng công của phòng.
- `HR Timekeeper`: Quản lý ca làm việc, đồng bộ dữ liệu từ máy chấm công, chốt công toàn công ty.

---

## 3. Luồng nghiệp vụ (Business Workflows)

- **Workflow Xử lý dữ liệu thô (Log Parsing)**: Cronjob chạy mỗi 15 phút. Gom các bản ghi `IN/OUT` trong ngày của 1 NV. Thuật toán lấy bản ghi sớm nhất làm `time_in`, muộn nhất làm `time_out`. So sánh với `start_time` và `end_time` của `shift_id` để tính `late_mins`, `early_leave_mins`.
- **Workflow Đơn xin nghỉ (Leave Request)**: NV tạo đơn xin nghỉ ngày X -> Quản lý duyệt -> Cập nhật `leave_type_id` vào `Timesheet` ngày X -> Tính lại `workday_count` (nếu nghỉ có lương, công = 1).
- **Workflow Giải trình**: NV quên chấm công ra -> Tạo đơn xin cập nhật giờ ra là 17:30 -> Quản lý duyệt -> Ghi đè `time_out` vào `Timesheet` và set `is_manual_edit = true`.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1 API Endpoints (RESTful)
- `POST /api/v1/timekeeping/logs`: Nhận dữ liệu đẩy từ máy chấm công (Webhook).
- `GET /api/v1/timekeeping/timesheets`: Lấy bảng công tháng (Dạng ma trận Ngày - Nhân viên).
- `POST /api/v1/timekeeping/leaves`: Tạo đơn xin nghỉ phép.
- `POST /api/v1/timekeeping/calculate`: Trigger tính toán lại bảng công thủ công cho 1 khoảng thời gian.

### 4.2 Ràng buộc logic (Business Rules)
- Không cho phép check-in GPS nếu toạ độ nằm ngoài bán kính (VD: 50m) so với văn phòng khai báo, trừ khi được cấp quyền check-in tự do (Sale).
- Số ngày phép năm (Annual Leave Quota) bị trừ đi khi đơn nghỉ phép năm được duyệt. Không cho phép tạo đơn nếu Quota < số ngày xin nghỉ (hoặc cho phép âm tuỳ policy).
- Khi Bảng công đã bị trạng thái `LOCKED` (Chốt công), không ai được phép thay đổi, không thể duyệt đơn giải trình cho tháng đó nữa.

### 4.3 Điểm tích hợp (Integrations)
- **Máy chấm công (Hardware)**: Tích hợp SDK/API của ZKTeco, Ronald Jack để kéo dữ liệu tự động.
- **Mobile App**: App MISA AMIS cho phép nhân viên bấm chấm công lấy Location và Face matching.
- **Phân hệ Tính lương (Payroll)**: Truyền tổng số công, tổng phút đi muộn, tổng ngày nghỉ không lương sang bảng lương.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1 Layouts
- **Timesheet Matrix (Bảng công tổng hợp)**: Dạng Pivot/Excel-like. Cột dọc là Tên nhân viên, Cột ngang là các ngày trong tháng (1->31). Cell hiển thị ký hiệu (Vd: X = Đủ công, P = Nghỉ phép, M = Đi muộn).
- **My Time (Cá nhân)**: Giao diện dạng Calendar (Lịch) cho nhân viên xem. Ngày nào đi muộn hiện chấm đỏ, bình thường chấm xanh.
- **Request Approval Board**: Danh sách các đơn từ cần duyệt dành cho Manager.

### 5.2 UI Components
- `Data Grid / Spreadsheet Component`: Cực kỳ quan trọng, cần hỗ trợ Fixed Header, Fixed Column, Scroll mượt mà với >1000 rows x 31 columns. Hỗ trợ Filter trên từng cột.
- `Cell Hover Tooltip`: Trỏ chuột vào ký hiệu "M" trên bảng công, popup hiện chi tiết: "Giờ vào: 08:15, Đi muộn 15 phút".
- `Clock In/Out Button`: Nút to, rõ ràng trên Mobile App, nhấn giữ 2s để check-in tránh bấm nhầm.

### 5.3 UX Feedback
- Highlight màu cuối tuần (Thứ 7, CN) trên bảng công ngang để dễ nhìn.
- Nút "Tính toán lại" cần có Loading state và Progress bar vì xử lý lượng dữ liệu lớn có thể mất vài chục giây.
- Cho phép HR double click trực tiếp vào ô ngày của nhân viên trên Bảng công để sửa tay (Inline edit), yêu cầu nhập lý do.
