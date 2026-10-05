# Đặc tả nghiệp vụ: Phân hệ Báo giá & Đơn hàng (Quotes & Orders)

> **Quy ước tham chiếu:** "MISA AMIS" và các sản phẩm MISA được nhắc tới trong tài liệu này là **sản phẩm tham khảo** để minh họa cách làm nghiệp vụ, **không phải yêu cầu bắt buộc**. VComm tự xây dựng tính năng tương đương trên nền tảng của mình.

## 1. Trường dữ liệu (Data Fields)

Do tính chất liên quan mật thiết, phần này đặc tả cho cả hai đối tượng: **Báo giá (Quotes)** và **Đơn hàng (Sales Orders)**.

### Bảng chính 1: `crm_quotes` (Báo giá)
| Tên trường | Mã trường (Database) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **ID Báo giá** | `quote_id` | UUID | Có | Khóa chính |
| **Mã báo giá** | `quote_code` | String(50) | Có | Số báo giá tự động sinh (VD: BG-2023-0001) |
| **Tên báo giá** | `quote_name` | String(255) | Có | |
| **Cơ hội liên quan** | `opportunity_id` | UUID (FK) | Không | |
| **Khách hàng** | `account_id` | UUID (FK) | Có | |
| **Liên hệ nhận BG** | `contact_id` | UUID (FK) | Không | |
| **Ngày báo giá** | `quote_date` | Date | Có | |
| **Ngày hiệu lực đến** | `expiration_date` | Date | Có | Thời hạn của báo giá |
| **Trạng thái** | `status` | Enum | Có | Nháp, Đang chờ duyệt, Đã gửi, Đã từ chối, Đã chấp nhận |
| **Tổng tiền trước thuế**| `sub_total` | Decimal | Có | Tự động tính từ các dòng sản phẩm |
| **Chiết khấu tổng** | `total_discount` | Decimal | Không | Cố định hoặc % |
| **Tổng thuế VAT** | `total_tax` | Decimal | Không | |
| **Tổng tiền thanh toán**| `grand_total` | Decimal | Có | Tổng tiền cuối cùng |
| **Mẫu in/Điều khoản** | `terms_conditions` | Text | Không | Điều khoản thanh toán, giao hàng |

### Bảng chính 2: `crm_orders` (Đơn hàng)
Cấu trúc tương tự Bảng Báo giá, thay ID và có thêm một số trường liên quan đến Giao hàng/Kế toán:
*   **Mã đơn hàng (`order_code`)**
*   **Trạng thái Đơn hàng (`status`):** Chờ duyệt, Chờ xuất kho, Đang giao, Hoàn thành, Đã hủy.
*   **Tình trạng thanh toán (`payment_status`):** Chưa thanh toán, Đã thanh toán 1 phần, Đã thanh toán. (Đồng bộ từ AMIS Kế toán).
*   **Tình trạng xuất hóa đơn (`invoice_status`):** Chưa xuất, Đã xuất.
*   **Ngày giao hàng dự kiến (`expected_delivery_date`)**.

### Bảng chi tiết: `crm_quote_lines` / `crm_order_lines` (Hàng hóa dịch vụ)
| Tên trường | Mã trường (Database) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **ID Dòng** | `line_id` | UUID | Có | |
| **ID Báo giá/Đơn hàng**| `parent_id` | UUID (FK) | Có | Liên kết đến Quote/Order |
| **Hàng hóa/Sản phẩm** | `product_id` | UUID (FK) | Có | Liên kết bảng Danh mục sản phẩm |
| **Đơn vị tính** | `uom_id` | UUID (FK) | Có | Chiếc, Cái, Gói... |
| **Số lượng** | `quantity` | Decimal | Có | |
| **Đơn giá** | `unit_price` | Decimal | Có | |
| **Tỷ lệ chiết khấu (%)**| `discount_percent` | Decimal | Không | |
| **Tiền chiết khấu** | `discount_amount` | Decimal | Không | |
| **Tỷ suất thuế (%)** | `tax_rate` | Decimal | Không | (VD: 8%, 10%) |
| **Thành tiền** | `total_amount` | Decimal | Có | `(SL * Đơn giá - Chiết khấu) + Thuế` |

---

## 2. Quy trình (Business Processes)

### Quy trình Báo giá -> Đơn hàng
1.  **Lập Báo giá:** NV KD chọn Khách hàng, chọn Hàng hóa từ Bảng giá, điền số lượng, chiết khấu.
2.  **Phê duyệt Báo giá (Tùy chọn):** Nếu mức chiết khấu vượt quá thẩm quyền của Sale, hệ thống khóa BG lại và gửi thông báo cho Quản lý (Manager/Giám đốc) duyệt.
3.  **Gửi Khách hàng:** Sale xuất PDF hoặc gửi email Báo giá trực tiếp từ hệ thống cho khách.
4.  **Khách hàng chốt:** Nếu khách hàng đồng ý (Status = Đã chấp nhận), Sale bấm 1 nút **"Tạo Đơn hàng từ Báo giá"**.
5.  **Xử lý Đơn hàng (Order Fulfillment):** Đơn hàng được tạo, chuyển thông tin qua bộ phận Kho (xuất hàng) và Kế toán (xuất hóa đơn, ghi nhận công nợ).

