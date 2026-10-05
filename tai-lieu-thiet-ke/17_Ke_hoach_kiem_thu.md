# Kế hoạch kiểm thử

> Phạm vi kiểm thử, các lớp kiểm thử, môi trường kiểm thử, dữ liệu kiểm thử, tiêu chí đạt.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Phạm vi

- Kiểm thử đơn vị (unit) cho hàm thuần: xác thực người bán, vân tay khóa sổ, xử lý sự kiện, báo lỗi ghi dữ liệu.
- Kiểm thử tích hợp (integration) cho luồng có cơ sở dữ liệu (chạy khi bật cờ).
- Kiểm thử hợp đồng giao diện với API (HTTP) — hiện còn hạn chế.

## 2. Các lớp kiểm thử

| Lớp | Công cụ | Phạm vi | Bằng chứng |
|---|---|---|---|
| Đơn vị | Vitest 4.1.6 | Hàm thuần, dịch vụ | `package.json:63`, 86 tệp `*.test.ts` trong `src/` |
| Tích hợp | Vitest + cờ `RUN_INTEGRATION_TESTS=1` | Luồng có DB/Supabase | `scripts/run-tests.mjs:67` |
| Đầu-cuối (HTTP) | (chưa có bộ riêng) | Route thật | — |

## 3. Môi trường kiểm thử

- Chạy cục bộ bằng `npx vitest run <tệp>` cho từng tệp; mặc định tắt tích hợp.
- Chạy toàn bộ: `npm run test:ci` → `node scripts/run-tests.mjs` (`package.json:15`), mặc định chỉ đơn vị; bật tích hợp bằng `RUN_INTEGRATION_TESTS=1` (`scripts/run-tests.mjs:25`).
- **Không dùng `npm test`** (treo) — dùng `test:ci` hoặc chạy từng tệp.
- Kiểm tra kiểu bắt buộc trước khi commit: `npx tsc --noEmit` phải sạch.

## 4. Dữ liệu kiểm thử

- Hàm thuần nhận tham số ngày (`atDate`) và đầu vào tường minh để không phụ thuộc dữ liệu thật.
- Token kiểm thử đặt biến môi trường `SELLER_TOKEN_SECRET='unit-test-secret'` (xem `src/lib/sellerAuth.test.ts`).
- Kiểm thử migration đọc trực tiếp tệp `.sql` thay vì chạy cơ sở dữ liệu (xem `src/services/domainEventsRls.test.ts`).

## 5. Tiêu chí đạt

- `npx tsc --noEmit` không có lỗi.
- Toàn bộ tệp kiểm thử liên quan xanh.
- Kiểm thử phải **đỏ thật khi khôi phục về trạng thái cũ** (revert-proof): ví dụ khôi phục `server.ts` về trạng thái trước khi gắn guard thì kiểm thử guard phải đỏ.
- Không làm hỏng chức năng cũ (không có kiểm thử đang xanh bị đỏ).

## 6. Các nhóm kiểm thử đã có (tiêu biểu)

| Nhóm | Tệp | Nội dung |
|---|---|---|
| Xác thực người bán | `src/lib/sellerAuth.test.ts` | Cấp/kiểm token, chống sửa đổi, hết hạn, sai định dạng |
| Guard người bán | `src/services/sellerAuthGuards.test.ts` | Đọc `server.ts`, đếm 11 guard, chống IDOR |
| RLS `domain_events` | `src/services/domainEventsRls.test.ts` | Đọc migration, kiểm policy siết ẩn danh |
| Khóa sổ | `src/services/ledgerClosing.test.ts`, `finance_ledger_lock.test.ts` | Vân tay SHA-256 giữ dấu |
| Thanh toán đơn hàng | `src/services/order_payment_trigger.test.ts` | Báo lỗi ghi `payments` thay vì nuốt thầm |
| Sự kiện miền | `src/services/domainEventService.test.ts` | Xử lý sự kiện outbox |

## Chưa xác minh được

- Thời lượng và độ ổn định thực tế của `npm run test:ci` trên môi trường hiện tại.
- Có hay không bộ kiểm thử đầu-cuối (E2E) riêng cho giao diện.
- Dữ liệu kiểm thử tích hợp có trỏ tới Supabase thật hay môi trường giả lập.
