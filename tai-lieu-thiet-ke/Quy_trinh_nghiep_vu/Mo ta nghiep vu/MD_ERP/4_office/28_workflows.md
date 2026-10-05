# Đặc tả nghiệp vụ: Phân hệ Quy trình (Workflows/BPM)

> **Quy ước tham chiếu:** "MISA AMIS" và các sản phẩm MISA được nhắc tới trong tài liệu này là **sản phẩm tham khảo** để minh họa cách làm nghiệp vụ, **không phải yêu cầu bắt buộc**. VComm tự xây dựng tính năng tương đương trên nền tảng của mình.

## 1. Trường dữ liệu (Data Fields)

AMIS Quy trình là một công cụ BPM (Business Process Management) cho phép số hóa mọi quy trình liên phòng ban (Vd: Thanh toán tạm ứng, Đề xuất tuyển dụng, Duyệt chi, Xử lý khiếu nại...). Cấu trúc dữ liệu rất linh hoạt (Dynamic Data).

### Bảng 1: `bpm_workflow_definitions` (Định nghĩa Quy trình - Template)
Quản lý các loại quy trình được thiết kế sẵn.
| Tên trường | Mã trường (Database) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **ID Định nghĩa** | `def_id` | UUID | Có | |
| **Mã quy trình** | `def_code` | String(50) | Có | VD: QT-TTTU (Quy trình thanh toán tạm ứng) |
| **Tên quy trình** | `def_name` | String(255) | Có | |
| **Nhóm quy trình** | `category_id` | UUID (FK) | Không | Hành chính, Nhân sự, Kế toán... |
| **Cấu hình Form** | `form_schema` | JSON | Có | Lưu cấu trúc các trường nhập liệu tự thiết kế |
| **Cấu hình Luồng** | `flow_schema` | JSON | Có | Lưu cấu trúc các bước duyệt (BPMN) |
| **Trạng thái** | `is_active` | Boolean | Có | Đang áp dụng hoặc Ngừng áp dụng |

### Bảng 2: `bpm_workflow_instances` (Lượt chạy / Lượt đề xuất)
Mỗi lần một nhân viên tạo một đề xuất (Tạo Ticket), nó sinh ra một Instance.
| Tên trường | Mã trường (Database) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **ID Đề xuất** | `instance_id` | UUID | Có | |
| **Tiêu đề** | `title` | String(255) | Có | VD: "Đề xuất thanh toán công tác phí HN - T10" |
| **ID Định nghĩa** | `def_id` | UUID (FK) | Có | Link tới template của quy trình |
| **Người tạo (Requester)**| `created_by` | UUID (FK) | Có | NV tạo đề xuất (Link tới users table) |
| **Dữ liệu Form** | `form_data` | JSON | Có | Dữ liệu người dùng điền (Key-Value map theo form_schema) |
| **Bước hiện tại** | `current_step_id` | String(100) | Có | ID của node đang bị tắc trong luồng |
| **Người xử lý hiện tại**| `current_assignees`| Array[UUID]| Có | Danh sách những người đang phải duyệt bước này |
| **Trạng thái tổng thể**| `status` | Enum | Có | Chờ xử lý, Đang xử lý, Hoàn thành, Bị từ chối, Đã hủy |
| **Ngày tạo** | `created_at` | DateTime | Có | |
| **Deadline toàn trình** | `due_date` | DateTime | Không | Thời hạn SLA tối đa phải xử lý xong |

### Bảng 3: `bpm_tasks` (Nhiệm vụ Duyệt/Thực hiện của từng bước)
Mỗi khi Lượt đề xuất đi đến một bước, sinh ra Task cho người liên quan.

---

## 2. Quy trình (Business Processes)

### Quy trình Tổng quát: Thiết lập & Vận hành (Design & Run)
1.  **Thiết kế (Admin/HR/Manager):**
    *   Tạo **Form nhập liệu** (Kéo thả các trường Text, Số, File đính kèm, Bảng chi tiết).
    *   Vẽ **Luồng xử lý (Workflow/Phân luồng)**: Bước 1: Quản lý trực tiếp duyệt -> Bước 2: Kế toán kiểm tra chứng từ -> Bước 3: Giám đốc duyệt (Rẽ nhánh: Nếu số tiền < 5tr thì bỏ qua GĐ).
2.  **Thực thi (End User - Nhân viên):**
    *   NV vào cổng thông tin, chọn "Quy trình thanh toán", điền Form và đính kèm hóa đơn -> Bấm Gửi.
3.  **Xử lý (Approvers):**
    *   Hệ thống chuyển ticket đến Nút số 1. Quản lý nhận thông báo -> Vào xem -> Bấm "Đồng ý" hoặc "Từ chối" hoặc "Yêu cầu bổ sung".
    *   Hệ thống tự động chuyển tiếp đến các Nút tiếp theo dựa trên logic rẽ nhánh.
4.  **Kết thúc:** Hoàn thành toàn bộ luồng, người đề xuất nhận thông báo "Đề xuất đã được duyệt".

### Phân quyền (Roles & Permissions)
*   **Quản trị viên Hệ thống/Ứng dụng:** Thiết kế form, Vẽ luồng, Phân quyền người xem/chạy quy trình.
*   **Người thực hiện (Người tạo đề xuất):** Chỉ xem được các đề xuất do mình tạo. Rút lại đề xuất nếu chưa ai duyệt.
*   **Người xử lý (Người duyệt):** Xem được form dữ liệu. Chỉ được sửa dữ liệu nếu bước đó cấu hình cho phép sửa. Để lại ý kiến phản hồi (Comments).
*   **Người theo dõi (Followers):** Được add vào để nhìn thấy tiến trình, không có quyền duyệt.

