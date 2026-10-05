# Lịch sử thay đổi

> Mã phiên bản, ngày phát hành, danh sách thay đổi, chức năng mới, lỗi đã sửa, thay đổi dữ liệu, thay đổi API, rủi ro, khả năng tương thích, phương án quay lui.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Lịch sử chiến dịch audit bảo mật (liên quan trực tiếp đến thiết kế)

Trước đợt khảo sát này, một chiến dịch rà quét bảo mật / độ bền đã sửa các lỗi sau (commit trong bản clone `_recovery_V-com-ERP`, đã push origin/main):

| Commit | Ngày (ước lượng) | Thay đổi | Liên kết tài liệu |
|---|---|---|---|
| `d65dc6a` | — | GĐ 2.4: duyệt phiếu kho fail-closed — từ chối xuất/chuyển vượt tồn kho (pattern #89), `validateVoucherApproval` | `19_Bao_mat.md` |
| `3eac0a6` | — | GĐ 2.4: Warehouse không còn nhân danh AI (pattern #77) — `withCannedBanner` + `createdBy` | `19_Bao_mat.md` |
| `651804f` | — | fix(ledger): khóa sổ dùng SHA-256 giữ dấu thay vì `Math.abs` (pattern #75) | `src/services/ledgerClosing.ts`, `19_Bao_mat.md` |
| `c479756` | — | feat(server): cho phép ghi đè cổng qua `PORT` (mặc định 3000) | `server.ts:119`, `09_Kien_truc_he_thong.md` |
| `128dd2f` | — | fix(db): báo lỗi ghi payments thay vì nuốt thầm (pattern #74 / #90) | `src/services/dbService.ts:2134`, `19_Bao_mat.md` |
| `0126231` | — | (pattern #61) khôi phục mật chữ ký ví | `19_Bao_mat.md` |
| `c384e46` | 2026-10-05 | feat(sec): xác thực phiên người bán — vá IDOR `/api/seller/*` (M1) | `src/lib/sellerAuth.ts`, `server.ts` `requireSellerAuth`, `19_Bao_mat.md` §3.1 |
| `4b9cd56` | 2026-10-05 | fix(sec): siết chính sách RLS `domain_events` — chặn anon chưa login (M2) | `006_harden_domain_events_rls.sql`, `19_Bao_mat.md` §3.2 |

## 2. Các mốc kiến trúc / chuẩn

- **Thông tư 99/2025/TT-BTC** có hiệu lực 01/01/2026, thay thế Thông tư 200/2014 (Điều 31) — `src/services/tt99Service.ts:18`, `:20`. Hệ thống đã có dịch vụ TT99 (`tt99Service.ts`, `accountingService.ts`, `TT99Accounting.tsx`).

## 3. Thay đổi dữ liệu / API đáng chú ý

- Thêm cột `tenant_id` làm khóa phân cách đa doanh nghiệp (`src/services/dbService.ts:150`).
- Thêm `RELATIONAL_TABLES` (19 bảng) ánh xạ camel↔snake (`src/services/dbService.ts:15`).
- Thêm `ledgerClosing` (vân tay khóa sổ) — thay đổi logic khóa sổ cũ dùng `Math.abs`.

## 4. Rủi ro còn lại (sau các bản sửa)

- Bề mặt API lớn (~63/86 route chưa guard); `/api/seller/*` IDOR đã vá (M1 `c384e46`), còn `/api/gemini/db-query` (`:1515`) VẪN MỞ — `14_Dac_ta_API.md`, `19_Bao_mat.md` §3.1.
- `domain_events` policy RLS đã siết (M2 `4b9cd56`): chặn anon chưa login; chờ M2.1 (JWT mang claim `tenant_id`) để bỏ hẳn `OR` mặc định — `19_Bao_mat.md` §3.2.
- Ghi không nguyên tử — `13_Luoc_do_co_so_du_lieu.md`.
- Token MISA giả — `19_Bao_mat.md`.

## 5. Khả năng tương thích / Phương án quay lui

- Các sửa lỗi bảo mật là backward-compatible (chỉ thay đổi hành vi báo lỗi / validate, không đổi schema).
- Đổi `PORT` mặc định 3000 → hỗ trợ ghi đè: tương thích ngược (mặc định vẫn 3000).
- Quay lui: `git revert <commit>` trên bản clone, push lại.

## Bằng chứng (evidence)

- Commit list: `git log` trên `_recovery_V-com-ERP` (các hash trên).
- TT99: `src/services/tt99Service.ts:18`, `:20`.
- Ledger: `src/services/ledgerClosing.ts`.

## Chưa xác minh được

- Ngày chính xác (timestamp) của từng commit — chỉ có thứ tự và message.
- Có hay không các bản phát hành (release tag) trên origin.
- Trạng thái deploy của từng commit lên Production.
