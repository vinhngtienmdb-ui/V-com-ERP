# QT-44 — Hợp đồng và Pháp chế

- Dự án: VComm
- Mã quy trình: QT-44
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-22 Hợp đồng và Pháp chế (`/contracts`)
- Hiện trạng mã nguồn: Đã có — có màn hình quản trị hợp đồng, phê duyệt và tiến trình chữ ký số

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên pháp chế | Tạo hợp đồng, theo dõi tình trạng hồ sơ | `src/components/ContractManager.tsx:782`, `:437` |
| Người phê duyệt | Phê duyệt hợp đồng theo thẩm quyền | `src/components/ContractManager.tsx:477` |
| Người ký | Ký số hợp đồng | `src/components/ContractManager.tsx:495` |

## 2. Điều kiện trước

- Đã có mẫu hợp đồng và thẩm quyền phê duyệt theo loại hợp đồng.
- Đã có chứng thư số cho người ký.

## 3. Luồng chính

1. Nhân viên pháp chế tạo hợp đồng mới từ mẫu (`ContractManager.tsx:782`).
2. Hợp đồng được trình duyệt theo thẩm quyền.
3. Người phê duyệt xem và phê duyệt (`ContractManager.tsx:477`).
4. Hệ thống theo dõi tiến trình ký số (`ContractManager.tsx:495`).
5. Khi các bên ký xong, hợp đồng chuyển sang trạng thái đã ký và được lưu trữ.
6. Hệ thống theo dõi tình trạng hồ sơ và các mốc quan trọng (`ContractManager.tsx:437`).

## 4. Sơ đồ

```
[Tạo hợp đồng từ mẫu :782]
            |
            v
[Trình duyệt theo thẩm quyền]
            |
            v
[Phê duyệt :477]
            |
            v
[Tiến trình chữ ký số :495]
            |
            v
[Đã ký --> Lưu trữ]
            |
            v
[Theo dõi tình trạng hồ sơ :437]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Hợp đồng chưa được phê duyệt mà đã gửi ký | Chặn gửi ký | `src/components/ContractManager.tsx:477` |
| E2 | Người ký không có chứng thư số hợp lệ | Chặn ký | `src/components/ContractManager.tsx:495` |
| E3 | Hợp đồng sắp hết hạn | Hiển thị trong tình trạng hồ sơ cần xử lý | `src/components/ContractManager.tsx:437` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Hợp đồng: Nháp --> Chờ duyệt --> Đã duyệt --> Đang ký --> Đã ký --> Đã thanh lý
Đã ký --hết hạn--> Hết hiệu lực
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Chỉ gửi ký khi hợp đồng đã được phê duyệt | `src/components/ContractManager.tsx:477` |
| BR-02 | Người ký phải có chứng thư số hợp lệ | `src/components/ContractManager.tsx:495` |
| BR-03 | Hợp đồng phải được lưu trữ kèm lịch sử phê duyệt và ký | `src/components/ContractManager.tsx:437` |

## 8. Thông báo và nhật ký

- Thông báo cho người phê duyệt khi có hợp đồng chờ duyệt.
- Thông báo cho người ký khi hợp đồng đến lượt mình.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng hợp đồng | Số hợp đồng, loại, các bên, giá trị, trạng thái | `src/components/ContractManager.tsx:655` |
| Bảng phê duyệt | Người phê duyệt, ý kiến, thời điểm | `src/components/ContractManager.tsx:477` |
| Bảng tiến trình ký | Người ký, thứ tự, trạng thái | `src/components/ContractManager.tsx:495` |

## 10. Màn hình

- Quản trị Hợp đồng (`src/components/ContractManager.tsx:655`, tuyến `/contracts`, 822 dòng).
- Tình trạng hồ sơ (`src/components/ContractManager.tsx:437`).
- Thao tác phê duyệt (`src/components/ContractManager.tsx:477`).
- Tiến trình chữ ký số (`src/components/ContractManager.tsx:495`).
- Tạo hợp đồng mới (`src/components/ContractManager.tsx:782`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho hợp đồng đã duyệt, Khi gửi ký, Thì tiến trình ký được khởi tạo.
- **AC-02.** Cho hợp đồng chưa duyệt, Khi gửi ký, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-03.** Cho người ký thiếu chứng thư số, Khi ký, Thì hệ thống chặn (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình hợp đồng đã có.
- Cần bổ sung thẩm quyền phê duyệt theo loại hợp đồng nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Hợp đồng được ký số hoàn toàn, không cần bản giấy.
- **Q-01.** Có bao nhiêu loại hợp đồng và thẩm quyền phê duyệt tương ứng?
- **Q-02.** Chứng thư số dùng nhà cung cấp nào?

## 14. Ghi chú kỹ thuật

- Trung tâm ký số dùng chung cho hợp đồng và các loại tài liệu khác (xem QT-46).

## Chưa xác minh được

- Chưa xác minh được thẩm quyền phê duyệt theo loại hợp đồng.
- Chưa xác minh được nhà cung cấp chứng thư số.
- Chưa xác minh được luồng lưu trữ hợp đồng đã ký.
