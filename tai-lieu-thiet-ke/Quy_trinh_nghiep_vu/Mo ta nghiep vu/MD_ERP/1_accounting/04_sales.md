# Đặc tả nghiệp vụ: Phân hệ Bán hàng (Sales & Accounts Receivable)

## 1. Trường dữ liệu (Data Fields)

### 1.1. Master Data (Dữ liệu danh mục)
- **Khách hàng (Customers)**: Mã KH, Tên KH, MST, Địa chỉ, Người liên hệ, Hạn mức nợ, Nhân viên sale phụ trách.
- **Bảng giá (Price Lists)**: Bảng giá chung, Bảng giá đại lý, Bảng giá bán lẻ...
- **Vật tư hàng hóa (Items)**: Hàng hóa/Dịch vụ để bán.
- **Kênh bán hàng**: Bán buôn, Bán lẻ, Online...

### 1.2. Bảng chính: Chứng từ Bán hàng (Sales Invoice)
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| Loại chứng từ | `SalesType` | Int | Có | 1: Bán hàng trong nước, 2: Xuất khẩu, 3: Bán dịch vụ |
| Xuất kho | `IsDelivery` | Boolean | Có | Gắn kèm phiếu xuất kho luôn không? |
| Lập hóa đơn | `IsIssueInvoice`| Boolean | Có | Có xuất hóa đơn điện tử không? |
| Số chứng từ | `VoucherNo` | String(50) | Có | |
| Ngày hạch toán | `PostedDate` | DateTime | Có | Ngày ghi nhận doanh thu |
| Mã Khách hàng | `CustomerId` | Guid/UUID | Có | |
| Tên người mua | `CustomerName` | String(255)| Có | Tên khách lẻ hoặc tên lấy từ KH |
| NVKD phụ trách | `SalespersonId` | Guid/UUID | Không | Dùng để tính hoa hồng |
| Tổng tiền hàng | `TotalGoodsAmount`| Decimal | Có | Tiền hàng trước chiết khấu, thuế |
| Tổng tiền CK | `TotalDiscount` | Decimal | Có | |
| Tổng tiền thuế | `TotalTaxAmount` | Decimal | Có | Thuế GTGT đầu ra |
| Tổng thanh toán| `TotalAmount` | Decimal | Có | |
| Trạng thái TT | `PaymentStatus` | Enum | Có | Chưa thanh toán / Thanh toán 1 phần / Đã thu tiền |

### 1.3. Bảng chi tiết: Chi tiết hàng bán (Sales Details)
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| ID Chứng từ | `SalesId` | Guid/UUID | Có | |
| Mã VTHH | `ItemId` | Guid/UUID | Có | |
| Kho | `WarehouseId` | Guid/UUID | Tùy | Nếu là bán hàng hóa |
| Số lượng | `Quantity` | Decimal | Có | |
| Đơn giá | `UnitPrice` | Decimal | Có | Đơn giá bán |
| Thành tiền | `Amount` | Decimal | Có | |
| Tỷ lệ CK | `DiscountRate` | Decimal | Không | |
| Tiền CK | `DiscountAmount` | Decimal | Không | |
| % Thuế GTGT | `TaxRate` | Decimal | Không | |
| TK Doanh thu | `RevenueAccount` | String(20) | Có | VD: 511 |
| TK Công nợ | `ReceivableAccount`| String(20) | Có | VD: 131, 111 (nếu thu ngay) |
| TK Giá vốn | `COGSAccount` | String(20) | Tùy | VD: 632 (Nếu có xuất kho) |
| TK Kho | `InventoryAccount` | String(20) | Tùy | VD: 156 (Nếu có xuất kho) |

---

## 2. Quy trình (Business Processes)

### 2.1. Các bước thực hiện end-to-end
1. **Báo giá (Quotation)** (Tùy chọn): Sales tạo báo giá gửi khách hàng (không hạch toán).
2. **Đơn đặt hàng (Sales Order - SO)** (Tùy chọn): Khách hàng chốt mua, lên SO. Quản lý trạng thái giao hàng, xuất hóa đơn của SO.
3. **Chứng từ bán hàng (Ghi nhận Doanh thu & Công nợ)**:
   - Kế thừa từ SO hoặc Báo giá.
   - Có thể chọn "Kiêm phiếu xuất kho" (Ghi nhận đồng thời Doanh thu và Giá vốn).
   - Có thể chọn "Lập kèm hóa đơn" (Chuẩn bị data đẩy sang phân hệ quản lý Hóa đơn).
4. **Thu tiền (Receipts)**: Sinh tự động phiếu thu tiền mặt / báo có từ chứng từ bán hàng nếu khách thanh toán ngay.
5. **Trả lại hàng bán / Giảm giá hàng bán**:
   - Khách trả hàng -> Lập chứng từ hàng bán bị trả lại.
   - Ghi giảm doanh thu, giảm công nợ, nhập lại kho (nếu có).