---

## 3. Luồng nghiệp vụ (Business Workflows)

### Luồng Rẽ Nhánh Tự Động (Conditional Routing Workflow)
*   **Scenario:** Đề xuất mua sắm thiết bị.
*   **Form Input:** Người dùng nhập `total_amount` (Tổng tiền).
*   **Logic Rule trên Gateway (Nút điều kiện):**
    *   Rule 1: Nếu `total_amount` <= 10.000.000 VNĐ -> Route tới Bước: "Trưởng phòng HCNS duyệt" -> Kết thúc.
    *   Rule 2: Nếu `total_amount` > 10.000.000 VNĐ -> Route tới Bước: "Trưởng phòng HCNS duyệt" -> Sau đó route tiếp tới Bước: "Giám đốc tài chính duyệt" -> Kết thúc.
*   **Execution:** Hệ thống Workflow Engine đọc `form_data` (JSON), parse biến `total_amount`, evaluate logic và tạo Task cho đúng người tương ứng.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### API Endpoints Đề xuất
*   `GET /api/v1/office/workflows`: Danh sách các loại quy trình user được phép dùng.
*   `POST /api/v1/office/workflows/{def_id}/instances`: Khởi tạo 1 quy trình mới (Gửi form_data).
*   `GET /api/v1/office/instances/{id}`: Xem chi tiết 1 lượt chạy (bao gồm form_data và lịch sử các bước đã qua).
*   `POST /api/v1/office/instances/{id}/actions`: Thực hiện hành động (Approve, Reject, RequestInfo). Payload: `{ "action": "APPROVE", "comment": "Đồng ý chi", "step_id": "step_2" }`.

### Ràng buộc logic (Business Rules)
*   **Dynamic Assignee Parsing:** Người duyệt có thể là Fix cứng (Ông Nguyễn Văn A), hoặc Động (Quản lý trực tiếp của người đề xuất - Hệ thống tự query cây sơ đồ tổ chức HR để tìm ra Quản lý).
*   **Kiểm tra SLA (Service Level Agreement):** Mỗi bước trong luồng được cấu hình số giờ tối đa phải xử lý. Hệ thống có Background Worker (Cronjob) liên tục quét: Nếu Task nào trễ hạn -> Đánh dấu Overdue màu đỏ -> Gửi email nhắc nhở Người xử lý và cc Quản lý của họ.
*   **Immutable History:** Mọi hành động Duyệt/Từ chối phải lưu Log vào bảng Audit Trail (Thời gian, ID người duyệt, Hành động, IP, Chữ ký số nếu có). KHÔNG THỂ XÓA hoặc SỬA lịch sử này.

### Điểm tích hợp (Integrations)
*   **AMIS Nhân sự / Sơ đồ tổ chức:** Lấy cấp bậc (Manager, Director) để auto-routing (chọn người duyệt tự động).
*   **Hệ thống Ký số (MISA eSign):** Tích hợp nút "Ký số Token/Từ xa" ngay tại bước duyệt của Giám đốc. Khi duyệt, file PDF sinh ra từ Form sẽ được đóng mộc chữ ký điện tử.
*   **Mobile App Push Notifications:** Đẩy thông báo tức thời "Bạn có 1 đề xuất cần duyệt" về app MISA AMIS trên điện thoại.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### Layouts
*   **Trang chủ (My Tasks / Dashboard):**
    *   Khu vực 1: Việc cần tôi xử lý (To-do list).
    *   Khu vực 2: Đề xuất tôi đã gửi (Theo dõi trạng thái: Đang ở bước nào, ai đang giữ).
*   **Màn hình Thiết kế Luồng (Workflow Builder):**
    *   Canvas kéo thả trực quan (như draw.io hoặc bpmn.io). Cột trái là các Tool (Nút Duyệt, Nút Rẽ nhánh, Nút Gửi Email tự động). Khu vực giữa là bảng vẽ. Mũi tên nối các nút. Cột phải là Properties Panel (Cấu hình người duyệt cho nút đang chọn).
*   **Màn hình Thực thi (Xử lý Đề xuất):**
    *   Phần chính: Hiển thị Form dữ liệu read-only để người duyệt đọc.
    *   Sidebar bên phải: Thanh tiến trình (Timeline) thể hiện quy trình. VD: Bước 1 (Tạo) ✅ -> Bước 2 (TP Duyệt) ⏳ Đang chờ anh A -> Bước 3 (GĐ Duyệt) ⚪. Các nút Hành động (Xanh: Đồng ý, Đỏ: Từ chối) neo cố định ở cuối trang.

### UI Components
*   **Visual Workflow Tracker:** Component vẽ lại quy trình dạng Mini-map trên trang chi tiết đề xuất. Node nào đã qua thì màu Xanh, Node hiện tại chớp nháy màu Cam, Node tương lai màu Xám. Rất dễ hiểu cho người dùng cuối.
*   **Comment Thread:** Box bình luận dạng hội thoại (như chat) đính kèm theo từng lượt xử lý để các sếp và nhân viên trao đổi, giải trình thêm về đề xuất (Có tag @mention).

### UX Feedback
*   Lưu nháp (Auto-save): Khi nhân viên đang điền một Form Đề xuất dài (VD: Thanh toán công tác phí có hàng chục dòng), form phải tự động auto-save vào Local Storage hoặc server để tránh mất dữ liệu nếu rớt mạng.
*   Validate Form Real-time: Nếu cấu hình field "Số tiền" là Bắt buộc và Phải > 0. Nếu nhập sai, khung input đỏ lên ngay lập tức và báo lỗi trước khi bấm Gửi.
