# Tiêu chí nghiệm thu

> Tiêu chí nghiệm thu cho từng chức năng, điều kiện xác định đúng hoặc sai.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Quy ước

- Mã tiêu chí: `AC-nn`.
- Viết dạng **Cho, Khi, Thì**.
- Bắt buộc có ít nhất một trường hợp thất bại về quyền (AC-02, AC-03).
- Quyền do máy chủ quyết định; ẩn nút trên giao diện không được coi là bảo mật.

## 2. Tiêu chí nghiệm thu

### AC-01. Đăng nhập người bán cấp token
- Cho người bán đã đăng ký, Khi gửi thông tin đăng nhập đúng tới `POST /api/seller/auth/login` (`server.ts:3447`), Thì nhận `seller`, `role` và `token` (`server.ts:3514`).

### AC-02. Truy cập người bán không token bị từ chối (thất bại về quyền)
- Cho client không có token, Khi gọi `GET /api/seller/data/:sellerId` (`server.ts:3540`), Thì nhận HTTP 401 (middleware `requireSellerAuth`, `server.ts:424`).

### AC-03. Token của người bán A không đọc được dữ liệu người bán B (thất bại về quyền)
- Cho token hợp lệ của người bán A, Khi gọi `GET /api/seller/data/:sellerId` với `:sellerId` của người bán B, Thì `sellerId` bị **ghi đè** bằng A (`server.ts:424`), không trả dữ liệu của B.

### AC-04. Token bị sửa đổi bị từ chối
- Cho token hợp lệ bị sửa một ký tự, Khi gọi route người bán, Thì nhận 401 (chữ ký HMAC không khớp, `src/lib/sellerAuth.ts`).

### AC-05. Token hết hạn bị từ chối
- Cho token có `exp` đã qua, Khi gọi route người bán, Thì nhận 401 (`verifySellerToken` kiểm tra hạn).

### AC-06. Quản trị iPOS fail-closed
- Cho khóa `IPOS_ADMIN_API_KEY` chưa đặt, Khi gọi `/api/ipos/accounts` (`server.ts:4072`), Thì request bị từ chối (`requireIposAdmin`, `server.ts:477`).

### AC-07. Open API cần khóa hợp lệ
- Cho khóa Open API sai, Khi gọi `/api/openapi/orders` (`server.ts:3007`), Thì nhận lỗi xác thực (`authenticateOpenApi`, `server.ts:2667`).

### AC-08. Duyệt phiếu kho không vượt tồn
- Cho phiếu xuất vượt tồn kho, Khi duyệt phiếu, Thì `validateVoucherApproval` từ chối (pattern #89, `d65dc6a`).

### AC-09. Khóa sổ dùng vân tay SHA-256 giữ dấu
- Cho số liệu khóa sổ, Khi tạo vân tay, Thì dùng `hashLedgerClosing` SHA-256 giữ dấu, không dùng `Math.abs` (pattern #75, `src/services/ledgerClosing.ts`).

### AC-10. Ghi thanh toán lỗi phải báo, không nuốt thầm
- Cho lỗi khi ghi bảng `payments`, Khi `handleOrderPaymentTrigger` chạy, Thì gọi `reportWriteFailure` báo lỗi, không `console.error` đơn thuần (pattern #74, `128dd2f`).

### AC-11. RLS `domain_events` chặn ẩn danh (chưa đạt — cần migrate)
- Cho caller giữ anon key chưa đăng nhập, Khi đọc `domain_events` của tenant mặc định, Thì bị chặn bởi policy mới (`006_harden_domain_events_rls.sql`) sau khi chạy migration. Hiện chưa áp dụng lên môi trường.

### AC-12. `/api/gemini/db-query` cần guard (chưa đạt)
- Cho client bất kỳ, Khi gọi `POST /api/gemini/db-query` (`server.ts:1554`), Thì phải bị từ chối khi thiếu quyền. Hiện **chưa có guard** → chưa đạt.

## 3. Bảng tổng hợp trạng thái

| Mã | Tiêu chí | Trạng thái | Bằng chứng |
|---|---|---|---|
| AC-01 | Cấp token khi đăng nhập | Đạt (unit test) | `src/lib/sellerAuth.test.ts` |
| AC-02 | Không token → 401 | Đạt (guard có) | `server.ts:424` |
| AC-03 | Chống IDOR chéo | Đạt (ghi đè sellerId) | `server.ts:424`, `sellerAuthGuards.test.ts` |
| AC-04 | Token sửa đổi → 401 | Đạt (unit test) | `src/lib/sellerAuth.test.ts` |
| AC-05 | Token hết hạn → 401 | Đạt (unit test) | `src/lib/sellerAuth.test.ts` |
| AC-06 | iPOS fail-closed | Đạt (guard có) | `server.ts:477` |
| AC-07 | Open API cần khóa | Đạt (guard có) | `server.ts:2667` |
| AC-08 | Kho không vượt tồn | Đạt | `d65dc6a` |
| AC-09 | Khóa sổ SHA-256 | Đạt | `src/services/ledgerClosing.ts` |
| AC-10 | Báo lỗi ghi payments | Đạt | `128dd2f` |
| AC-11 | RLS chặn ẩn danh | Chưa áp dụng lên môi trường | `006_harden_domain_events_rls.sql` |
| AC-12 | db-query cần guard | **Chưa đạt** | `server.ts:1554` |

## Chưa xác minh được

- Các ca kiểm thử HTTP đầu-cuối (smoke) cho AC-02/AC-03 trên môi trường thật — hiện chỉ có unit test đọc mã nguồn, chưa gọi server.
- Ngưỡng tồn kho cụ thể trong AC-08 (giá trị biên).
- Cấu hình thực tế của khóa Open API/iPOS ở Production.
