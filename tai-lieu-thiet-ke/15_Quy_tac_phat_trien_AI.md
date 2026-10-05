# Quy tắc phát triển cho AI

> Các quy tắc AI phải tuân thủ trong dự án này.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Quy tắc nghiệp vụ / quy trình

- Tuân thủ skill `quy-trinh-vibecode` (năm bước BA → Design → Code → Test → Release trên nền mười hai giai đoạn) cho mọi công việc lập trình.
- Bảy nguyên tắc bất biến: con người quyết định; không đoán (dừng lại hỏi khi thiếu dữ liệu); không phá vỡ; không xóa chức năng; không tự phát sinh chức năng; xây nhỏ rồi kiểm tra; không có tiêu chí nghiệm thu thì không coi là hoàn thành.
- Khi gặp yêu cầu không rõ, mâu thuẫn hoặc thiếu quy tắc: dừng lại, phát hiện — mô tả — xác định thành phần ảnh hưởng — nêu phương án — yêu cầu xác nhận. Không tự suy đoán rồi triển khai.

## 2. Quy tắc với dữ liệu và môi trường

- Không tự ý chạy migration, `DELETE`, hoặc sửa dữ liệu Production khi chưa được duyệt.
- Không sửa dữ liệu lịch sử; sai thì đảo bút toán, không xóa.
- Không hard-code mã tài khoản, tên tài khoản, biểu mẫu hay quy tắc — đọc từ dữ liệu.
- Bí mật (khóa API, chuỗi kết nối, token) không ghi vào tài liệu, không tiết lộ khi trích dẫn cấu hình.

## 3. Quy tắc kỹ thuật của dự án

- Ngôn ngữ TypeScript, cấu hình `strict: false` → khi xử lý union cần kiểm tra kiểu cẩn thận (`'error' in r ? r.error : ''`); sai kiểu thừa dùng `@ts-expect-error`.
- Không dùng ORM: truy vấn SQL thô qua `supabase-js` và `pg`; migration bằng tệp `.sql` + runner `tsx`.
- Đa doanh nghiệp: cột `tenant_id` + Row Level Security; tenant mặc định `tenant-vcomm-prod-01`.
- Sự kiện: event-driven bằng trigger PostgreSQL, không có message broker.
- Xác thực: Supabase bearer (`requireAuth`), khóa tĩnh iPOS (`requireIposAdmin`), khóa Open API (`authenticateOpenApi`), token phiên người bán HMAC (`requireSellerAuth`). Dự án **không có** `jsonwebtoken` → dùng `node:crypto`; mật khẩu dùng `bcryptjs`.
- Module mới phải có: lớp lỗi riêng, `ALLOWED_TRANSITIONS`, `newId(prefix)`, export `*_STATUS_LABEL`, hàm thuần nhận `atDate` để dễ kiểm thử.
- Fail-closed: thiếu cấu hình bảo mật → từ chối, không mở.

## 4. Quy tắc kiểm thử và bàn giao

- Mỗi bản sửa phải kèm kiểm thử; kiểm thử phải **đỏ thật khi khôi phục về trạng thái cũ** (revert-proof).
- Trước khi commit: chạy `npx tsc --noEmit` sạch và chạy kiểm thử liên quan.
- Không dùng `npm test` (treo) — dùng `npm run test:ci` hoặc chạy từng tệp.
- Ghi nhật ký dự án và cập nhật checklist trong cùng lượt làm việc với mã nguồn.

## 5. Quy tắc trình bày và ngôn ngữ

- Không viết tắt; không rườm rà; không thêm ghi chú không cần thiết; không dùng tiếng Anh trừ thuật ngữ chuyên môn.
- Tên tệp và mô tả bằng tiếng Việt, có đánh số thứ tự.
- Mọi phát biểu về hệ thống phải trỏ được đường dẫn tệp và số dòng; tài liệu phân tích phải có mục "Chưa xác minh được".

## Chưa xác minh được

- Có hay không quy định riêng của chủ dự án về nhánh, môi trường, phê duyệt triển khai (ngoài những gì đã ghi).
- Ngưỡng thời gian phản hồi/hạn hoàn thành theo từng giai đoạn (chưa có cam kết cụ thể).
