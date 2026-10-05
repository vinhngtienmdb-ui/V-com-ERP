# Đặc tả nghiệp vụ: Phân hệ Tính lương (Payroll)

## 1. Trường dữ liệu (Data Fields)

### 1.1 Chính sách lương (Salary Policies)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `policy_id` | UUID | Yes | Mã chính sách |
| `policy_name` | String | Yes | Tên chính sách (Lương thời gian, Lương khoán, Lương Sale...) |
| `formula` | Text | Yes | Công thức tính toán (VD: (Lương cơ bản / Ngày công chuẩn) * Công thực tế) |
| `is_active` | Boolean | Yes | Trạng thái hiệu lực |

### 1.2 Thành phần lương (Payroll Components / Allowances)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `component_id` | UUID | Yes | Mã khoản mục |
| `component_name` | String | Yes | Tên (Phụ cấp ăn trưa, Thưởng nóng, Phạt đi muộn...) |
| `type` | Enum | Yes | Loại: EARNING (Cộng), DEDUCTION (Trừ) |
| `is_taxable` | Boolean | Yes | Có chịu thuế TNCN không |
| `is_insurance` | Boolean | Yes | Có tham gia tính BHXH không |

### 1.3 Bảng lương tháng (Payroll Period / Salary Table)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `payroll_id` | UUID | Yes | Mã bảng lương |
| `month` | Integer | Yes | Tháng tính lương (1-12) |
| `year` | Integer | Yes | Năm tính lương |
| `status` | Enum | Yes | Trạng thái: DRAFT, CALCULATING, REVIEWING, APPROVED, PAID |

### 1.4 Phiếu lương cá nhân (Payslip)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `payslip_id` | UUID | Yes | Mã phiếu lương |
| `payroll_id` | UUID | Yes | Thuộc bảng lương nào |
| `employee_id` | UUID | Yes | Mã nhân viên |
| `gross_salary` | Decimal | Yes | Tổng thu nhập (chưa trừ) |
| `net_salary` | Decimal | Yes | Thực lĩnh |
| `details` | JSON | Yes | Lưu chi tiết từng khoản (Lương cơ bản: X, Phụ cấp: Y, Thuế: Z) để snapshot dữ liệu |

### Master Data
- Danh mục Ngân hàng trả lương.
- Mẫu phiếu lương (Payslip Templates).

---

## 2. Quy trình (Business Processes)

1. **Thiết lập Cấu hình**: Đầu kỳ/năm, HR cấu hình Công thức tính, Khai báo các loại phụ cấp, cấu hình Mức lương tối thiểu vùng.
2. **Tổng hợp Dữ liệu Đầu vào**: Kéo dữ liệu Công (từ Phân hệ Chấm công), Doanh số (từ Phân hệ Sales/KPI), Phụ cấp biến đổi (Excel import).
3. **Chạy Tính lương**: Hệ thống tính toán Gross, các khoản giảm trừ (BHXH, Thuế TNCN), và Net cho toàn bộ nhân viên.
4. **Kiểm tra và Phê duyệt**: C&B rà soát bảng lương, trình Kế toán trưởng và Giám đốc phê duyệt.
5. **Gửi Phiếu lương & Chi trả**: Sau khi duyệt, hệ thống gửi Payslip qua email/app cho nhân viên. Xuất file UNC (Ủy nhiệm chi) cho ngân hàng để thanh toán.

**Phân quyền (Roles):**
- `C&B Specialist`: Thực hiện toàn bộ thao tác tính lương, cấu hình công thức.
- `C-Level / Finance Director`: Phê duyệt bảng lương (Chỉ xem tổng quỹ lương và xác nhận).
- `Employee`: Xem phiếu lương của mình, gửi thắc mắc/khiếu nại nếu có.

---

## 3. Luồng nghiệp vụ (Business Workflows)

