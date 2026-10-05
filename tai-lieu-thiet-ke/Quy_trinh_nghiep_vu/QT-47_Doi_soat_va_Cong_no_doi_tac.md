# QT-47 — Đối soát và Công nợ đối tác

- Dự án: VComm
- Mã quy trình: QT-47
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-31 Đối soát và Công nợ (`/settlement`)
- Hiện trạng mã nguồn: Đã có — có màn hình đối soát, hóa đơn điện tử và giải ngân tự động

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên đối soát | Đối chiếu doanh thu, phí và công nợ đối tác | `src/components/Settlement.tsx:447` |
| Kế toán | Xác nhận số liệu đối soát và giải ngân | `src/components/Settlement.tsx:807` |
| Hệ thống | Giải ngân tự động qua cổng thanh toán | `src/components/Settlement.tsx:807` |

## 2. Điều kiện trước

- Đã có kỳ đối soát và chính sách phí.
- Đã có thông tin tài khoản nhận tiền của đối tác.

## 3. Luồng chính

1. Hệ thống tổng hợp doanh thu, phí và các khoản giảm trừ trong kỳ đối soát.
2. Nhân viên đối soát kiểm tra và xác nhận số liệu (`Settlement.tsx:447`).
3. Hệ thống sinh bảng đối soát và hóa đơn điện tử liên quan.
4. Kế toán xác nhận và lệnh giải ngân.
5. Hệ thống giải ngân tự động qua cổng thanh toán (`Settlement.tsx:807`).
6. Ghi sổ bút toán đối soát và giải ngân.

## 4. Sơ đồ

```
[Tổng hợp doanh thu + phí + giảm trừ]
            |
            v
[Nhân viên đối soát xác nhận :447]
            |
            v
[Bảng đối soát + hóa đơn điện tử]
            |
            v
[Kế toán xác nhận lệnh giải ngân]
            |
            v
[Giải ngân tự động :807]
            |
            v
[Ghi sổ bút toán đối soát]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Số liệu đối soát lệch giữa hai bên | Đưa vào danh sách lệch để xử lý thủ công | `src/components/Settlement.tsx:447` |
| E2 | Tài khoản nhận tiền chưa xác minh | Chặn giải ngân | `src/components/SellerFinance.tsx:1280` |
| E3 | Bút toán đối soát lệch Nợ/Có | Từ chối ghi sổ | `src/services/dbService.ts:1888` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Kỳ đối soát: Chưa tổng hợp --> Đã tổng hợp --> Đã xác nhận --> Đã giải ngân
Đối soát: Chưa khớp --> Đã khớp / Lệch cần xử lý
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Chỉ giải ngân khi kỳ đối soát đã được xác nhận | `src/components/Settlement.tsx:807` |
| BR-02 | Tài khoản nhận tiền phải được xác minh trước khi giải ngân | `src/components/SellerFinance.tsx:1280` |
| BR-03 | Mọi khoản giải ngân phải ghi sổ qua cổng ghi sổ chung | `src/services/dbService.ts:1883` |

## 8. Thông báo và nhật ký

- Thông báo cho đối tác khi kỳ đối soát được xác nhận.
- Chưa xác minh được thông báo khi giải ngân thành công.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng kỳ đối soát | Kỳ, đối tác, doanh thu, phí, số phải trả | `src/components/Settlement.tsx:447` |
| Bảng lệnh giải ngân | Kỳ, số tiền, trạng thái, thời điểm | `src/components/Settlement.tsx:807` |
| Bảng tài khoản nhận tiền | Đối tác, ngân hàng, số tài khoản, trạng thái xác minh | `src/components/SellerFinance.tsx:1280` |

## 10. Màn hình

- Đối soát và Hóa đơn Điện tử (`src/components/Settlement.tsx:447`, tuyến `/settlement`, 886 dòng).
- Giải ngân tự động qua Cổng Payout (`src/components/Settlement.tsx:807`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho kỳ đối soát đã xác nhận, Khi giải ngân, Thì hệ thống sinh lệnh và ghi sổ.
- **AC-02.** Cho tài khoản nhận tiền chưa xác minh, Khi giải ngân, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-03.** Cho số liệu lệch giữa hai bên, Khi đối soát, Thì giao dịch vào danh sách lệch (ca bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình đối soát và cổng ghi sổ chung.
- Cần bổ sung chính sách phí và chu kỳ đối soát nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Kỳ đối soát theo tháng cho mọi đối tác.
- **Q-01.** Chu kỳ đối soát là theo tuần hay theo tháng?
- **Q-02.** Cổng thanh toán nào được dùng để giải ngân?

## 14. Ghi chú kỹ thuật

- Giải ngân tự động dùng cổng thanh toán đã tích hợp (`src/services/sepayService.ts:190`).

## Chưa xác minh được

- Chưa xác minh được chu kỳ đối soát.
- Chưa xác minh được cổng thanh toán đang dùng.
- Chưa xác minh được chính sách phí áp cho đối tác.
