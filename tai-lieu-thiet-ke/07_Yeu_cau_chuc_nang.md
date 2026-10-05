# Yêu cầu chức năng

> Mã chức năng, tên chức năng, mục đích, người sử dụng, điều kiện thực hiện, dữ liệu đầu vào, quy trình xử lý, kết quả đầu ra, quy tắc nghiệp vụ, trường hợp ngoại lệ, phân quyền, thông báo lỗi.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Quy ước

- Mã chức năng: `FR-nn`, đánh số tăng dần, không tái sử dụng.
- Quy tắc nghiệp vụ tham chiếu `BR-xx` (xem `04_Quy_tac_nghiep_vu.md`).
- Phân quyền: theo `05_Vai_tro_nguoi_dung.md` (4 cơ chế xác thực ở `server.ts`).

## 2. Danh sách chức năng

### FR-01. Đăng ký và đăng nhập người bán
- Người sử dụng: Người bán, Nhân viên người bán.
- Đầu vào: thông tin đăng ký/đăng nhập (email, mật khẩu).
- Xử lý: `POST /api/seller/auth/register` (`server.ts:3346`); `POST /api/seller/auth/login` (`server.ts:3447`) truy vấn `seller_staffs` + `sellers` (`server.ts:41-59`) rồi cấp token HMAC.
- Đầu ra: hồ sơ `seller`, `role`, `token` (`server.ts:65-68`).
- Ngoại lệ: sai thông tin → không cấp token, trả lỗi.
- Phân quyền: công khai (có rate limit `authRateLimiter`).

### FR-02. Quản lý sản phẩm người bán
- Người sử dụng: Người bán.
- Xử lý: `POST /api/seller/products/create` (`server.ts:3638`); `DELETE /api/seller/products/delete/:id` (`server.ts:3667`).
- Phân quyền: `requireSellerAuth`; `sellerId` lấy từ token.

### FR-03. Quản lý trạng thái đơn hàng người bán
- Người sử dụng: Người bán.
- Xử lý: `POST /api/seller/orders/status` (`server.ts:3683`).
- Phân quyền: `requireSellerAuth`.

### FR-04. Ví và rút tiền người bán
- Người sử dụng: Người bán.
- Xử lý: `POST /api/seller/wallet/withdraw` (`server.ts:3792`).
- Ngoại lệ: ghi đường tiền chưa nguyên tử (M3) — có thể lệch số dư nếu ghi dở dang.
- Phân quyền: `requireSellerAuth`.

### FR-05. Khuyến mãi
- Người sử dụng: Người bán.
- Xử lý: `POST /api/seller/promotions/create` (`server.ts:3829`); màn hình `FlashSale.tsx`, `GroupBuy.tsx`.
- Phân quyền: `requireSellerAuth`.

### FR-06. Tiếp thị liên kết (KOL/Affiliate)
- Người sử dụng: Người bán.
- Xử lý: `POST /api/seller/kol/create` (`server.ts:3850`); màn hình `Affiliate.tsx`.
- Phân quyền: `requireSellerAuth`.

### FR-07. Nhân sự người bán
- Người sử dụng: Người bán.
- Xử lý: `POST /api/seller/staffs/create` (`server.ts:3866`); lưu bảng `seller_staffs`.
- Phân quyền: `requireSellerAuth`.

### FR-08. Phát hành hóa đơn người bán
- Người sử dụng: Người bán.
- Xử lý: `POST /api/seller/invoices/issue` (`server.ts:3895`); liên quan `einvoice` (`server.ts:948`).
- Phân quyền: `requireSellerAuth`.

### FR-09. Cập nhật cửa hàng người bán
- Người sử dụng: Người bán.
- Xử lý: `POST /api/seller/store/update` (`server.ts:3910`); hồ sơ `GET /api/seller/profile/:ownerId` (`server.ts:3523`), dữ liệu `GET /api/seller/data/:sellerId` (`server.ts:3540`).
- Phân quyền: `requireSellerAuth`; `ownerId`/`sellerId` bị ghi đè từ token.

### FR-10. Quản trị iPOS (licence, duyệt tài khoản)
- Người sử dụng: iPOS Admin.
- Xử lý: `/api/ipos/licenses` (`server.ts:2651`, `:2655`), `/api/ipos/accounts` (`:4072`, `:4104`, `:4138`).
- Phân quyền: `requireIposAdmin` (khóa tĩnh, fail-closed).

### FR-11. Tích hợp Open API (đơn hàng, tồn kho, khách hàng)
- Người sử dụng: Đối tác tích hợp.
- Xử lý: `/api/openapi/orders` (`server.ts:3007`), `/inventory/deduct` (`:3311`), `/customers` (`:2757`, `:3332`), `/cfo-report` (`:3197`).
- Phân quyền: `authenticateOpenApi`.

### FR-12. Kế toán TT99 và khóa sổ
- Người sử dụng: Kế toán.
- Xử lý: `src/services/tt99Service.ts`, `src/services/ledgerClosing.ts` (vân tay SHA-256); màn hình `TT99Accounting.tsx`.
- Ngoại lệ: lệch Nợ/Có > 0,01 → từ chối ghi bút toán.

### FR-13. Trí tuệ nhân tạo (Gemini)
- Người sử dụng: Quản trị, người dùng nội bộ.
- Xử lý: `/api/gemini/legal-audit` (`server.ts:1248`), `/api/gemini/diagnostics` (`server.ts:1426`), `/api/gemini/db-query` (`server.ts:1554`).
- Ngoại lệ/rủi ro: `/api/gemini/db-query` **chưa có guard** → rủi ro truy vấn tùy ý.

## 3. Ma trận chức năng — phân quyền

| Mã | Chức năng | Phân quyền | Guard |
|---|---|---|---|
| FR-01 | Đăng ký/đăng nhập người bán | Công khai | rate limit |
| FR-02..FR-09 | Nghiệp vụ người bán | Seller | `requireSellerAuth` |
| FR-10 | Quản trị iPOS | iPOS Admin | `requireIposAdmin` |
| FR-11 | Open API | Đối tác | `authenticateOpenApi` |
| FR-12 | Kế toán TT99 | Kế toán | (chưa xác minh guard route) |
| FR-13 | Gemini | Nội bộ | **FR-13 db-query chưa guard** |

## Chưa xác minh được

- Guard của các route kế toán (FR-12) — chưa đối chiếu từng route trong `server.ts`.
- Danh sách đầy đủ 13 chức năng theo tài liệu nghiệp vụ gốc (FR-01..FR-13 được suy ra từ mã nguồn, cần đối chiếu `07` với phiếu yêu cầu gốc của chủ dự án).
- Quy tắc nghiệp vụ chi tiết của từng chức năng người bán (mới xác định route, chưa đọc thân handler).