- **Workflow Tính toán lương (Engine Engine)**: 
  1. Load Base Salary từ hợp đồng.
  2. Load Working days từ Timesheet.
  3. Tính Lương thời gian = (Base / Standard Days) * Actual Days.
  4. Load Allowances (Cố định & Biến đổi).
  5. Tính BHXH = (Mức đóng BHXH) * Tỷ lệ quy định.
  6. Tính Thuế TNCN = (Tổng thu nhập chịu thuế - Giảm trừ gia cảnh - BHXH) * Bậc thuế.
  7. Net = Gross - BHXH - Thuế - Các khoản trừ khác.
- **Workflow Khiếu nại lương**: NV nhận phiếu lương trên App -> Nhấn "Gửi thắc mắc" -> HR C&B nhận được ticket -> HR giải trình -> Đóng ticket.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1 API Endpoints (RESTful)
- `POST /api/v1/payroll/tables`: Tạo bảng lương kỳ mới.
- `POST /api/v1/payroll/calculate`: Trigger job tính lương. Cần dùng Message Queue/Background Job vì chạy lâu.
- `GET /api/v1/payroll/tables/{id}/payslips`: Lấy chi tiết bảng lương.
- `POST /api/v1/payroll/payslips/{id}/send`: Gửi phiếu lương cho 1 NV.

### 4.2 Ràng buộc logic (Business Rules)
- **Snapshot Data**: Phiếu lương (Payslip) khi đã sinh ra phải lưu dữ liệu dưới dạng JSON (Snapshot). Kể cả sau này đổi cấu hình/lương cơ bản của tháng trước, phiếu lương đã chốt không được thay đổi.
- Công thức tính lương cần hỗ trợ Dynamic Eval (VD sử dụng parser như expr-eval để parse chuỗi công thức động do user nhập).
- Bảng lương ở trạng thái `APPROVED` hoặc `PAID` thì không được phép chạy lại (re-calculate).

### 4.3 Điểm tích hợp (Integrations)
- **Phân hệ Kế toán (Accounting)**: Sau khi chốt lương, tự động sinh chứng từ hạch toán Chi phí lương (Nợ 642, Có 334) đẩy sang phần mềm kế toán.
- **Ngân hàng (Banking API)**: Xuất file txt/excel theo format chuẩn của Vietcombank, Techcombank, MB... để đẩy lệnh chi lương hàng loạt.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1 Layouts
- **Formula Builder**: Giao diện cấu hình công thức lương. 2 cột: Cột trái chứa danh sách Biến số (Kéo thả được), Cột phải là ô Text area nhập công thức.
- **Payroll Spreadsheet (Bảng lương tổng hợp)**: Dạng Grid siêu rộng. Fixed cột Tên NV và cột Thực lĩnh. Các cột ở giữa cuộn ngang.
- **My Payslip (App/Web)**: Giao diện dạng Hóa đơn/Mã bưu điện, hiển thị số tiền bự, chia 2 cột "Thu nhập" và "Khấu trừ" rõ ràng.

### 5.2 UI Components
- `Dynamic Formula Editor`: Gợi ý biến số khi gõ phím `@` hoặc `$` (Intellisense). Validate công thức sai cú pháp (VD: chia cho 0, thiếu dấu ngoặc).
- `Virtual Scrolling Grid`: Đảm bảo load bảng lương có 5000 nhân viên x 50 cột thành phần lương không bị đơ trình duyệt.
- `PIN/Password Modal`: Trước khi nhân viên mở xem Phiếu lương trên App, yêu cầu nhập lại mật khẩu hoặc FaceID để bảo mật.

### 5.3 UX Feedback
- Khi HR nhấn "Tính lương", hiển thị ProgressBar thật (dựa trên webhook/websocket tracking tiến trình background job).
- Thay đổi một tham số ở cấu hình phụ cấp, hệ thống hiện cảnh báo: "Việc này sẽ làm thay đổi kết quả bảng lương tháng X đang ở trạng thái DRAFT. Bạn có muốn tính lại không?".
