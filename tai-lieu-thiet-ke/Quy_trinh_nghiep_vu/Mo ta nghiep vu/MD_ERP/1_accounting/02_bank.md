# Đặc tả nghiệp vụ: Phân hệ Ngân hàng (Bank Management)

## 1. Trường dữ liệu (Data Fields)

### 1.1. Master Data (Dữ liệu danh mục)
- **Tài khoản ngân hàng của công ty**: Số TK, Tên Ngân hàng, Chi nhánh, Loại tiền (VND, USD...).
- **Tài khoản ngân hàng của Đối tác**: Thông tin thụ hưởng của Khách hàng, Nhà cung cấp, Nhân viên.
- **Loại giao dịch ngân hàng**: Chuyển khoản, Rút tiền mặt, Phí ngân hàng, Lãi tiền gửi, Thanh toán thẻ...

### 1.2. Bảng chính: Báo Có (Thu tiền gửi) / Báo Nợ (Chi tiền gửi)
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| Loại chứng từ | `BankVoucherType`| Int / Enum | Có | 1: Báo Có, 2: Báo Nợ, 3: Ủy nhiệm chi |
| Số chứng từ | `VoucherNo` | String(50) | Có | Số phiếu (BC0001, BN0001, UNC0001) |
| Ngày chứng từ | `VoucherDate` | DateTime | Có | Ngày lập |
| Ngày hạch toán | `PostedDate` | DateTime | Có | Ngày giao dịch thực tế với Bank |
| Tài khoản NH | `BankAccountID` | Guid/UUID | Có | TK ngân hàng của công ty đang giao dịch |
| Mã đối tượng | `ObjectId` | Guid/UUID | Không | ID Khách/Nhà cung cấp/Nhân viên |
| TK Thụ hưởng | `TargetBankAccount`| String(50) | Tùy | STK của bên đối tác (Dùng khi chi) |
| Lý do | `ReasonId` | Guid/UUID | Có | Thu nợ, Thanh toán NCC, Trả lương... |
| Diễn giải | `Description` | String(500)| Không | Diễn giải ngân hàng |
| Loại tiền | `CurrencyId` | String(3) | Có | VND, USD... |
| Tỷ giá | `ExchangeRate` | Decimal | Có | Tỷ giá (nếu ngoại tệ) |
| Tổng tiền | `TotalAmount` | Decimal | Có | Số tiền nguyên tệ |

### 1.3. Bảng chi tiết: Chi tiết Báo Có/Báo Nợ (Bank Voucher Detail)
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| ID Phiếu | `VoucherId` | Guid/UUID | Có | Liên kết bảng chính |
| Diễn giải | `LineDescription` | String(255)| Có | Diễn giải chi tiết từng dòng |
| TK Nợ | `DebitAccount` | String(20) | Có | (VD: 1121 đối với Báo Có) |
| TK Có | `CreditAccount`| String(20) | Có | (VD: 1121 đối với Báo Nợ) |
| Số tiền | `Amount` | Decimal | Có | Nguyên tệ |
| Số tiền QĐ | `AmountConverted`| Decimal | Có | Quy đổi VND |
| Phí ngân hàng | `BankFee` | Decimal | Không | Khoản phí giao dịch khấu trừ (nếu có) |
| ID Hóa đơn | `InvoiceId` | Guid/UUID | Không | Dùng để đối trừ công nợ chi tiết |

---

## 2. Quy trình (Business Processes)

### 2.1. Các bước thực hiện end-to-end
**Quy trình Thu tiền gửi (Báo Có):**
1. Nhận sao kê/tin nhắn thông báo tiền vào tài khoản.
2. Kế toán ngân hàng lập chứng từ Thu tiền gửi (Báo Có) trên phần mềm (có thể import excel từ sao kê bank hoặc Bank API auto-fetch).
3. Hạch toán, phân bổ thu tiền cho hóa đơn nào (nếu là thu nợ KH).
4. Ghi sổ.

**Quy trình Chi tiền gửi (Ủy nhiệm chi / Báo Nợ):**
1. Nhận yêu cầu thanh toán đã được duyệt.
2. Lập Ủy nhiệm chi (UNC) trên phần mềm.
3. Chuyển UNC sang hệ thống ngân hàng điện tử (Internet Banking) hoặc in giấy đóng dấu ra quầy.
4. Khi ngân hàng báo giao dịch thành công (Báo Nợ), cập nhật trạng thái UNC thành Đã thanh toán và Ghi sổ kế toán.

**Đối chiếu ngân hàng (Bank Reconciliation):**
1. Cuối kỳ, fetch sổ phụ từ ngân hàng (Bank Statement).
2. Phần mềm tự động đối chiếu các giao dịch trên sổ phụ với các chứng từ Báo Nợ/Báo Có đã ghi sổ dựa trên: Ngày, Số tiền, Diễn giải.
3. Kế toán xác nhận khớp hoặc tạo thêm chứng từ cho những giao dịch có trên sao kê nhưng chưa có trên sổ (như lãi, phí NH).

