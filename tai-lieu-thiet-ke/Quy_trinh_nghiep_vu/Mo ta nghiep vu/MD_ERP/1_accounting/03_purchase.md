# Đặc tả nghiệp vụ: Phân hệ Mua hàng (Purchase & Accounts Payable)

## 1. Trường dữ liệu (Data Fields)

### 1.1. Master Data (Dữ liệu danh mục)
- **Nhà cung cấp (Vendors/Suppliers)**: Mã NCC, Tên NCC, MST, Địa chỉ, TK Ngân hàng, Điều khoản thanh toán mặc định, Hạn mức nợ.
- **Vật tư hàng hóa / Dịch vụ (Items)**: Mã VTHH, Tên, ĐVT, Loại (Vật tư, Hàng hóa, Dịch vụ), TK Kho, TK Chi phí mặc định.
- **Kho (Warehouses)**: Định nghĩa danh sách kho nhận hàng.

### 1.2. Bảng chính: Chứng từ Mua hàng (Purchase Invoice/Receipt)
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| Loại chứng từ | `PurchaseType` | Int / Enum | Có | 1: Mua hàng trong nước, 2: Mua hàng nhập khẩu, 3: Mua dịch vụ |
| Trạng thái kho | `IsReceiveGoods` | Boolean | Có | Đã nhận hàng chưa (Tạo kèm phiếu nhập kho hay không) |
| Số chứng từ | `VoucherNo` | String(50) | Có | Số chứng từ phần mềm |
| Ngày hạch toán | `PostedDate` | DateTime | Có | Ngày ghi sổ kế toán |
| Mã NCC | `VendorId` | Guid/UUID | Có | Chọn từ danh mục Nhà cung cấp |
| Tên người bán | `VendorName` | String(255)| Có | Auto fill theo mã NCC, có thể sửa |
| Diễn giải | `Description` | String(500)| Không | |
| Số hóa đơn | `InvoiceNo` | String(50) | Không | Số hóa đơn GTGT của NCC |
| Ngày hóa đơn | `InvoiceDate` | DateTime | Không | |
| Loại tiền | `CurrencyId` | String(3) | Có | |
| Tỷ giá | `ExchangeRate` | Decimal | Có | |
| Tổng tiền hàng | `TotalGoodsAmount`| Decimal | Có | Tiền hàng trước thuế |
| Tổng tiền thuế | `TotalTaxAmount` | Decimal | Có | Thuế GTGT đầu vào |
| Tổng thanh toán| `TotalAmount` | Decimal | Có | Tiền hàng + Thuế |
| Trạng thái TT | `PaymentStatus` | Enum | Có | Chưa thanh toán / Thanh toán 1 phần / Đã thanh toán |

### 1.3. Bảng chi tiết: Hàng hóa (Purchase Details)
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| ID Phiếu mua | `PurchaseId` | Guid/UUID | Có | |
| Mã VTHH | `ItemId` | Guid/UUID | Có | |
| Kho | `WarehouseId` | Guid/UUID | Tùy | Bắt buộc nếu là hàng hóa/vật tư có nhập kho |
| Số lượng | `Quantity` | Decimal | Có | |
| Đơn giá | `UnitPrice` | Decimal | Có | |
| Thành tiền | `Amount` | Decimal | Có | = SL * Đơn giá |
| Tỷ lệ CK | `DiscountRate` | Decimal | Không | Chiết khấu thương mại % |
| Tiền CK | `DiscountAmount` | Decimal | Không | |
| % Thuế GTGT | `TaxRate` | Decimal | Không | 0%, 5%, 8%, 10% |
| TK Nợ (Chi phí)| `DebitAccount` | String(20) | Có | VD: 152, 156, 642... |
| TK Có (Phải trả)| `CreditAccount`| String(20) | Có | VD: 331 |
| TK Thuế | `TaxAccount` | String(20) | Tùy | VD: 1331 |

---

## 2. Quy trình (Business Processes)

### 2.1. Các bước thực hiện end-to-end
1. **Đơn mua hàng (PO - Purchase Order)** (Tùy chọn):
   - Lập PO gửi nhà cung cấp. PO không phát sinh hạch toán kế toán.
2. **Chứng từ mua hàng (Nhận hàng & Ghi nhận công nợ)**:
   - Khi hàng về / Nhận được hóa đơn: Kế toán lập Chứng từ mua hàng.
   - Kế thừa (Tham chiếu) từ Đơn mua hàng (PO) để đổ dữ liệu sang, không phải gõ lại.
   - Có thể check chọn "Đồng thời lập phiếu nhập kho" (Nếu nhận hàng vào kho).
   - Có thể check chọn "Nhận kèm hóa đơn" (Nếu NCC giao hóa đơn cùng lúc).
3. **Thanh toán (Payment)**:
   - Từ chứng từ mua hàng, có thể sinh ra trực tiếp Ủy nhiệm chi / Phiếu chi tiền mặt để thanh toán cho NCC.
4. **Trả lại hàng mua / Giảm giá hàng bán (Purchase Returns)** (Nếu có phát sinh):
   - Nếu hàng lỗi, lập Chứng từ trả lại hàng mua.
   - Hệ thống tự động ghi giảm công nợ (hoặc thu lại tiền) và xuất kho (nếu đã nhập).

