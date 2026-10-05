# Đặc tả nghiệp vụ: Phân hệ Giá thành (Costing)

## 1. Trường dữ liệu (Data Fields)

### 1.1. Master Data (Dữ liệu danh mục)
- **Kỳ tính giá thành**: Tháng, Quý, Năm, hoặc Khoảng thời gian tự định nghĩa.
- **Đối tượng tập hợp chi phí (Cost Object)**: Phân xưởng, Công trình, Hợp đồng, Sản phẩm, Đơn hàng, Bước công nghệ.
- **Yếu tố chi phí (Cost Elements)**: NVL trực tiếp (621), Nhân công trực tiếp (622), Sản xuất chung (627).
- **Định mức (BOM - Bill of Materials)** (Tùy chọn): Định mức tiêu hao NVL cho 1 thành phẩm.

### 1.2. Bảng chính: Kỳ tính giá thành (Costing Period)
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| Mã kỳ tính | `PeriodCode` | String(50) | Có | VD: GT_052024 |
| Ngày bắt đầu | `StartDate` | DateTime | Có | |
| Ngày kết thúc | `EndDate` | DateTime | Có | |
| Trạng thái | `Status` | Enum | Có | Đang tập hợp, Đã phân bổ, Đã tính GT, Đã cập nhật |
| Phương pháp | `CostingMethod` | Enum | Có | Giản đơn, Hệ số, Tỷ lệ, Công trình, Đơn hàng |
| Tổng CP phát sinh| `TotalIncurredCost`| Decimal | Tùy | Tổng 621, 622, 627 thu thập được |

### 1.3. Bảng chi tiết: Bảng tính giá thành (Cost Calculation Result)
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| ID Kỳ tính | `PeriodId` | Guid/UUID | Có | |
| Đối tượng THCP | `CostObjectId` | Guid/UUID | Có | Mã thành phẩm / Công trình |
| Số lượng SX | `ProduceQty` | Decimal | Có | SL Thành phẩm hoàn thành nhập kho |
| Chi phí Dở dang ĐK| `WipBeginAmount` | Decimal | Có | Dở dang đầu kỳ (TK 154) |
| Chi phí NVL (621)| `MaterialCost` | Decimal | Có | Tiền NVL phân bổ cho SP này |
| Chi phí NC (622) | `LaborCost` | Decimal | Có | Tiền nhân công phân bổ |
| Chi phí SXC (627)| `OverheadCost` | Decimal | Có | Tiền SX chung phân bổ |
| Chi phí Dở dang CK| `WipEndAmount` | Decimal | Có | Dở dang cuối kỳ |
| Tổng giá thành | `TotalCost` | Decimal | Có | Dở dang ĐK + Phát sinh - Dở dang CK |
| Đơn giá (Z) | `UnitCost` | Decimal | Có | Tổng giá thành / Số lượng SX |

---

## 2. Quy trình (Business Processes)

### 2.1. Các bước thực hiện end-to-end (Quy trình 5 bước cơ bản)
1. **Xác định kỳ tính giá thành & Tập hợp chi phí**:
   - Chọn kỳ (tháng/quý).
   - Phần mềm quét toàn bộ chứng từ phát sinh Nợ TK 621, 622, 627 (đối với TT200) hoặc TK 154 (TT133). Tập hợp về các "Đối tượng tập hợp chi phí".
2. **Phân bổ chi phí chung (Overhead Allocation)**:
   - Những chi phí như Điện nước xưởng (627), Lương quản đốc (622) chưa chỉ đích danh cho Sản phẩm nào.
   - User chọn "Tiêu thức phân bổ" (Theo NVL trực tiếp, Theo số lượng sản xuất, Theo định mức...). Hệ thống phân bổ mớ chi phí chung này vào từng Mã thành phẩm.
3. **Đánh giá Sản phẩm dở dang (WIP Evaluation)**:
   - Tính giá trị chi phí nằm lại trong các Sản phẩm chưa hoàn thành ở cuối kỳ.
   - Các PP đánh giá: Theo chi phí NVL trực tiếp, Theo tỷ lệ hoàn thành tương đương, hoặc Nhập tay.
4. **Tính giá thành**:
   - Chạy toán tử: `Tổng Z = Dở dang ĐK + (CP NVL + CP NC + CP SXC) - Dở dang CK`.
   - Chia cho Số lượng nhập kho để ra `Giá thành đơn vị (Z)`.
5. **Cập nhật giá xuất kho / giá nhập kho**:
   - Hệ thống tự động đẩy Đơn giá vừa tính được ngược lại vào các **Phiếu Nhập kho thành phẩm (155)** đã lập trong kỳ.
   - Trigger chạy lại lệnh "Tính giá xuất kho" (ở phân hệ Kho) để update lại Giá vốn xuất bán.

### 2.2. Phân quyền / Roles tham gia
- **Kế toán giá thành**: Chịu trách nhiệm toàn bộ quy trình, kiểm tra chi phí, phân bổ.
- **Kế toán tổng hợp**: Kiểm tra lại sự khớp đúng giữa Sổ Giá thành và Sổ Cái.

