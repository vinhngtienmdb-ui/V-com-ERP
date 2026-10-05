# Đặc tả nghiệp vụ: Phân hệ Công việc (Tasks & Projects)

> **Quy ước tham chiếu:** "MISA AMIS" và các sản phẩm MISA được nhắc tới trong tài liệu này là **sản phẩm tham khảo** để minh họa cách làm nghiệp vụ, **không phải yêu cầu bắt buộc**. VComm tự xây dựng tính năng tương đương trên nền tảng của mình.

## 1. Trường dữ liệu (Data Fields)

AMIS Công việc là giải pháp quản lý Công việc cá nhân, Quản lý Dự án (Project Management) và Phối hợp phòng ban (Team Collaboration) tương tự Asana/Trello/Jira.

### Bảng 1: `task_projects` (Dự án / Nhóm công việc)
Tập hợp chứa các công việc, dùng để quản lý 1 Dự án cụ thể (VD: Triển khai phần mềm) hoặc 1 Phòng ban (VD: Công việc phòng Marketing).
| Tên trường | Mã trường (Database) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **ID Dự án** | `project_id` | UUID | Có | |
| **Tên dự án** | `project_name` | String(255) | Có | |
| **Mô tả** | `description` | Text | Không | Mục tiêu dự án |
| **Trạng thái** | `status` | Enum | Có | Đang thực hiện, Tạm dừng, Hoàn thành |
| **Ngày bắt đầu** | `start_date` | Date | Không | |
| **Ngày kết thúc** | `end_date` | Date | Không | |
| **Người quản trị**| `manager_id` | UUID (FK) | Có | Project Manager |
| **Loại hiển thị** | `view_type` | Enum | Không | Mặc định mở view: List, Kanban, Gantt |

### Bảng 2: `tasks` (Công việc chi tiết)
Đơn vị hạt nhân của phân hệ.
| Tên trường | Mã trường (Database) | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **ID Công việc** | `task_id` | UUID | Có | |
| **Tên công việc** | `title` | String(500) | Có | Vd: "Thiết kế banner chiến dịch X" |
| **Dự án/Nhóm** | `project_id` | UUID (FK) | Có* | *Có thể thuộc Dự án "Việc cá nhân" |
| **Nhóm việc con** | `task_group_id` | UUID (FK) | Không | Dùng để phân chia Nhóm (Cột Kanban/Section) |
| **Mô tả chi tiết** | `description` | Rich Text | Không | Nội dung yêu cầu công việc |
| **Người thực hiện**| `assignee_id` | UUID (FK) | Không | Người chịu trách nhiệm làm việc này |
| **Người giao việc**| `assignor_id` | UUID (FK) | Có | Người tạo / giao việc |
| **Hạn hoàn thành** | `due_date` | DateTime | Không | Deadline (Có thể chứa cả giờ) |
| **Trạng thái** | `status` | Enum | Có | Cần làm (To Do), Đang làm (Doing), Đã xong (Done) |
| **Mức độ ưu tiên** | `priority` | Enum | Có | Thấp, Bình thường, Cao, Khẩn cấp |
| **Khối lượng (Tiến độ)**| `progress_percent`| Integer | Không | 0 - 100% |
| **Công việc cha** | `parent_task_id`| UUID (FK) | Không | Dùng khi chia Sub-tasks |

### Master Data / Bảng phụ
*   `task_comments`: Lưu bình luận trao đổi trong task.
*   `task_attachments`: Files đính kèm (Hình ảnh, tài liệu).
*   `task_followers`: Những người liên quan cần nhận thông báo theo dõi.

---

## 2. Quy trình (Business Processes)

### Quy trình Giao Việc và Thực Hiện (Task Execution)
1.  **Lập kế hoạch (Planning):** Trưởng dự án tạo Dự án mới. Tạo các Nhóm công việc (Giai đoạn 1, Giai đoạn 2...).
2.  **Tạo & Giao việc (Delegation):** Người quản lý hoặc nhân viên tạo Task mới. Điền tiêu đề, mô tả yêu cầu rõ ràng. Đặt Deadline. Chọn Người thực hiện (Assignee) -> Hệ thống báo notification cho người đó.
3.  **Thực thi & Phối hợp (Collaboration):** Assignee nhận việc, đổi trạng thái sang "Đang làm". Trong quá trình làm, có vấn đề cần hỏi thì tag tên (@mention) người giao việc vào mục Bình luận (Comments) của Task. Đính kèm file kết quả trung gian.
4.  **Cập nhật Tiến độ & Hoàn thành:** Assignee kéo thả task qua cột "Đã xong" (Hoặc tick checkbox). Hoặc cập nhật tiến độ lên 100%. Người giao việc nhận thông báo để vào nghiệm thu. (Có thể cấu hình thêm bước Duyệt task trước khi Đóng).

### Phân quyền (Roles & Permissions)
Trong phạm vi 1 Dự án:
*   **Project Manager:** Toàn quyền thêm/sửa/xóa tất cả Tasks, Cài đặt dự án, Thêm bớt thành viên.
*   **Member (Thành viên):** Được tạo task mới. Được chuyển trạng thái/comment vào task do mình làm hoặc task public trong dự án.
*   **Guest/Client (Tùy chọn):** Khách hàng hoặc đối tác bên ngoài chỉ xem được những task được chia sẻ (Read-only status).

---

