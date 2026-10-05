# Đặc tả nghiệp vụ: Phân hệ Hồ sơ nhân viên (Employee Records)

## 1. Trường dữ liệu (Data Fields)

### 1.1 Thông tin chung (General Information)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `employee_id` | UUID | Yes | Mã định danh hệ thống |
| `employee_code` | String | Yes | Mã nhân viên (Unique, Vd: NV001) |
| `full_name` | String | Yes | Họ và tên |
| `gender` | Enum | Yes | Giới tính (MALE, FEMALE, OTHER) |
| `dob` | Date | Yes | Ngày sinh |
| `avatar_url` | String | No | Link ảnh đại diện |
| `status` | Enum | Yes | Trạng thái: ACTIVE, ON_LEAVE, RESIGNED, PROBATION |

### 1.2 Giấy tờ tuỳ thân & Thuế (Identity & Tax)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `identity_number` | String | Yes | Số CMND/CCCD |
| `issue_date` | Date | No | Ngày cấp |
| `issue_place` | String | No | Nơi cấp |
| `tax_code` | String | No | Mã số thuế cá nhân |
| `social_insurance_number`| String | No | Số sổ BHXH |

### 1.3 Thông tin Công việc (Job Information)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `department_id` | UUID | Yes | Phòng ban công tác |
| `job_position_id` | UUID | Yes | Chức danh (Vd: Developer) |
| `job_level_id` | UUID | No | Cấp bậc (Vd: Junior, Senior) |
| `direct_manager_id` | UUID | No | Quản lý trực tiếp |
| `work_location` | String | Yes | Địa điểm làm việc (Vd: Trụ sở HN) |
| `join_date` | Date | Yes | Ngày gia nhập |

### 1.4 Quá trình công tác (Working History)
Lưu lại lịch sử thay đổi thông tin công việc: `history_id`, `employee_id`, `old_department`, `new_department`, `old_position`, `new_position`, `effective_date`, `decision_number`.

### Master Data
- Cơ cấu tổ chức (Departments, Branches, Divisions)
- Danh mục Chức danh (Positions)
- Danh mục Cấp bậc (Levels/Grades)
- Ngân hàng, Quốc gia, Tỉnh/Thành phố.

---

## 2. Quy trình (Business Processes)

1. **Khởi tạo hồ sơ**: Chuyển từ ứng viên hoặc Import từ file Excel đối với triển khai mới.
2. **Cập nhật hồ sơ (Self-service)**: Nhân viên tự cập nhật thông tin cá nhân (Chứng chỉ, Học vấn, Quan hệ gia đình/Người phụ thuộc), gửi yêu cầu phê duyệt cho HR.
3. **Điều chuyển/Bổ nhiệm (Transfer/Promotion)**: Quản lý hoặc HR khởi tạo quyết định thay đổi vị trí, phòng ban, lương.
4. **Nghỉ việc (Offboarding)**: Nhân viên nộp đơn xin nghỉ việc -> Quản lý duyệt -> Bàn giao công việc/tài sản -> HR ra quyết định nghỉ việc -> Chốt lương/BHXH.

**Phân quyền (Roles):**
- `Employee`: Xem hồ sơ của chính mình, yêu cầu cập nhật thông tin, tra cứu sơ đồ tổ chức (thông tin public).
- `Line Manager`: Xem hồ sơ của nhân viên dưới quyền, đề xuất điều chuyển/nghỉ việc.
- `HR Admin`: Full quyền thêm/sửa/xoá hồ sơ, duyệt các yêu cầu thay đổi, ban hành quyết định.
- `BOD (Giám đốc)`: Xem dashboard tổng quan nhân sự, phê duyệt quyết định bổ nhiệm cấp cao.

---

## 3. Luồng nghiệp vụ (Business Workflows)

