# QT-35 — V-Xu — Điểm thưởng và Hoàn tiền

- Dự án: VComm
- Mã quy trình: QT-35
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-21 V-Xu (`/vxu`)
- Hiện trạng mã nguồn: Đã có — dịch vụ V-Xu với sổ cái kế toán kép, phân hạng, hoàn tiền và ma trận phiếu thưởng; **chưa nối vào vòng đời đơn hàng**

> Quyết định chủ dự án ngày 2026-10-09: **V-Xu là động cơ điểm duy nhất** của hệ sinh thái. Sổ điểm cũ (`loyalty_points_ledger` và trường `points` trên hồ sơ khách) phải được gộp vào V-Xu. Xem mục 9 và mục 12.

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Khách hàng | Tích V-Xu khi mua, đổi V-Xu lấy phiếu ưu đãi | `src/services/vxuService.ts:83`, `:387` |
| Nhân viên vận hành | Theo dõi ví, sổ cái và xử lý lệch | `src/services/vxuService.ts:125`, `:210`, `:227` |
| Quản trị hệ thống | Điều chỉnh điểm qua bút toán `adjust` | `src/services/vxuService.ts:151`, `:154` |
| Hệ thống | Xếp hạng, tính hoàn tiền, ghi sổ kép, phát hiện lệch | `src/services/vxuService.ts:58`, `:269`, `:227` |

## 2. Điều kiện trước

- Đã có tài khoản V-Xu cho khách; hệ thống tự tạo khi chưa có (`src/services/vxuService.ts:93`).
- Đã có bảng hạng và tỉ lệ hoàn tiền (`src/types/erp.ts:1131`).
- Đã có ma trận phiếu ưu đãi (`src/services/vxuService.ts:365`).

## 3. Luồng chính

1. Khi đơn hoàn tất, hệ thống lấy hoặc tự tạo ví V-Xu của khách (`src/services/vxuService.ts:269`, `:93`).
2. Hệ thống cộng chi tiêu lũy kế và số đơn, rồi **xếp lại hạng** (`src/services/vxuService.ts:296`, `:298`).
3. Hệ thống tính hoàn tiền theo **hạng sau khi xếp lại** (`src/services/vxuService.ts:303`).
4. Hệ thống ghi bút toán kép `earn`: Nợ `vxu_issuer`, Có ví khách (`src/services/vxuService.ts:309`).
5. Khách đổi V-Xu lấy phiếu ưu đãi; hệ thống kiểm tra hạng mở khoá và số dư (`src/services/vxuService.ts:387`, `:400`, `:408`).
6. Hệ thống ghi bút toán kép `spend`: Nợ ví khách, Có `vxu_revenue` (`src/services/vxuService.ts:415`).
7. Khi đơn bị huỷ hoặc trả hàng, hệ thống hoàn lại V-Xu đã tích (`src/services/vxuService.ts:511`).
8. Hệ thống đối chiếu sổ và phát hiện giao dịch không cân (`src/services/vxuService.ts:227`).

## 4. Sơ đồ

```
[Đơn hoàn tất :269]
        |
        v
[Cộng lũy kế + xếp lại hạng :296, :298]
        |
        v
[computeCashback theo hạng mới :303]
        |
        v
[postDoubleEntry earn :309 — Nợ vxu_issuer / Có ví khách]
        |
        +------------------------------+
        |                              |
        v                              v
[Khách đổi phiếu :387]        [Đối chiếu sổ :227]
        |                              |
        v                              v
[postDoubleEntry spend :415]  [Danh sách giao dịch lệch]
        |
        v
[Phiếu phát hành :446]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Đổi phiếu khi hạng chưa đủ mở khoá | Từ chối | `src/services/vxuService.ts:400` |
| E2 | Đổi phiếu khi số dư V-Xu không đủ | Từ chối | `src/services/vxuService.ts:408` |
| E3 | Mẫu phiếu không có trong ma trận | Từ chối | `src/services/vxuService.ts:395` |
| E4 | Dùng phiếu đã dùng hoặc đã hết hạn | Từ chối | `src/services/vxuService.ts:478`, `:481` |
| E5 | Ghi trùng bút toán `earn` cho cùng một đơn | Bỏ qua (idempotent) | `src/services/vxuService.ts:291` |
| E6 | Giao dịch ghi điểm không cân | Hệ thống phát hiện và đưa vào danh sách lệch | `src/services/vxuService.ts:227` |
| E7 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Hạng khách: Đồng --> Bạc --> Vàng --> Kim Cương
Phiếu ưu đãi: Đã phát hành --> Đã dùng
Đã phát hành --quá hạn--> Hết hạn
Bút toán sổ cái: Đã ghi --> Đã đối chiếu --> Lệch cần xử lý
```

