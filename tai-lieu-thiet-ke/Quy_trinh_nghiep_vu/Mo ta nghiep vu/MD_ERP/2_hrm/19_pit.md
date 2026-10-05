# Đặc tả nghiệp vụ: Phân hệ Thuế TNCN (Personal Income Tax)

## 1. Trường dữ liệu (Data Fields)

### 1.1 Hồ sơ người phụ thuộc (Dependents)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `dependent_id` | UUID | Yes | Mã người phụ thuộc |
| `employee_id` | UUID | Yes | Mã nhân viên |
| `full_name` | String | Yes | Họ và tên NPT |
| `dob` | Date | Yes | Ngày sinh |
| `tax_code` | String | No | Mã số thuế (nếu có) |
| `relationship` | Enum | Yes | Quan hệ: Con, Vợ/Chồng, Cha/Mẹ... |
| `start_month` | String | Yes | Tháng bắt đầu giảm trừ (VD: 01/2023) |
| `end_month` | String | No | Tháng kết thúc giảm trừ |

### 1.2 Biểu thuế TNCN (Tax Brackets)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `bracket_id` | UUID | Yes | Mã bậc thuế |
| `level` | Integer | Yes | Bậc (1 đến 7) |
| `min_income` | Decimal | Yes | Thu nhập tính thuế từ (>0, >5M, >10M...) |
| `max_income` | Decimal | No | Đến (5M, 10M, 18M...) |
| `tax_rate` | Decimal | Yes | Thuế suất (5%, 10%, 15%...) |
| `subtract_amount`| Decimal | Yes | Số tiền trừ lùi (0, 0.25M, 0.75M...) để tính nhanh |

### Master Data
- Mức giảm trừ bản thân (VD: 11.000.000 VNĐ).
- Mức giảm trừ người phụ thuộc (VD: 4.400.000 VNĐ).

---

## 2. Quy trình (Business Processes)

1. **Đăng ký MST và NPT**: Cập nhật mã số thuế cá nhân cho nhân viên mới. NV nộp hồ sơ chứng minh người phụ thuộc, HR duyệt và nhập thời gian giảm trừ.
2. **Khấu trừ thuế hàng tháng/quý**: Quá trình tính lương tự động tính ra số thuế TNCN phải nộp trong tháng theo biểu thuế luỹ tiến (đối với HĐLĐ >= 3 tháng) hoặc khấu trừ 10% (với HĐLĐ < 3 tháng, cộng tác viên).
3. **Kê khai thuế**: HR/Kế toán xuất tờ khai 05/KK-TNCN hàng tháng/quý để nộp cho Cơ quan Thuế.
4. **Quyết toán thuế cuối năm**: Cuối năm, gom toàn bộ thu nhập của nhân viên, tính lại tổng thuế phải nộp trong năm, bù trừ với số đã tạm khấu trừ các tháng để ra số tiền Thuế nộp thêm hoặc Thuế hoàn lại.

**Phân quyền (Roles):**
- `C&B / Tax Accountant`: Quản lý mức giảm trừ, tính toán, kết xuất tờ khai quyết toán thuế.
- `Employee`: Nộp chứng từ người phụ thuộc, uỷ quyền quyết toán thuế qua App.

---

## 3. Luồng nghiệp vụ (Business Workflows)

- **Workflow Đăng ký Người phụ thuộc**: NV tạo request trên portal -> Upload Giấy khai sinh/Sổ hộ khẩu -> HR C&B duyệt -> Active `start_month`. Từ tháng này, khi tính lương tự động -4.4tr vào thu nhập tính thuế.
- **Workflow Uỷ quyền quyết toán thuế**: Đầu năm sau (T1-T3), hệ thống gửi yêu cầu xác nhận Uỷ quyền quyết toán thuế (Mẫu 08/UQ-QTT-TNCN) cho toàn bộ NV. NV vào App tick "Đồng ý uỷ quyền" và ký điện tử.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1 API Endpoints (RESTful)
- `POST /api/v1/tax/dependents`: Tạo mới người phụ thuộc.
- `GET /api/v1/tax/calculate-preview`: API nháp tính thuế dựa trên input tổng thu nhập và số NPT.
- `POST /api/v1/tax/annual-finalization`: Chạy tác vụ quyết toán thuế cuối năm.

### 4.2 Ràng buộc logic (Business Rules)
- Thu nhập tính thuế = Thu nhập Gross chịu thuế - Các khoản miễn thuế - BHXH bắt buộc - (11tr giảm trừ bản thân + số NPT * 4.4tr).
- Thuế TNCN = Tính theo luỹ tiến từng phần dựa trên Thu nhập tính thuế. Có thể dùng công thức tính nhanh: `(Thu nhập tính thuế * Thuế suất) - Số tiền trừ lùi`.
- Đối tượng Không cư trú hoặc HĐLĐ < 3 tháng (CTV): Thuế TNCN = Thu nhập chịu thuế * 10% (nếu thu nhập > 2tr/lần). Không được tính giảm trừ.

### 4.3 Điểm tích hợp (Integrations)
- **Tổng cục Thuế (HTKK)**: Cho phép xuất file dữ liệu định dạng XML đúng chuẩn cấu trúc của phần mềm HTKK (Hỗ trợ kê khai) để Kế toán upload thẳng lên cổng eTax mà không phải nhập tay lại.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1 Layouts
- **Tax Calculator Utility**: Một widget/popup có thể gọi ở mọi nơi cho phép HR gõ nhanh Thu nhập Gross, hệ thống vẽ ra breakdown tiền BHXH, tiền Thuế TNCN và Net. Rất hữu ích khi offer ứng viên.
- **Dependents List**: Danh sách người phụ thuộc, có cột "Tháng hiệu lực", "Tình trạng duyệt".

### 5.2 UI Components
- `XML Exporter`: Button "Kết xuất HTKK" yêu cầu định dạng chính xác.
- `E-Signature Modal`: Popup cho nhân viên đọc và ký uỷ quyền quyết toán thuế.

### 5.3 UX Feedback
- Nếu nhân viên không có MST, cảnh báo khi tính lương: "Nhân viên chưa có MST, không được phép uỷ quyền quyết toán thuế".
- Khi upload hồ sơ NPT, hỗ trợ OCR (nếu có) đọc Giấy khai sinh để tự động điền Tên, Ngày sinh.
