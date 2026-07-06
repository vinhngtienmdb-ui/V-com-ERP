# Feature Specification: CRM, CSKH & Điểm Loyalty (Phase 4)

## 1. Mục tiêu Nghiệp vụ (Business Goals)
Nâng cao mức độ hài lòng, trải nghiệm khách hàng và chuẩn hóa dịch vụ sau bán hàng bằng cách:
- Phân khúc khách hàng tự động dựa trên phân tích RFM (Recency, Frequency, Monetary) thật từ dữ liệu lịch sử mua hàng thực tế.
- Xây dựng hệ thống quản lý ví điểm thưởng tích lũy (Loyalty points ledger) đáng tin cậy phục vụ các hoạt động Marketing/Chăm sóc khách hàng.
- Chuẩn hóa quy trình xử lý phản hồi khiếu nại (CSKH Tickets) với cam kết chất lượng dịch vụ (SLA) rõ ràng tương ứng với từng cấp độ ưu tiên.

## 2. Phạm vi Sản phẩm (Scope)
- **Hệ thống phân hạng RFM**:
  - `Recency`: Số ngày kể từ đơn hàng hoàn thành cuối cùng.
  - `Frequency`: Tổng số đơn hàng đã mua.
  - `Monetary`: Tổng số tiền đã thanh toán tích lũy.
  - Tự động phân cấp khách hàng thành các hạng: Đồng (Bronze), Bạc (Silver), Vàng (Gold), Bạch Kim (Platinum), Kim Cương (Diamond).
- **Ví điểm Loyalty Ledger**:
  - Ghi nhận mọi giao dịch thay đổi ví điểm (tích lũy/tiêu dùng/hoàn trả) vào bảng `loyalty_points_ledger`.
  - Tích lũy điểm khi hoàn tất đơn hàng (Ví dụ: 10,000 VND doanh số = 1 điểm).
- **Khiếu nại & SLA CSKH**:
  - Tạo ticket hỗ trợ với quy định hạn xử lý SLA (Low: 48h, Medium: 24h, High: 4h, Urgent: 1h).
  - Tự động cảnh báo quá hạn SLA nếu quá deadline mà trạng thái chưa chuyển sang `resolved` hoặc `closed`.

## 3. Tiêu chí Thành công (Success Criteria)
- Điểm RFM được cập nhật tự động và chính xác sau mỗi thay đổi trạng thái đơn hàng của khách hàng.
- Số dư ví điểm Loyalty của khách hàng khớp hoàn hảo với tổng các dòng ghi nhận trong sổ `loyalty_points_ledger`.
- Cảnh báo vi phạm SLA hoạt động đúng thời gian thực tế.

## 4. Các Kịch bản Chấp nhận (Acceptance Scenarios)
- **Kịch bản 1**: Khi đơn hàng hoàn thành, khách hàng được tự động cộng điểm tích lũy tương ứng và cập nhật lại điểm RFM.
- **Kịch bản 2**: Tạo mới Ticket khiếu nại với mức ưu tiên Urgent, hạn xử lý SLA tự động set là 1 giờ kể từ thời điểm tạo.
- **Kịch bản 3**: Bảng điều khiển CRM hiển thị cảnh báo vi phạm SLA nếu xử lý quá giờ quy định.
