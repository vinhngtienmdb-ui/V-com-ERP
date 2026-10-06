# QT-50 — Đề xuất và Trình ký

- Dự án: VComm
- Mã quy trình: QT-50
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-06 Đề xuất và Trình ký (`/requests`)
- Hiện trạng mã nguồn: Đã có — trung tâm đề xuất với thiết kế biểu mẫu, xác thực chữ ký và lưu vết

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Người đề xuất | Điền biểu mẫu, gửi đề xuất, theo dõi tiến trình | `src/components/RequestHub.tsx:1292` |
| Người duyệt | Duyệt, từ chối hoặc yêu cầu bổ sung | `src/components/RequestHub.tsx:1292` |
| Quản trị viên | Thiết kế cấu trúc phiếu | `src/components/RequestHub.tsx:905` |
| Hệ thống | Lưu vết kiểm toán và ghi nhận lỗi ghi dữ liệu | `src/services/auditTrailService.ts:203`, `src/services/writeFailure.ts:52` |

## 2. Điều kiện trước

- Đã có cấu trúc phiếu được thiết kế và kích hoạt.
- Đã phân quyền người duyệt cho từng bước.

## 3. Luồng chính

1. Quản trị viên thiết kế cấu trúc phiếu (`RequestHub.tsx:905`).
2. Người đề xuất tạo đề xuất mới và điền dữ liệu.
3. Người đề xuất gửi đề xuất; hệ thống chuyển đến người duyệt bước đầu.
4. Người duyệt xử lý; hệ thống xác thực chữ ký số nếu có (`RequestHub.tsx:1136`).
5. Hệ thống ghi vết kiểm toán cho mọi thao tác (`auditTrailService.ts:203`).
6. Khi hoàn tất, người đề xuất nhận thông báo và đề xuất được lưu trữ.

## 4. Sơ đồ

```
[Thiết kế cấu trúc phiếu :905]
            |
            v
[Người đề xuất tạo và gửi]
            |
            v
[Người duyệt bước 1] --> [Người duyệt bước 2]
            |                       |
            v                       v
[Xác thực chữ ký số :1136]  [Ghi vết kiểm toán :203]
            |                       |
            +-----------+-----------+
                        |
                        v
            [Hoàn tất + thông báo + lưu trữ]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Đề xuất thiếu trường bắt buộc | Không gửi được; báo trường còn thiếu | `src/components/RequestHub.tsx:905` |
| E2 | Chữ ký số không hợp lệ | Từ chối bước duyệt | `src/components/RequestHub.tsx:1136` |
| E3 | Ghi dữ liệu thất bại | Mô tả lỗi và báo người dùng | `src/services/writeFailure.ts:37` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Đề xuất: Nháp --> Chờ duyệt --> Đã duyệt / Đã từ chối
Chờ duyệt --yêu cầu bổ sung--> Cần bổ sung --> Chờ duyệt
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Cấu trúc phiếu quy định trường bắt buộc và người duyệt | `src/components/RequestHub.tsx:905` |
| BR-02 | Mọi thao tác trên đề xuất được ghi vết kiểm toán | `src/services/auditTrailService.ts:203` |
| BR-03 | Lỗi ghi dữ liệu phải được mô tả và báo cho người dùng | `src/services/writeFailure.ts:37` |

## 8. Thông báo và nhật ký

- Thông báo cho người duyệt khi có đề xuất đến bước của mình.
- Có tệp kiểm thử cho lỗi ghi dữ liệu của trung tâm đề xuất (`src/requesthubDbError.test.ts`).

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng cấu trúc phiếu | Trường, kiểu, bắt buộc | `src/components/RequestHub.tsx:905` |
| Bảng đề xuất | Người tạo, dữ liệu, trạng thái | `src/components/RequestHub.tsx:1292` |
| Bảng vết kiểm toán | Thao tác, người thực hiện, thời điểm | `src/services/auditTrailService.ts:66` |
| Bảng lỗi ghi dữ liệu | Ngữ cảnh, thông điệp lỗi | `src/services/writeFailure.ts:52` |

## 10. Màn hình

- Phiếu Đề xuất (`src/components/RequestHub.tsx:1292`, tuyến `/requests`, 1.628 dòng).
- Cài đặt Cấu trúc Phiếu (`src/components/RequestHub.tsx:905`).
- Xác thực Chữ ký số (`src/components/RequestHub.tsx:1136`).
- Tạo Đề xuất mới (`src/components/DynamicRequestForm.tsx`, tuyến `/requests/new`, 298 dòng).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho đề xuất đủ trường bắt buộc, Khi gửi, Thì đề xuất chuyển đến người duyệt bước đầu.
- **AC-02.** Cho đề xuất thiếu trường bắt buộc, Khi gửi, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-03.** Cho thao tác duyệt, Khi thực hiện, Thì hệ thống ghi vết kiểm toán (ca bắt buộc).
- **AC-04.** Cho ghi dữ liệu thất bại, Khi xảy ra, Thì người dùng nhận mô tả lỗi rõ ràng (ca bất thường bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại trung tâm đề xuất, dịch vụ lưu vết kiểm toán và mô tả lỗi.
- Cần bổ sung cấu trúc phiếu mẫu nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Cấu trúc phiếu do quản trị viên tự định nghĩa, không cần lập trình.
- **Q-01.** Có bao nhiêu loại phiếu đề xuất thường dùng?
- **Q-02.** Thời hạn xử lý một đề xuất là bao lâu?

## 14. Ghi chú kỹ thuật

- Lưu vết kiểm toán ghi vào bảng riêng và có thể phản chiếu sang nhật ký quản trị (`src/services/auditTrailService.ts:76`).
- Mô tả lỗi ghi dữ liệu được tách thành dịch vụ riêng (`src/services/writeFailure.ts:37`).

## Chưa xác minh được

- Chưa xác minh được danh sách loại phiếu đề xuất.
- Chưa xác minh được thời hạn xử lý đề xuất.
- Chưa xác minh được phạm vi phản chiếu vết kiểm toán sang nhật ký quản trị.
