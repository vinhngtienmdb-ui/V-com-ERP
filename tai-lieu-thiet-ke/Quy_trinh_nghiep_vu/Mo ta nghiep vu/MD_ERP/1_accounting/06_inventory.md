# Đặc tả nghiệp vụ: Phân hệ Kho (Inventory Management)

## 1. Trường dữ liệu (Data Fields)

### 1.1. Master Data (Dữ liệu danh mục)
- **Kho (Warehouses)**: Mã kho, Tên kho, Địa chỉ, Loại kho, Thủ kho.
- **Vật tư hàng hóa (Items)**: Mã, Tên, Hình ảnh, ĐVT, Phân nhóm, Phương pháp tính giá xuất kho (Bình quân, Nhập trước xuất trước - FIFO, Đích danh), Định mức tồn tối thiểu/tối đa. Đánh dấu có theo dõi theo Lô/Hạn sử dụng hay không.
- **Lý do nhập/xuất**: Nhập kho nội bộ, Xuất nguyên vật liệu sản xuất, Xuất hủy...

### 1.2. Bảng chính: Phiếu Nhập kho (Inventory Receipt) / Phiếu Xuất kho (Inventory Issue)
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| Loại chứng từ | `VoucherType` | Int / Enum | Có | 1: Nhập kho, 2: Xuất kho, 3: Chuyển kho |
| Số chứng từ | `VoucherNo` | String(50) | Có | Số phiếu tự tăng (PN001, PX001) |
| Ngày chứng từ | `VoucherDate` | DateTime | Có | |
| Người giao/nhận| `ContactName` | String(255)| Không | Người mang hàng đến / Người lấy hàng |
| Đối tượng | `ObjectId` | Guid/UUID | Không | NCC/KH/Nhân viên liên quan |
| Lý do | `ReasonId` | Guid/UUID | Có | Xuất NVL, Nhập thành phẩm... |
| Diễn giải | `Description` | String(500)| Không | |
| ID Chứng từ gốc| `SourceVoucherId`| Guid/UUID | Tùy | Trỏ tới ID Chứng từ mua hàng/Bán hàng gốc |

### 1.3. Bảng chi tiết: Chi tiết Nhập/Xuất kho (Inventory Detail)
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| ID Phiếu | `VoucherId` | Guid/UUID | Có | |
| Mã VTHH | `ItemId` | Guid/UUID | Có | |
| Kho | `WarehouseId` | Guid/UUID | Có | Kho xuất/nhập thực tế |
| Lô / HSD | `LotNumber` | String(50) | Tùy | Bắt buộc nếu VTHH có config theo dõi lô |
| Số lượng | `Quantity` | Decimal | Có | (Dương cho Nhập, tính giảm cho Xuất) |
| Đơn giá | `UnitPrice` | Decimal | Tùy | Phiếu Nhập: Bắt buộc. Phiếu Xuất: = 0 (Chờ tính giá) |
| Thành tiền | `Amount` | Decimal | Tùy | |
| TK Kho (Nợ/Có) | `InventoryAccount` | String(20) | Có | VD: 152, 156... |
| TK Đối ứng | `OffsetAccount` | String(20) | Có | VD: 621, 632... |

---

## 2. Quy trình (Business Processes)

### 2.1. Các bước thực hiện end-to-end
**Nhập kho (Thành phẩm/Khác):**
1. Kế toán kho hoặc Thủ kho lập Phiếu nhập kho từ Yêu cầu nhập / Lệnh sản xuất.
2. Kiểm đếm thực tế, điền số lượng.
3. Ghi sổ để tăng số lượng tồn kho và hạch toán kế toán.

**Xuất kho (Sản xuất/Khác):**
1. Nhận lệnh xuất kho/Yêu cầu cấp vật tư.
2. Lập Phiếu xuất kho.
3. Ghi sổ để giảm số lượng tồn kho ngay lập tức. (Tiền vốn xuất kho chưa có).
4. Cuối kỳ (hoặc định kỳ): Chạy chức năng **"Tính giá xuất kho"** để hệ thống tự động update lại Đơn giá và Thành tiền cho các phiếu xuất, đồng thời update Sổ cái.

**Chuyển kho nội bộ:**
- Lập lệnh chuyển kho (Từ kho A sang kho B). Hệ thống ghi nhận 1 line Xuất kho A và 1 line Nhập kho B.

**Kiểm kê kho:**
1. Tạo phiếu kiểm kê. Phần mềm snapshot số lượng Tồn trên sổ sách hiện tại.
2. Nhập số liệu đếm thực tế (hoặc scan barcode/excel import).
3. Hệ thống tính chênh lệch. Nhấn nút "Xử lý chênh lệch", phần mềm auto sinh Phiếu Nhập kho (đối với phần thừa) hoặc Phiếu Xuất kho (phần thiếu).