Trạng thái phiếu ở `src/services/vxuService.ts:441` (`issued`), `:487` (`used`), `:482` (`expired`).

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | **V-Xu là động cơ điểm duy nhất** của hệ sinh thái; mọi điểm thưởng và hoàn tiền đều ghi vào `vxu_ledger` | Quyết định chủ dự án 2026-10-09 |
| BR-02 | Mỗi giao dịch V-Xu ghi đúng hai vế (một Nợ, một Có) cùng `transactionId`; sổ phải luôn cân | `src/services/vxuService.ts:150`, `:154` |
| BR-03 | Xếp hạng theo chi tiêu lũy kế **và** số đơn; cả hai điều kiện phải thoả | `src/services/vxuService.ts:58`, `:62` |
| BR-04 | Hoàn tiền tính theo hạng **sau khi** xếp lại — đơn đưa khách lên hạng mới hưởng ngay mức hoàn của hạng mới | `src/services/vxuService.ts:298`, `:303` |
| BR-05 | 1 V-Xu = 1 VND khi tiêu | `src/services/vxuService.ts:29` |
| BR-06 | Số V-Xu hoàn làm tròn xuống; đơn quá nhỏ hoàn 0 thì không ghi sổ nhưng vẫn cộng lũy kế | `src/services/vxuService.ts:85`, `:308` |
| BR-07 | Ghi hoàn tiền cho một đơn là idempotent theo `orderId` | `src/services/vxuService.ts:291` |
| BR-08 | Đổi phiếu phải đủ hạng mở khoá và đủ số dư | `src/services/vxuService.ts:400`, `:408` |
| BR-09 | Đơn bị huỷ hoặc trả hàng thì hoàn lại V-Xu đã tích, **không** cộng lại chi tiêu lũy kế | `src/services/vxuService.ts:511`, `:559` |

## 8. Thông báo và nhật ký

- Sổ cái kép cho phép đối chiếu với sổ kế toán tài chính qua `transactionId` (`src/services/vxuService.ts:15`).
- Chưa xác minh được có thông báo cho khách khi điểm sắp hết hạn hay không.
- Chưa xác minh được nhật ký kiểm toán cho thao tác điều chỉnh điểm.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng ví V-Xu `vxu_accounts` | Khách hàng, số dư, tổng tích lũy, chi tiêu lũy kế, số đơn, hạng | `src/services/vxuService.ts:98`, `:108` |
| Bảng sổ cái `vxu_ledger` | `transactionId`, vế Nợ/Có, tài khoản, số tiền, loại, tham chiếu | `src/services/vxuService.ts:203`, `:286` |
| Bảng phiếu đã đổi `vxu_redemptions` | Mã phiếu, mẫu, chi phí V-Xu, giá trị, hạng yêu cầu, trạng thái, hạn | `src/services/vxuService.ts:446` |
| **Di trú:** bảng `loyalty_points_ledger` và trường `points` trên hồ sơ khách | Chuyển số dư sang `vxu_ledger` rồi ngừng ghi sổ cũ | `src/services/crmService.ts:77`, `:101` |

## 10. Màn hình

