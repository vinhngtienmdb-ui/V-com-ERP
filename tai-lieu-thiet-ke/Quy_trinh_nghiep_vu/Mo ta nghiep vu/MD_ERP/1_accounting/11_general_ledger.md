# Đặc tả nghiệp vụ: Phân hệ Tổng hợp (General Ledger - GL)

## 1. Trường dữ liệu (Data Fields)

### 1.1. Master Data (Dữ liệu danh mục)
- **Hệ thống Tài khoản kế toán (Chart of Accounts)**: Gồm Cấp 1, Cấp 2, Cấp 3 (VD: 111, 1111, 1112). Đặc tính tài khoản: Dư Nợ, Dư Có, Lưỡng tính. Đối tượng chi tiết (Theo dõi theo Khách hàng, NCC, Hợp đồng, Kho).
- **Kỳ kế toán**: Năm tài chính, Tháng/Quý. Trạng thái Khóa sổ (Locked).

### 1.2. Bảng chính: Chứng từ nghiệp vụ khác (General Journal Voucher)
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| Số chứng từ | `VoucherNo` | String(50) | Có | (VD: PKT001, PTTH001) |
| Ngày hạch toán | `PostedDate` | DateTime | Có | Ngày ghi vào Sổ cái |
| Loại chứng từ | `VoucherType` | Enum | Có | Chứng từ thường, C/từ Kết chuyển lãi lỗ, C/từ Chênh lệch tỷ giá |
| Diễn giải | `Description` | String(500)| Có | Nội dung nghiệp vụ chung |
| Tổng tiền | `TotalAmount` | Decimal | Có | Tổng doanh số Nợ/Có |

### 1.3. Bảng cốt lõi: SỔ CÁI (General Ledger Table)
*Đây là bảng quan trọng nhất toàn hệ thống, chứa mọi dòng hạch toán từ mọi phân hệ đổ về.*
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| ID Giao dịch | `GlId` | Guid/UUID | Có | Khóa chính |
| Ref ID Chứng từ| `SourceVoucherId`| Guid/UUID | Có | Liên kết đến ID chứng từ gốc (Quỹ, Ngân hàng, Kho...) |
| Module Gốc | `SourceModule` | String(50) | Có | "CASH", "BANK", "SALES", "GL" |
| Ngày hạch toán | `PostedDate` | DateTime | Có | |
| TK Kế toán | `AccountId` | String(20) | Có | |
| TK Đối ứng | `OffsetAccount` | String(20) | Không | |
| Ghi Nợ / Có | `IsDebit` | Boolean | Có | True = Nợ, False = Có |
| Số tiền | `Amount` | Decimal | Có | Nguyên tệ |
| Số tiền quy đổi| `AmountConverted`| Decimal | Có | Tiền nội tệ (VND) |
| Đối tượng | `ObjectId` | Guid/UUID | Tùy | Nếu TK đó có setting "Theo dõi chi tiết theo đối tượng" |

---

## 2. Quy trình (Business Processes)

### 2.1. Các bước thực hiện end-to-end (Công việc Cuối kỳ của Kế toán Tổng hợp)
1. **Kiểm tra sự hợp lệ**: Rà soát các chứng từ chưa ghi sổ ở tất cả phân hệ. Kiểm tra lệch Nợ/Có.
2. **Khấu hao TSCĐ, Phân bổ CCDC, Tính giá xuất kho, Tính giá thành**: Đảm bảo các job này đã chạy xong trước khi chốt sổ.
3. **Đánh giá chênh lệch tỷ giá cuối kỳ**:
   - Hệ thống tự động quét các TK gốc ngoại tệ (1122, 131, 331 ngoại tệ) còn số dư.
   - Nhập tỷ giá cuối kỳ. Hệ thống tự sinh "Chứng từ đánh giá CLTG" (TK 413).
4. **Kết chuyển Lãi Lỗ**:
   - Hệ thống tự động kết chuyển các TK loại 5 (Doanh thu), 7 (Thu nhập) sang 911.
   - Kết chuyển loại 6 (Chi phí), 8 (Chi phí khác) sang 911.
   - Tính toán lãi/lỗ đưa từ 911 sang 421 (Lợi nhuận chưa phân phối).
5. **Khóa sổ kỳ kế toán (Period Close)**:
   - Kế toán trưởng đóng băng dữ liệu tháng/năm. Không ai được phép thêm/sửa/xóa chứng từ có `PostedDate` <= Ngày khóa sổ.
6. **Lập Báo cáo Tài chính (BCTC)**:
   - Hệ thống render: Bảng cân đối kế toán, Kết quả hoạt động kinh doanh, Lưu chuyển tiền tệ, Thuyết minh BCTC.

