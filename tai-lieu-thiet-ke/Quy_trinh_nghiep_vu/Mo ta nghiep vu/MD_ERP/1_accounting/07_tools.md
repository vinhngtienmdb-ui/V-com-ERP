# Đặc tả nghiệp vụ: Phân hệ Công cụ dụng cụ (Tools & Supplies)

## 1. Trường dữ liệu (Data Fields)

### 1.1. Master Data (Dữ liệu danh mục)
- **Công cụ dụng cụ (CCDC)**: Mã CCDC, Tên CCDC, ĐVT, Phân loại, Đặc tính kỹ thuật.
- **Phòng ban (Departments)**: Bộ phận đang sử dụng CCDC.
- **Tài khoản Kế toán**: TK CCDC (153), TK Chi phí chờ phân bổ (242), TK Chi phí (642, 627, 641...).

### 1.2. Bảng chính: Thẻ CCDC / Danh sách CCDC đang sử dụng (ToolCard)
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| Mã CCDC | `ToolCode` | String(50) | Có | Mã quản lý (VD: MT001) |
| Tên CCDC | `ToolName` | String(255)| Có | Tên công cụ (VD: Máy tính Dell) |
| Loại CCDC | `ToolCategoryId`| Guid/UUID | Không | Nhóm công cụ |
| Ngày ghi tăng | `PurchaseDate` | DateTime | Có | Ngày bắt đầu tính phân bổ |
| Nguyên giá | `OriginalValue` | Decimal | Có | Tổng giá trị xuất kho/mua vào |
| Số kỳ phân bổ | `AllocationPeriods`| Int | Có | Số tháng phân bổ (VD: 12 tháng) |
| Giá trị đã PB | `AllocatedAmount`| Decimal | Có | Số tiền đã phân bổ lũy kế |
| Giá trị còn lại| `RemainingValue` | Decimal | Có | Nguyên giá - Giá trị đã phân bổ |
| Trạng thái | `Status` | Enum | Có | Đang sử dụng, Đã hỏng/Ghi giảm, Chờ thanh lý |
| TK Chờ phân bổ | `PrepaidAccount` | String(20) | Có | Thường là 242 |

### 1.3. Bảng chi tiết: Bộ phận sử dụng & Thiết lập phân bổ
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| Mã CCDC | `ToolId` | Guid/UUID | Có | |
| Mã phòng ban | `DepartmentId` | Guid/UUID | Có | Bộ phận nào dùng |
| Tỷ lệ phân bổ | `AllocationRate` | Decimal | Có | % phân bổ cho phòng ban đó (thường 100%) |
| TK Chi phí | `ExpenseAccount` | String(20) | Có | (VD: 6423, 6273) |

---

## 2. Quy trình (Business Processes)

### 2.1. Các bước thực hiện end-to-end
1. **Ghi tăng CCDC**:
   - Xuất kho CCDC (từ kho 153) đưa vào sử dụng, hoặc Mua CCDC về đưa thẳng vào sử dụng không qua kho.
   - Khai báo các thông tin trên Thẻ CCDC: Nguyên giá, Số kỳ phân bổ, Bộ phận sử dụng.
2. **Phân bổ CCDC (Hàng tháng)**:
   - Cuối tháng, Kế toán chạy chức năng "Tính phân bổ CCDC".
   - Hệ thống tự động chia Nguyên giá cho Số kỳ để ra mức phân bổ tháng này.
   - Sinh tự động Chứng từ Kế toán (Phân bổ) ghi nhận chi phí cho các phòng ban.
3. **Điều chuyển CCDC**:
   - Nếu điều chuyển từ Phòng A sang Phòng B -> Lập biên bản điều chuyển trên phần mềm.
   - Từ tháng sau, chi phí phân bổ sẽ được hạch toán vào Tài khoản chi phí của Phòng B.
4. **Ghi giảm (Báo hỏng, mất)**:
   - Nếu CCDC hỏng trước khi phân bổ hết, lập chứng từ Ghi giảm.
   - Phần mềm tính toán Giá trị còn lại và hạch toán toàn bộ vào chi phí (hoặc bắt đền nhân viên) trong kỳ đó. Cập nhật trạng thái CCDC thành "Ghi giảm".

### 2.2. Phân quyền / Roles tham gia
- **Kế toán tổng hợp / Kế toán tài sản**: Quản lý ghi tăng, phân bổ, ghi giảm.
- **Trưởng phòng / Quản lý thiết bị**: Theo dõi danh sách thiết bị/công cụ đang do phòng ban mình quản lý.

