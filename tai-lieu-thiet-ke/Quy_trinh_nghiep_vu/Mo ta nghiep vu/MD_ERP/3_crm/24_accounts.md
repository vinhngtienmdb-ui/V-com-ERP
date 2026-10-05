# Đặc tả nghiệp vụ: Phân hệ Khách hàng (Accounts)

> **Quy ước tham chiếu:** "MISA AMIS" và các sản phẩm MISA được nhắc tới trong tài liệu này là **sản phẩm tham khảo** để minh họa cách làm nghiệp vụ, **không phải yêu cầu bắt buộc**. VComm tự xây dựng tính năng tương đương trên nền tảng của mình.

## 1. Trường dữ liệu (Data Fields)

### Bảng chính: `crm_accounts`
Lưu trữ thông tin tổ chức, công ty hoặc cá nhân đang là khách hàng chính thức, đã và đang có quan hệ kinh doanh. Đây là trung tâm của dữ liệu CRM (Mô hình B2B).

| Tên trường | Mã trường (Database) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **ID Khách hàng** | `account_id` | UUID | Có | Khóa chính |
| **Mã khách hàng** | `account_code` | String(50) | Có | Mã khách hàng (vd: KH-00123) |
| **Tên khách hàng** | `account_name` | String(255) | Có | Tên công ty / Tổ chức / Cá nhân |
| **Mã số thuế** | `tax_code` | String(50) | Không | Dùng để tích hợp AMIS Kế toán / Hóa đơn |
| **Số điện thoại** | `phone` | String(50) | Không | Tổng đài / SĐT công ty |
| **Website** | `website` | String(255) | Không | URL trang chủ |
| **Email** | `email` | String(100) | Không | Email công ty |
| **Địa chỉ (Hóa đơn)** | `billing_address` | String(500) | Không | Địa chỉ xuất hóa đơn |
| **Địa chỉ (Giao hàng)**| `shipping_address` | String(500) | Không | Địa chỉ nhận hàng |
| **Nhóm khách hàng** | `account_group_id` | UUID (FK) | Không | Nhóm (Khách hàng VIP, Khách lẻ, Đại lý...) |
| **Loại hình** | `account_type_id` | UUID (FK) | Không | Doanh nghiệp FDI, Nhà nước, Tư nhân... |
| **Ngành nghề** | `industry_id` | UUID (FK) | Không | Lĩnh vực hoạt động |
| **Doanh thu hàng năm** | `annual_revenue` | Decimal | Không | Mức doanh thu ước tính |
| **Quy mô (Số NV)** | `employee_count` | Integer | Không | |
| **Nhân viên quản lý** | `owner_id` | UUID (FK) | Có | ID nhân viên phụ trách account |
| **Đang nợ** | `outstanding_debt` | Decimal | Không | Sync từ AMIS Kế toán (Read-only) |
| **Ngày tạo** | `created_at` | DateTime | Có | |

### Master Data tham chiếu
*   `crm_account_groups`: Nhóm khách hàng
*   `crm_account_types`: Loại hình doanh nghiệp
*   Danh mục Địa lý (Tỉnh/Thành, Quận/Huyện, Phường/Xã).

---

## 2. Quy trình (Business Processes)

### Quy trình Quản trị Khách hàng (Account Management)
1.  **Tạo mới/Tiếp nhận:** Account có thể được tạo bằng cách Chuyển đổi từ Tiềm năng (Leads), thêm mới thủ công, hoặc đồng bộ 2 chiều từ AMIS Kế toán.
2.  **Làm giàu dữ liệu (Data Enrichment):** Nếu nhập Mã số thuế, hệ thống tự động gọi API lấy thông tin Tên công ty, Địa chỉ trụ sở chính từ Cổng thông tin doanh nghiệp quốc gia.
3.  **Quản lý 360 độ:** Nhân viên KD chăm sóc khách hàng. Tại màn hình Khách hàng, có thể xem được tất cả: Liên hệ (Contacts) thuộc công ty, Cơ hội (Opportunities) đang mở, Báo giá, Đơn hàng, Lịch sử tương tác, Hóa đơn, Công nợ.
4.  **Bàn giao (Handover):** Khi nhân viên nghỉ việc hoặc chuyển vùng, thực hiện chức năng Bàn giao/Chuyển chủ sở hữu (Reassign) hàng loạt Account cho nhân viên khác, kèm theo việc chuyển quyền sở hữu của Contacts, Opportunities tương ứng.

### Phân quyền (Roles & Permissions)
*   **Sales Rep:** Thêm/Sửa Khách hàng do mình quản lý. Có thể xem khách hàng của người khác (nếu cài đặt chế độ chia sẻ dữ liệu toàn công ty) nhưng không được sửa.
*   **Sales Manager:** Toàn quyền Thêm/Sửa/Xóa, Reassign khách hàng trong phòng ban.
*   **Hỗ trợ/CSKH (Customer Success):** Xem thông tin khách hàng, Thêm ghi chú/Hỗ trợ, không được xóa dữ liệu kinh doanh.

