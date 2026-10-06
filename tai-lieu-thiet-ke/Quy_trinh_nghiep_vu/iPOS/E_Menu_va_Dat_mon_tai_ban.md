# QT-54 — E-Menu và Đặt món tại bàn (POS nội bộ do VComm vận hành)

> **CHUYỂN PHẠM VI 2026-10-06.** **CHUYỂN PHẠM VI 2026-10-06.** Chủ dự án chốt quy trình E-Menu & Đặt món tại bàn **dời hẳn sang iPOS (HS-04)**, không còn thuộc bộ quy trình ERP. Tệp giữ nội dung, bỏ mã QT; mã cũ là **QT-54**. Xem `Quy_trinh_nghiep_vu/index.md`.

- Dự án: VComm
- Mã quy trình: QT-54
- Phiên bản: 2.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án), mã nguồn `_recovery_V-com-ERP`, và Quyết định chủ dự án 2026-10-09 (xem `Phan_tich_chong_cheo_iPOS_Hub_MuaChung_VXu.md`, mục 6.1 quyết định 1)
- Mô-đun hệ thống: E-Menu (`/emenu/:tableId`)
- Hiện trạng mã nguồn: Đã có — trang gọi món tại bàn dành cho khách, có xác nhận đặt món thành công

> Quyết định chủ dự án ngày 2026-10-09 (quyết định 1): **E-Menu là POS nội bộ do VComm vận hành**, khác với iPOS (shop đối tác, ngoài repo, đa tenant). Cùng với Siêu thị VComm (QT-53) và trạm Hub `standard`/`freeze` (QT-34), E-Menu là một trong ba nơi bán lẻ do VComm vận hành. Xem mục 7 và mục 12.

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Khách tại bàn | Xem thực đơn, chọn món và gửi yêu cầu đặt món | `src/components/EMenu.tsx:147`, `:118` |
| Nhân viên phục vụ | Nhận yêu cầu đặt món và xác nhận | `src/components/EMenu.tsx:147` |
| Hệ thống | Ghi nhận yêu cầu theo mã bàn | `src/components/EMenu.tsx:118` |

## 2. Điều kiện trước

- Đã có thực đơn và giá theo từng món.
- Đã có mã bàn hoặc mã điểm phục vụ.
- Đã phân biệt rõ E-Menu là cơ sở do VComm vận hành (không phải shop đối tác iPOS).

## 3. Luồng chính

1. Khách quét mã tại bàn để mở thực đơn điện tử (`EMenu.tsx:147`).
2. Khách chọn món và gửi yêu cầu đặt món.
3. Hệ thống ghi nhận yêu cầu theo mã bàn và hiển thị xác nhận đặt món thành công (`EMenu.tsx:118`).
4. Nhân viên phục vụ nhận yêu cầu và xác nhận với bếp.
5. Khi khách thanh toán, hệ thống ghi nhận doanh thu và ghi sổ.

## 4. Sơ đồ

```
[Khách quét mã tại bàn :147]
            |
            v
[Xem thực đơn + chọn món]
            |
            v
[Gửi yêu cầu đặt món]
            |
            v
[Xác nhận đặt món thành công :118]
            |
            v
[Nhân viên xác nhận + bếp chế biến]
            |
            v
[Thanh toán --> ghi nhận doanh thu + ghi sổ]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Mã bàn không hợp lệ | Không mở được thực đơn | `src/components/EMenu.tsx:147` |
| E2 | Món đã hết | Không cho chọn; hiển thị hết món | `src/components/EMenu.tsx:147` |
| E3 | Gửi yêu cầu trùng do mạng chập chờn | Cần cơ chế chống gửi trùng | `src/components/EMenu.tsx:118` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Yêu cầu đặt món: Đã gửi --> Đã xác nhận --> Đang chế biến --> Đã phục vụ --> Đã thanh toán
Yêu cầu --bị hủy--> Đã hủy
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Yêu cầu đặt món gắn với mã bàn hoặc mã điểm phục vụ | `src/components/EMenu.tsx:147` |
| BR-02 | Chỉ món còn phục vụ được mới cho chọn | `src/components/EMenu.tsx:147` |
| BR-03 | Doanh thu ghi nhận khi khách thanh toán | `src/components/EMenu.tsx:118` |
| BR-04 | **E-Menu là POS nội bộ do VComm vận hành**; khác iPOS (shop đối tác, ngoài repo, đa tenant) | Quyết định 1 (2026-10-09); `src/components/VCommHub.tsx:25` |
| BR-05 | E-Menu chia sẻ mô hình POS nội bộ với Siêu thị VComm (QT-53) và trạm Hub `standard`/`freeze` (QT-34) | Quyết định 1; phân tích mục 4.1 |

## 8. Thông báo và nhật ký

- Xác nhận đặt món thành công hiển thị ngay cho khách (`src/components/EMenu.tsx:118`).
- Chưa xác minh được thông báo cho nhân viên phục vụ.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng thực đơn | Món, giá, trạng thái phục vụ | `src/components/EMenu.tsx:147` |
| Bảng bàn | Mã bàn, khu vực, trạng thái | `src/components/EMenu.tsx:147` |
| Bảng yêu cầu đặt món | Mã bàn, món, số lượng, trạng thái | `src/components/EMenu.tsx:118` |

## 10. Màn hình

- E-Menu Experience (`src/components/EMenu.tsx:147`, tuyến `/emenu/:tableId`, 290 dòng).
- Xác nhận đặt món thành công (`src/components/EMenu.tsx:118`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho mã bàn hợp lệ, Khi khách mở, Thì thực đơn hiển thị đúng món đang phục vụ.
- **AC-02.** Cho mã bàn không hợp lệ, Khi khách mở, Thì hệ thống không hiển thị thực đơn (ca thất bại bắt buộc).
- **AC-03.** Cho khách gửi yêu cầu, Khi gửi thành công, Thì hệ thống hiển thị xác nhận và ghi nhận theo mã bàn.
- **AC-04.** Cho E-Menu được gán nhầm là shop iPOS đối tác, Khi phân loại, Thì hệ thống phân biệt rõ là POS nội bộ VComm (ca bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại trang gọi món đã có.
- **Làm rõ phân loại POS:** E-Menu là POS nội bộ do VComm vận hành, khác iPOS đối tác (quyết định 1). Cùng với Siêu thị (QT-53) và trạm Hub `standard`/`freeze` (QT-34), E-Menu là một trong ba nơi bán lẻ do VComm vận hành, giải quyết chồng chéo "bốn nơi cùng bán lẻ" (phân tích mục 2.1 và 4.1).
- Cần bổ sung cơ chế chống gửi trùng yêu cầu nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Khách mở thực đơn bằng cách quét mã tại bàn, không cần đăng nhập.
- **Q-01.** Có cần đăng nhập hoặc xác thực khách trước khi đặt món không?
- **Q-02.** Có cần kết nối hệ thống bếp không?

## 14. Ghi chú kỹ thuật

- Trang gọi món là trang công khai, không nằm sau cơ chế xác thực nội bộ.

## Chưa xác minh được

- Chưa xác minh được cơ chế xác thực cho trang gọi món công khai.
- Chưa xác minh được kết nối hệ thống bếp.
- Chưa xác minh được cơ chế chống gửi trùng yêu cầu.