- V-Xu (`src/components/VXu.tsx`, tuyến `/vxu`, 546 dòng).
- Cách tính hạng và hoàn tiền (`src/components/VXu.tsx:391`).
- Phiếu đã đổi (`src/components/VXu.tsx:499`).
- Nguồn dữ liệu thật: `src/components/VXu.tsx:10` (`import * as vxu from '../services/vxuService'`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho đơn hoàn tất của khách hạng Vàng, Khi tính hoàn tiền, Thì số V-Xu theo tỉ lệ 3,5% của hạng Vàng.
- **AC-02.** Cho đơn đưa khách vượt ngưỡng lên hạng mới, Khi tính hoàn tiền, Thì áp mức hoàn của hạng mới ngay trong đơn đó (ca bắt buộc).
- **AC-03.** Cho khách đổi phiếu vượt số dư, Khi đổi, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-04.** Cho khách hạng thấp đổi phiếu yêu cầu hạng cao, Khi đổi, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-05.** Cho giao dịch ghi điểm lệch, Khi đối chiếu, Thì giao dịch vào danh sách lệch (ca bắt buộc).
- **AC-06.** Cho đơn đã ghi hoàn tiền, Khi ghi lần hai, Thì hệ thống bỏ qua (idempotent) (ca bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại dịch vụ V-Xu và màn hình đã có.
- **V-Xu chưa nối vào vòng đời đơn hàng.** Đường tích điểm đang chạy thật nằm ở sổ cũ: `src/components/Orders.tsx:1277` gọi `addLoyaltyPoints` với `pointsToEarn = Math.round(total / 10000)` (1 điểm mỗi 10.000 đồng). Hàm `recordCompletedOrder` của V-Xu **chỉ được gọi trong tệp kiểm thử** (`src/__tests__/vxu.test.ts:138`, `:163`, `:177`), không có thành phần chạy thật nào gọi. Vì vậy động cơ "duy nhất" trên danh nghĩa đang **không hoạt động**, còn động cơ cũ lại đang hoạt động.
- **Hai công thức tích điểm khác nhau:** sổ cũ dùng 1 điểm mỗi 10.000 đồng (≈ 0,01%); V-Xu dùng tỉ lệ hoàn theo hạng 1%–5% (`src/types/erp.ts:1131`). Hai mức chênh nhau khoảng 100 lần — **phải chốt mức nào trước khi di trú**.
- **Gộp sổ điểm:** `loyalty_points_ledger` (ghi ở `src/services/crmService.ts:77`) và trường `points` trên hồ sơ khách (ghi ở `src/services/crmService.ts:101`) phải ngừng ghi và được chuyển vào `vxu_ledger`. Cần một lượt di trú có kiểm soát: đọc số dư cũ, ghi bút toán mở đầu, đối chiếu, rồi ngừng ghi sổ cũ.
- **Sửa màn hình Loyalty:** xem QT-37.

## 13. Giả định và câu hỏi mở

- **GD-01.** 1 V-Xu = 1 VND khi tiêu.
- **GD-02.** V-Xu áp dụng cho toàn hệ sinh thái, không riêng một kênh.
- **Q-01.** Điểm có hết hạn theo thời gian không? (có tài khoản `vxu_expired` nhưng chưa xác minh được luồng chạy)
- **Q-02.** Lượt miễn ghép của mua chung (QT-31) có tiêu hao V-Xu không?
- **Q-03.** Có thêm tầng hội viên trả phí theo tháng không (tham chiếu 省钱月卡 của Pinduoduo)?
- **Q-04.** Chốt mức tích điểm: giữ 0,01% của sổ cũ hay dùng 1%–5% theo hạng của V-Xu?
- **Q-05.** Thứ tự xử lý khi một khách vừa có số dư sổ cũ vừa có số dư V-Xu lúc di trú?

## 14. Ghi chú kỹ thuật

- Hàm xếp hạng, tỉ lệ hoàn tiền và tính hoàn tiền đều là hàm thuần, kiểm thử được độc lập (`src/services/vxuService.ts:58`, `:70`, `:83`).
- Mọi thao tác ghi điểm đi qua **một hàm ghi duy nhất** `postDoubleEntry` (`src/services/vxuService.ts:154`), bảo đảm sổ luôn cân.
- Bốn tài khoản chuẩn: `vxu_customer:<id>`, `vxu_issuer`, `vxu_revenue`, `vxu_expired` (`src/services/vxuService.ts:34`–`:36`, `:49`).
- Có hàm phát hiện giao dịch không cân (`src/services/vxuService.ts:227`).
- Có tệp kiểm thử đầy đủ cho dịch vụ (`src/__tests__/vxu.test.ts`).

## Chưa xác minh được

- Chưa xác minh được chính sách hết hạn điểm — tài khoản `vxu_expired` có tồn tại nhưng chưa rõ luồng nào ghi vào.
- Chưa xác minh được luồng xử lý khi phát hiện giao dịch lệch.
- Chưa xác minh được `loyalty_points_ledger` và trường `points` có bao nhiêu bản ghi thật trong sản xuất — cần đếm trước khi di trú.
- Chưa xác minh được vì sao V-Xu chưa được nối vào `Orders.tsx` — có thể do chưa tới giai đoạn, hoặc do hai công thức tích điểm chưa được chốt.