### 2.2. Phân quyền / Roles tham gia
- **Kế toán tổng hợp**: Làm bút toán điều chỉnh, kết chuyển cuối kỳ. Lập BCTC.
- **Kế toán trưởng / Giám đốc tài chính (CFO)**: Khóa sổ, Duyệt BCTC, Xem báo cáo quản trị.

---

## 3. Luồng nghiệp vụ (Business Workflows)

- Mọi luồng dữ liệu đều hội tụ về đây. Phân hệ Tổng hợp đóng vai trò là "Data Warehouse" của kế toán.
- Bất cứ hành động "Ghi sổ" nào ở các phân hệ khác (Quỹ, Kho, Bán hàng) thực chất là gọi lệnh `INSERT INTO GeneralLedger` (Ghi vào Sổ cái).
- Luồng khóa sổ: Block mọi transaction thay đổi dữ liệu phát sinh trước mốc thời gian khóa.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1. API endpoints đề xuất
- `POST /api/v1/gl/journals`: Lập chứng từ NV khác.
- `GET /api/v1/gl/ledger-entries`: Query sổ cái (Cần tối ưu cache/index vì bảng này vô cùng lớn).
- `POST /api/v1/gl/auto-closing`: Chạy Job Kết chuyển Lãi Lỗ.
- `POST /api/v1/gl/period-lock`: Khóa sổ.
- `GET /api/v1/reports/balance-sheet`: Lấy data Bảng cân đối kế toán.

### 4.2. Ràng buộc logic (Business rules) ở Backend
- **Double-Entry Validation (Ghi sổ kép)**: Tại mọi chứng từ có sinh hạch toán, `SUM(Debit) = SUM(Credit)` là Rule tối thượng ở mức Database (hoặc ORM Middleware). Nếu sai -> Block hoàn toàn.
- **Bắt buộc chi tiết theo đối tượng**: Nếu TK 131 trong Master Data được set `RequiresObject = true`, thì khi có bất kỳ dòng hạch toán nào gắn TK 131 mà field `ObjectId` bị Null, Backend phải quăng lỗi: "Tài khoản 131 yêu cầu phải chọn đối tượng công nợ (Khách hàng)".
- **Tính toán BCTC động**: Báo cáo tài chính không lấy từ bảng Cứng, mà dùng Thuật toán Tree/Rules Engine để SUM dư nợ/dư có của các Tài khoản trong Sổ cái theo công thức định trước. (VD: Mã số 111 "Tiền" = Dư Nợ 111 + Dư Nợ 112 + Dư Nợ 113).

### 4.3. Điểm tích hợp
- Export dữ liệu Sổ cái ra Excel định dạng chuẩn để phục vụ kiểm toán độc lập (Big4 Audit).
- API cấp số liệu cho hệ thống BI (PowerBI, Tableau) để làm Dashboard Quản trị tài chính.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1. Layouts
- **GL Dashboard / CFO Dashboard**: Thể hiện Sức khỏe tài chính. Chỉ số Quick Ratio, Dòng tiền thuần, Doanh thu / Chi phí trong năm (Line chart), Lợi nhuận gộp.
- **Màn hình Khóa sổ**: Hiển thị Thanh Timeline năm tài chính. Các tháng đã khóa có biểu tượng "Ổ khóa đóng đỏ", tháng đang mở là "Ổ khóa mở xanh". Có nút "Khóa sổ đến ngày...".

### 5.2. UI Components
- **Financial Report Viewer**: Giao diện view Báo cáo tài chính giống Excel Spreadsheet. Cho phép in ngang (Landscape) và xuất Excel.
- **Drill-Down (Truy xuất ngược)**: TÍNH NĂNG QUAN TRỌNG NHẤT của Kế toán. Từ bảng BCTC (Bảng CĐKT) -> Click vào con số 1 Tỷ của Quỹ tiền mặt -> Popup mở ra Sổ chi tiết TK 111 -> Click vào dòng 50tr của Phiếu thu PT001 -> Mở ra giao diện Xem chi tiết Phiếu thu PT001 ở phân hệ Quỹ. (Navigations xuyên module).

### 5.3. UX feedback
- Màn hình Lập chứng từ nghiệp vụ khác, khi người dùng nhập lệch Nợ/Có. Có một dòng text đỏ to nhấp nháy ở Footer: **"Độ lệch: 1,500,000 VND"**. Nút [Lưu] bị mờ (Disabled) cho đến khi Độ lệch = 0.
- Cảnh báo Khóa sổ: "Bạn sắp khóa sổ đến ngày 31/12/2024. Mọi sự thay đổi dữ liệu trước ngày này sẽ bị chặn. Bạn có chắc chắn?". Đòi hỏi nhập mật khẩu xác nhận lại.