---

## 3. Luồng nghiệp vụ (Business Workflows)

### 3.1. Luồng luân chuyển dữ liệu
- Mua hàng / Xuất kho -> Ghi tăng CCDC (Hình thành Sổ CCDC).
- Chạy Job phân bổ cuối kỳ -> Sinh Chứng từ Tổng hợp (Đẩy vào Sổ Cái).

### 3.2. Luồng hạch toán tài khoản (Định khoản)
* **Ghi tăng CCDC (đưa vào sử dụng)**:
  - Nợ TK 242 (Chi phí trả trước)
  - Có TK 153 (Nếu xuất từ kho) / Có TK 111, 112, 331 (Nếu mua dùng ngay)
* **Phân bổ CCDC định kỳ hàng tháng**:
  - Nợ TK 641, 642, 627... (Chi phí bộ phận sử dụng)
  - Có TK 242
* **Ghi giảm do hỏng/báo mất (đẩy hết giá trị còn lại vào chi phí)**:
  - Nợ TK 642 / 811
  - Có TK 242

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1. API endpoints đề xuất
- `GET /api/v1/tools`: Lấy danh sách Sổ CCDC.
- `POST /api/v1/tools`: Tạo thẻ CCDC (Ghi tăng).
- `POST /api/v1/tools/allocate`: Endpoint để trigger Job phân bổ định kỳ theo tháng/năm.
- `POST /api/v1/tools/{id}/decrease`: Ghi giảm CCDC.

### 4.2. Ràng buộc logic (Business rules) ở Backend
- **Công thức tính phân bổ**: Mức phân bổ tháng đầu tiên cần tính chẻ theo **Số ngày sử dụng thực tế** (Trừ khi user config phân bổ tròn tháng). Công thức: `(Giá trị PB 1 tháng / Tổng số ngày trong tháng) * Số ngày sử dụng trong tháng`. Các tháng tiếp theo phân bổ đều. Tháng cuối cùng bù trừ số lẻ.
- **Rollback Phân bổ**: Không cho phép Xóa/Sửa "Chứng từ ghi tăng" nếu CCDC này đã phát sinh "Chứng từ phân bổ" ở các tháng sau đó. Phải thực hiện Hủy phân bổ trước.
- **Đóng kỳ kế toán**: Việc phân bổ CCDC phải được thực hiện tuần tự theo từng kỳ. Không thể phân bổ tháng 05 nếu chưa phân bổ tháng 04.

### 4.3. Điểm tích hợp
- Kết nối tới phân hệ Tổng hợp (General Ledger) để tự động post Chứng từ nghiệp vụ khác cho việc phân bổ.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1. Layouts
- **Màn hình Sổ CCDC**: Danh sách DataGrid, cột hiển thị rành mạch: Mã, Tên, Ngày mua, Giá trị, Số kỳ, Đã PB, Còn lại. Hỗ trợ filter theo "Bộ phận sử dụng".
- **Bảng tính phân bổ tháng (Grid Interface)**: Khi bấm "Phân bổ CCDC", hiển thị ra 1 bảng Excel-like: Cột Mã, Tên, Giá trị kỳ này (Có thể edit manual số tiền phân bổ nếu muốn). Dưới đáy có Nút "Hạch toán".

### 5.2. UI Components
- **Wizard Tạo CCDC mới**: Nếu CCDC hình thành từ nhiều hóa đơn mua, cung cấp luồng Wizard 3 bước: B1 (Chọn chứng từ mua gốc) -> B2 (Nhập thông tin phân bổ) -> B3 (Xác nhận Thẻ).
- **History Timeline**: Trong modal chi tiết của 1 CCDC, có tab "Lịch sử" dưới dạng timeline (đứng):
  - 12/01/2024: Ghi tăng
  - 31/01/2024: Phân bổ tháng 1
  - 15/02/2024: Điều chuyển từ P.Hành Chính sang P.Kế Toán.

### 5.3. UX feedback
- Cảnh báo CCDC hết khấu hao: Highlight màu xám nhạt (disabled-like) cho các CCDC có "Giá trị còn lại" = 0 để dễ phân biệt với đồ đang dùng.
- Khi user chọn ngày ghi tăng là ngày trong quá khứ xa, nhắc nhở: "Ngày ghi tăng nằm ở kỳ kế toán trước. Hệ thống sẽ dồn số tiền phân bổ của các tháng trước vào kỳ hiện tại, bạn có đồng ý?".
