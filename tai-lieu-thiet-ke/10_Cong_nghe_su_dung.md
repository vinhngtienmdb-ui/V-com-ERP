# Công nghệ sử dụng

> Ngôn ngữ lập trình, khuôn khổ, cơ sở dữ liệu, thư viện, công cụ xây dựng, công cụ kiểm thử, môi trường triển khai.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Ngôn ngữ / Khuôn khổ

| Hạng mục | Công nghệ | Phiên bản (từ `package.json`) | Bằng chứng |
|---|---|---|---|
| Ngôn ngữ | TypeScript | `~5.8.2` | `package.json:61` |
| Giao diện | React | `^19.0.0` | `package.json:36` |
| Build giao diện | Vite | `^6.2.0` | `package.json:45` |
| CSS | Tailwind CSS | `^4.1.14` | `package.json:58` |
| Định tuyến | react-router-dom | `^7.14.1` | `package.json:40` |
| Máy chủ | Express | `^4.21.2` | `package.json:31` |

## 2. Cơ sở dữ liệu / Dữ liệu

| Hạng mục | Công nghệ | Phiên bản | Bằng chứng |
|---|---|---|---|
| CSDL | PostgreSQL (qua Supabase) | `@supabase/supabase-js ^2.108.1` | `package.json:22` |
| Truy vấn thô | `pg` (không ORM) | `^8.22.0` | `package.json:57` |
| Lớp dữ liệu | Firestore-compat tự viết | — | `src/services/dbService.ts` |

**Lưu ý quan trọng:** dự án **không dùng ORM** — truy vấn SQL thô qua `pg` và `supabase-js`. Điều này nghĩa là không có abstraction transaction tự động; thực tế `dbService.ts` không có `beginTransaction` / `rpc` / `withTransaction` (xác nhận bằng tìm kiếm: không có kết quả) → các ghi nhiều bảng không nguyên tử.

## 3. Thư viện nghiệp vụ chính

| Mục đích | Thư viện | Bằng chứng |
|---|---|---|
| AI (Gemini) | `@google/genai` | `package.json:21` |
| Xuất Excel | `exceljs` | `package.json:30` |
| Mã hóa mật khẩu | `bcryptjs` | `package.json:54` |
| Biểu đồ | `recharts` | `package.json:43` |
| QR / quét | `html5-qrcode` | `package.json:32` |
| In / PDF | `puppeteer` | `package.json:35` |
| S3 | `@aws-sdk/client-s3` | `package.json:18` |

## 4. Công cụ xây dựng / Chạy

| Công cụ | Mục đích | Bằng chứng |
|---|---|---|
| `tsx` | Chạy `server.ts` trực tiếp (dev) | `package.json:60`, script `dev` |
| `esbuild` | Bundle server thành CJS | `package.json:55`, script `build` |
| `vite` | Build SPA + SSR | `package.json:45` |

## 5. Công cụ kiểm thử

| Công cụ | Mục đích | Bằng chứng |
|---|---|---|
| `vitest` | Unit / source-scan test | `package.json:63`, script `test` |
| `@testing-library/jest-dom` | Test component | `package.json:48` |
| `jsdom` | DOM giả lập | `package.json:56` |
| `ts-morph` | Phân tích AST (dùng trong một số test) | `package.json:59` |

Quy trình chạy test: `RUN_INTEGRATION_TESTS=0 npx vitest run <file>` cho từng file; CI dùng `node scripts/run-tests.mjs` (`package.json:15`). Lưu ý không dùng `npm test` (treo theo kinh nghiệm chiến dịch audit).

## 6. Môi trường triển khai

- `Dockerfile` tại gốc repo (build image, chạy `dist/server.cjs`).
- Biến môi trường: `PORT`, `IPOS_ADMIN_API_KEY`, `METRICS_TOKEN`, `SEPAY_WEBHOOK_SECRET`, cấu hình Supabase.

## Bằng chứng (evidence)

Tất cả phiên bản trích từ `package.json` (dòng đã ghi trong bảng). Lớp dữ liệu / thiếu transaction: `src/services/dbService.ts`.

## Chưa xác minh được

- Phiên bản Node.js / npm tối thiểu yêu cầu (không có `engines` trong `package.json`).
- Cấu hình CI/CD thực tế (`.github/` có tồn tại nhưng chưa duyệt nội dung).
- Tên gói `package.json:2` đang là `"react-example"` (tên mặc định) — chưa được đặt tên dự án chuẩn.
