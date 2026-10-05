# QT-53 — Quản lý Công văn

- Dự án: VComm
- Mã quy trình: QT-53
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-08 Quản lý Công văn (`/documents`)
- Hiện trạng mã nguồn: Đã có — màn hình quản trị công văn và văn phòng điện tử, có tóm tắt nội dung tự động

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên văn thư | Tạo công văn, đăng ký số và lưu trữ | `src/components/DocumentManager.tsx:156` |
| Người ký | Ký công văn trước khi phát hành | `src/components/DocumentManager.tsx:500` |
| Hệ thống | Tóm tắt nội dung công văn tự động | `src/components/DocumentManager.tsx:546` |

## 2. Điều kiện trước

- Đã có mẫu công văn theo thể thức văn bản hành chính.
- Đã có sổ đăng ký văn bản đi và đến.

## 3. Luồng chính

1. Nhân viên văn thư tạo công văn từ mẫu (`DocumentManager.tsx:156`).
2. Hệ thống tóm tắt nội dung công văn tự động (`DocumentManager.tsx:546`).
3. Công văn được trình ký; người ký xem và ký.
4. Hệ thống cấp số văn bản theo sổ đăng ký.
5. Công văn được phát hành và ghi vào nơi nhận.
6. Hệ thống lưu trữ tệp đính kèm và liên kết tới hồ sơ liên quan.

## 4. Sơ đồ

```
[Tạo công văn từ mẫu :156]
            |
            v
[Tóm tắt nội dung tự động :546]
            |
            v
[Trình ký] --> [Người ký xem và ký]
            |
            v
[Cấp số văn bản theo sổ đăng ký]
            |
            v
[Phát hành + ghi nơi nhận]
            |
            v
[Lưu trữ tệp đính kèm]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Công văn chưa ký mà đã phát hành | Chặn phát hành | `src/components/DocumentManager.tsx:500` |
| E2 | Trùng số văn bản | Chặn cấp số trùng | `src/components/DocumentManager.tsx:156` |
| E3 | Tệp đính kèm quá dung lượng cho phép | Từ chối tải lên | `src/services/storageService.ts:58` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Công văn: Nháp --> Chờ ký --> Đã ký --> Đã phát hành --> Đã lưu trữ
Công văn đến: Đã nhận --> Đã phân công --> Đã xử lý
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Công văn phải được ký trước khi phát hành | `src/components/DocumentManager.tsx:500` |
| BR-02 | Số văn bản cấp theo sổ đăng ký, không trùng | `src/components/DocumentManager.tsx:156` |
| BR-03 | Tệp đính kèm lưu trữ qua dịch vụ lưu trữ có liên kết tải xuống tạm thời | `src/services/storageService.ts:38` |

## 8. Thông báo và nhật ký

- Thông báo cho người ký khi có công văn chờ ký.
- Chưa xác minh được thông báo cho nơi nhận.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng công văn | Số, loại, trích yếu, người ký, trạng thái | `src/components/DocumentManager.tsx:156` |
| Bảng sổ đăng ký văn bản | Số, ngày, loại văn bản | `src/components/DocumentManager.tsx:156` |
| Bảng tệp đính kèm | Tệp, dung lượng, liên kết | `src/services/storageService.ts:58` |

## 10. Màn hình

- Quản trị Công văn và Văn phòng điện tử (`src/components/DocumentManager.tsx:156`, tuyến `/documents`, 1.126 dòng).
- AI Tóm tắt nội dung (`src/components/DocumentManager.tsx:546`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho công văn đã ký, Khi phát hành, Thì hệ thống cấp số và ghi nơi nhận.
- **AC-02.** Cho công văn chưa ký, Khi phát hành, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-03.** Cho tệp đính kèm quá dung lượng, Khi tải lên, Thì hệ thống từ chối (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình công văn và dịch vụ lưu trữ.
- Cần bổ sung sổ đăng ký văn bản nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Thể thức công văn theo quy định hiện hành về văn bản hành chính.
- **Q-01.** Có bao nhiêu loại công văn và mẫu tương ứng?
- **Q-02.** Dung lượng tệp đính kèm tối đa là bao nhiêu?

## 14. Ghi chú kỹ thuật

- Dịch vụ lưu trữ hỗ trợ liên kết tải xuống tạm thời và liên kết tải lên tạm thời (`src/services/storageService.ts:38`, `:58`).

## Chưa xác minh được

- Chưa xác minh được thể thức công văn đang áp dụng.
- Chưa xác minh được dung lượng tệp tối đa.
- Chưa xác minh được luồng xử lý công văn đến.
