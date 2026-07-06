# Feature Specification: Kế toán Sổ kép & Ví Đối soát (Phase 3)

## 1. Mục tiêu Nghiệp vụ (Business Goals)
Đảm bảo tính chính xác, minh bạch và an toàn tài chính cho toàn bộ hệ thống VComm ERP bằng cách:
- Tự động hóa hạch toán sổ kép (Double-entry accounting) cho mọi nghiệp vụ phát sinh: doanh thu, giá vốn, xuất kho, hoa hồng CTV, và nạp/rút ví.
- Ngăn chặn hoàn toàn việc can thiệp dữ liệu tài chính cũ thông qua cơ chế khóa sổ kế toán bất biến (Immutable period closing).
- Quản lý ví số dư đại lý / đối tác an toàn, đảm bảo tính khớp hạn mức rút tiền và hạch toán trực tiếp sang sổ cái.
- Tách biệt và chuẩn hóa luồng đối soát 4 lớp độc lập: Nhà bán hàng (Seller), Hoa hồng CTV (Affiliate), Điểm nhận hàng (Store/Pickup), và Vận chuyển/COD.

## 2. Phạm vi Sản phẩm (Scope)
- **Hệ thống hạch toán tự động**: Tự động sinh `journal_entries` khi:
  - Hoàn tất đơn hàng: Ghi nhận doanh thu (Debit 131 / Credit 511, 3331) và Giá vốn hàng bán (Debit 632 / Credit 156).
  - Chiết khấu hoa hồng CTV: Ghi nhận chi phí bán hàng (Debit 641 / Credit 3388).
  - Phê duyệt lệnh rút ví: Ghi nhận giảm phải trả (Debit 3388 / Credit 1121).
- **Khóa sổ kế toán**: Ngăn cấm tạo, sửa đổi hoặc xóa bất kỳ bút toán nào có ngày phát sinh trước hoặc bằng ngày khóa sổ kế toán (`closingLockDate`).
- **Ví & Hạn mức**: Ràng buộc hạn mức rút tiền tối thiểu, hạn mức ngày, và cập nhật số dư qua cơ chế transaction an toàn.

## 3. Tiêu chí Thành công (Success Criteria)
- 100% bút toán sinh ra tự động phải có Tổng Nợ (Debit) = Tổng Có (Credit).
- Mọi nỗ lực ghi sổ vào kỳ đã khóa phải bị từ chối với lỗi rõ ràng.
- Ghi nhận chi tiết lịch sử biến động ví khớp hoàn toàn với sổ công nợ đại lý.

## 4. Các Kịch bản Chấp nhận (Acceptance Scenarios)
- **Kịch bản 1**: Giao dịch hoàn tất đơn hàng tự động sinh ra bút toán hạch toán doanh thu và giá vốn hàng bán tương ứng.
- **Kịch bản 2**: Khi kế toán thực hiện khóa sổ đến ngày YYYY-MM-DD, mọi tác vụ hạch toán phát sinh trước ngày đó đều bị hệ thống chặn lại.
- **Kịch bản 3**: Lệnh rút tiền vượt hạn mức ngày hoặc số dư ví khả dụng sẽ bị từ chối ngay lập tức ở giao diện và dịch vụ lõi.
