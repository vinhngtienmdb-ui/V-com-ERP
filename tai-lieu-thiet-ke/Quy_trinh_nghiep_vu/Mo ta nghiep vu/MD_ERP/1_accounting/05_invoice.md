# Đặc tả nghiệp vụ: Phân hệ Quản lý Hóa đơn (E-Invoice Management)

> **Quy ước tham chiếu:** "MISA AMIS" và các sản phẩm MISA được nhắc tới trong tài liệu này là **sản phẩm tham khảo** để minh họa cách làm nghiệp vụ, **không phải yêu cầu bắt buộc**. VComm tự xây dựng tính năng tương đương trên nền tảng của mình.

## 1. Trường dữ liệu (Data Fields)

### 1.1. Master Data (Dữ liệu danh mục)
- **Mẫu hóa đơn**: Mã mẫu, Tên mẫu, Phân loại (Hóa đơn GTGT, Hóa đơn Bán hàng...), Hình thức (Có mã/Không có mã CQT).
- **Dải số (Ký hiệu)**: Ký hiệu (VD: 1C23TAA), Số bắt đầu, Số tối đa.
- **Chữ ký số (Digital Signature)**: Thông tin token/HSM, Serial number, Valid from/to.

### 1.2. Bảng chính: Hóa đơn điện tử (E-Invoice)
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| Mẫu số | `TemplateCode` | String(20) | Có | VD: 01GTKT0/001 |
| Ký hiệu | `SymbolCode` | String(20) | Có | VD: 1C23TAA |
| Số hóa đơn | `InvoiceNo` | String(20) | Có | Sinh tự động khi phát hành (0000001) |
| Ngày hóa đơn | `InvoiceDate` | DateTime | Có | |
| Khách hàng | `CustomerName` | String(255)| Có | Tên đơn vị mua hàng |
| MST người mua | `CustomerTaxCode`| String(50) | Không | |
| Tổng tiền | `TotalAmount` | Decimal | Có | |
| Trạng thái HĐ | `InvoiceStatus` | Enum | Có | Chờ phát hành, Đã phát hành, Đã hủy, Bị thay thế, Bị điều chỉnh |
| Mã CQT | `TaxAuthorityCode`| String(50) | Tùy | Mã do cơ quan thuế cấp (Nếu là HĐ có mã) |
| Trạng thái CQT | `TaxAuthorityStatus`| Enum | Có | Chưa gửi, Chờ cấp mã, Đã cấp mã, Lỗi |
| Mã tra cứu | `LookupCode` | String(50) | Có | Chuỗi bảo mật để KH lên portal tra cứu |
| Chứng từ gốc | `SourceVoucherId`| Guid/UUID | Tùy | Tham chiếu ID Chứng từ bán hàng/Giảm giá |

### 1.3. Bảng chi tiết: Lịch sử xử lý Hóa đơn
| Trường dữ liệu | Tên Database (Gợi ý) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| ID Hóa đơn | `InvoiceId` | Guid/UUID | Có | |
| Hành động | `ActionType` | Enum | Có | Lập, Ký số, Gửi CQT, CQT Trả về, Hủy... |
| Thời gian | `ActionTime` | DateTime | Có | |
| Nội dung/Lỗi | `Message` | String(max)| Không | Chi tiết lỗi từ CQT (nếu có) |

---

## 2. Quy trình (Business Processes)

### 2.1. Các bước thực hiện end-to-end (Theo Nghị định 123/Thông tư 78)
1. **Lập hóa đơn nháp**:
   - Dữ liệu hóa đơn được kéo tự động từ "Chứng từ bán hàng" sang phân hệ Quản lý Hóa đơn (Chưa có số hóa đơn, Trạng thái "Chờ phát hành").
2. **Ký số & Phát hành**:
   - Kế toán chọn một/nhiều hóa đơn nháp -> Nhấn Phát hành.
   - Hệ thống tự động lấy Server HSM hoặc USB Token để ký XML. Cấp số hóa đơn theo thứ tự.
3. **Gửi Cơ quan Thuế (CQT)**:
   - Hệ thống thông qua Tổ chức T-Van truyền file XML (chuẩn CQT) lên hệ thống của Tổng cục Thuế.
   - Nhận "Mã của cơ quan thuế" (đối với loại HĐ có mã).
4. **Gửi hóa đơn cho Khách hàng**:
   - Hệ thống tự động gửi Email chứa file PDF, file XML bản gốc và Link tra cứu cho khách hàng.
