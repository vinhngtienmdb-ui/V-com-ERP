# Đặc tả nghiệp vụ: Phân hệ Quỹ (Cash Management)

## 1. Trường dữ liệu (Data Fields)

### 1.1. Master Data (Dữ liệu danh mục)
- **Tài khoản ngân hàng/Tiền mặt**: Danh sách các TK kế toán liên quan đến tiền mặt (1111, 1112).
- **Đối tượng (Khách hàng, Nhà cung cấp, Nhân viên)**: Thông tin người nộp/người nhận tiền.
- **Lý do thu/chi**: Danh mục định nghĩa sẵn các loại thu chi (Thu tiền bán hàng, Thu nợ, Chi tạm ứng, Chi trả nợ...).

### 1.2. Bảng chính: Phiếu Thu (Cash Receipt) / Phiếu Chi (Cash Payment)
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| Loại chứng từ | `VoucherType` | Int / Enum | Có | Phân biệt Phiếu thu, Phiếu chi |
| Số chứng từ | `VoucherNo` | String(50) | Có | Số phiếu tự tăng (VD: PT00001, PC00001) |
| Ngày chứng từ | `VoucherDate` | DateTime | Có | Ngày lập phiếu |
| Ngày hạch toán | `PostedDate` | DateTime | Có | Ngày ghi sổ kế toán |
| Mã đối tượng | `ObjectId` | Guid/UUID | Không | ID Khách hàng/Nhà cung cấp/Nhân viên |
| Người nộp/nhận | `ContactName` | String(255)| Có | Tên người nộp hoặc người nhận tiền |
| Lý do thu/chi | `ReasonId` | Guid/UUID | Có | Chọn từ danh mục Lý do thu/chi |
| Diễn giải | `Description` | String(500)| Không | Diễn giải chi tiết chung |
| Loại tiền | `CurrencyId` | String(3) | Có | VND, USD, EUR... |
| Tỷ giá | `ExchangeRate` | Decimal | Có | Tỷ giá so với đồng tiền hạch toán |
| Tổng tiền | `TotalAmount` | Decimal | Có | Tổng số tiền nguyên tệ |
| Tổng tiền QĐ | `TotalAmountConverted` | Decimal | Có | Tổng số tiền quy đổi ra đồng tiền hạch toán |

### 1.3. Bảng chi tiết: Chi tiết phiếu thu/chi (Cash Voucher Detail)
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| ID Phiếu | `VoucherId` | Guid/UUID | Có | Khóa ngoại liên kết với Bảng chính |
| Diễn giải chi tiết | `LineDescription` | String(255)| Có | Diễn giải cho từng dòng hạch toán |
| TK Nợ | `DebitAccount` | String(20) | Có | Tài khoản Nợ (VD: 1111) |
| TK Có | `CreditAccount`| String(20) | Có | Tài khoản Có (VD: 131, 511...) |
| Số tiền | `Amount` | Decimal | Có | Số tiền nguyên tệ |
| Số tiền quy đổi | `AmountConverted`| Decimal | Có | Số tiền quy đổi |
| Đối tượng THCP | `CostCenterId` | Guid/UUID | Không | Mã trung tâm chi phí / phòng ban |

---

## 2. Quy trình (Business Processes)

### 2.1. Các bước thực hiện end-to-end
**Quy trình Thu tiền mặt:**
1. **Lập phiếu**: Kế toán quỹ lập Phiếu thu tiền mặt từ khách hàng hoặc nội bộ (rút tiền gửi ngân hàng về quỹ).
2. **Ký duyệt (Tùy chọn)**: Nếu có luồng duyệt, Kế toán trưởng / Giám đốc duyệt phiếu.
3. **Thủ quỹ xác nhận**: Thủ quỹ kiểm tra số tiền thực tế nhận, xác nhận thu tiền trên phần mềm.
4. **Ghi sổ (Posting)**: Phiếu được ghi vào sổ cái (General Ledger) và sổ quỹ tiền mặt.
5. **In chứng từ**: In Phiếu thu (Mẫu số 01-TT) đưa cho người nộp tiền ký.

**Quy trình Chi tiền mặt:**
1. **Lập phiếu**: Kế toán lập Phiếu chi từ yêu cầu tạm ứng, yêu cầu thanh toán.
2. **Ký duyệt (Bắt buộc)**: Kế toán trưởng và Giám đốc phê duyệt chi.
3. **Thủ quỹ xuất quỹ**: Thủ quỹ xuất tiền mặt, xác nhận trên phần mềm.
4. **Ghi sổ**: Hệ thống ghi nhận giảm trừ quỹ và sổ cái.
5. **In chứng từ**: In Phiếu chi (Mẫu số 02-TT).

**Quy trình Kiểm kê quỹ:**
1. Lập biên bản kiểm kê, phần mềm tự động lấy số dư tồn quỹ theo sổ kế toán và sổ quỹ.
2. Thủ quỹ nhập số thực tế đếm được.
3. Phần mềm tính ra số chênh lệch. Xử lý chênh lệch (lập phiếu thu nếu thừa, phiếu chi nếu thiếu).

### 2.2. Phân quyền / Roles tham gia
- **Kế toán viên / Kế toán thanh toán**: Lập phiếu thu, phiếu chi.
- **Kế toán trưởng / Quản lý**: Phê duyệt chứng từ thu chi.
- **Thủ quỹ**: Xem phiếu thu/chi, xác nhận thực thu/thực chi (tạo Sổ quỹ độc lập với Sổ kế toán).

---

## 3. Luồng nghiệp vụ (Business Workflows)