### 2.2. Phân quyền / Roles tham gia
- **Kế toán ngân hàng**: Lập, sửa, xóa chứng từ, đối chiếu NH.
- **Kế toán trưởng**: Duyệt chi, kiểm tra sổ tiền gửi.
- **Giám đốc**: Phê duyệt UNC trực tuyến (Tích hợp e-Banking).

---

## 3. Luồng nghiệp vụ (Business Workflows)

### 3.1. Luồng luân chuyển dữ liệu
- Báo nợ, Báo có ghi vào Sổ Tiền Gửi Ngân Hàng và Sổ Cái.
- Tương tác mật thiết với Phân hệ Công nợ (Khách hàng / Nhà cung cấp) để đối trừ (Clearing).

### 3.2. Luồng hạch toán tài khoản (Định khoản)
* **Khách hàng chuyển khoản thanh toán nợ**:
  - Nợ TK 112 (Tiền gửi ngân hàng)
  - Có TK 131 (Phải thu khách hàng)
* **Thanh toán bằng chuyển khoản cho NCC**:
  - Nợ TK 331 (Phải trả người bán)
  - Có TK 112
* **Rút tiền gửi NH nhập quỹ tiền mặt**:
  - Nợ TK 111 (Tiền mặt)
  - Có TK 112
* **Trả phí dịch vụ ngân hàng**:
  - Nợ TK 642 (Chi phí quản lý doanh nghiệp)
  - Có TK 112

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1. API endpoints đề xuất
- `GET /api/v1/bank-vouchers`: DS chứng từ ngân hàng.
- `POST /api/v1/bank-vouchers/unc`: Tạo mới Ủy nhiệm chi.
- `POST /api/v1/bank-vouchers/receipt`: Tạo mới Thu tiền gửi.
- `POST /api/v1/banking-integration/sync-statements`: Fetch sao kê từ Bank API.
- `POST /api/v1/bank-reconciliation/auto-match`: Chạy thuật toán đối chiếu tự động.

### 4.2. Ràng buộc logic (Business rules) ở Backend
- **Validate TK Bank**: Tài khoản công ty chọn ở header phải ánh xạ đúng tới tài khoản kế toán chi tiết (VD: Bank Vietcombank -> TK kế toán 11211).
- **Kiểm tra trạng thái Bank Sync**: Nếu chứng từ đã được sync từ Bank API và đánh dấu "Đã khớp sổ phụ", không cho phép User tự ý sửa Số tiền hoặc xóa chứng từ (phải thực hiện rollback workflow).
- **Hỗ trợ giao dịch ngoại tệ**: Bắt buộc tính chênh lệch tỷ giá tự động nếu thanh toán công nợ ngoại tệ nhưng tiền gửi là VND (hoặc ngược lại).

### 4.3. Điểm tích hợp
- **Open Banking API**: Tích hợp trực tiếp với các Ngân hàng lớn (Vietcombank, Techcombank, ACB, BIDV...) qua chuẩn API mở hoặc cổng trung gian.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1. Layouts
- **Bank Dashboard**: Biểu đồ số dư tổng hợp tại các ngân hàng (Pie chart/Bar chart). Danh sách các TK ngân hàng và số dư hiện tại.
- **Giao diện Đối chiếu ngân hàng (Reconciliation View)**:
  - Chia màn hình làm 2 panel (Split View): Trái là "Sao kê ngân hàng" (Dữ liệu gốc), Phải là "Sổ kế toán" (Dữ liệu phần mềm).
  - Giao diện có nút "Đối chiếu tự động", các dòng khớp sẽ highlight xanh lá.

### 5.2. UI Components
- **Dropzone Import**: Hỗ trợ kéo thả file CSV/Excel của ngân hàng để import sao kê.
- **Steppers**: Tiến trình tạo UNC qua Internet Banking (Khởi tạo -> Chờ ký -> Đang xử lý Bank -> Hoàn thành).
- **Inline Modal**: Từ sao kê bank, click nút `+` để popup nhanh form tạo Báo Có/Báo Nợ mà không chuyển trang.

### 5.3. UX feedback
- Khi tạo UNC mà số dư tiền gửi trên phần mềm nhỏ hơn số tiền định chi, cảnh báo: "Số dư tài khoản ngân hàng trên sổ sách có thể không đủ để thực hiện giao dịch".
- Trạng thái Connect Bank rõ ràng: Icon chấm xanh (Connected) hoặc chấm đỏ (Disconnected) cạnh tên mỗi tài khoản ngân hàng.
