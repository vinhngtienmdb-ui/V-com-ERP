# Kiến trúc hệ thống

> Kiến trúc tổng thể, thành phần, xác thực, phân quyền, lưu trữ tệp, ghi nhật ký, giám sát, sao lưu, phục hồi, triển khai.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Kiến trúc tổng thể

Ứng dụng đơn (monolith hợp nhất): một tiến trình Node chạy cả máy chủ API (Express) và máy chủ render giao diện (Vite SSR). Toàn bộ logic nghiệp vụ nằm trong `server.ts` (Express) và các thành phần React tại `src/components`. Không có tách biệt microservice; không có message broker — sự kiện liên mô-đun được thực hiện qua PostgreSQL trigger (`scripts/setup_cross_module_triggers.sql`).

```
[ Trình duyệt ] ──HTTP──> [ Node: server.ts ]
                                 │
              ┌──────────────────┼───────────────────────┐
              │                  │                       │
        [ Express routes ]  [ Vite SSR + React ]   [ Supabase (PostgreSQL) ]
        (86 route, 23 có guard)  (76 .tsx)          (logic multi-tenant)
                                                        
        Lớp dữ liệu: src/services/dbService.ts
        (Firestore-compat: setDoc/updateDoc/addDoc → Supabase upsert/insert/update)
```

## 2. Thành phần chính

| Thành phần | Vị trí | Ghi chú |
|---|---|---|
| API gateway / SSR | `server.ts` | Cổng `Number(process.env.PORT) || 3000` (`server.ts:119`) |
| Lớp dữ liệu | `src/services/dbService.ts` | Firestore-compat trên Supabase; `RELATIONAL_TABLES:15` |
| Kế toán | `src/services/tt99Service.ts`, `accountingService.ts` | TT99/2025 |
| Khóa sổ | `src/services/ledgerClosing.ts` | SHA-256 giữ dấu |
| Báo lỗi ghi | `src/services/writeFailure.ts` | chuẩn báo lỗi |
| Giao diện | `src/components/*.tsx` | 76 tệp |

## 3. Xác thực và phân quyền

Có 3 middleware xác thực được định nghĩa nhưng chỉ dùng rải rác:
- `requireAuth` — `server.ts:383`
- `requireIposAdmin` — `server.ts:438`
- `authenticateOpenApi` — `server.ts:2628`

Thực tế: trong 86 route HTTP trực tiếp, chỉ **23 route** gắn một trong các guard trên. Khoảng 63 route còn lại **không có guard tại tầng route** (một số tự kiểm tra token trong handler, nhưng không có quy ước thống nhất). Xem chi tiết tại `14_Dac_ta_API.md` và `19_Bao_mat.md`.

## 4. Lưu trữ tệp

Dự án dùng `@aws-sdk/client-s3` (`package.json:18`) — lưu trữ tệp qua S3-compatible. Cần xác nhận cấu hình bucket thực tế.

## 5. Ghi nhật ký (audit trail)

Bảng `domain_events` ghi sự kiện nghiệp vụ (`src/services/domainEventService.ts`). Tuy nhiên **chưa có chính sách RLS** cho `domain_events` (xem `19_Bao_mat.md`), nên nhật ký đa doanh nghiệp chưa được cách ly ở tầng CSDL.

## 6. Giám sát / Sao lưu / Phục hồi

- `server.ts` in cảnh báo khi thiếu `IPOS_ADMIN_API_KEY`, `METRICS_TOKEN`, `SEPAY_WEBHOOK_SECRET`.
- Sao lưu / phục hồi phụ thuộc vào Supabase (chưa thấy script riêng trong mã ứng dụng).

## 7. Triển khai

- `npm run dev` → `tsx server.ts` (`package.json:7`).
- `npm run build` → `vite build` + esbuild bundle `server.ts` thành `dist/server.cjs` (`package.json:9`).
- Cổng lắng nghe đã hỗ trợ ghi đè qua `PORT` (sửa tại `server.ts:119`, commit `c479756`).

## Bằng chứng (evidence)

- Cổng: `server.ts:119`.
- Guard: `server.ts:383`, `:438`, `:2628`.
- Lớp dữ liệu / tenant mặc định: `src/services/dbService.ts:15`, `:150`.
- S3 SDK: `package.json:18`.
- Trigger liên mô-đun: `scripts/setup_cross_module_triggers.sql`.

## Chưa xác minh được

- Kiến trúc deployment thực tế (Docker? K8s? serverless?) — chỉ có `Dockerfile` tại gốc repo.
- Cấu hình Supabase project (URL, khóa, region) — nằm trong biến môi trường chưa công khai.
- Mức độ hoàn thiện của trigger CSDL trên Production.
- Có hay không bản ghi (log) tập trung (centralized logging) ngoài console.
