# QT-46 — Ký số

- Dự án: VComm
- Mã quy trình: QT-46
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-24 Quản lý chữ ký số (`/signature`)
- Hiện trạng mã nguồn: Đã có — trung tâm ký số với hàng chờ ký, chứng thư và quản lý con dấu

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Người ký | Ký tài liệu đang chờ, xem tài liệu đã hoàn tất | `src/components/SignatureHub.tsx:462`, `:472` |
| Quản trị chứng thư | Quản lý chứng thư số và con dấu | `src/components/SignatureHub.tsx:483`, `:696` |
| Hệ thống | Xác thực chữ ký và lưu vết | `src/components/RequestHub.tsx:1136` |

## 2. Điều kiện trước

- Đã có chứng thư số cho người ký.
- Đã có quy trình gửi ký từ các phân hệ.

## 3. Luồng chính

1. Người dùng gửi tài liệu cần ký từ phân hệ tương ứng.
2. Tài liệu vào hàng chờ ký của người ký (`SignatureHub.tsx:462`).
3. Người ký xem tài liệu và thực hiện ký số.
4. Hệ thống xác thực chữ ký (`RequestHub.tsx:1136`).
5. Tài liệu đã ký chuyển sang danh sách đã hoàn tất (`SignatureHub.tsx:472`).
6. Quản trị chứng thư theo dõi chứng thư đang hoạt động và quản lý con dấu (`SignatureHub.tsx:483`, `:696`).

## 4. Sơ đồ

```
[Phân hệ gửi tài liệu cần ký]
            |
            v
[Hàng chờ ký :462]
            |
            v
[Người ký thực hiện ký số]
            |
            v
[Xác thực chữ ký :1136]
            |
    +-------+-------+
    |               |
    v               v
[Đã hoàn tất :472]  [Chứng thư đang hoạt động :483]
                            |
                            v
                    [Quản lý con dấu :696]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Chứng thư hết hạn | Chặn ký, yêu cầu gia hạn chứng thư | `src/components/SignatureHub.tsx:483` |
| E2 | Chữ ký không hợp lệ | Từ chối tài liệu | `src/components/RequestHub.tsx:1136` |
| E3 | Người ký không có thẩm quyền với tài liệu | Không hiển thị trong hàng chờ ký | `src/components/SignatureHub.tsx:462` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Tài liệu: Chờ ký --> Đang ký --> Đã ký --> Đã hoàn tất
Chứng thư: Đang hoạt động --> Sắp hết hạn --> Hết hạn
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Chỉ người có thẩm quyền mới thấy tài liệu trong hàng chờ ký | `src/components/SignatureHub.tsx:462` |
| BR-02 | Chữ ký phải được xác thực trước khi đánh dấu hoàn tất | `src/components/RequestHub.tsx:1136` |
| BR-03 | Chứng thư hết hạn không được dùng để ký | `src/components/SignatureHub.tsx:483` |

## 8. Thông báo và nhật ký

- Thông báo cho người ký khi có tài liệu mới trong hàng chờ.
- Thông báo khi chứng thư sắp hết hạn.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng tài liệu cần ký | Loại tài liệu, người ký, trạng thái | `src/components/SignatureHub.tsx:462` |
| Bảng chứng thư số | Người sở hữu, nhà cung cấp, hạn dùng | `src/components/SignatureHub.tsx:483` |
| Bảng con dấu | Tên con dấu, đơn vị, trạng thái | `src/components/SignatureHub.tsx:696` |

## 10. Màn hình

- Trung tâm Ký số (`src/components/SignatureHub.tsx:434`, tuyến `/signature`, 1.213 dòng).
- Chờ tôi ký (`src/components/SignatureHub.tsx:462`).
- Đã hoàn tất (`src/components/SignatureHub.tsx:472`).
- Chứng thư đang hoạt động (`src/components/SignatureHub.tsx:483`).
- Quản lý Con dấu (`src/components/SignatureHub.tsx:696`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho tài liệu được gửi ký, Khi người ký có thẩm quyền mở trung tâm, Thì tài liệu xuất hiện trong hàng chờ ký.
- **AC-02.** Cho chứng thư hết hạn, Khi ký, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-03.** Cho chữ ký không hợp lệ, Khi xác thực, Thì tài liệu bị từ chối (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại trung tâm ký số đã có.
- Cần bổ sung danh mục chứng thư và con dấu nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Chứng thư số do nhà cung cấp bên ngoài cấp.
- **Q-01.** Nhà cung cấp chứng thư số nào được dùng?
- **Q-02.** Con dấu được quản lý theo đơn vị hay theo phòng ban?

## 14. Ghi chú kỹ thuật

- Xác thực chữ ký được dùng chung giữa trung tâm ký số và luồng đề xuất (`src/components/RequestHub.tsx:1136`).

## Chưa xác minh được

- Chưa xác minh được nhà cung cấp chứng thư số.
- Chưa xác minh được luồng cấp và thu hồi chứng thư.
- Chưa xác minh được phạm vi quản lý con dấu.
