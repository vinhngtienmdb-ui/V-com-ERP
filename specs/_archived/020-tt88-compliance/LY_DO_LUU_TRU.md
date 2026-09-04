# Lý do lưu trữ spec 020 (TT88/2021/TT-BTC)

**Ngày lưu trữ:** 01/09/2026
**Trạng thái:** KHÔNG triển khai — bị gỡ hoàn toàn khỏi codebase.

## Quyết định của chủ dự án

Khi được hỏi "áp dụng Thông tư 99/2025/TT-BTC cho module Tài chính kế toán thay cho TT88",
chủ dự án đã trả lời qua hai lựa chọn:

1. **Phạm vi → "Chỉ TT99, gỡ TT88"**
   Toàn bộ chủ thể kế toán trong VComm ERP (kể cả hộ kinh doanh / cá nhân kinh doanh trên sàn)
   sẽ áp dụng **chế độ kế toán DOANH NGHIỆP** theo TT99/2025/TT-BTC.
   Chế độ kế toán hộ kinh doanh (TT88/2021/TT-BTC) **không được áp dụng**.

2. **Ưu tiên → chọn cả 4 hạng mục**
   - Lõi: hệ thống tài khoản + sổ cái + BCTC
   - Điều 28 — phần mềm kế toán (lưu vết, chống xoá/sửa trái phép, xuất dữ liệu cho cơ quan thuế)
   - Hợp nhất đơn vị trực thuộc (loại bỏ giao dịch nội bộ)
   - Doanh thu theo mô hình 5 bước IFRS 15

## Lý do kỹ thuật

TT99/2025/TT-BTC (có hiệu lực **01/01/2026**, thay thế TT200/2014/TT-BTC) và
TT88/2021/TT-BTC **không thay thế cho nhau** — hai văn bản điều chỉnh hai đối tượng khác nhau:

| | TT88/2021/TT-BTC | TT99/2025/TT-BTC |
|---|---|---|
| Đối tượng | Hộ kinh doanh, cá nhân kinh doanh | Doanh nghiệp (mọi loại hình) |
| Sổ kế toán | 7 sổ S1–S7-HKD (Điều 5(4)) | 42 mẫu sổ (Phụ lục III), tự thiết kế |
| Hệ thống TK | Không có hệ thống tài khoản chuẩn | 71 tài khoản cấp 1 (Điều 11) |
| BCTC | Không bắt buộc | Bắt buộc năm (Điều 14–27) |

Việc giữ cả hai chế độ trong một hệ thống sẽ tạo ra hai chart-of-accounts, hai chuẩn ghi nhận
doanh thu và hai bộ BCTC song song — chi phí bảo trì gấp đôi mà không có lợi ích pháp lý,
vì Luật Kế toán 2015 không buộc hộ kinh doanh phải dùng TT88 (TT88 Điều 2(2) chỉ *khuyến khích*
hộ nộp thuế theo phương pháp khoán áp dụng).

## Những gì đã bị gỡ

- `src/components/TT88Books.tsx` — UI 8 tab, 7 sổ S1–S7 + tờ khai
- `src/services/tt88Service.ts` — biểu thuế TT40/2021, ghi sổ, xuất XML 01/CNKD
- `src/__tests__/tt88.test.ts` — 40 test
- `src/types/erp.ts` — toàn bộ khối type `Hkd*`
- `src/services/dbService.ts` — 9 bảng `hkd_*` trong `RELATIONAL_TABLES`,
  `toRelationalPayload`, `fromRelationalRow`
- `src/App.tsx` — route `/ke-toan-tt88`
- `src/constants.ts` — mục nav "Sổ kế toán TT88"

## Giá trị còn giữ lại

Các tài liệu dưới đây vẫn hữu ích khi cần tham chiếu, dù không nằm trong codebase:

- `020-tt88-compliance.md` — chứa **đính chính** spec 015 từng ghi sai "4 sổ kế toán"
  (thực tế TT88 Điều 5(4) quy định **7 sổ**). Đính chính này vẫn đúng về mặt pháp lý.
- `migrations/001_tt88_books.sql` — tham khảo cấu trúc sổ quỹ / sổ tiền gửi ngân hàng
  (S6/S7) khi làm module quỹ tiền mặt & ngân hàng theo TT99.
- Biểu thuế TT40/2021 Điều 10 (1,5% / 3% / 4,5% / 7%) — vẫn đúng cho nghĩa vụ thuế của
  cá nhân kinh doanh, nhưng sẽ được quản lý ở module Thuế, tách khỏi module Kế toán.

## Kế tiếp

Xem `specs/021-*` (TT99/2025/TT-BTC) — thay thế hoàn toàn spec này.
