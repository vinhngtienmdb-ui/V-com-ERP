# QT-36 — Gom đơn B2B

- Dự án: VComm
- Mã quy trình: QT-36
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-18 Gom đơn B2B (`/f2b2b`)
- Hiện trạng mã nguồn: Đã có — có dịch vụ gom đơn với giá theo bậc và quản lý nguồn hàng

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhà bán buôn | Tạo nguồn hàng, cập nhật giá theo bậc | `src/services/f2b2bService.ts:117`, `:143` |
| Người mua gom | Tham gia gom đơn theo bậc giá | `src/services/f2b2bService.ts:181` |
| Nhân viên kiểm duyệt | Đưa nguồn hàng vào danh sách đen khi vi phạm | `src/services/f2b2bService.ts:159` |

## 2. Điều kiện trước

- Đã có nguồn hàng và bậc giá theo số lượng.
- Đã có chính sách kiểm duyệt nhà bán buôn.

## 3. Luồng chính

1. Nhà bán buôn tạo nguồn hàng và thiết lập bậc giá theo số lượng.
2. Hệ thống chuẩn hóa bậc giá (`f2b2bService.ts:65`).
3. Người mua tham gia gom đơn; hệ thống xác định giá theo bậc (`f2b2bService.ts:76`).
4. Hệ thống theo dõi các nhóm gom đang mở (`f2b2bService.ts:181`).
5. Khi nhóm đủ điều kiện, chốt giá và sinh đơn.
6. Nếu nguồn hàng vi phạm, nhân viên kiểm duyệt đưa vào danh sách đen (`f2b2bService.ts:159`).

## 4. Sơ đồ

```
[Nhà bán buôn tạo nguồn hàng :117]
            |
            v
[normalizeTiers :65] --> [Bậc giá theo số lượng]
            |
            v
[Người mua gom] --> [resolveTierPrice :76]
            |
            v
[Theo dõi nhóm gom đang mở :181]
            |
            v
[Chốt nhóm] --> [Sinh đơn]
            |
            v
[Nguồn vi phạm --> danh sách đen :159]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Bậc giá không tăng dần theo số lượng | Chặn lưu cấu hình bậc | `src/services/f2b2bService.ts:65` |
| E2 | Nhà bán buôn nằm trong danh sách đen | Không cho tạo hoặc cập nhật nguồn hàng | `src/services/f2b2bService.ts:159` |
| E3 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Nguồn hàng: Nháp --> Đang mở --> Đã đóng --> Danh sách đen
Nhóm gom: Đang gom --> Đã chốt --> Đã sinh đơn / Đã hủy
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Bậc giá phải được chuẩn hóa và tăng dần theo số lượng | `src/services/f2b2bService.ts:65` |
| BR-02 | Nhà bán buôn trong danh sách đen không được tạo nguồn hàng mới | `src/services/f2b2bService.ts:159` |
| BR-03 | Giá áp theo bậc tương ứng số lượng của nhóm gom | `src/services/f2b2bService.ts:76` |

## 8. Thông báo và nhật ký

- Chưa xác minh được có thông báo cho người mua khi nhóm gom chốt hay không.
- Chưa xác minh được nhật ký kiểm toán cho thao tác đưa vào danh sách đen.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng nguồn hàng | Nhà bán buôn, sản phẩm, trạng thái | `src/services/f2b2bService.ts:117` |
| Bảng bậc giá | Số lượng tối thiểu, giá | `src/services/f2b2bService.ts:65` |
| Bảng nhóm gom | Mã nhóm, nguồn hàng, số người, trạng thái | `src/services/f2b2bService.ts:181` |
| Bảng danh sách đen | Nhà bán buôn, lý do | `src/services/f2b2bService.ts:159` |

## 10. Màn hình

- Gom đơn B2B (`src/components/F2B2B.tsx`, tuyến `/f2b2b`, 1.028 dòng).
- Bên tham gia gom (`src/components/F2B2B.tsx:670`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho bậc giá hợp lệ, Khi lưu, Thì hệ thống chuẩn hóa và ghi nhận.
- **AC-02.** Cho bậc giá không tăng dần, Khi lưu, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-03.** Cho nhà bán buôn trong danh sách đen, Khi tạo nguồn hàng, Thì hệ thống chặn (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại dịch vụ gom đơn và màn hình đã có.
- Cần bổ sung luồng sinh đơn sau khi chốt nhóm nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Nhà bán buôn phải được kiểm duyệt trước khi đăng nguồn hàng.
- **Q-01.** Có bao nhiêu bậc giá cho mỗi nguồn hàng?
- **Q-02.** Quy trình đưa vào và gỡ khỏi danh sách đen như thế nào?

## 14. Ghi chú kỹ thuật

- Hàm chuẩn hóa bậc giá và hàm xác định giá là hàm thuần, kiểm thử được độc lập (`f2b2bService.ts:65`, `:76`).

## Chưa xác minh được

- Chưa xác minh được luồng sinh đơn sau khi chốt nhóm.
- Chưa xác minh được quy trình danh sách đen.
- Chưa xác minh được số bậc giá tối đa.
