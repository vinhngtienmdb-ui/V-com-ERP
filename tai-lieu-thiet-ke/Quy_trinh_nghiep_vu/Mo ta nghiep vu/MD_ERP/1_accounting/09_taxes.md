# Đặc tả nghiệp vụ: Phân hệ Thuế (Tax Management)

## 1. Trường dữ liệu (Data Fields)

### 1.1. Master Data (Dữ liệu danh mục)
- **Kỳ tính thuế**: Tháng, Quý, Năm (theo loại thuế).
- **Danh mục Mức thuế suất**: 0%, 5%, 8%, 10%, Không chịu thuế.
- **Mẫu Tờ khai thuế**: Tờ khai thuế GTGT (01/GTGT), Thuế TNDN (03/TNDN), Thuế TNCN.

### 1.2. Bảng chính: Tờ khai thuế (Tax Declaration)
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| Mẫu tờ khai | `DeclarationForm` | String(50) | Có | (VD: 01/GTGT) |
| Loại kỳ | `PeriodType` | Enum | Có | 1: Tháng, 2: Quý, 3: Năm |
| Kỳ báo cáo | `PeriodValue` | String(20) | Có | VD: "05/2024", "Q1/2024" |
| Loại tờ khai | `DeclarationType`| Enum | Có | Lần đầu, Bổ sung (Lần 1, 2...) |
| Trạng thái | `Status` | Enum | Có | Bản nháp, Đã lập, Đã nộp CQT |
| Doanh thu Bán ra| `TotalOutputAmount`| Decimal | Tùy | Tổng HHDV bán ra (Trường 27 Tờ khai) |
| Thuế GTGT Đầu ra| `TotalOutputTax` | Decimal | Tùy | |
| Thuế GTGT Đầu vào| `TotalInputTax` | Decimal | Tùy | Thuế được khấu trừ kỳ này |
| Thuế phải nộp | `TaxPayable` | Decimal | Có | Số tiền thuế chốt phải nộp |

### 1.3. Bảng chi tiết: Bảng kê hóa đơn mua vào / bán ra (Tax Invoices Detail)
- Lưu thông tin chi tiết các Hóa đơn cấu thành nên tờ khai (Mẫu 01-1/GTGT, 01-2/GTGT) để audit/truy vết.
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| Số hóa đơn | `InvoiceNo` | String(20) | Có | |
| Ngày hóa đơn | `InvoiceDate` | DateTime | Có | |
| MST Đối tác | `PartnerTaxCode` | String(50) | Có | |
| Doanh số | `BaseAmount` | Decimal | Có | Tiền chưa thuế |
| Thuế suất | `TaxRate` | Decimal | Có | |
| Tiền thuế | `TaxAmount` | Decimal | Có | |

---

## 2. Quy trình (Business Processes)

### 2.1. Các bước thực hiện end-to-end
**Lập Tờ khai Thuế GTGT (Phổ biến nhất):**
1. Cuối tháng / Cuối quý, Kế toán Thuế thực hiện lập Tờ khai.
2. Chọn Kỳ kê khai, phần mềm tự động rà quét toàn bộ chứng từ Mua hàng (đầu vào), Bán hàng (đầu ra), Chứng từ Kế toán khác có hạch toán thuế GTGT trong kỳ.
3. Phần mềm fill số liệu lên biểu mẫu Tờ khai y hệt form chuẩn của HTKK.
4. Kế toán rà soát bảng kê Mua vào, Bán ra. Sửa đổi nếu cần (Bỏ bớt hóa đơn không hợp lệ).
5. Nhấn Lưu và Ghi sổ Khấu trừ thuế.
6. **Xuất khẩu XML**: Kết xuất ra file XML đúng chuẩn HTKK của Tổng cục thuế để nộp trên cổng Etax, HOẶC tích hợp nộp thuế điện tử trực tiếp từ phần mềm (qua T-VAN).

**Khấu trừ thuế (Thuế GTGT):**
- Xác định số thuế Đầu vào được khấu trừ và số thuế Đầu ra phải nộp. Sinh tự động Chứng từ Khấu trừ thuế GTGT để chốt số dư 2 tài khoản 133 và 3331.

### 2.2. Phân quyền / Roles tham gia
- **Kế toán Thuế**: Lập báo cáo thuế, bảng kê.
- **Kế toán trưởng**: Kiểm tra và ký nộp.

---

## 3. Luồng nghiệp vụ (Business Workflows)

