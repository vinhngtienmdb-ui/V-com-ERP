# Đặc tả nghiệp vụ: Phân hệ Tài sản cố định (Fixed Assets)

## 1. Trường dữ liệu (Data Fields)

### 1.1. Master Data (Dữ liệu danh mục)
- **Tài sản cố định (TSCĐ)**: Mã tài sản, Tên tài sản, Loại TSCĐ (Hữu hình, Vô hình, Thuê tài chính), Nhóm TSCĐ (Máy móc, Nhà cửa, Phương tiện vận tải).
- **Phòng ban / Dự án**: Bộ phận sử dụng TSCĐ.

### 1.2. Bảng chính: Sổ Tài sản (Asset Register / Thẻ tài sản)
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| Mã TSCĐ | `AssetCode` | String(50) | Có | |
| Tên TSCĐ | `AssetName` | String(255)| Có | |
| Nhóm TSCĐ | `AssetGroup` | Guid/UUID | Có | |
| Ngày bắt đầu SD | `UseDate` | DateTime | Có | Ngày tính khấu hao |
| Nguyên giá | `OriginalCost` | Decimal | Có | Toàn bộ chi phí hình thành TSCĐ |
| Thời gian KH | `LifeTime` | Int | Có | Số tháng (Hoặc số năm) khấu hao |
| Tỷ lệ KH | `DepreciationRate` | Decimal | Có | Tỷ lệ % khấu hao / năm |
| Hao mòn lũy kế | `AccumulatedDepre` | Decimal | Có | Tổng đã khấu hao đến hiện tại |
| Giá trị còn lại | `NetBookValue` | Decimal | Có | = Nguyên giá - Hao mòn lũy kế |
| TK Nguyên giá | `AssetAccount` | String(20) | Có | VD: 211 (TSCĐ Hữu hình) |
| TK Khấu hao | `DepreAccount` | String(20) | Có | VD: 214 (Hao mòn TSCĐ) |

### 1.3. Bảng chi tiết: Lịch sử tác động TSCĐ
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| ID Tài sản | `AssetId` | Guid/UUID | Có | |
| Loại nghiệp vụ | `ActionType` | Enum | Có | Tăng, Đánh giá lại, Tạm dừng KH, Giảm, Thanh lý |
| Ngày thực hiện | `ActionDate` | DateTime | Có | |
| Diễn giải | `Description` | String(255)| Có | |
| Số tiền thay đổi| `ChangeAmount` | Decimal | Tùy | Nếu là Đánh giá lại nguyên giá |

---

## 2. Quy trình (Business Processes)

### 2.1. Các bước thực hiện end-to-end
1. **Ghi tăng TSCĐ**:
   - Từ các nguồn: Mua mới, Xây dựng cơ bản hoàn thành, Nhận vốn góp.
   - Cập nhật Thẻ TSCĐ: Khai báo nguyên giá, tỷ lệ khấu hao, thời gian sử dụng, phòng ban sử dụng.
2. **Tính Khấu hao (Hàng tháng)**:
   - Kế toán chạy chức năng "Tính khấu hao TSCĐ".
   - Phần mềm trích lập chi phí khấu hao theo Phương pháp Đường thẳng (Chủ yếu), hạch toán vào chi phí các phòng ban tương ứng.
3. **Đánh giá lại TSCĐ** (Nếu có):
   - Thay đổi Nguyên giá (Do nâng cấp, sửa chữa lớn) hoặc thay đổi Thời gian sử dụng.
   - Phần mềm phải lưu vết lịch sử và tự động tính lại mức khấu hao cho các kỳ sau.
4. **Kiểm kê TSCĐ**:
   - Cuối năm thực hiện kiểm kê, in biên bản.
5. **Thanh lý / Nhượng bán / Ghi giảm**:
   - Khi TSCĐ hết hạn hoặc bị bán/hủy, lập chứng từ Ghi giảm. Xóa sổ TSCĐ, ghi nhận thu nhập/chi phí thanh lý.

### 2.2. Phân quyền / Roles tham gia
- **Kế toán TSCĐ**: Quản lý thẻ tài sản, tính khấu hao.
- **Kế toán trưởng**: Duyệt các quyết định đánh giá lại, thanh lý TSCĐ.

---

## 3. Luồng nghiệp vụ (Business Workflows)

