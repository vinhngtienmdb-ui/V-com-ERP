# QT-39 — V-Xu — Điểm thưởng và Hoàn tiền

- Dự án: VComm
- Mã quy trình: QT-39
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-21 V-Xu (`/vxu`)
- Hiện trạng mã nguồn: Đã có — có dịch vụ V-Xu với phân hạng, tỉ lệ hoàn tiền và sổ điểm khách hàng

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Khách hàng | Tích điểm khi mua, đổi điểm khi thanh toán | `src/services/vxuService.ts:83` |
| Nhân viên vận hành | Theo dõi sổ điểm và xử lý lệch | `src/services/vxuService.ts:210` |
| Hệ thống | Xác định hạng, tỉ lệ hoàn tiền và phát hiện giao dịch lệch | `src/services/vxuService.ts:58`, `:70`, `:210` |

## 2. Điều kiện trước

- Đã có hạng thành viên và tỉ lệ hoàn tiền theo hạng.
- Đã có tài khoản điểm cho khách hàng.

## 3. Luồng chính

1. Hệ thống xác định hạng của khách (`vxuService.ts:58`).
2. Hệ thống lấy tỉ lệ hoàn tiền theo hạng (`vxuService.ts:70`).
3. Khi đơn hoàn tất, hệ thống tính số điểm hoàn (`vxuService.ts:83`).
4. Hệ thống ghi điểm vào tài khoản khách (`vxuService.ts:93`).
5. Khách đổi điểm khi thanh toán; hệ thống ghi giảm điểm.
6. Hệ thống đối chiếu sổ điểm và phát hiện giao dịch không cân (`vxuService.ts:210`).

## 4. Sơ đồ

```
[Xác định hạng :58] --> [Tỉ lệ hoàn tiền :70]
                                |
                                v
                    [computeCashback :83]
                                |
                                v
                    [Ghi điểm vào tài khoản :93]
                                |
                    +-----------+-----------+
                    |                       |
                    v                       v
            [Khách đổi điểm]        [Sổ điểm khách hàng :210]
                                            |
                                            v
                            [Phát hiện giao dịch không cân]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Đổi điểm vượt số dư điểm | Từ chối đổi | `src/services/vxuService.ts:83` |
| E2 | Giao dịch ghi điểm không cân | Hệ thống phát hiện và đưa vào danh sách lệch | `src/services/vxuService.ts:210` |
| E3 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Tài khoản điểm: Mới --> Đang tích --> Đang đổi --> Đã khóa
Giao dịch điểm: Đã ghi --> Đã đối chiếu --> Lệch cần xử lý
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Tỉ lệ hoàn tiền phụ thuộc hạng thành viên | `src/services/vxuService.ts:70` |
| BR-02 | Điểm chỉ ghi khi đơn hoàn tất | `src/services/vxuService.ts:83` |
| BR-03 | Mọi giao dịch điểm phải cân, giao dịch không cân bị đưa vào danh sách lệch | `src/services/vxuService.ts:210` |

## 8. Thông báo và nhật ký

- Chưa xác minh được có thông báo cho khách khi điểm sắp hết hạn hay không.
- Chưa xác minh được nhật ký kiểm toán cho thao tác điều chỉnh điểm.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng hạng thành viên | Tên hạng, điều kiện, tỉ lệ hoàn tiền | `src/services/vxuService.ts:58` |
| Bảng tài khoản điểm | Khách hàng, số dư điểm, hạng | `src/services/vxuService.ts:93` |
| Bảng sổ điểm | Loại giao dịch, số điểm, thời điểm | `src/services/vxuService.ts:210` |

## 10. Màn hình

- V-Xu (`src/components/VXu.tsx`, tuyến `/vxu`, 547 dòng).
- Cách tính hạng và hoàn tiền (`src/components/VXu.tsx:391`).
- Phiếu đã đổi (`src/components/VXu.tsx:499`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho đơn hoàn tất của khách hạng Vàng, Khi tính hoàn tiền, Thì số điểm theo tỉ lệ của hạng Vàng.
- **AC-02.** Cho khách đổi điểm vượt số dư, Khi đổi, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-03.** Cho giao dịch ghi điểm lệch, Khi đối chiếu, Thì giao dịch vào danh sách lệch (ca bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại dịch vụ V-Xu và màn hình đã có.
- Cần bổ sung chính sách hết hạn điểm nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Điểm có giá trị quy đổi cố định khi thanh toán.
- **Q-01.** Điểm có hết hạn theo thời gian không?
- **Q-02.** Tỉ lệ hoàn tiền theo từng hạng là bao nhiêu?

## 14. Ghi chú kỹ thuật

- Hàm xác định hạng, tỉ lệ hoàn tiền và tính hoàn tiền đều là hàm thuần, kiểm thử được độc lập.
- Có hàm phát hiện giao dịch điểm không cân (`src/services/vxuService.ts:210`).

## Chưa xác minh được

- Chưa xác minh được chính sách hết hạn điểm.
- Chưa xác minh được tỉ lệ hoàn tiền từng hạng.
- Chưa xác minh được luồng xử lý khi phát hiện giao dịch lệch.
