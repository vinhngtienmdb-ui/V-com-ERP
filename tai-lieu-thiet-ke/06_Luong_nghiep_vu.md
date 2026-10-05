# Luồng nghiệp vụ

> Các luồng nghiệp vụ chính, luồng phụ, luồng ngoại lệ, kèm sơ đồ.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Tổng quan

VComm là nền tảng thương mại điện tử đa mô-đun (76 màn hình React, `src/components`). Các luồng chính được xác định từ định tuyến frontend (`src/App.tsx:383-432`) và các route backend (`server.ts`).

## 2. Luồng chính

### 2.1. Đăng ký / Đăng nhập người bán và cấp phiên
- Đăng ký: `POST /api/seller/auth/register` (`server.ts:3346`).
- Đăng nhập: `POST /api/seller/auth/login` (`server.ts:3447`) → truy vấn `seller_staffs` + `sellers` (`server.ts:41-59`) → trả `token` HMAC (`server.ts:3514`).
- Mọi thao tác sau đó gửi `Authorization: Bearer <token>`; `requireSellerAuth` (`server.ts:424`) xác thực và ghi đè `sellerId` (`src/lib/sellerAuth.ts`).

### 2.2. Quản lý sản phẩm người bán
- Tạo: `POST /api/seller/products/create` (`server.ts:3638`).
- Xóa: `DELETE /api/seller/products/delete/:id` (`server.ts:3667`).
- Quản lý tập trung trên màn hình PIM (`/pim`, `src/components/PIM.tsx`).

### 2.3. Đơn hàng và thanh toán
- Tạo đơn qua Open API: `POST /api/openapi/orders` (`server.ts:3007`).
- Khi đơn sang trạng thái `paid`, `dbService.handleOrderPaymentTrigger` ghi bản ghi `payments` (đã sửa nuốt lỗi, pattern #74, `128dd2f`).
- Màn hình `Orders.tsx` (`/orders`).

### 2.4. Kho và duyệt phiếu
- Duyệt phiếu kho fail-closed: `validateVoucherApproval` từ chối xuất/chuyển vượt tồn kho (pattern #77/#89, `3eac0a6`, `d65dc6a`).
- Màn hình `WarehouseModule` (`/warehouse`).

### 2.5. Kế toán và khóa sổ (Thông tư 99/2025)
- Dịch vụ TT99: `src/services/tt99Service.ts`, `TT99Accounting.tsx` (`/ke-toan-tt99`).
- Khóa sổ dùng vân tay SHA-256 giữ dấu (`src/services/ledgerClosing.ts`, pattern #75, `651804f`).

### 2.6. Đối soát thanh toán
- Màn hình `SettlementManagement` (`/settlement`); quy tắc đối chiếu chi tiết chưa hoàn thiện (xem `Checklist_cong_viec.md` M-Đối soát).

### 2.7. Ví người bán và rút tiền
- Rút ví: `POST /api/seller/wallet/withdraw` (`server.ts:3792`).
- Ghi đường tiền chưa nguyên tử (M3, `dbService.ts` không có transaction).

### 2.8. Khuyến mãi, KOL, hóa đơn
- Khuyến mãi: `POST /api/seller/promotions/create` (`server.ts:3829`).
- KOL: `POST /api/seller/kol/create` (`server.ts:3850`).
- Hóa đơn: `POST /api/seller/invoices/issue` (`server.ts:3895`).
- Cửa hàng: `POST /api/seller/store/update` (`server.ts:3910`).

### 2.9. Trí tuệ nhân tạo (Gemini)
- Kiểm toán pháp lý hợp đồng: `POST /api/gemini/legal-audit` (`server.ts:1248`), model `gemini-3.5-flash` (`server.ts:1360`).
- Chẩn đoán vận hành: `POST /api/gemini/diagnostics` (`server.ts:1426`).
- Truy vấn cơ sở dữ liệu: `POST /api/gemini/db-query` (`server.ts:1554`) — **chưa có guard** (rủi ro truy vấn tùy ý, `19_Bao_mat.md` §3.1).

## 3. Sơ đồ luồng đăng nhập người bán (M1)

```
[Seller/Staff] --register--> /api/seller/auth/register (public)
             --login-------> /api/seller/auth/login (public)
                                    |
                                    v
                       seller_staffs + sellers (Supabase)
                                    |
                                    v
                       issueSellerToken(sellerId) --> token HMAC
                                    |
   [Seller/Staff] --Bearer token--> /api/seller/* (requireSellerAuth)
                                    |
                                    v
                       ghi đè sellerId/ownerId từ token (chống IDOR)
```

## 4. Luồng ngoại lệ tiêu biểu
- Đăng nhập sai → không cấp token, trả lỗi (`server.ts:3447` trở đi).
- Truy cập `/api/seller/*` không token → `requireSellerAuth` trả 401 (`server.ts:424`).
- Xuất kho vượt tồn → `validateVoucherApproval` từ chối (fail-closed).
- Ghi `payments` lỗi → `reportWriteFailure` báo lỗi (không nuốt thầm, #74).

## Chưa xác minh được

- Thứ tự và điều kiện chuyển trạng thái đơn hàng đầy đủ (chỉ xác nhận nhánh `paid` kích hoạt ghi `payments`).
- Luồng hoàn tiền, huỷ đơn, đổi trả — chưa liệt kê route tương ứng.
- Tích hợp MISA thực tế (hiện dùng token giả `misaService.ts:56`).
- Quy trình phát hành hóa đơn điện tử (e-invoice) đầu cuối — có route `/api/einvoice/*` (`server.ts:948`) nhưng chưa rõ luồng nghiệp vụ hoàn chỉnh.