### Phân quyền (Roles & Permissions)
*   **Sales Rep:** Tạo BG/ĐH. Chỉ được sửa/xóa khi trạng thái là "Nháp". Khi đã gửi hoặc duyệt thì chỉ xem.
*   **Sales Manager:** Quyền Phê duyệt các báo giá/đơn hàng vượt hạn mức chiết khấu.
*   **Kế toán / Kho (Qua tích hợp):** Xem Đơn hàng, cập nhật tình trạng giao hàng/thanh toán.

---

## 3. Luồng nghiệp vụ (Business Workflows)

### Luồng Phê duyệt Chiết khấu (Discount Approval Workflow)
*   **Trigger:** Nút "Trình duyệt" trên Báo giá được bấm.
*   **Condition:** Hệ thống check `discount_percent` của từng dòng hoặc `total_discount`. Nếu > 10% (Cấu hình linh hoạt theo rule hệ thống).
*   **Action:**
    *   Trạng thái BG đổi thành `Pending Approval`. Khóa toàn bộ các field, không cho phép sửa.
    *   Gửi notification (In-app, Mobile push) cho người Quản lý.
*   **Output:**
    *   Quản lý bấm **Duyệt (Approve)**: Trạng thái đổi thành `Approved`, Sale được phép xuất PDF gửi khách.
    *   Quản lý bấm **Từ chối (Reject)**: Trạng thái về `Draft` (Nháp), kèm ghi chú lý do, Sale phải sửa lại giá.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### API Endpoints Đề xuất
*   `GET /api/v1/crm/quotes` | `GET /api/v1/crm/orders`
*   `POST /api/v1/crm/quotes`: Yêu cầu payload có Nested JSON bao gồm Thông tin chung (Master) và Danh sách hàng hóa (Details/Lines). Hệ thống Backend xử lý Transaction (Insert Master -> Insert Details).
*   `POST /api/v1/crm/quotes/{id}/generate-order`: API thực hiện business logic clone từ Quote sang Order mới.
*   `POST /api/v1/crm/quotes/{id}/export-pdf`: Generate file PDF dựa trên template HTML lưu trên server.

### Ràng buộc logic (Business Rules)
*   **Tính toán động (Dynamic Calculation):** Backend luôn phải validate và tính toán lại trường `grand_total` từ các `line_items` gởi lên để tránh trường hợp Client (Frontend) tính sai hoặc thao túng giá trị.
*   **Ràng buộc thời hạn BG:** Cảnh báo nếu Sales gửi 1 báo giá đã qua `expiration_date`.

### Điểm tích hợp (Integrations)
*   **AMIS Kế toán / Bán hàng:** CỰC KỲ QUAN TRỌNG. Đơn hàng (Sale Order) bên CRM sau khi chốt sẽ đồng bộ nguyên xi sang AMIS Kế toán (trở thành Đơn đặt hàng - Sale Order bên phần mềm Kế toán) để Kế toán kho lập Phiếu Xuất Kho và Hóa đơn.
*   **Kho (Inventory):** Gọi API check số lượng tồn kho theo thời gian thực (Real-time stock check) ngay khi Sales chọn sản phẩm vào dòng Đơn hàng. Nếu hết hàng, cảnh báo đỏ "Vượt quá số lượng tồn".

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### Layouts
*   **Form Thêm mới/Sửa (Master-Detail Form):**
    *   **Phần trên (Master):** Các field thông tin chung (Khách hàng, Ngày tháng, Trạng thái).
    *   **Phần giữa (Details):** Lưới nhập liệu dạng bảng (Data Grid) cho phép nhập hàng hóa. Cho phép dùng phím Tab di chuyển giữa các ô cell, dùng mũi tên lên xuống để chuyển dòng (giống trải nghiệm Excel).
    *   **Phần dưới (Footer):** Khu vực Tổng hợp tiền (Tổng trước thuế, Nhập chiết khấu, Tiền thuế, Tổng tiền) nằm góc dưới bên phải. Nằm bên trái có thể là Textarea nhập Điều khoản.

### UI Components
*   **Editable Data Grid:** Bảng chi tiết hàng hóa phải cho phép nhập liệu cực nhanh (Inline editing). Cột "Mã hàng" có combo-box search nhanh (Search as you type).
*   **Template Selector:** Cung cấp Dropdown chọn Mẫu in (Báo giá chuẩn, Báo giá tiếng Anh, Báo giá rút gọn). Nút Preview (Xem trước PDF) ngay trong form.

### UX Feedback
*   Khi nhập xong Số lượng và Đơn giá ở dòng hàng hóa, cột Thành tiền phải lập tức nhảy số ngay trên giao diện mà không cần reload trang (Client-side computation), đồng thời Tổng tiền ở footer cũng update tức thì.
*   Nút "Thêm dòng mới" (Add Row) và shortcut phím (vd: Ctrl+Enter) để thao tác bằng bàn phím nhanh nhất.
