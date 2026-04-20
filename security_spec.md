# Security Specification: V-ERP Enterprise Edition

## 1. Data Invariants
- Một sản phẩm (Product) không thể có số lượng tồn kho âm.
- Một đơn hàng (Order) phải được tạo bởi một nhân viên (Staff) có tài khoản đã xác thực email.
- Trạng thái đơn hàng chỉ có thể thay đổi theo luồng: `pending` -> `completed` / `cancelled`.
- Khách hàng (Customer) chỉ có thể được tạo bởi nhân viên.
- Nhân viên (Staff) chỉ có thể xem dữ liệu nếu họ có trong danh sách trắng (`staff` collection).

## 2. The "Dirty Dozen" Payloads (Deny cases)
1. **Identity Spoofing**: Tạo Order với `staffId` của người khác.
2. **Schema Poisoning**: Gửi trường `price: "free"` (chuỗi thay vì số).
3. **Ghost Fields**: Thêm trường `isVerified: true` vào hồ sơ Customer.
4. **Denial of Wallet**: Gửi doc ID dài 10MB để gây tốn phí lưu trữ.
5. **State Shortcut**: Cập nhật trực tiếp status Order thành `returned` mà không qua bước `completed`.
6. **Self-Promotion**: Người dùng bình thường tự tạo doc trong `/staff/{uid}` với `role: 'admin'`.
7. **PII Leak**: Người dùng không thuộc Staff cố gắng đọc toàn bộ danh sách `/customers`.
8. **Unverified Write**: Sử dụng tài khoản email chưa xác thực để tạo đơn hàng.
9. **Price Manipulation**: Sửa giá sản phẩm (`products`) mà không có quyền Admin.
10. **Inventory Wipe**: Sửa tồn kho sản phẩm thành âm qua client.
11. **Orphaned Order**: Tạo Order tham chiếu đến `customerId` không tồn tại (cần check relational).
12. **Recursive List Query**: Thực hiện list query trên `/orders` mà không dùng filter `staffId`.

## 3. Test Runner (Conceptual)
Sử dụng `@firebase/rules-unit-testing` để chạy các case trên.
(Lưu ý: Trong môi trường này tôi sẽ thực hiện audit thủ công và triển khai rules đã vá lỗi).
