# Đặc tả API

> Điểm cuối, phương thức, yêu cầu, phản hồi, xác thực, phân quyền, kiểm tra dữ liệu, xử lý lỗi, phân trang, lọc, sắp xếp, phiên bản.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Tổng quan bề mặt API

Toàn bộ API định nghĩa trong `server.ts`. Theo quét mã nguồn:
- **86 route HTTP** khai báo trực tiếp qua `app.get/post/put/delete/patch` (`server.ts`).
- Chỉ **23 route** gắn guard xác thực (`requireAuth` / `requireIposAdmin` / `authenticateOpenApi`).
- Ước lượng **~63 route không có guard tại tầng route** (một số tự kiểm tra token trong handler, nhưng không có quy ước thống nhất).

> Ghi chú: đợt khảo sát trước từng ước lượng ~104 route (tính cả sub-router `app.use`). Số 86 là đếm trực tiếp các khai báo `app.*(`. Cả hai đều cho thấy tỉ lệ route không bảo vệ rất cao.

## 2. Các middleware xác thực

| Guard | Định nghĩa | Dùng cho |
|---|---|---|
| `requireAuth` | `server.ts:383` | webhook nội bộ (`/api/sepay/webhook-events` `:643`, `:648`) |
| `requireIposAdmin` | `server.ts:438` | quản trị iPOS (`/api/ipos/licenses` `:2612`, `:2616`; `/api/ipos/accounts*` `:4031`, `:4063`, `:4097`) |
| `authenticateOpenApi` | `server.ts:2628` | cổng mở đối tác (`/api/openapi/*` từ `:2700` đến `:4260`) |

## 3. Các route nhạy cảm KHÔNG có guard (cần ưu tiên xử lý)

| Route | Dòng | Mức độ rủi ro | Ghi chú |
|---|---|---|---|
| `POST /api/gemini/db-query` | `server.ts:1515` | **Nghiêm trọng** | Thực thi truy vấn CSDL theo yêu cầu; không guard → có thể đọc/sửa toàn bộ dữ liệu |
| `POST /api/seller/wallet/withdraw` | `server.ts:3751` | **Nghiêm trọng** | Rút tiền ví người bán; không guard → giả mạo rút tiền |
| (nhiều route tài chính / admin khác) | — | Cao | cần rà quét từng route còn lại |

## 4. Yêu cầu / Phản hồi

- Định dạng: JSON (`express.json()`).
- Lỗi được trả về dưới dạng `{ error: ... }` hoặc `{ message: ... }` tùy handler — **chưa có chuẩn lỗi thống nhất**.
- Phân trang / lọc / sắp xếp: chưa có quy ước chung (xem `Chưa xác minh được`).

## 5. Xử lý lỗi hiện trạng

Một số handler bắt lỗi và chỉ `console.error` (nuốt thầm) — pattern #74. Đã sửa `handleOrderPaymentTrigger` chuyển sang `reportWriteFailure` (`src/services/dbService.ts:2134`), nhưng nhiều handler khác có thể còn pattern tương tự (cần rà quét).

## 6. Phiên bản API

Chưa thấy tiền tố version (`/api/v1/...`) thống nhất. Các nhóm route dùng tiền tố nghiệp vụ (`/api/ipos`, `/api/openapi`, `/api/seller`, `/api/gemini`, `/api/sepay`).

## Bằng chứng (evidence)

- Số route / guard: quét `server.ts` (`app.(get|post|put|delete|patch)(` = 86; `requireAuth,|requireIposAdmin,|authenticateOpenApi,` = 23).
- Guard định nghĩa: `server.ts:383`, `:438`, `:2628`.
- Route nhạy cảm không guard: `server.ts:1515`, `:3751`.
- Sửa pattern #74: `src/services/dbService.ts:2134`.

## Chưa xác minh được

- Danh sách đầy đủ 86 route kèm method, tham số, schema request/response (cần trích xuất thủ công).
- Cơ chế token thực tế (JWT? session? Supabase auth?) dùng trong các handler tự kiểm tra.
- Có hay không rate-limiting / quota trên API công khai.
- Tình trạng xác thực của từng route còn lại (63 route chưa rõ guard).