- **Workflow Điều chuyển nhân sự**: 
  1. Trưởng phòng A lập đề xuất chuyển NV sang phòng B.
  2. HR xác nhận (check headcount phòng B).
  3. Trưởng phòng B phê duyệt tiếp nhận.
  4. Hệ thống sinh bản ghi `Working History` với trạng thái Chờ hiệu lực.
  5. Khi đến `effective_date`, Cronjob tự động update thông tin `department_id` hiện tại của NV.
- **Workflow Cập nhật người phụ thuộc**: NV cập nhật con cái -> HR duyệt -> Đẩy dữ liệu sang Phân hệ Thuế (PIT) để tự động tính giảm trừ gia cảnh vào kỳ lương tới.
- **Offboarding Workflow**: Gửi checklist bàn giao cho NV, Trưởng phòng, IT, Kế toán (công nợ). Hoàn tất checklist -> Tự động chuyển `status` sang `RESIGNED` vào ngày cuối cùng làm việc.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1 API Endpoints (RESTful)
- `GET /api/v1/employees`: Search, filter nhân viên. Support Tree view cho sơ đồ tổ chức.
- `POST /api/v1/employees/{id}/requests`: Tạo yêu cầu cập nhật thông tin từ NV.
- `POST /api/v1/decisions/transfer`: Tạo quyết định điều chuyển.
- `POST /api/v1/offboarding`: Khởi tạo quy trình nghỉ việc.

### 4.2 Ràng buộc logic (Business Rules)
- `Employee Code` phải là duy nhất (Unique) trên toàn hệ thống và tự động sinh theo quy tắc (Sequence).
- `Identity Number` (CMND/CCCD) kiểm tra định dạng 9 hoặc 12 số, không trùng lặp.
- Ngày quyết định nghỉ việc (resign_date) không được nhỏ hơn ngày hiện tại (hoặc có quy tắc check lock data kỳ lương).
- Bảo mật dữ liệu: Các trường nhạy cảm như Mức lương (nếu lưu ở đây), Số TK ngân hàng cần mã hoá (Encrypt) dưới DB và chỉ HR có quyền mới được gọi API xem.

### 4.3 Điểm tích hợp (Integrations)
- **Payroll & Timekeeping**: Là master data cung cấp nhân sự cho các phân hệ tính toán.
- **ERP System (Finance/Accounting)**: Đồng bộ mã nhân viên sang hệ thống Kế toán để làm đối tượng công nợ, đối tượng trả lương.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1 Layouts
- **Organization Chart (Sơ đồ tổ chức)**: Dạng hình cây (Tree/Org Chart), zoom in/zoom out, click vào node hiện quick-view profile.
- **Employee Directory**: Giao diện dạng lưới (Grid) hoặc Card view chứa danh bạ công ty, search nhanh theo tên, SĐT, phòng ban.
- **Employee Profile 360 (Chi tiết hồ sơ)**: 
  - Header: Avatar, Tên, Chức danh, Badge trạng thái.
  - Tabs ngang: Thông tin chung | Quá trình công tác | Khen thưởng/Kỷ luật | Hợp đồng | Người phụ thuộc.

### 5.2 UI Components
- `Org Chart Component`: Hỗ trợ lazy loading khi công ty có >1000 nhân sự.
- `Timeline Component`: Hiển thị đẹp mắt Quá trình công tác (từ dưới lên trên theo thời gian).
- `Inline Edit / Modal`: Cho phép HR sửa nhanh một trường dữ liệu mà không cần tải lại trang.
- `Data Export (Excel/PDF)`: Nút xuất báo cáo danh sách trích ngang nhân sự.

### 5.3 UX Feedback
- Tính năng "Chụp ảnh màn hình" đối với Org Chart để xuất file present.
- Khi nhân viên sửa thông tin cá nhân, hiện cảnh báo "Thông tin cần HR phê duyệt để có hiệu lực". Các trường vừa sửa highlight màu vàng (Pending).
- Tìm kiếm toàn cục (Global Search) ở Header: Gõ tên "Nguyen Van A" nhảy ngay ra gợi ý truy cập hồ sơ.
