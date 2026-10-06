# Hỗ trợ Tài chính Nhà bán — TẠM HỦY

> **TẠM HỦY 2026-10-09.** Quy trình này được dời khỏi cây đang hoạt động. Lý do: Tạm hủy 2026-10-05 theo yêu cầu chủ dự án. Tệp lưu trữ không mang mã QT; mã cũ là QT-49. Xem `_Tam_huy/README.md`.

- Dự án: VComm
- Mã quy trình: QT-49 (tạm hủy 2026-10-09)
- Phiên bản: 1.0
- Trạng thái: Tạm hủy
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-33 Hỗ trợ Tài chính Nhà bán (`/seller-finance`)
- Hiện trạng mã nguồn: Đã có — có màn hình tài chính người bán với xếp hạng tín nhiệm và chi tiết khấu trừ phí

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Người bán | Xem số dư khả dụng, lịch sử giao dịch, xin ứng tiền | `src/components/SellerFinance.tsx:1003`, `:1019` |
| Kế toán | Duyệt lệnh chi và xác thực chữ ký số | `src/components/SellerFinance.tsx:1350` |
| Hệ thống | Xếp hạng tín nhiệm người bán và tính phí khấu trừ | `src/components/SellerFinance.tsx:1093`, `:1312` |

## 2. Điều kiện trước

- Người bán đã hoàn tất xác minh hồ sơ.
- Đã có chính sách ứng tiền và phí khấu trừ.

## 3. Luồng chính

1. Hệ thống tính số dư khả dụng của người bán (`SellerFinance.tsx:1003`).
2. Hệ thống tính điểm xếp hạng tín nhiệm dựa trên lịch sử giao dịch (`SellerFinance.tsx:1093`).
3. Người bán xin ứng tiền theo hạn mức tương ứng hạng tín nhiệm.
4. Hệ thống xác minh tình trạng vận đơn trước khi chấp nhận ứng (`SellerFinance.tsx:1280`).
5. Hệ thống tính chi tiết khấu trừ phí và số tiền chuyển khoản (`SellerFinance.tsx:1312`).
6. Kế toán xác thực chứng thư và ký số duyệt chi (`SellerFinance.tsx:1350`).
7. Hệ thống phát sự kiện rút tiền đã duyệt và ghi sổ (`accountingOutbox.ts:88`).

## 4. Sơ đồ

```
[Số dư khả dụng :1003]
            |
            v
[Xếp hạng tín nhiệm :1093] --> [Hạn mức ứng tiền]
            |
            v
[Người bán xin ứng tiền]
            |
            v
[Xác minh vận đơn :1280]
            |
            v
[Chi tiết khấu trừ phí :1312]
            |
            v
[Xác thực chữ ký số duyệt chi :1350]
            |
            v
[publishWithdrawalApproved :88] --> [Ghi sổ]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Số dư khả dụng không đủ | Chặn lệnh chi | `src/components/SellerFinance.tsx:1003` |
| E2 | Vận đơn chưa xác minh | Chặn ứng tiền cho đơn đó | `src/components/SellerFinance.tsx:1280` |
| E3 | Chữ ký số không hợp lệ | Chặn duyệt chi | `src/components/SellerFinance.tsx:1350` |
| E4 | Bút toán rút tiền lệch Nợ/Có | Từ chối ghi sổ | `src/services/dbService.ts:1888` |

## 6. Máy trạng thái

```
Yêu cầu ứng tiền: Mới --> Chờ duyệt --> Đã duyệt --> Đã chi --> Đã ghi sổ
Yêu cầu --từ chối--> Đã từ chối (kèm lý do)
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Hạn mức ứng tiền phụ thuộc hạng tín nhiệm người bán | `src/components/SellerFinance.tsx:1093` |
| BR-02 | Phải xác minh vận đơn trước khi chấp nhận ứng tiền | `src/components/SellerFinance.tsx:1280` |
| BR-03 | Lệnh chi phải được ký số trước khi thực hiện | `src/components/SellerFinance.tsx:1350` |
| BR-04 | Sự kiện rút tiền đã duyệt đi qua hàng đợi ra để ghi sổ | `src/services/accountingOutbox.ts:88` |

## 8. Thông báo và nhật ký

- Thông báo cho người bán khi lệnh chi được duyệt.
- Có tệp kiểm thử cho hàng đợi ra kế toán.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng số dư người bán | Số dư khả dụng, số dư tạm giữ | `src/components/SellerFinance.tsx:1003` |
| Bảng xếp hạng tín nhiệm | Điểm, hạng, hạn mức tương ứng | `src/components/SellerFinance.tsx:1093` |
| Bảng lệnh chi | Người bán, số tiền, phí khấu trừ, trạng thái | `src/components/SellerFinance.tsx:1312` |
| Bảng vận đơn | Mã vận đơn, trạng thái, đơn hàng | `src/components/SellerFinance.tsx:1280` |

## 10. Màn hình

- Số dư khả dụng (`src/components/SellerFinance.tsx:1003`, tuyến `/seller-finance`, 1.497 dòng).
- Lịch sử giao dịch ví (`src/components/SellerFinance.tsx:1019`).
- Thuật toán Xếp hạng Tín nhiệm (`src/components/SellerFinance.tsx:1093`).
- Chi tiết khấu trừ phí và số tiền chuyển khoản (`src/components/SellerFinance.tsx:1312`).
- Xác thực chứng thư và Ký số duyệt chi (`src/components/SellerFinance.tsx:1350`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho người bán có số dư khả dụng dương, Khi xin ứng tiền trong hạn mức, Thì yêu cầu được tạo.
- **AC-02.** Cho vận đơn chưa xác minh, Khi xin ứng tiền, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-03.** Cho lệnh chi chưa ký số, Khi thực hiện chi, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-04.** Cho lệnh chi đã duyệt, Khi ghi sổ, Thì bút toán đúng số tiền sau khấu trừ phí.

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình tài chính người bán và hàng đợi ra kế toán.
- Cần bổ sung chính sách xếp hạng tín nhiệm và phí khấu trừ nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Người bán được ứng trước một phần doanh thu của đơn đã giao.
- **Q-01.** Hạn mức ứng tiền theo từng hạng tín nhiệm là bao nhiêu?
- **Q-02.** Phí ứng tiền tính theo tỉ lệ hay theo bậc?

## 14. Ghi chú kỹ thuật

- Sự kiện rút tiền đã duyệt đi qua hàng đợi ra (`src/services/accountingOutbox.ts:88`), bảo đảm ghi sổ ít nhất một lần.

## Chưa xác minh được

- Chưa xác minh được hạn mức ứng tiền theo hạng.
- Chưa xác minh được cách tính phí ứng tiền.
- Chưa xác minh được thuật toán xếp hạng tín nhiệm.