### 3.1. Luồng luân chuyển dữ liệu
- Dữ liệu từ Quỹ có thể được sinh ra tự động từ các phân hệ khác: Mua hàng (Thanh toán ngay bằng tiền mặt), Bán hàng (Thu tiền ngay), Quản lý Hóa đơn, Tiền lương.
- Sau khi "Ghi sổ", dữ liệu chảy vào Sổ cái tổng hợp (General Ledger) và Sổ quỹ tiền mặt.

### 3.2. Luồng hạch toán tài khoản (Định khoản Nợ/Có chi tiết)
* **Thu tiền khách hàng trả nợ**:
  - Nợ TK 111 (1111, 1112)
  - Có TK 131 (Phải thu khách hàng)
* **Rút tiền gửi ngân hàng về quỹ tiền mặt**:
  - Nợ TK 111
  - Có TK 112 (1121, 1122)
* **Chi thanh toán nhà cung cấp**:
  - Nợ TK 331 (Phải trả người bán)
  - Có TK 111
* **Chi tạm ứng cho nhân viên**:
  - Nợ TK 141 (Tạm ứng)
  - Có TK 111
* **Kiểm kê phát hiện thiếu tiền chờ xử lý**:
  - Nợ TK 1381 (Tài sản thiếu chờ xử lý)
  - Có TK 111

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1. API endpoints đề xuất
- `GET /api/v1/cash-vouchers`: Lấy danh sách phiếu thu/chi (hỗ trợ filter, pagination).
- `POST /api/v1/cash-vouchers`: Tạo mới phiếu thu/chi.
- `GET /api/v1/cash-vouchers/{id}`: Xem chi tiết 1 phiếu.
- `PUT /api/v1/cash-vouchers/{id}`: Cập nhật phiếu thu/chi (khi chưa ghi sổ).
- `POST /api/v1/cash-vouchers/{id}/post`: Thực hiện ghi sổ (Ghi vào Sổ cái).
- `POST /api/v1/cash-vouchers/{id}/unpost`: Bỏ ghi sổ.
- `GET /api/v1/cash-reports/cash-book`: Lấy báo cáo Sổ quỹ tiền mặt.

### 4.2. Ràng buộc logic (Business rules) ở Backend
- **Kiểm tra khóa sổ**: Nếu `PostedDate` nằm trong kỳ kế toán đã khóa sổ -> Từ chối Thêm/Sửa/Xóa.
- **Tài khoản hợp lệ**: Nếu là Phiếu Thu, ít nhất 1 TK ghi Nợ phải có gốc là `111`. Nếu là Phiếu Chi, ít nhất 1 TK ghi Có phải có gốc là `111`.
- **Cân bằng định khoản**: Tổng Nợ phải BẰNG Tổng Có (theo từng loại tiền).
- **Cảnh báo âm quỹ**: Khi ghi sổ Phiếu Chi, hệ thống check tồn quỹ tiền mặt tại ngày hạch toán. Nếu tính ra số dư < 0 -> Bật warning hoặc block (tùy config của hệ thống).

### 4.3. Điểm tích hợp
- Phân hệ Bán hàng: Trạng thái hóa đơn chuyển sang "Đã thanh toán" khi lập Phiếu thu.
- Hệ thống Máy in/Mẫu in: Gọi service render PDF (FastReport / Crystal Report) cho Mẫu 01-TT, 02-TT.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1. Layouts
- **List View (Dashboard phân hệ Quỹ)**:
  - Chia Tabs: Thu, Chi, Kiểm kê quỹ.
  - Phía trên là Widget thống kê: Tổng thu trong kỳ, Tổng chi trong kỳ, Tồn quỹ hiện tại.
  - Cột DataGrid: Ngày hạch toán, Số chứng từ, Số tiền, Mã đối tượng, Tên đối tượng, Diễn giải, Trạng thái (Chưa ghi sổ/Đã ghi sổ).
- **Form View (Master-Detail)**:
  - Phần Header: Chia làm 2 cột. Trái: Đối tượng, Người nộp, Lý do, Kèm theo ... chứng từ gốc. Phải: Số chứng từ, Ngày hạch toán, Ngày chứng từ.
  - Phần Detail (Lưới hạch toán): Cột Diễn giải, TK Nợ, TK Có, Số tiền, Đối tượng THCP... Lưới hỗ trợ inline-editing, tab để chuyển sang ô kế tiếp.

### 5.2. UI Components
- **Account Lookup / Dropdown**: Combobox kết hợp search (Autocomplete) để chọn Tài khoản Nợ/Có. Phải hiển thị cả Mã TK + Tên TK.
- **Date Picker**: Chú ý sync giữa "Ngày chứng từ" và "Ngày hạch toán" (thường default bằng nhau).
- **Toggle Button**: Nút Ghi sổ / Bỏ ghi sổ phải rõ ràng bằng màu sắc (Ghi sổ: Xanh lá, Bỏ ghi sổ: Đỏ/Cam).

### 5.3. UX feedback
- Khi chọn "Lý do thu" -> Tự động fill cặp "TK Nợ / TK Có" mặc định và focus vào ô "Số tiền".
- Khi lưu phiếu chưa cân bằng Nợ/Có -> Hiển thị Toast Error rõ ràng: "Tổng Nợ (1,000,000) đang lệch so với Tổng Có (0). Vui lòng kiểm tra lại!".
- Phím tắt (Hotkeys): `Ctrl + S` (Lưu), `F8` (Xóa dòng chi tiết), `F3` (Tìm kiếm).