---

## 3. Luồng nghiệp vụ (Business Workflows)

### 3.1. Luồng luân chuyển dữ liệu
- Dữ liệu nguyên liệu lấy từ Phân hệ Kho (Xuất NVL). Nhân công lấy từ Phân hệ Lương. Chi phí chung lấy từ Mua hàng/Quỹ/Ngân hàng/TSCĐ/CCDC.
- Cuối cùng trả kết quả về Phân hệ Kho (Cập nhật đơn giá nhập thành phẩm).

### 3.2. Luồng hạch toán tài khoản (Định khoản)
* **Kết chuyển chi phí tính giá thành (Cuối kỳ)**:
  - Nợ TK 154 (Chi phí SXKD dở dang)
  - Có TK 621 (Chi phí NVLTT)
  - Có TK 622 (Chi phí NCTT)
  - Có TK 627 (Chi phí SX chung)
* **Nhập kho thành phẩm hoàn thành**:
  - Hạch toán ở Phiếu nhập kho (Nhưng Đơn giá được hệ thống Giá thành điền vào sau)
  - Nợ TK 155 (Thành phẩm) / Có TK 154.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1. API endpoints đề xuất
- `POST /api/v1/costing/periods`: Tạo kỳ tính.
- `GET /api/v1/costing/periods/{id}/gather-costs`: API quét và tập hợp chi phí từ Sổ cái.
- `POST /api/v1/costing/periods/{id}/allocate-overhead`: Chạy thuật toán phân bổ ma trận chi phí.
- `POST /api/v1/costing/periods/{id}/calculate`: Tính ra bảng giá thành Z.
- `POST /api/v1/costing/periods/{id}/update-inventory`: Cập nhật Đơn giá vào Phiếu nhập kho.

### 4.2. Ràng buộc logic (Business rules) ở Backend
- **Kiểm tra chứng từ chưa ghi sổ**: Trước khi bấm "Tập hợp chi phí", Backend phải check xem trong tháng có chứng từ nào liên quan đến 621, 622, 627 mà trạng thái là "Chưa ghi sổ" không? Nếu có, block và warning bắt user ghi sổ hoặc xóa đi để tránh lọt chi phí.
- **Khóa kỳ giá thành**: Khi kỳ đã hoàn thành (Đã update giá vào kho), không cho phép Sửa/Xóa các chứng từ chi phí gốc (Phiếu xuất kho NVL, Phiếu chi điện nước...). Muốn sửa, user phải `Hủy kỳ giá thành` -> Mở khóa chứng từ -> Tính lại.
- **Cân bằng 154**: Backend cần có report đối chiếu: Dư Nợ 154 trên Sổ cái BẮT BUỘC bằng Tổng Giá trị Dở dang Cuối kỳ trên Bảng giá thành.

### 4.3. Điểm tích hợp
- Phân hệ Kho (Lấy số liệu nhập kho thành phẩm, xuất kho NVL).
- Hệ thống MES (Manufacturing Execution System) nếu có để tự động lấy số lượng SP Dở dang và SP Hoàn thành thực tế dưới xưởng.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1. Layouts
- **Wizard 5 bước (Stepper Layout)**: Giao diện kinh điển và bắt buộc cho Giá thành.
  - Sidebar trái hoặc Top bar là Stepper (Bước 1 -> Bước 5). Hoàn thành bước trước mới cho đi sang bước sau.
- **Bảng phân bổ chi phí chung (Matrix Grid)**:
  - Cột: Tiêu thức phân bổ, Tổng CP cần phân bổ.
  - Các cột tiếp theo động (Dynamic columns): Mã Thành phẩm 1, Thành phẩm 2...
  - Hàng: Chi tiết các khoản chi phí (Tiền điện, Tiền lương).

### 5.2. UI Components
- **DataGrid với Auto-Sum**: Cực kỳ quan trọng ở các màn hình nhập Dở dang và Tính Z. Luôn có dòng Tổng cộng ở dưới.
- **Modal Cấu hình định mức (BOM)**: Cho phép import từ Excel cấu trúc BOM nhiều tầng để phần mềm tự tính Tiêu thức phân bổ.

### 5.3. UX feedback
- Khi chạy tính Z, nếu phát hiện có Thành phẩm (Mã A) có số lượng Nhập kho (Tồn tại Phiếu nhập 155) nhưng lại KHÔNG có bất kỳ chi phí NVL (621) nào được tập hợp. Hệ thống bật Alert vàng: "Thành phẩm A có sinh ra thành phẩm nhưng không tiêu hao nguyên vật liệu. Bạn có muốn tiếp tục?".
- State management: Lưu tạm (Draft) kết quả ở từng bước. User đang làm dở Bước 3 bận đi họp, lúc sau quay lại hệ thống vẫn load ra đúng số liệu đang làm dở.