### 2.2. Phân quyền / Roles tham gia
- **Nhân viên kinh doanh (Sales)**: Lập Báo giá, SO. Xem báo cáo doanh số cá nhân.
- **Kế toán bán hàng**: Lập chứng từ bán hàng, phát hành hóa đơn, theo dõi công nợ phải thu.
- **Thủ kho**: Chốt xuất kho (nếu quy trình tách bạch kho và kế toán).

---

## 3. Luồng nghiệp vụ (Business Workflows)

### 3.1. Luồng luân chuyển dữ liệu
- Báo giá -> SO -> Chứng từ Bán hàng -> Hóa đơn Điện tử.
- Chứng từ Bán hàng tự động đẩy số liệu Doanh thu, Thuế đầu ra lên Bảng kê Thuế và Sổ cái.

### 3.2. Luồng hạch toán tài khoản (Định khoản)
* **Bán hàng hóa (Ghi nhận Doanh thu)**:
  - Nợ TK 131/111/112 (Tổng tiền thanh toán)
  - Có TK 511 (Doanh thu bán hàng hóa)
  - Có TK 33311 (Thuế GTGT đầu ra)
* **Bán hàng hóa (Ghi nhận Giá vốn) - Chạy đồng thời**:
  - Nợ TK 632 (Giá vốn hàng bán)
  - Có TK 156 / 155 (Hàng hóa, thành phẩm)
* **Khách hàng trả lại hàng**:
  - Nợ TK 5212/511 (Hàng bán bị trả lại/Doanh thu)
  - Nợ TK 33311 (Thuế GTGT đầu ra)
  - Có TK 131/111/112
  - (Nhập kho) Nợ TK 156 / Có TK 632.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1. API endpoints đề xuất
- `POST /api/v1/sales/orders`: Tạo SO.
- `GET /api/v1/sales/invoices`: Danh sách chứng từ bán.
- `POST /api/v1/sales/invoices`: Lập chứng từ bán hàng.
- `GET /api/v1/reports/ar-aging`: Báo cáo tuổi nợ phải thu KH.

### 4.2. Ràng buộc logic (Business rules) ở Backend
- **Chính sách giá & Chiết khấu**: Backend phải tự động áp dụng Bảng giá (Price List) được cấu hình cho Khách hàng tương ứng, tự động nội suy các rule chiết khấu (Khuyến mãi số lượng lớn).
- **Kiểm tra tồn kho**: Nếu chứng từ kiêm Phiếu xuất kho, hệ thống phải check số lượng tồn kho ảo (Available Stock = Tồn thực tế - Đã giữ chỗ). Nếu không đủ -> Block.
- **Kiểm tra hạn mức nợ (Credit Limit)**: Nếu Nợ hiện tại + Đơn hàng này > Hạn mức nợ KH -> Bật Cảnh báo hoặc Block tùy config.
- **Giá vốn xuất kho**: Tại thời điểm lập chứng từ, đơn giá vốn có thể bằng 0 (chờ cuối kỳ tính lại giá bình quân). Do đó trường `COGSAmount` không bắt buộc phải có giá trị chính xác ngay lập tức.

### 4.3. Điểm tích hợp
- Kênh bán hàng (Shopee, Shopify, Haravan...): Webhooks nhận Order để tạo chứng từ bán hàng tự động.
- Phân hệ Hóa đơn điện tử.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1. Layouts
- **Sales Dashboard**: Biểu đồ hình phễu Doanh số, Top 5 Khách hàng nợ đọng, Top hàng hóa bán chạy.
- **Kéo thả / Trạng thái**: Kanban board cho Quản lý Đơn đặt hàng (SO) - Chờ duyệt -> Đang giao -> Hoàn thành.

### 5.2. UI Components
- **Customer Info Panel**: Khi chọn mã khách hàng ở Form chứng từ, bên góc phải hiển thị nhanh (Quick View) panel: "Công nợ hiện tại: 50.000.000, Hạn mức: 100.000.000".
- **Toggle Options**: Switch buttons rõ ràng cho: "Kiêm phiếu xuất kho", "Kiêm lập hóa đơn". Khi On/Off, DataGrid chi tiết bên dưới tự động hiện/ẩn các cột TK Giá vốn, TK Kho...

### 5.3. UX feedback
- Cảnh báo âm kho hiển thị ngay trên lưới DataGrid (Highlight chữ đỏ ở ô số lượng) ngay khi User gõ xong số lượng, không cần đợi nhấn Lưu.
- Chức năng "Lập hàng loạt": Cho phép tick chọn nhiều Đơn đặt hàng của cùng 1 Khách hàng để gộp chung thành 1 Chứng từ bán hàng / 1 Hóa đơn duy nhất.
