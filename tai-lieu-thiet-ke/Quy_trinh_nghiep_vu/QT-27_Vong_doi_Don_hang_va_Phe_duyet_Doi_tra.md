# QT-27 — Vòng đời Đơn hàng và Phê duyệt Đổi trả

- Dự án: VComm
- Mã quy trình: QT-27
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-08 Quản lý Đơn hàng (`/orders`)
- Hiện trạng mã nguồn: Đã có — màn hình vận hành đơn hàng và đổi trả đã có trong mã nguồn

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên vận hành đơn hàng | Theo dõi đơn, xử lý trạng thái, xử lý đổi trả | `src/components/Orders.tsx` (tuyến `/orders`) |
| Khách hàng | Nhận thông báo trạng thái đơn qua tin nhắn | `src/services/orderStatusNotification.ts:50` |
| Hệ thống | Phát sự kiện và ghi bút toán khi đơn hoàn tất | `src/services/accountingOutbox.ts:52` |
| Người duyệt đổi trả | Phê duyệt yêu cầu đổi trả theo chính sách | `src/components/Orders.tsx` (tính năng phê duyệt đổi trả tự động) |

## 2. Điều kiện trước

- Đơn hàng đã được tạo từ kênh bán hàng hoặc từ sàn.
- Đã cấu hình chính sách đổi trả và thời hạn đổi trả.

## 3. Luồng chính

1. Đơn hàng mới được tạo và gán trạng thái ban đầu.
2. Hệ thống xác nhận đơn và gửi thông báo cho khách hàng (`orderStatusNotification.ts:50`).
3. Đơn chuyển sang trạng thái đóng gói và bàn giao vận chuyển.
4. Khi giao thành công, hệ thống cập nhật trạng thái và phát sự kiện đơn hoàn tất (`accountingOutbox.ts:52`).
5. Nếu khách yêu cầu đổi trả trong thời hạn, hệ thống tạo yêu cầu và chạy kiểm tra điều kiện tự động.
6. Người duyệt xem xét và phê duyệt hoặc từ chối yêu cầu đổi trả.
7. Khi đổi trả được duyệt, hệ thống sinh chứng từ nhập lại kho và bút toán đảo doanh thu.

## 4. Sơ đồ

```
[Đơn mới] --> [Xác nhận + thông báo khách]
                    |
                    v
        [Đóng gói] --> [Bàn giao vận chuyển] --> [Giao thành công]
                    |
                    v
        [publishOrderCompleted accountingOutbox:52] --> [Bút toán doanh thu]
                    |
                    v
   [Yêu cầu đổi trả] --> [Kiểm điều kiện tự động] --> [Người duyệt]
                    |
            +-------+-------+
            |               |
            v               v
    [Duyệt: nhập kho + đảo bút toán]  [Từ chối: đóng yêu cầu]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Đổi trả quá thời hạn chính sách | Từ chối tự động hoặc chuyển cấp duyệt ngoại lệ | `src/components/Orders.tsx` |
| E2 | Đơn hoàn tất hai lần phát sự kiện | Hàng đợi ra bảo đảm ít nhất một lần; cần khóa theo mã đơn | `src/services/accountingOutbox.ts:52` |
| E3 | Bút toán đảo lệch Nợ/Có | Từ chối ghi sổ | `src/services/dbService.ts:1888` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Đơn hàng: Mới --> Đã xác nhận --> Đang đóng gói --> Đang giao --> Giao thành công --> Hoàn tất
Hoàn tất --yêu cầu đổi trả--> Chờ duyệt đổi trả --> Đã duyệt đổi trả / Từ chối đổi trả
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Chỉ phát sinh bút toán doanh thu khi đơn hoàn tất | `src/services/accountingOutbox.ts:52` |
| BR-02 | Thông báo trạng thái đơn gửi cho khách theo mẫu tin nhắn tương ứng từng trạng thái | `src/services/orderStatusNotification.ts:50` |
| BR-03 | Đổi trả được duyệt phải sinh chứng từ nhập lại kho và bút toán đảo doanh thu | `src/components/Orders.tsx` |

## 8. Thông báo và nhật ký

- Gửi tin nhắn cho khách theo từng mốc trạng thái đơn (`src/services/orderStatusNotification.ts:46`).
- Chưa xác minh được có nhật ký kiểm toán riêng cho thao tác đổi trả hay không.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng đơn hàng | Mã đơn, trạng thái, tổng tiền, khách hàng | `src/services/accountingOutbox.ts:52` |
| Bảng đổi trả | Đơn gốc, lý do, trạng thái duyệt | `src/components/Orders.tsx` |
| `journal_entries` / `journal_items` | Bút toán doanh thu và bút toán đảo | `src/services/dbService.ts:1913` |

## 10. Màn hình

- Vận hành Đơn hàng và Logistics (`src/components/Orders.tsx`, tuyến `/orders`, 1.998 dòng).
- Tính năng Phê duyệt Đổi trả tự động (`src/components/Orders.tsx`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho đơn giao thành công, Khi hoàn tất, Thì hệ thống phát sự kiện và sinh bút toán doanh thu.
- **AC-02.** Cho yêu cầu đổi trả quá hạn chính sách, Khi tạo, Thì hệ thống từ chối hoặc buộc duyệt ngoại lệ (ca thất bại bắt buộc).
- **AC-03.** Cho đổi trả được duyệt, Khi ghi sổ, Thì doanh thu đảo đúng và hàng nhập lại kho.
- **AC-04.** Cho khách đổi trạng thái đơn, Khi trạng thái đổi, Thì khách nhận đúng mẫu thông báo.

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình đơn hàng và hàng đợi ra kế toán đã có.
- Cần bổ sung bảng đổi trả và chính sách thời hạn đổi trả nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Chính sách đổi trả áp dụng thống nhất cho mọi ngành hàng trong giai đoạn đầu.
- **Q-01.** Thời hạn đổi trả là bao nhiêu ngày và có khác nhau theo ngành hàng không?
- **Q-02.** Ai có thẩm quyền duyệt đổi trả ngoại lệ?

## 14. Ghi chú kỹ thuật

- Màn hình đơn hàng là một trong những màn hình lớn nhất kho mã (1.998 dòng), nên cân nhắc tách nhỏ khi mở rộng.
- Ghi sổ đi qua hàng đợi ra để bảo đảm xử lý ít nhất một lần (`src/services/accountingOutbox.ts:126`).

## Chưa xác minh được

- Chưa xác minh được bảng đổi trả có tồn tại độc lập hay nằm trong bảng đơn hàng.
- Chưa xác minh được chính sách thời hạn đổi trả đang áp dụng.
- Chưa xác minh được quy tắc phê duyệt đổi trả tự động.