5. **Xử lý sai sót**:
   - **Hủy hóa đơn**: Đối với HĐ đã phát hành nhưng sai sót chưa giao hàng/chưa kê khai. Lập thông báo sai sót (Mẫu 04/SS-HĐĐT) gửi CQT.
   - **Lập hóa đơn thay thế / điều chỉnh**: Khi HĐ sai đã gửi/đã kê khai. Hệ thống liên kết "Hóa đơn cũ" bị thay thế/điều chỉnh với "Hóa đơn mới".

### 2.2. Phân quyền / Roles tham gia
- **Kế toán bán hàng**: Lập hóa đơn nháp, kiểm tra dữ liệu.
- **Kế toán trưởng / Người cầm Token**: Ký duyệt và Phát hành hóa đơn.

---

## 3. Luồng nghiệp vụ (Business Workflows)

- Phân hệ Hóa đơn **không hạch toán kế toán** (không phát sinh Nợ/Có). Việc hạch toán đã hoàn thành ở Chứng từ Bán hàng. Phân hệ này thuần túy phục vụ **Quản trị hóa đơn tài chính theo luật định** và **Giao tiếp với CQT**.
- Luồng gửi CQT: Dữ liệu JSON/DB -> Generate CQT XML -> Hash -> Ký số Digital Signature -> Đóng gói gửi T-VAN -> Chờ Sync trạng thái -> Lưu CQT ID vào database.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1. API endpoints đề xuất
- `GET /api/v1/invoices`: DS hóa đơn.
- `POST /api/v1/invoices/{id}/publish`: Phát hành/Ký số.
- `POST /api/v1/invoices/{id}/send-tax-authority`: Đẩy lên CQT.
- `POST /api/v1/invoices/{id}/send-email`: Gửi email cho khách.
- `POST /api/v1/invoices/{id}/cancel`: Hủy hóa đơn (kèm lý do).

### 4.2. Ràng buộc logic (Business rules) ở Backend
- **Quy tắc cấp số (Auto-Numbering)**: Số hóa đơn phải được cấp liên tục, tăng dần theo thời gian ký thực tế (theo đúng NĐ123). Cần cơ chế **Pessimistic Locking** trên Database (hoặc Queue/Redis) lúc phát hành để đảm bảo không bị trùng số hay nhảy cóc số khi nhiều user bấm phát hành cùng lúc.
- **Ký số**: Tích hợp module HSM (Hardware Security Module) API. Nếu user dùng USB Token ở local, web app phải kết nối qua 1 Agent App/WebSocket (VD: MISA KYSO) cài ở máy trạm để gọi hàm ký.
- **XML Schema Validator**: Trước khi gửi đi, Backend phải validate file XML theo Schema định dạng (XSD) chuẩn mà Tổng cục thuế ban hành để giảm tỷ lệ CQT từ chối.

### 4.3. Điểm tích hợp
- **T-Van Services**: Giao tiếp chuẩn SOAP/REST với nhà cung cấp dịch vụ T-Van (VD: MISA meInvoice, VNPT, Viettel).
- **Email/SMS Gateway**: Để tự động phân phối hóa đơn cho người mua.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1. Layouts
- **E-Invoice Dashboard**: Bảng điều khiển giám sát trạng thái truyền nhận (Radar chart). Số liệu: Đang chờ cấp mã, Đã cấp mã, CQT từ chối, Gửi Email lỗi.
- **Danh sách Hóa đơn**:
  - Có các tab cố định: Hóa đơn chờ phát hành | Hóa đơn đã phát hành | Hóa đơn lỗi/Từ chối | Hóa đơn xóa bỏ.
  - Cột nổi bật: Số hóa đơn, Trạng thái phát hành, Trạng thái CQT (Color-coded tags).

### 5.2. UI Components
- **PDF Preview Panel**: Khi chọn 1 hóa đơn trong lưới, nửa bên phải (hoặc popup) tự động render bản thể hiện PDF của hóa đơn đó (có hình chữ ký số đỏ, QR Code, Mã CQT) để user xem lại trước khi gửi.
- **Bulk Action Bar**: Nút "Phát hành hàng loạt", "Gửi email hàng loạt" hiện lên góc trên khi tick chọn nhiều checkbox.

### 5.3. UX feedback
- Khi nhấn Phát hành, hiển thị Loader "Đang ký số và truyền dữ liệu lên Cơ quan thuế... Vui lòng không đóng trình duyệt".
- Nếu CQT báo lỗi (VD: Sai định dạng MST), highlight trực tiếp ô bị lỗi trên giao diện báo lỗi và hướng dẫn cách sửa (VD: "Mã số thuế không tồn tại trên hệ thống của TCT").