### 3.1. Luồng luân chuyển dữ liệu
- Dữ liệu nguyên giá có thể kế thừa từ Mua hàng / Tổng hợp.
- Bảng trích khấu hao tạo Chứng từ ghi nhận Chi phí & Khấu hao đẩy về Sổ Cái.

### 3.2. Luồng hạch toán tài khoản (Định khoản)
* **Ghi tăng mua mới TSCĐ**:
  - Nợ TK 211 (Nguyên giá) / Nợ TK 1332 (Thuế GTGT TSCĐ)
  - Có TK 331, 112
* **Trích khấu hao định kỳ**:
  - Nợ TK 641, 642, 627 (Chi phí bộ phận sử dụng)
  - Có TK 214 (Hao mòn TSCĐ)
* **Thanh lý, nhượng bán TSCĐ (Xóa sổ)**:
  - Nợ TK 214 (Giá trị đã hao mòn)
  - Nợ TK 811 (Chi phí khác - Phần giá trị còn lại)
  - Có TK 211 (Nguyên giá)
* **Thu nhập từ thanh lý (Bán TSCĐ)**:
  - Nợ TK 111/112/131
  - Có TK 711 (Thu nhập khác)
  - Có TK 33311 (Thuế)

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1. API endpoints đề xuất
- `GET /api/v1/assets`: Danh sách sổ TSCĐ.
- `POST /api/v1/assets`: Tạo Thẻ tài sản.
- `POST /api/v1/assets/depreciate`: Chạy tính khấu hao tháng.
- `POST /api/v1/assets/{id}/revaluate`: Đánh giá lại TSCĐ.

### 4.2. Ràng buộc logic (Business rules) ở Backend
- **Phương pháp khấu hao**: Chủ yếu support **Đường thẳng (Straight Line)**. Công thức Mức KH tháng = Nguyên giá / Số tháng khấu hao. Tính theo số ngày thực tế cho tháng đầu tiên/tháng cuối cùng giống CCDC.
- **Tuân thủ khung thời gian KH (Thông tư 45)**: Khi user chọn Nhóm tài sản, hệ thống có thể validation cảnh báo nếu `LifeTime` (thời gian khấu hao) nhập tay vượt ra ngoài Khung min-max quy định của Bộ Tài Chính (Ví dụ xe oto 6-10 năm).
- **Rule Đánh giá lại**: Khi thay đổi Nguyên giá hoặc Thời gian, hệ thống KHÔNG tính lại quá khứ, chỉ tính lại **Giá trị khấu hao một tháng** cho thời gian còn lại = (Giá trị còn lại sau đánh giá) / (Thời gian sử dụng còn lại).

### 4.3. Điểm tích hợp
- Kết nối mã tài sản với các hệ thống Quản lý tài sản ERP vật lý (QR Code scanning asset tracking) qua API Open.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1. Layouts
- **Asset Dashboard**: Biểu đồ phân bổ loại tài sản (Hữu hình, Vô hình), Tổng tài sản hình thành mới trong năm.
- **Thẻ Tài Sản (Card View)**: Header to hiển thị tên và mã, bên dưới là thanh Progress Bar biểu diễn Trạng thái khấu hao (Ví dụ: Thanh ngang đổ màu xanh 70% biểu thị đã KH 70%).

### 5.2. UI Components
- **Tree Grid Danh mục Nhóm TSCĐ**: Khung trái màn hình là Cây thư mục (Nhà cửa -> Xưởng, Văn phòng | Máy móc -> Dây chuyền...), Khung phải là DataGrid danh sách tài sản thuộc nhóm đó.
- **Form Đánh giá lại (Revaluation Form)**: Có cột "Trước điều chỉnh", cột nhập "Giá trị thay đổi (+/-)", và hệ thống tự live-calculate cột "Sau điều chỉnh" để user verify ngay.

### 5.3. UX feedback
- **Drill-down**: Trên sổ tài sản, click vào con số "Hao mòn lũy kế", popup mở ra liệt kê danh sách chi tiết các Chứng từ khấu hao của các tháng đã hình thành nên con số đó (Hyperlink).
- Cảnh báo khi tính khấu hao: "TSCĐ Ôtô Camry (TS005) đã khấu hao hết 100% trong kỳ này. Hệ thống sẽ tự động dừng trích khấu hao vào kỳ sau".