## 3. Luồng nghiệp vụ (Business Workflows)

### Luồng Công việc Phụ thuộc (Task Dependencies)
*   Trong các dự án theo mô hình Thác nước (Waterfall).
*   **Setup:** Thiết lập logic Task B (Lập trình) bị Phụ thuộc (Blocker/Waiting on) bởi Task A (Thiết kế giao diện).
*   **Action & Trigger:**
    *   Assignee của Task B KHÔNG THỂ đánh dấu Task B là Hoàn thành (Nút Check mark bị mờ) chừng nào Task A chưa đổi trạng thái "Done".
    *   Ngay khi Task A được đánh dấu "Done", hệ thống auto-trigger gửi Notification nhắc nhở Assignee của Task B: "Công việc Thiết kế đã xong, bạn có thể bắt đầu Lập trình".
*   Nếu Hạn hoàn thành của Task A bị dời (Delay), Hạn hoàn thành của Task B tự động tịnh tiến dời theo cấu hình Gantt chart.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### API Endpoints Đề xuất
*   `GET /api/v1/office/projects/{id}/tasks`: Lấy toàn bộ task của 1 dự án. (Hỗ trợ query phân trang, Sort theo nhóm `task_group_id` cho Kanban).
*   `POST /api/v1/office/tasks`: Tạo công việc mới.
*   `PUT /api/v1/office/tasks/{id}/status`: API cập nhật nhanh trạng thái/Tiến độ (Dùng nhiều nhất).
*   `POST /api/v1/office/tasks/{id}/comments`: Đăng bình luận.

### Ràng buộc logic (Business Rules)
*   **Kiểm tra Quyền (Authorization check):** API phải check cứng: Nếu Task được đánh dấu là "Riêng tư" (Private Task), thì chỉ có `assignor_id`, `assignee_id` và những người trong mảng `followers` mới được phép GET chi tiết task đó. Các thành viên khác trong dự án query danh sách sẽ không thấy.
*   **Update Recursion (Cập nhật tiến độ đệ quy):** Nếu Task A có 4 Sub-tasks (Việc con). Khi Sub-task thứ 1 hoàn thành (1/4) -> Backend tự động trigger tính toán lại `progress_percent` của Task cha lên 25%. Tránh việc user phải cập nhật tay ở nhiều nơi.

### Điểm tích hợp (Integrations)
*   **Google Calendar / Outlook:** Đồng bộ thời hạn các Tasks vào lịch cá nhân của nhân viên (Tính năng Subcribe Calendar Link).
*   **MISA AMIS Mạng Xã Hội (Newsfeed):** Khi 1 Dự án lớn khởi động hoặc cán đích, tự động bắn bài viết thông báo lên Tường công ty.
*   **Email System:** Reply email thông báo Task sẽ tự động chuyển thành Comment bên trong Task đó (Email parsing).

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### Layouts
Phân hệ Công việc bắt buộc phải hỗ trợ chuyển đổi linh hoạt (Toggle) giữa 3 giao diện hiển thị cho cùng 1 bộ dữ liệu:
1.  **List View (Bảng danh sách):** Hiển thị dạng bảng, gộp nhóm (group-by) theo Trạng thái hoặc Người thực hiện. Thích hợp thao tác hàng loạt, xem chi tiết nhiều field.
2.  **Kanban Board:** Bảng thẻ. Các cột là các "Trạng thái" hoặc "Nhóm công việc". Thích hợp quy trình Agile/Scrum.
3.  **Gantt Chart (Biểu đồ thời gian):** Trục hoành là Timeline (Ngày/Tháng). Trục tung là danh sách Task. Thể hiện dạng thanh bar nối với nhau để nhìn bao quát toàn bộ lịch trình dự án.

### UI Components
*   **Task Detail Sidebar (Drawer):** Khi click vào 1 Task trong Kanban hoặc List, KHÔNG chuyển trang mà trượt (Slide in) một thanh Sidebar lớn từ cạnh phải màn hình (hoặc mở Modal lớn). Nửa trên là Thông tin/Mô tả, Nửa dưới là Tab Bình luận & Đính kèm.
*   **Quick Add Input:** Ở dưới cùng mỗi cột Kanban, luôn có sẵn 1 ô Text input + Nút Enter. Gõ Text -> Enter -> Nhảy ra Card mới ngay lập tức (Tối ưu tốc độ tạo task, giống Trello).
*   **User Avatar Stack:** Cột hiển thị Người thực hiện/Người theo dõi xếp chồng các hình tròn Avatar lên nhau gọn gàng.

### UX Feedback
*   **Hiệu ứng Hoàn thành (Gamification):** Khi tick ô Checkbox (Hoàn thành) một Task quan trọng, phát âm thanh "Ting" nhẹ và icon tick xanh xoay tròn mượt mà để tạo cảm giác thỏa mãn (Reward) cho người dùng.
*   **Cảnh báo Deadline (Visual cues):** Task quá hạn (`due_date` < now) thì text Ngày tháng hiển thị Đỏ rực. Task đến hạn hôm nay hiển thị màu Vàng/Cam.
*   **Drag & Drop (Kéo thả):** Hỗ trợ kéo thả thả Card trên Kanban để đổi trạng thái. Hỗ trợ kéo thanh Bar trên biểu đồ Gantt để dời Deadline mượt mà không có độ trễ (Optimistic UI update).