---

## 3. Luồng nghiệp vụ (Business Workflows)

### Luồng Đồng bộ Dữ liệu với AMIS Kế toán
*   **Từ CRM sang Kế toán:** Khi Sale chốt được Đơn hàng, thông tin Account (nếu chưa có bên Kế toán) sẽ được tự động đồng bộ sang danh mục Khách hàng (Customer) của hệ thống AMIS Kế toán để Kế toán viên xuất hóa đơn.
*   **Từ Kế toán sang CRM:** Khi Kế toán ghi nhận thu tiền hoặc phát sinh công nợ, trường dữ liệu `outstanding_debt` (Công nợ hiện tại), `total_revenue` (Tổng doanh số) sẽ được sync ngược về CRM. Giúp Sales xem được công nợ ngay trên CRM mà không cần hỏi Kế toán.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### API Endpoints Đề xuất
*   `GET /api/v1/crm/accounts`: Lấy danh sách khách hàng.
*   `GET /api/v1/crm/accounts/{id}`: Chi tiết KH.
*   `POST /api/v1/crm/accounts`: Tạo KH mới.
*   `GET /api/v1/crm/accounts/tax-lookup?taxCode={taxCode}`: API lookup thông tin doanh nghiệp qua mã số thuế.
*   `GET /api/v1/crm/accounts/{id}/related`: Lấy các bản ghi liên quan (Opportunities, Contacts, Quotes, Invoices).

### Ràng buộc logic (Business Rules)
*   **Auto-fill từ MST:** Nếu người dùng nhập Mã số thuế hợp lệ, tự động gọi api nội bộ điền tên và địa chỉ công ty nếu trường đó đang trống.
*   **Ràng buộc Xóa:** KHÔNG CHO PHÉP XÓA Khách hàng nếu đã phát sinh Chứng từ/Báo giá/Đơn hàng. Chỉ cho phép Xóa mềm (Soft Delete) hoặc vô hiệu hóa.
*   **Bảo mật theo cấp bậc (Row-level security):** Danh sách trả về qua API phải tự động filter theo `owner_id` và cây sơ đồ tổ chức (Manager xem được của nhân viên cấp dưới).

### Điểm tích hợp (Integrations)
*   **AMIS Kế toán (AMIS Accounting):** Đồng bộ danh mục khách hàng, công nợ, doanh số.
*   **Cổng thông tin Đăng ký doanh nghiệp:** Lấy data từ MST.
*   **Google Maps API:** Hiển thị vị trí khách hàng trên bản đồ và tính toán tuyến đường (Route planning) cho Sales đi thị trường.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### Layouts
*   **List View (Danh sách):**
    *   Bảng dữ liệu mạnh mẽ (Data Grid), cho phép Pin/Freeze cột tên khách hàng, tùy chỉnh ẩn hiện cột (Customize Columns).
    *   Tính năng "Gộp khách hàng trùng lặp" (Merge duplicates) nếu phát hiện các bản ghi có tên/website gần giống nhau.
*   **Detail View (Customer 360 View):**
    *   **Header:** Card nổi bật hiển thị Tên công ty, MST, Số điện thoại và 3 chỉ số quan trọng (Tổng doanh số, Công nợ, Số cơ hội đang mở).
    *   **Tab Layout ở dưới:**
        *   Tab "Chi tiết": Field thông tin.
        *   Tab "Liên hệ": Grid danh sách Contacts thuộc Account này.
        *   Tab "Giao dịch": Lịch sử Cơ hội, Báo giá, Đơn hàng.
        *   Tab "Lịch sử chăm sóc": Timeline.
        *   Tab "Kế toán": Công nợ, Hóa đơn (tích hợp).

### UI Components
*   **Related List Widget:** Các bảng dữ liệu con trong Detail view hiển thị tối đa 5 bản ghi, có nút "Xem tất cả" và nút dấu "+" để tạo nhanh (VD: Tạo nhanh Liên hệ, Tạo nhanh Báo giá cho khách hàng này mà không cần chuyển trang).
*   **Smart Tags:** Các tag màu sắc cho Nhóm KH (VD: VIP - Đỏ, Standard - Xanh).

### UX Feedback
*   Cảnh báo thông minh: Nếu Khách hàng đang có Công nợ > 0 quá hạn (từ AMIS Kế toán đẩy sang), hiển thị một Banner cảnh báo màu Cam ở đầu trang chi tiết KH để Sales biết trước khi tiến hành chào bán thêm.
*   Nút bấm "Tải thông tin từ MST" hiển thị trạng thái Loading dạng spinner ngay trên nút bấm.
