# QT-44 — Ví, Ký quỹ và Thanh toán

- Dự án: VComm
- Mã quy trình: QT-44
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-32 Ví và Thanh toán (`/wallet`)
- Hiện trạng mã nguồn: Đã có — có dịch vụ ký quỹ đầy đủ vòng đời và kết nối ngân hàng

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Khách hàng hoặc người bán | Nạp tiền, rút tiền, xem số dư và lịch sử giao dịch | `src/components/Wallet.tsx:282`, `:1019` |
| Hệ thống | Giữ tiền ký quỹ, giải phóng hoặc hoàn tiền theo trạng thái đơn | `src/services/escrowService.ts:111`, `:144` |
| Kế toán | Đối chiếu số dư ví với sổ kế toán | `src/components/Wallet.tsx:913` |

## 2. Điều kiện trước

- Đã có tài khoản ví cho người dùng.
- Đã cấu hình kết nối ngân hàng để nạp và rút tiền.

## 3. Luồng chính

1. Người dùng nạp tiền vào ví qua kết nối ngân hàng (`Wallet.tsx:726`).
2. Khi đặt hàng, hệ thống giữ tiền ký quỹ (`escrowService.ts:44`).
3. Hệ thống đánh dấu ký quỹ đã giao hàng khi đơn giao thành công (`escrowService.ts:77`).
4. Nếu không có tranh chấp, hệ thống giải phóng tiền cho người bán (`escrowService.ts:111`).
5. Nếu có tranh chấp, hệ thống mở tranh chấp và tạm giữ tiền (`escrowService.ts:100`).
6. Khi tranh chấp kết thúc, hệ thống hoàn tiền cho người mua (`escrowService.ts:144`).
7. Hệ thống xử lý các ký quỹ đến hạn tự động (`escrowService.ts:167`).
8. Người dùng rút tiền; hệ thống xác minh tài khoản nhận tiền trước khi giải ngân.

## 4. Sơ đồ

```
[Nạp tiền qua ngân hàng :726]
            |
            v
[Đặt hàng] --> [createEscrow :44]
            |
            v
[markEscrowDelivered :77]
            |
    +-------+-------+
    |               |
    v               v
[releaseEscrow :111]  [openDispute :100]
    |                       |
    v                       v
[Tiền về người bán]   [refundEscrow :144]
                            |
                            v
                    [Tiền về người mua]
            |
            v
[processDueEscrows :167] --> [Rút tiền]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Số dư ví không đủ để đặt hàng | Chặn đặt hàng | `src/services/escrowService.ts:44` |
| E2 | Giải phóng ký quỹ hai lần cho cùng đơn | Hệ thống chặn theo trạng thái ký quỹ | `src/services/escrowService.ts:111` |
| E3 | Rút tiền khi chưa xác minh tài khoản | Chặn rút tiền | `src/components/SellerFinance.tsx:1280` |
| E4 | Bút toán ví lệch Nợ/Có | Từ chối ghi sổ | `src/services/dbService.ts:1888` |

## 6. Máy trạng thái

```
Ký quỹ: Đã giữ --> Đã giao hàng --> Đã giải phóng / Đang tranh chấp
Đang tranh chấp --> Đã hoàn tiền / Đã giải phóng
Giao dịch ví: Đang chờ --> Thành công / Thất bại
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Tiền đặt hàng được giữ ký quỹ cho tới khi đơn hoàn tất | `src/services/escrowService.ts:44` |
| BR-02 | Chỉ giải phóng ký quỹ khi đơn đã giao và không có tranh chấp | `src/services/escrowService.ts:111` |
| BR-03 | Tranh chấp mở ra thì tiền bị tạm giữ cho tới khi kết thúc | `src/services/escrowService.ts:100` |
| BR-04 | Ký quỹ đến hạn được xử lý tự động | `src/services/escrowService.ts:167` |

## 8. Thông báo và nhật ký

- Thông báo cho người dùng khi giao dịch ví thành công hoặc thất bại.
- Chưa xác minh được thông báo khi ký quỹ được giải phóng.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng ví | Chủ ví, số dư khả dụng, số dư tạm giữ | `src/components/Wallet.tsx:282` |
| Bảng giao dịch ví | Loại giao dịch, số tiền, trạng thái, thời điểm | `src/components/Wallet.tsx:1019` |
| Bảng ký quỹ | Đơn hàng, số tiền, trạng thái, thời hạn | `src/services/escrowService.ts:89` |
| Bảng tài khoản nhận tiền | Chủ ví, ngân hàng, trạng thái xác minh | `src/components/Wallet.tsx:592` |

## 10. Màn hình

- Ví Tài chính và Ký quỹ (`src/components/Wallet.tsx:282`, tuyến `/wallet`, 1.051 dòng).
- Liên kết tài khoản ngân hàng (`src/components/Wallet.tsx:592`).
- Giao thức giải ngân tức thời (`src/components/Wallet.tsx:607`).
- Giao thức ký quỹ (`src/components/Wallet.tsx:629`).
- Kết nối ngân hàng SePay (`src/components/Wallet.tsx:726`).
- Tra cứu giao dịch (`src/components/Wallet.tsx:913`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho đơn hàng đặt thành công, Khi hệ thống giữ tiền, Thì số dư khả dụng giảm và số dư tạm giữ tăng tương ứng.
- **AC-02.** Cho đơn giao thành công không tranh chấp, Khi giải phóng ký quỹ, Thì tiền về người bán.
- **AC-03.** Cho tranh chấp được mở, Khi kết thúc, Thì tiền hoàn về người mua (ca bắt buộc).
- **AC-04.** Cho lệnh giải phóng ký quỹ thứ hai cho cùng đơn, Khi thực hiện, Thì hệ thống chặn (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại dịch vụ ký quỹ và màn hình ví đã có.
- Cần bổ sung chính sách thời hạn ký quỹ nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** VComm không phải tổ chức cung ứng dịch vụ trung gian thanh toán; ví chỉ ghi nhận công nợ nội bộ.
- **Q-01.** Thời hạn tự động giải phóng ký quỹ là bao nhiêu ngày?
- **Q-02.** Quy trình xử lý tranh chấp gồm những bước nào?

## 14. Ghi chú kỹ thuật

- Vòng đời ký quỹ là tập trạng thái có kiểm soát, kiểm thử được độc lập.
- Có tệp kiểm thử cho dịch vụ ký quỹ.

## Chưa xác minh được

- Chưa xác minh được thời hạn tự động giải phóng ký quỹ.
- Chưa xác minh được quy trình xử lý tranh chấp.
- Chưa xác minh được mô hình pháp lý của ví trong hệ thống.
