# QT-45 — Vận chuyển và Logistics

- Dự án: VComm
- Mã quy trình: QT-45
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-26 Vận chuyển (`/logistics`)
- Hiện trạng mã nguồn: Đã có một phần — có màn hình vận chuyển và dịch vụ đối chiếu tiền thu hộ

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên điều phối vận chuyển | Gán đơn vị vận chuyển, theo dõi trạng thái giao | `src/components/Logistics.tsx` (tuyến `/logistics`) |
| Đơn vị vận chuyển | Nhận đơn, cập nhật trạng thái giao | `src/components/Logistics.tsx` |
| Kế toán | Đối chiếu tiền thu hộ với đơn vị vận chuyển | `src/services/codReconciliationService.ts:15` |

## 2. Điều kiện trước

- Đã có danh sách đơn vị vận chuyển và biểu phí.
- Đã có thông tin địa chỉ giao hàng.

## 3. Luồng chính

1. Gán đơn vị vận chuyển cho đơn hàng cần giao.
2. Hệ thống gửi thông tin đơn sang đơn vị vận chuyển.
3. Đơn vị vận chuyển cập nhật trạng thái giao hàng.
4. Hệ thống cập nhật trạng thái đơn và thông báo cho khách.
5. Khi giao thành công, hệ thống ghi nhận tiền thu hộ nếu có.
6. Cuối kỳ, đối chiếu tiền thu hộ với sao kê của đơn vị vận chuyển (`codReconciliationService.ts:15`).

## 4. Sơ đồ

```
[Gán đơn vị vận chuyển]
            |
            v
[Gửi đơn sang đơn vị vận chuyển]
            |
            v
[Đơn vị cập nhật trạng thái giao]
            |
            v
[Cập nhật đơn + thông báo khách]
            |
            v
[Giao thành công --> ghi nhận tiền thu hộ]
            |
            v
[reconcileCodStatement :15] --> [Kết quả đối chiếu]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Giao hàng thất bại nhiều lần | Chuyển sang trạng thái hoàn hàng | `src/components/Logistics.tsx` |
| E2 | Tiền thu hộ lệch giữa đơn và sao kê | Đưa vào danh sách lệch để kế toán xử lý | `src/services/codReconciliationService.ts:15` |
| E3 | Đơn không có địa chỉ giao hợp lệ | Chặn gán đơn vị vận chuyển | `src/components/Logistics.tsx` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Đơn giao: Chờ lấy hàng --> Đang giao --> Giao thành công / Giao thất bại --> Hoàn hàng
Đối chiếu tiền thu hộ: Chưa đối chiếu --> Đã đối chiếu --> Lệch cần xử lý
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Đơn vị vận chuyển chọn theo tuyến và biểu phí | `src/components/Logistics.tsx` |
| BR-02 | Tiền thu hộ phải được đối chiếu với sao kê đơn vị vận chuyển | `src/services/codReconciliationService.ts:15` |
| BR-03 | Giao thất bại quá số lần quy định thì chuyển sang hoàn hàng | `src/components/Logistics.tsx` |

## 8. Thông báo và nhật ký

- Thông báo trạng thái giao cho khách theo từng mốc (`src/services/orderStatusNotification.ts:50`).
- Chưa xác minh được thông báo cho kế toán khi có lệch tiền thu hộ.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng đơn vị vận chuyển | Tên, biểu phí, tuyến phục vụ | `src/components/Logistics.tsx` |
| Bảng vận đơn | Mã vận đơn, đơn hàng, trạng thái | `src/components/Logistics.tsx` |
| Bảng đối chiếu tiền thu hộ | Đơn, số tiền, trạng thái đối chiếu | `src/services/codReconciliationService.ts:15` |

## 10. Màn hình

- Vận chuyển (`src/components/Logistics.tsx`, tuyến `/logistics`, 544 dòng).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho đơn có địa chỉ hợp lệ, Khi gán đơn vị vận chuyển, Thì vận đơn được tạo.
- **AC-02.** Cho đơn không có địa chỉ, Khi gán đơn vị vận chuyển, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-03.** Cho sao kê tiền thu hộ lệch với đơn, Khi đối chiếu, Thì giao dịch vào danh sách lệch (ca bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình vận chuyển và dịch vụ đối chiếu tiền thu hộ.
- Cần bổ sung kết nối đơn vị vận chuyển nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Đơn vị vận chuyển bên ngoài, hệ thống chỉ điều phối và đối chiếu.
- **Q-01.** Có kết nối tự động với đơn vị vận chuyển không?
- **Q-02.** Số lần giao thất bại tối đa trước khi hoàn hàng là bao nhiêu?

## 14. Ghi chú kỹ thuật

- Dịch vụ đối chiếu tiền thu hộ là hàm thuần, kiểm thử được độc lập (`codReconciliationService.ts:15`).

## Chưa xác minh được

- Chưa xác minh được kết nối đơn vị vận chuyển.
- Chưa xác minh được số lần giao thất bại tối đa.
- Chưa xác minh được chu kỳ đối chiếu tiền thu hộ.