### 2.2. Phân quyền / Roles tham gia
- **Thủ kho**: Chỉ ghi nhận số lượng (nhập/xuất thực tế), không nhìn thấy giá trị (đơn giá/thành tiền) (Tùy cấu hình).
- **Kế toán kho / Kế toán tổng hợp**: Xem xét về mặt giá trị, tính giá xuất kho, xử lý hạch toán.

---

## 3. Luồng nghiệp vụ (Business Workflows)

### 3.1. Luồng luân chuyển dữ liệu
- Dữ liệu tồn kho (Stock Quantity) thay đổi Realtime (Online-sync) ngay khi Phiếu Nhập/Xuất được Lưu & Ghi sổ.
- Kết nối mạnh mẽ với Tính giá thành (Xuất NVL cho công trình/phân xưởng) và Mua/Bán hàng.

### 3.2. Luồng hạch toán tài khoản (Định khoản)
* **Xuất kho nguyên vật liệu cho Sản xuất**:
  - Nợ TK 621 (Chi phí NVL trực tiếp)
  - Có TK 152 (Nguyên liệu, vật liệu)
* **Nhập kho Thành phẩm sản xuất xong**:
  - Nợ TK 155 (Thành phẩm)
  - Có TK 154 (Chi phí SXKD dở dang)
* **Chuyển kho**:
  - Nợ TK 156 (Kho nhận) / Có TK 156 (Kho xuất) (Chi tiết theo mã kho).

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1. API endpoints đề xuất
- `GET /api/v1/inventory/stock-balance`: Query tồn kho hiện tại (By Item, By Warehouse).
- `POST /api/v1/inventory/receipts`: Tạo phiếu nhập.
- `POST /api/v1/inventory/issues`: Tạo phiếu xuất.
- `POST /api/v1/inventory/calculate-cost`: Trigger chạy Job tính giá xuất kho.

### 4.2. Ràng buộc logic (Business rules) ở Backend
- **Chống xuất quá tồn (Stock Over-issue Prevent)**: Khi lưu phiếu Xuất kho, mở DB Transaction khóa row tồn kho của Vật tư đó -> Kiểm tra Tồn kho >= Số lượng xuất? Nếu OK -> Trừ đi và Commit. Nếu KHÔNG -> Rollback và bắn lỗi. (Bắt buộc dùng `SELECT ... FOR UPDATE` ở CSDL hoặc dùng Redis Locking).
- **Thuật toán tính giá xuất kho**:
  - **Bình quân gia quyền cuối kỳ**: Tính lại đơn giá cho tất cả phiếu xuất trong tháng = (Giá trị tồn đầu kỳ + Giá trị nhập trong kỳ) / (SL tồn đầu kỳ + SL nhập trong kỳ). Update ngược lại các phiếu xuất.
  - **FIFO**: Cần query lô nhập cũ nhất (còn tồn) để trừ dần. Backend phải lưu được "Link" giữa dòng Xuất và các dòng Nhập để tính giá.
- **Quản lý Lô / HSD (Lot Tracking)**: Vật tư cấu hình theo Lô bắt buộc field `LotNumber` và `ExpiryDate` khi nhập. Khi xuất, phải chọn chính xác xuất từ Lô nào, kiểm tra tồn kho theo Lô.

### 4.3. Điểm tích hợp
- Thiết bị đọc mã vạch (Barcode Scanners), PDA thiết bị kho: Cần cung cấp REST API nhanh/gọn để app Mobile trên máy PDA gọi khi quét mã vạch nhập/xuất kho.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1. Layouts
- **Inventory Dashboard**: Cảnh báo Hàng sắp hết hạn (HSD), Hàng dưới định mức tồn tối thiểu (Cần mua), Hàng tồn kho ứ đọng (Chậm luân chuyển).
- **Báo cáo Tồn kho (Sổ chi tiết vật tư, Thẻ kho)**: View dưới dạng Grid báo cáo chuẩn.

### 5.2. UI Components
- **Item Search Box với Stock Info**: Khi gõ tìm VTHH để xuất kho, dropdown gợi ý ngoài tên vật tư còn hiển thị nhỏ chữ màu xám: `Tồn kho: 100 cái (Kho A: 40, Kho B: 60)`.
- **Barcode Input Field**: Ô nhập liệu tối ưu hóa cho súng bắn mã vạch. Quét 1 phát -> Auto thêm 1 dòng vào lưới hoặc tăng số lượng dòng có sẵn lên 1.

### 5.3. UX feedback
- Khi chạy tính giá xuất kho (Do tốn nhiều thời gian, có thể vài phút), UI phải hiển thị **Progress Bar** hoặc chuyển job xuống background và báo notification khi xong: "Đã tính giá xuất kho xong tháng 5/2024. Cập nhật thành công 2,500 phiếu xuất".
- Khi user cố lưu phiếu xuất làm tồn kho bị âm, popup lỗi đỏ chặn lại kèm chi tiết: "Vật tư X, Kho Y đang có tồn: 10, Bạn xuất: 15. Thiếu 5".
