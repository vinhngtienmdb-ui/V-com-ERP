# Đặc tả nghiệp vụ: Phân hệ Khen thưởng - Kỷ luật (Rewards & Discipline)

> **Quy ước tham chiếu:** "MISA AMIS" và các sản phẩm MISA được nhắc tới trong tài liệu này là **sản phẩm tham khảo** để minh họa cách làm nghiệp vụ, **không phải yêu cầu bắt buộc**. VComm tự xây dựng tính năng tương đương trên nền tảng của mình.

## 1. Trường dữ liệu (Data Fields)

### 1.1 Quyết định Khen thưởng / Kỷ luật (Decisions)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `decision_id` | UUID | Yes | Mã quyết định |
| `decision_number`| String | Yes | Số quyết định (VD: QD-KT-001) |
| `type` | Enum | Yes | Loại: REWARD (Khen thưởng), DISCIPLINE (Kỷ luật) |
| `category_id` | UUID | Yes | Hình thức (VD: Tiền mặt, Bằng khen, Cảnh cáo, Sa thải) |
| `reason` | Text | Yes | Lý do cụ thể |
| `effective_date` | Date | Yes | Ngày hiệu lực |
| `signer_id` | UUID | Yes | Người ký quyết định |
| `status` | Enum | Yes | DRAFT, PENDING_APPROVAL, APPROVED, REJECTED |

### 1.2 Danh sách nhân viên liên quan (Affected Employees)
| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `record_id` | UUID | Yes | Mã bản ghi chi tiết |
| `decision_id` | UUID | Yes | Thuộc quyết định nào |
| `employee_id` | UUID | Yes | Mã nhân viên |
| `amount` | Decimal | No | Số tiền thưởng/phạt (nếu có) |
| `taxable` | Boolean | No | Có tính vào thu nhập chịu thuế TNCN không? |

### Master Data
- Danh mục Hình thức Khen thưởng (Thưởng nóng, Gương mặt của năm, Thưởng thâm niên...).
- Danh mục Hình thức Kỷ luật (Khiển trách, Cảnh cáo toàn công ty, Giáng chức, Sa thải).

---

## 2. Quy trình (Business Processes)

1. **Đề xuất (Nomination/Incident Report)**: 
   - *Khen thưởng*: Trưởng phòng hoặc Đồng nghiệp tạo đề xuất vinh danh một cá nhân/tập thể có thành tích xuất sắc.
   - *Kỷ luật*: Khi có vi phạm nội quy (Vd: Đi muộn nhiều, lỗi nghiệp vụ), quản lý lập biên bản sự việc.
2. **Xác minh & Họp Hội đồng**: Với kỷ luật nặng (Sa thải, giáng chức), hệ thống ghi nhận biên bản cuộc họp Hội đồng Kỷ luật, cho phép người lao động giải trình.
3. **Phê duyệt Quyết định**: HR tổng hợp đề xuất trình Giám đốc phê duyệt.
4. **Ban hành & Công bố**: Hệ thống sinh Quyết định bản mềm (PDF), ký số, lưu vào Hồ sơ nhân sự và tùy chọn đăng lên Bảng tin nội bộ (Newsfeed).
5. **Thực thi Tài chính**: Chuyển số tiền thưởng/phạt sang Bảng lương kỳ hiện tại.

**Phân quyền (Roles):**
- `Employee`: Đề xuất khen thưởng đồng nghiệp, xem kỷ luật của mình.
- `Manager`: Đề xuất khen thưởng/kỷ luật cấp dưới.
- `HR / Legal`: Soạn thảo quyết định, tổ chức họp kỷ luật.
- `BOD / Giám đốc`: Phê duyệt quyết định chính thức.

---

## 3. Luồng nghiệp vụ (Business Workflows)

