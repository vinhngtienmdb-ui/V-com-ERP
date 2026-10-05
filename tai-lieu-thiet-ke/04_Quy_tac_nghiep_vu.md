# Quy tắc nghiệp vụ

> Điều kiện, ràng buộc, công thức, trạng thái, ngoại lệ, quy tắc chuyển trạng thái.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Ràng buộc đa doanh nghiệp

- Mọi bản ghi phải mang `tenant_id`; mặc định `tenant-vcomm-prod-01` nếu không truyền (`src/services/dbService.ts:150`).
- Truy vấn phải lọc theo `tenant_id` để không lẫn dữ liệu doanh nghiệp.

## 2. Ràng buộc ghi dữ liệu (không nuốt lỗi)

- Mọi thao tác ghi thất bại phải báo qua `reportWriteFailure` (log + thông điệp "chưa được lưu"), **không** chứa từ "thành công" — `src/services/writeFailure.ts`.
- Áp dụng thực tế tại `src/services/dbService.ts:2134` (pattern #74).

## 3. Ràng buộc khóa sổ kế toán (TT99)

- Vân tay khóa sổ = SHA-256 trên chuỗi canonical **giữ dấu** (lãi ≠ lỗ), gắn kỳ + ngày chốt + số liệu — `src/services/ledgerClosing.ts:31`, `:60`.
- Không có Web Crypto → **ném lỗi**, không trả chuỗi băm giả — `:65`.
- Sổ đã khóa (có `closingLockDate`) thì không được sửa số liệu kỳ đó (`src/components/Finance.tsx` — `handleResetLockDate` cho phép mở lại, cần đánh giá lại theo TT99 Điều 13).

## 4. Ràng buộc kho (fail-closed)

- Phiếu xuất/chuyển bị từ chối nếu vượt tồn kho thực tế — `validateVoucherApproval` (commit `d65dc6a`).
- Nguyên tắc: **từ chối an toàn** khi không chắc chắn, thay vì cho qua.

## 5. Ràng buộc AI (không giả danh)

- Warehouse / hệ thống không được nhân danh người dùng thực khi tạo bản ghi — dùng `withCannedBanner` + `createdBy` hệ thống (commit `3eac0a6`).
- Gemini chỉ được dùng truy vấn CSDL qua route được bảo vệ (hiện `server.ts:1515` CHƯA guard — vi phạm, xem `19_Bao_mat.md`).

## 6. Ràng buộc tiền tệ / đối soát

- Thanh toán đơn hàng ghi nhận qua `handleOrderPaymentTrigger` sau khi đơn đã commit (`src/services/dbService.ts:2099`, `:2201`, `:2284`).
- Ví người bán (`updateWalletBalance`) hiện **chưa atomic** — ghi ví và ghi ledger tách rời → rủi ro lệch số (OPEN).

## 7. Công thức / Trạng thái (chưa đầy đủ)

- Lãi/lỗ kỳ: `netProfit = totalRevenue - totalExpenses` (dùng trong `closingCanonical`, `src/services/ledgerClosing.ts:36-38`).
- Chi tiết state machine của `orders` / phiếu kho / settlement: **chưa trích xuất đủ**.

## Bằng chứng (evidence)

- Tenant: `src/services/dbService.ts:150`.
- Báo lỗi: `:2134`, `src/services/writeFailure.ts`.
- Khóa sổ: `src/services/ledgerClosing.ts:31`, `:60`, `:65`.
- Kho: `d65dc6a`.
- AI: `3eac0a6`.
- Thanh toán: `:2099`.

## Chưa xác minh được

- Bảng công thức thuế / VAT áp dụng (NĐ 254/2026? NĐ 174/2025 VAT 8%?) — chưa đọc kỹ `tt99Service.ts` toàn bộ.
- Quy tắc chuyển trạng thái chi tiết của từng thực thể.
- Quy tắc khóa sổ mở lại (reset lock) có hợp lệ theo TT99 Điều 13 hay không.