### 2.2. Phân quyền / Roles tham gia
- **Nhân viên mua hàng (Purchaser)**: Lập PO, theo dõi tiến độ.
- **Thủ kho**: Nhận hàng, xác nhận nhập kho thực tế.
- **Kế toán công nợ / Kế toán vật tư**: Lập chứng từ mua hàng, hóa đơn đầu vào, theo dõi công nợ NCC.

---

## 3. Luồng nghiệp vụ (Business Workflows)

### 3.1. Luồng luân chuyển dữ liệu
- Dữ liệu đi từ Đơn mua hàng (Tùy chọn) -> Chứng từ Mua hàng (Ghi nhận công nợ) -> Phiếu Nhập kho (Phân hệ Kho) -> Khai báo Thuế (Phân hệ Thuế) -> Chứng từ thanh toán (Quỹ/Ngân hàng).

### 3.2. Luồng hạch toán tài khoản (Định khoản)
* **Mua hàng hóa nhập kho, chưa thanh toán**:
  - Tiền hàng: Nợ TK 156 (Hàng hóa) / Có TK 331 (Phải trả NCC).
  - Tiền thuế: Nợ TK 1331 (Thuế GTGT đầu vào) / Có TK 331.
* **Mua dịch vụ, chi phí thanh toán bằng Tiền mặt**:
  - Tiền dịch vụ: Nợ TK 642/627/641... / Có TK 111 (Tiền mặt).
  - Tiền thuế: Nợ TK 1331 / Có TK 111.
* **Trả lại hàng mua cho NCC**:
  - Nợ TK 331 (Giảm phải trả) / Có TK 156 (Giảm kho), Có TK 1331 (Giảm thuế được khấu trừ).

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1. API endpoints đề xuất
- `POST /api/v1/purchases/orders`: Tạo PO.
- `GET /api/v1/purchases/invoices`: Danh sách chứng từ mua hàng.
- `POST /api/v1/purchases/invoices`: Tạo chứng từ mua hàng.
- `POST /api/v1/purchases/invoices/{id}/generate-payment`: Sinh Phiếu chi/Báo nợ từ chứng từ mua.
- `GET /api/v1/reports/ap-aging`: Báo cáo tuổi nợ phải trả NCC.

### 4.2. Ràng buộc logic (Business rules) ở Backend
- **Chính sách giá**: Backend cần tự động query Đơn giá mua gần nhất hoặc Giá theo hợp đồng với NCC này để gợi ý.
- **Chi phí mua hàng (Landed Cost)**: Nếu có chi phí vận chuyển/hải quan, backend cần cung cấp API để phân bổ chi phí này vào giá trị nhập kho của VTHH (theo Tiền hoặc theo Số lượng).
- **Thuế GTGT**: Đảm bảo Cấp số hóa đơn đầu vào là duy nhất (Unique) theo (Mã NCC + Số hóa đơn + Ký hiệu hóa đơn) để tránh nhập trùng hóa đơn.
- **Liên kết kho**: Nếu cờ `IsReceiveGoods = true`, transaction db phải đảm bảo insert thành công cả bản ghi bên bảng `InventoryReceipt` (Phiếu nhập kho).

### 4.3. Điểm tích hợp
- Phân hệ Kho (Inventory)
- Phân hệ Thuế (Tích hợp đưa dữ liệu hóa đơn mua vào Bảng kê mua vào thuế GTGT).
- Xử lý hóa đơn đầu vào (Tự động đọc XML hóa đơn điện tử đầu vào (MeInvoice, mBot) để auto-fill form chứng từ).

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1. Layouts
- **Purchase Dashboard**: Thống kê Tổng nợ phải trả, Nợ quá hạn, Hàng hóa nhập nhiều nhất.
- **Form Lập Chứng Từ**:
  - **Tabs Detail**: Hàng tiền | Cước phí (Chi phí mua hàng) | Thuế | Khác.
  - Vùng Top: Master data thông tin chung, Checkbox: [ ] Thanh toán ngay, [ ] Nhận kèm hóa đơn. Nếu tích vào "Thanh toán ngay", form động hiển thị thêm fields nhập TK Tiền (111/112).

### 5.2. UI Components
- **DataGrid Master-Detail Tham chiếu**: Nút "Kế thừa từ Đơn mua hàng" mở ra một side-panel (drawer) list các PO chưa hoàn thành. Chọn checkbox từng dòng VTHH để kéo dữ liệu sang lưới detail chứng từ.
- **Tooltip Cảnh báo**: Khi nhập hóa đơn bị trùng số, icon tam giác vàng nháy cảnh báo ngay cạnh field `Số hóa đơn`.

### 5.3. UX feedback
- Autocomplete Mã hàng hóa: Gõ bất kỳ ký tự nào trong tên hoặc mã, popover list sẽ hiển thị. Khi chọn xong, tự động fill ĐVT, TK Kho mặc định, Thuế suất và Đơn giá mua gần nhất.
- Dòng tính tổng: Footer của DataGrid tự động tính realtime Tổng tiền hàng, Tổng chiết khấu, Tổng thuế, Tổng cộng. Cố định dưới đáy lưới để dễ nhìn khi scroll.
