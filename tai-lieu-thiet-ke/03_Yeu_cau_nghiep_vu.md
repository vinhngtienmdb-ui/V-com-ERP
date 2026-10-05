# Yêu cầu nghiệp vụ

> Nhóm người dùng, quy trình chính, quy trình phụ, quy trình ngoại lệ, điều kiện bắt đầu, điều kiện kết thúc, dữ liệu nghiệp vụ.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Nhóm người dùng

| Nhóm | Mô tả | Bằng chứng |
|---|---|---|
| Owner / Quản lý | Vận hành toàn hệ thống, xem báo cáo | `src/components/Finance.tsx`, `TT99Accounting.tsx` |
| Kế toán | Khóa sổ, bút toán, báo cáo TT99 | `src/services/tt99Service.ts`, `Finance.tsx` |
| Thủ kho | Duyệt phiếu nhập/xuất/chuyển | `validateVoucherApproval` (`d65dc6a`) |
| Nhân viên POS (iPOS) | Bán lẻ, checkout | `server.ts:4161` (`/api/ipos/checkout`) |
| Nhân sự | Quản lý lương, khai báo | `src/services/payrollDeclaration.ts` |
| Người bán (Seller) | Bán trên sàn, rút ví | `server.ts:3751` (`/api/seller/wallet/withdraw`) |
| Đối tác (Open API) | Tích hợp bên thứ 3 | `server.ts:2700+` (`authenticateOpenApi`) |

## 2. Quy trình chính

1. **Bán hàng → Kế toán:** Đơn hàng được tạo (`orders` trong `RELATIONAL_TABLES:15`) → `handleOrderPaymentTrigger` ghi nhận thanh toán và tự động hạch toán (`src/services/dbService.ts:2099`).
2. **Kho:** Phiếu kho được tạo → duyệt fail-closed từ chối vượt tồn (`validateVoucherApproval`).
3. **Khóa sổ:** Kế toán chạy khóa sổ → tính vân tay SHA-256 giữ dấu (`src/services/ledgerClosing.ts`).

## 3. Quy trình phụ

- Đối soát (Settlement) giữa đơn hàng và thanh toán (`src/components/Settlement.tsx`).
- Loyalty: cộng/trừ điểm (`loyalty_points_ledger`).
- Mua chung / F2B2B: `group_buy_*`, `f2b2b_*`.
- Tích hợp MISA đồng bộ danh mục & chứng từ (`src/services/misaService.ts`).

## 4. Quy trình ngoại lệ

- Ghi CSDL thất bại → báo lỗi qua `reportWriteFailure` (không nuốt thầm) — `src/services/dbService.ts:2134`.
- Xuất kho vượt tồn → từ chối (fail-closed) — `d65dc6a`.
- Khóa sổ thiếu Web Crypto → ném lỗi (không trả chuỗi giả) — `src/services/ledgerClosing.ts:65`.

## 5. Điều kiện bắt đầu / kết thúc

- Bán hàng: bắt đầu khi có giỏ hàng; kết thúc khi đơn `orders` chuyển trạng thái hoàn tất + hạch toán.
- Khóa sổ: bắt đầu khi kỳ kế toán kết thúc; kết thúc khi có vân tay (`hashLedgerClosing`) lưu vào sổ.

## 6. Dữ liệu nghiệp vụ

- Thực thể cốt lõi: `products`, `customers`, `orders`, `warehouse_stock`, `sellers`, `payments`, `settlements` (`RELATIONAL_TABLES:15`).
- Kế toán: `journal_entries`/`journal_items` (cũ) + `acc_*` (TT99).
- Kiểm toán: `domain_events`.

## Bằng chứng (evidence)

- `RELATIONAL_TABLES`: `src/services/dbService.ts:15`.
- Tự động hạch toán: `:2099`.
- Khóa sổ: `src/services/ledgerClosing.ts`.
- Duyệt kho: commit `d65dc6a`.
- Seller rút ví: `server.ts:3751`.

## Chưa xác minh được

- Quy trình nghiệp vụ chính xác từng bước (cần phỏng vấn nghiệp vụ / tài liệu nghiệp vụ riêng).
- Trạng thái (state machine) chi tiết của `orders`, phiếu kho, settlement.
- Quy tắc tính hoa hồng / khấu trừ (commissionWithholdingService) — chưa đọc kỹ.