- **Workflow Đề xuất Khen thưởng (Peer-to-Peer Recognition)**: Nhân viên A gửi "Thẻ khen ngợi" (Kudos) + điểm thưởng (Points) cho Nhân viên B trên hệ thống -> Điểm tự cộng vào quỹ điểm cá nhân của B -> B dùng điểm đổi quà (Giftcard/Tiền) cuối tháng.
- **Workflow Trừ lương do Kỷ luật**: Kỷ luật đi muộn được duyệt -> Tạo bản ghi Phạt 500,000 VND -> Sang kỳ chốt lương cuối tháng, Phân hệ Lương tự động fetch bản ghi này và map vào cột `Khấu trừ khác`, lý do: Vi phạm nội quy ngày XX.
- **Workflow Sa thải**: Quyết định Kỷ luật hình thức "Sa thải" được Approve -> Tự động trigger luồng Offboarding (Nghỉ việc) -> Đổi status của Employee thành `RESIGNED` vào `effective_date`.

---

## 4. Hướng dẫn kỹ thuật (Technical Guidelines)

### 4.1 API Endpoints (RESTful)
- `POST /api/v1/rewards-discipline/decisions`: Tạo quyết định khen thưởng/kỷ luật.
- `GET /api/v1/rewards-discipline/employees/{id}/history`: Lấy lịch sử khen thưởng/kỷ luật của 1 nhân viên.
- `POST /api/v1/rewards-discipline/recognitions`: API gửi Kudos/Vinh danh đồng nghiệp.

### 4.2 Ràng buộc logic (Business Rules)
- Tiền thưởng (nếu chọn loại Thưởng tiền mặt) phải được thiết lập cờ `taxable` = True/False dựa theo luật Thuế (VD: Thưởng lễ tết chịu thuế, Thưởng sáng kiến tuỳ điều kiện).
- Không cho phép xoá (Delete) các Quyết định kỷ luật đã `APPROVED`, chỉ cho phép lập Quyết định Xóa Kỷ luật (nếu được ân xá/hết hạn).
- Kỷ luật mức "Sa thải" phải Validate có thông tin Biên bản họp hội đồng (Compliance check theo Luật Lao động).

### 4.3 Điểm tích hợp (Integrations)
- **Mạng xã hội nội bộ (AMIS Mạng Xã Hội / Workplace)**: Webhook bắn thông báo khen thưởng/vinh danh nhân viên xuất sắc của tháng lên Wall chung để mọi người vào thả tim, comment chúc mừng.
- **Phân hệ Lương**: Truyền Amount Earning/Deduction sang Payroll.
- **Hồ sơ nhân viên**: Update trực tiếp vào Tab "Khen thưởng / Kỷ luật" trên Employee Profile.

---

## 5. Hướng dẫn giao diện (UI/UX Guidelines)

### 5.1 Layouts
- **Wall of Fame (Bảng vàng vinh danh)**: Dashboard bắt mắt, hiển thị Slider ảnh các nhân viên xuất sắc của tuần/tháng kèm câu trích dẫn (Quote).
- **Incident Board**: Bảng quản lý riêng tư (dành cho HR/Manager) theo dõi các vụ việc vi phạm đang xử lý (Kanban: Chờ xác minh -> Đang giải trình -> Trình duyệt -> Đã ra quyết định).
- **Decision Detail View**: Form nhập liệu chia 2 phần: Thông tin chung (Số, Ngày, Lý do) và Bảng danh sách nhân viên áp dụng (Có thể copy/paste từ Excel vào Grid).

### 5.2 UI Components
- `Kudos/Badge Selector`: Giao diện chọn icon huy hiệu (Ngôi sao, Ngọn lửa, Huy chương) khi vinh danh đồng nghiệp. Đồ họa dạng Gamification.
- `Confetti / Sound Effect`: Tùy chọn nổ pháo hoa và phát âm thanh khi nhân viên mở App nhận được Quyết định khen thưởng.
- `Document Preview`: Xem ngay file Quyết định scan pdf có chữ ký đỏ.

### 5.3 UX Feedback
- Khi lập Quyết định Kỷ luật, tone màu của UI cảnh báo (Đỏ/Cam) rõ ràng để người thao tác cẩn trọng, tránh sai sót.
- Bulk Add: Có nút "Thêm toàn bộ nhân viên phòng X" hoặc "Thêm nhân viên thâm niên > 5 năm" để thao tác nhanh khi làm Khen thưởng tập thể.