### 3.1. Luồng luân chuyển dữ liệu
- Mọi giao dịch từ Mua hàng (TK 133), Bán hàng (TK 333), Ngân hàng (Phí), Tổng hợp (Điều chỉnh) có khai báo "Tab Thuế" sẽ tụ hội về Bảng Kê. Bảng kê cuộn số liệu tổng lên Tờ khai.

### 3.2. Luồng hạch toán tài khoản (Định khoản)
* **Khấu trừ thuế GTGT cuối kỳ**:
  Hệ thống lấy giá trị nhỏ hơn (Min) giữa Dư Nợ TK 1331 (Đầu vào) và Dư Có TK 33311 (Đầu ra).
  - Nợ TK 33311 (Thuế GTGT đầu ra)
  - Có TK 1331 (Thuế GTGT đầu vào được khấu trừ)
  *(Nếu Đầu ra > Đầu vào: Số dư Còn lại của 33311 là số phải nộp. Nếu Đầu vào > Đầu ra: Số dư còn lại của 1331 được chuyển kỳ sau)*.

* **Nộp thuế cho Nhà nước (Bằng tiền gửi NH)**:
  - Nợ TK 33311 (Thuế GTGT) / 3334 (Thuế TNDN)
  - Có TK 112

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1. API endpoints đề xuất
- `POST /api/v1/taxes/vat-declarations/preview`: Trả về data tổng hợp (Draft) cho Tờ khai VAT kỳ này.
- `POST /api/v1/taxes/vat-declarations`: Lưu trữ tờ khai thuế.
- `POST /api/v1/taxes/generate-deduction-voucher`: Sinh chứng từ khấu trừ thuế.
- `GET /api/v1/taxes/export-xml`: Xuất XML chuẩn HTKK.

### 4.2. Ràng buộc logic (Business rules) ở Backend
- **Đồng bộ chuẩn XML Thuế**: Định dạng file XML kết xuất bắt buộc phải map 1-1 với XSD schema của phần mềm HTKK (Hỗ trợ kê khai) mới nhất. Mọi tag XML `(chiTieu23, chiTieu24,...)` phải khớp chuẩn.
- **Tờ khai bổ sung**: Nếu Kỳ Q1/2024 đã nộp (Trạng thái = Đã nộp CQT), muốn sửa thì không được Sửa trực tiếp. Phải sinh tờ khai "Bổ sung lần 1", phần mềm so sánh số liệu cũ và số liệu mới để tính ra độ chênh lệch (Cần nộp thêm hay được giảm).
- **Rule lấy chứng từ**: Lấy các chứng từ có `Ngày hóa đơn` (không phải ngày hạch toán) thuộc kỳ kê khai, VÀ thỏa mãn điều kiện Tài khoản Thuế hợp lệ.

### 4.3. Điểm tích hợp
- Ứng dụng HTKK (Import XML vào HTKK).
- Cổng thông tin Thuế Điện Tử (thuedientu.gdt.gov.vn) để nộp trực tiếp (Direct filing API nếu có license T-Van).

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1. Layouts
- **Màn hình Lập tờ khai**: Giao diện thiết kế giống y hệt (Clone visual) các Form của phần mềm HTKK quen thuộc với kế toán Việt Nam.
  - Sidebar trái: Chọn kỳ, Loại tờ khai, Phụ lục đính kèm.
  - Khung chính: Biểu mẫu tờ khai dạng Table Spreadsheet. Các chỉ tiêu (21, 22, 23...) có background xanh nhạt là ô tự động tính, ô nền trắng là cho phép gõ tay (Tương tự Excel).

### 5.2. UI Components
- **Tabbed Spreadsheet**: Tờ khai chính ở Tab 1, Bảng kê Mua vào Tab 2, Bán ra Tab 3. Dữ liệu thay đổi ở Bảng kê lập tức re-calculate Tổng lên Tờ khai chính.
- **Drill-down Tooltip**: Khi click đúp vào "Chỉ tiêu [23] - Giá trị hàng hóa mua vào", hệ thống popup lên list chi tiết các Hóa đơn đã cấu thành nên con số đó để Kế toán đối chiếu.

### 5.3. UX feedback
- Khi User lưu tờ khai, hệ thống check "Số dư trên TK 133" với "Số liệu trên Tờ khai". Nếu có chênh lệch, hiển thị Alert vàng: "Cảnh báo: Số liệu thuế đầu vào trên tờ khai (50tr) đang lệch so với Số dư sổ cái TK 133 (55tr). Vui lòng kiểm tra lại nguyên nhân lệch." (Do bỏ sót hóa đơn hoặc hạch toán nhầm).
