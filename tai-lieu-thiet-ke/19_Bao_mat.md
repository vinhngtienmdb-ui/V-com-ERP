# Bảo mật

> Xác thực, phân quyền, phiên làm việc, kiểm tra dữ liệu đầu vào, bảo mật API, truy cập dữ liệu.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Tóm tắt tình hình bảo mật

Đợt khảo sát / chiến dịch audit trước đã phát hiện và **sửa 5 lỗi nghiêm trọng** (pattern #61, #74, #75, #77, #89) trực tiếp trong mã. Tuy nhiên vẫn còn **các rủi ro cấu trúc chưa xử lý** (xác thực API, RLS, transaction, token giả).

## 2. Các lỗi đã sửa (VERIFIED in code)

| Pattern | Mô tả | Trạng thái | Bằng chứng (commit) |
|---|---|---|---|
| #61 | Mất chữ ký ví (wallet sign loss) | ✅ Đã sửa | `0126231` |
| #74 | Nuốt lỗi ghi DB thầm (payments) | ✅ Đã sửa | `128dd2f` (`src/services/dbService.ts:2134`) |
| #75 | Va chạm SHA khóa sổ do `Math.abs` | ✅ Đã sửa | `651804f` (`src/services/ledgerClosing.ts`) |
| #77 | AI giả danh người dùng (warehouse) | ✅ Đã sửa | `3eac0a6` (`withCannedBanner` + `createdBy`) |
| #89 | Xuất kho vượt tồn (warehouse over-issue) | ✅ Đã sửa | `d65dc6a` (`validateVoucherApproval`) |
| #90 | Mất ghi `payments` thầm | ✅ Đã sửa | `128dd2f` |
| M1 | IDOR `/api/seller/*` — không guard + login không cấp token | ✅ Đã sửa | `c384e46` (`src/lib/sellerAuth.ts`, `server.ts` `requireSellerAuth`) |
| M2 | RLS `domain_events` policy quá lỏng (over-permissive) | ✅ Đã sửa | `4b9cd56` (`006_harden_domain_events_rls.sql`) |

## 3. Rủi ro cấu trúc CÒN MỞ (OPEN)

### 3.1. Phần lớn route API không có guard + `/api/seller/*` IDOR (CRITICAL — seller IDOR ĐÃ SỬA: M1, commit `c384e46`)

Ước tính chỉ ~23/86 route định nghĩa gắn `requireAuth` / `requireIposAdmin` / `authenticateOpenApi` (số chính xác cần M7 liệt kê từng route). Hai điểm nguy hiểm nhất:

- **`/api/seller/*` IDOR — ĐÃ SỬA (M1, `c384e46`):** Toàn bộ không gian `/api/seller/*` (14 route, `server.ts:3307–3878`) trước đây không guard + login (`:3408–3479`) không cấp token → IDOR. Nay: (1) thêm module `src/lib/sellerAuth.ts` cấp/kiểm token HMAC-SHA256 (`node:crypto`, fail-closed: thiếu `SELLER_TOKEN_SECRET` ở Production → ném lỗi); (2) middleware `requireSellerAuth` bảo vệ 11 route (trừ register/login); (3) middleware **ghi đè** `req.body.sellerId` / `req.params.sellerId` / `req.params.ownerId` bằng sellerId lấy từ token → triệt tiêu IDOR; (4) login cấp token (`issueSellerToken`). Test revert-proof: `sellerAuth.test.ts` (7) + `sellerAuthGuards.test.ts` (5, đọc `server.ts`, đỏ thật khi revert).
- `POST /api/gemini/db-query` (`server.ts:1515`) — chạy truy vấn CSDL theo yêu cầu, không guard → rủi ro truy vấn tùy ý. **VẪN MỞ** (thuộc M1 mở rộng, chưa làm — cần guard + giới hạn truy vấn).

### 3.2. `domain_events` có RLS nhưng policy quá lỏng (HIGH → ĐÃ SỬA: M2, commit `4b9cd56`)

Khảo sát trước ghi `domain_events` "không có RLS" là **SAI** (chỉ quét `scripts/` nên bỏ sót `specs/*/migrations/`). Thực tế bảng này **đã bật RLS** (`specs/022-chuan-hoa-nen-tang/migrations/002_outbox_domain_events.sql:109`) và có policy `domain_events_tenant_isolation` (`:112-115`). Rủi ro thực sự: policy dùng `USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01')` (`:114`) — cụm `OR` mặc định cho phép **mọi caller giữ anon key (chưa đăng nhập)** truy cập nhật ký của tenant mặc định.

**Đã xử lý (M2, `4b9cd56`):** migration `006_harden_domain_events_rls.sql` thay policy bằng:
```sql
CREATE POLICY domain_events_tenant_isolation ON public.domain_events
  FOR ALL
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')
    OR (tenant_id = 'tenant-vcomm-prod-01' AND auth.uid() IS NOT NULL)
  );
```
Giữ worker outbox trình duyệt (đã đăng nhập) hoạt động, chặn hoàn toàn anon chưa xác thực đọc/ghi audit log tenant mặc định. Test revert-proof: `domainEventsRls.test.ts` (4, đọc file migration).

**M2.1 (follow-up chưa làm):** JWT của Supabase **không mang claim `tenant_id`** (`auth.jwt() ->> 'tenant_id'` = NULL) → điều khoản `tenant-vcomm-prod-01 AND auth.uid() IS NOT NULL` vẫn là tạm bợ. Sửa triệt để: (a) phát hành JWT mang claim `tenant_id` (custom claim qua Supabase hook), hoặc (b) chạy outbox worker bằng service-role (server-side `OUTBOX_WORKER=1`), bỏ hẳn `OR` mặc định.

### 3.3. Ghi không nguyên tử (HIGH)
`src/services/dbService.ts` không có transaction → ghi nhiều bảng có thể bán thành phẩm (pattern #74/#90 là triệu chứng). Cần Supabase RPC / transaction.

### 3.4. Token MISA giả (MEDIUM)
`src/services/misaService.ts:56` hard-code `accessToken: 'simulated_misa_access_token_abc123'` — token mô phỏng, phải thay bằng cấu hình thực trước khi bật tích hợp MISA.

### 3.5. Hai sổ kế toán chưa thống nhất (MEDIUM)
`journal_entries` (TT200) và `acc_*` (TT99) song song → rủi ro báo cáo sai hoặc lệch số.

### 3.6. Thiếu chuẩn hóa báo lỗi / input validation (MEDIUM)
Nhiều handler tự `console.error` và trả lỗi không thống nhất; chưa có schema validation đầu vào tập trung.

## 4. Mã hóa / Bảo mật dữ liệu

- Mật khẩu: `bcryptjs` (`package.json:54`) — tốt.
- Chữ ký số khóa sổ: SHA-256 qua Web Crypto (`src/services/ledgerClosing.ts`) — đã giữ dấu.
- Kênh truyền: giả định HTTPS (chưa xác nhận cấu hình TLS thực tế).

## 5. Kiểm tra dữ liệu đầu vào

Chưa có lớp validation tập trung (ví dụ zod). Một số route tự kiểm tra, một số không.

## Bằng chứng (evidence)

- Guard & route nhạy cảm: `server.ts:383`, `:438`, `:2628`, `:1515`, `:3751`.
- RLS `domain_events`: `specs/022-chuan-hoa-nen-tang/migrations/002_outbox_domain_events.sql:109,112,114` (policy quá lỏng do `OR tenant_id = 'tenant-vcomm-prod-01'`).
- Thiếu transaction: `src/services/dbService.ts` (0 kết quả `beginTransaction|rpc|withTransaction`).
- Token giả: `src/services/misaService.ts:56`.
- Sửa lỗi + remediation: commits `0126231`, `128dd2f`, `651804f`, `3eac0a6`, `d65dc6a`, `c384e46` (M1 IDOR `/api/seller/*`), `4b9cd56` (M2 RLS `domain_events`).

## Chưa xác minh được

- Cơ chế xác thực thực tế (JWT secret, Supabase auth, session) — nằm trong biến môi trường chưa công khai.
- Có hay không giới hạn tốc độ (rate limit) / chống brute-force.
- Cấu hình TLS / HTTPS thực tế.
- Tình trạng quét input injection (SQLi/XSS) trên từng handler.
- Có log tập trung về các nỗ lực truy cập trái phép hay không.
