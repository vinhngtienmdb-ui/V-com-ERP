# Feature Specification: Duyệt đề xuất đa cấp & Hóa đơn (Phase 5)

## 1. Mục tiêu Nghiệp vụ (Business Goals)
- Thiết lập quy trình kiểm soát phê duyệt đề xuất (mua sắm, tạm ứng, nghỉ phép) chặt chẽ bằng cách áp dụng hạn mức tài chính phê duyệt phân quyền theo vai trò.
- Đồng bộ hóa trạng thái phê duyệt đề xuất với hệ thống thông báo tự động (ZNS) nhằm rút ngắn thời gian phản hồi của các bên liên quan.
- Hỗ trợ xuất mẫu in/PDF phiếu đề xuất chuẩn hóa chứng từ kế toán.

## 2. Phạm vi Sản phẩm (Scope)
- **Hạn mức phê duyệt đề xuất (Approval Thresholds)**:
  - Nhân viên (Staff): Hạn mức duyệt 0 VND (chỉ đề xuất).
  - Trưởng phòng (Manager/Lead): Hạn mức duyệt tối đa 20,000,000 VND.
  - Giám đốc (Director/Admin): Hạn mức duyệt vô hạn.
  - Khi duyệt đề xuất có ghi nhận số tiền (`amount`), hệ thống tự động đối chiếu vai trò người duyệt hiện tại và từ chối/cảnh báo nếu vượt quá quyền hạn.
- **Tích hợp Zalo ZNS thông báo**:
  - Khi đề xuất được duyệt hoặc từ chối tại các cấp, tự động kích hoạt gửi tin nhắn ZNS thông báo trạng thái kèm mã đề xuất tới người gửi.
- **Quản lý xuất PDF hóa đơn đề xuất**:
  - Tạo giao diện in biểu mẫu đề xuất chuẩn hóa (phiếu chi, phiếu tạm ứng, phiếu mua sắm) hỗ trợ lưu dưới định dạng PDF.

## 3. Tiêu chí Thành công (Success Criteria)
- Các đề xuất có số tiền lớn hơn 20,000,000 VND bắt buộc phải qua cấp phê duyệt Director/Admin. Trưởng phòng không thể phê duyệt cuối cùng.
- Trạng thái `currentLevel`, `approvalLog` của đề xuất đa cấp được lưu trữ đầy đủ vào database Supabase/Firestore.
- Hóa đơn/PDF đề xuất hiển thị chuẩn xác chữ ký điện tử và chữ ký số mã hóa (nếu có).

## 4. Các Kịch bản Chấp nhận (Acceptance Scenarios)
- **Kịch bản 1**: Người dùng vai trò Manager cố gắng duyệt đề xuất tạm ứng trị giá 25,000,000 VND. Hệ thống hiển thị thông báo lỗi "Vượt quá hạn mức phê duyệt tối đa của Trưởng phòng (20Mđ)".
- **Kịch bản 2**: Người dùng vai trò Director phê duyệt đề xuất mua sắm 50,000,000 VND. Hệ thống hoàn thành phê duyệt cuối cùng, lưu lịch sử duyệt của Director vào `approvalLog` trong database và gửi thông báo Zalo ZNS thành công.
