# Vai trò người dùng

> Nhóm người dùng, vai trò, trách nhiệm, quyền hạn.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Tổng quan

Hệ thống VComm phân biệt quyền ở lớp API bằng bốn cơ chế xác thực, mỗi cơ chế gắn cho một nhóm người dùng riêng (`server.ts`). Quyền không do giao diện quyết định mà do máy chủ (middleware) quyết định.

## 2. Các vai trò

### 2.1. Quản trị viên nội bộ (iPOS Admin)
- Xác thực bằng khóa tĩnh `IPOS_ADMIN_API_KEY` qua middleware `requireIposAdmin` (`server.ts:477`).
- Truy cập các endpoint nội bộ quản trị: danh sách/ghi licence iPOS (`/api/ipos/licenses` `server.ts:2651`, `:2655`), duyệt/từ chối tài khoản iPOS (`/api/ipos/accounts` `:4072`, `/approve` `:4104`, `/reject` `:4138`), sản phẩm và thanh toán iPOS (`/api/ipos/products` `:4174`, `/checkout` `:4202`, `/o2o-cart` `:4301`).
- Fail-closed: thiếu khóa → mọi request bị từ chối (`server.ts:477` trở đi).

### 2.2. Người bán (Seller)
- Đăng ký qua `POST /api/seller/auth/register` (`server.ts:3346`), đăng nhập qua `POST /api/seller/auth/login` (`server.ts:3447`).
- Sau đăng nhập, server cấp token phiên HMAC-SHA256 (`src/lib/sellerAuth.ts`, `issueSellerToken`), trả về trường `token` (`server.ts:3514`).
- Truy cập 11 route nghiệp vụ được bảo vệ bởi `requireSellerAuth` (`server.ts:3523`, `:3540`, `:3638`, `:3667`, `:3683`, `:3792`, `:3829`, `:3850`, `:3866`, `:3895`, `:3910`).
- Middleware `requireSellerAuth` (`server.ts:424`) **ghi đè** `sellerId`/`ownerId` từ token → người bán chỉ thao tác dữ liệu của chính mình (chống IDOR).

### 2.3. Nhân viên người bán (Seller Staff)
- Lưu trong bảng `seller_staffs`, có cột `seller_id` và `role` (`server.ts:42-43`).
- Khi đăng nhập, server truy vấn `seller_staffs` rồi tra `sellers` theo `seller_id`, trả về `seller`, `role`, `token` (`server.ts:56-68`).
- Cùng dùng token `requireSellerAuth` như người bán; quyền chi tiết theo `role` trong bảng `seller_staffs` (chưa rõ từng giá trị `role`).

### 2.4. Đối tác tích hợp (Open API Client)
- Xác thực bằng khóa API qua `authenticateOpenApi` (`server.ts:2667`).
- Truy cập nhóm `/api/openapi/*`: licence (`/license` `:2739`), khách hàng (`/customers` `:2757`, `:3332`), quy tắc và đổi điểm loyalty (`/loyalty/rules` `:2872`, `/redeem` `:2887`), cấu hình thanh toán (`/payments/config` `:2898`), cấu hình địa chỉ (`/address-config` `:2919`), đơn hàng (`/orders` `:3007`), ca làm việc (`/shifts` `:3111`), báo cáo CFO (`/cfo-report` `:3197`), sản phẩm (`/products` `:3291`), tồn kho (`/inventory/:sku` `:3299`, `/deduct` `:3311`), iPOS (`/products` `:4174`, `/checkout` `:4202`, `/o2o-cart` `:4301`).

### 2.5. Khách hàng cuối (Buyer) và người dùng trình duyệt
- Giao diện React (`src/components`, 76 tệp `.tsx`) giao tiếp với backend qua các route trên.
- Người dùng chưa đăng nhập giữ anon key Supabase → chỉ truy cập tài nguyên công khai (ví dụ `/health` `server.ts:239`, webhook).

### 2.6. Hệ thống / Worker
- Worker outbox phát sự kiện: chạy trên trình duyệt (anon client + phiên người dùng) hoặc server-side bằng service-role khi `OUTBOX_WORKER=1` (mặc định tắt). Liên quan trực tiếp đến chính sách RLS `domain_events` (xem `13_Luoc_do_co_so_du_lieu.md` §4, `19_Bao_mat.md` §3.2).

## 3. Ma trận quyền (tóm tắt)

| Vai trò | Cơ chế xác thực | Vùng endpoint | Bằng chứng |
|---|---|---|---|
| iPOS Admin | `requireIposAdmin` (khóa tĩnh) | `/api/ipos/*` | `server.ts:477`, `:2651`, `:4072` |
| Seller / Staff | `requireSellerAuth` (token HMAC) | `/api/seller/*` (trừ register/login) | `server.ts:424`, `:3523`–`:3910` |
| Open API Client | `authenticateOpenApi` (khóa API) | `/api/openapi/*` | `server.ts:2667`, `:2739`–`:3332` |
| Người dùng đã đăng nhập (Supabase) | `requireAuth` | `/api/sepay/webhook-events` | `server.ts:384`, `:682` |
| Ẩn danh | anon key | `/health`, webhook | `server.ts:239`, `:670` |

## Chưa xác minh được

- Các giá trị cụ thể của cột `role` trong `seller_staffs` (ví dụ owner, manager, staff) — chưa đọc schema đầy đủ của bảng này.
- Quyền chi tiết của từng `role` seller (phân quyền hạt nhân bên trong 11 route) — cần đọc từng handler `/api/seller/*`.
- Có hay không route riêng cho khách hàng cuối mua hàng trên giao diện React (có thể toàn bộ đi qua `/api/openapi/orders`).
- Cấu hình thực tế của khóa `IPOS_ADMIN_API_KEY` và khóa Open API ở môi trường Production (nằm trong biến môi trường chưa công khai).
