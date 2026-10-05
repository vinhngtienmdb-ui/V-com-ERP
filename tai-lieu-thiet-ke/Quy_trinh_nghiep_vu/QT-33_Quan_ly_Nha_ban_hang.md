# QT-33 — Quản lý Nhà bán hàng

- Dự án: VComm
- Mã quy trình: QT-33
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-35 Nhà bán hàng (`/sellers`)
- Hiện trạng mã nguồn: Đã có — màn hình quản lý người bán, quy trình đăng ký và duyệt, và dịch vụ xác minh hồ sơ

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Người bán | Đăng ký, nộp hồ sơ xác minh, ký hợp đồng | `src/services/sellerKycService.ts:46`, `:174` |
| Nhân viên kiểm duyệt | Duyệt hoặc từ chối hồ sơ người bán | `src/services/sellerKycService.ts:117`, `:147` |
| Nhân viên vận hành sàn | Theo dõi hiệu suất, áp chế tài vi phạm | `src/components/Sellers.tsx:458` |
| Hệ thống | Chặn đăng bán khi hồ sơ chưa được duyệt | `src/services/sellerKycService.ts:186` |

## 2. Điều kiện trước

- Đã có biểu mẫu đăng ký người bán và danh mục loại hình đối tác.
- Đã có chính sách chế tài vi phạm và chỉ tiêu hiệu suất.

## 3. Luồng chính

1. Người bán đăng ký và nộp hồ sơ xác minh (`sellerKycService.ts:46`).
2. Hệ thống kiểm tra điều kiện chuyển trạng thái hồ sơ (`sellerKycService.ts:41`).
3. Nhân viên kiểm duyệt bắt đầu xem xét hồ sơ (`sellerKycService.ts:97`).
4. Nhân viên kiểm duyệt duyệt hoặc từ chối hồ sơ (`sellerKycService.ts:117`, `:147`).
5. Sau khi duyệt, người bán ký hợp đồng điện tử (`sellerKycService.ts:174`).
6. Người bán được phép đăng bán sản phẩm (`sellerKycService.ts:186`).
7. Hệ thống theo dõi hiệu suất và áp chế tài khi vi phạm chỉ tiêu.

## 4. Sơ đồ

```
[Người bán đăng ký] --> [Nộp hồ sơ xác minh :46]
                                |
                                v
                    [Kiểm điều kiện chuyển trạng thái :41]
                                |
                                v
                    [Bắt đầu xem xét :97]
                                |
                    +-----------+-----------+
                    |                       |
                    v                       v
            [Duyệt hồ sơ :117]        [Từ chối hồ sơ :147]
                    |
                    v
            [Ký hợp đồng :174] --> [Được đăng bán :186]
                    |
                    v
            [Theo dõi hiệu suất] --> [Chế tài vi phạm]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Hồ sơ thiếu giấy tờ bắt buộc | Từ chối, yêu cầu bổ sung | `src/services/sellerKycService.ts:46` |
| E2 | Chuyển trạng thái không hợp lệ | Chặn chuyển | `src/services/sellerKycService.ts:41` |
| E3 | Người bán chưa ký hợp đồng mà cố đăng bán | Chặn đăng bán | `src/services/sellerKycService.ts:186` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Hồ sơ người bán: Mới --> Đã nộp hồ sơ --> Đang xem xét --> Đã duyệt --> Đã ký hợp đồng --> Đang hoạt động
Đang xem xét --từ chối--> Đã từ chối (kèm lý do)
Đang hoạt động --vi phạm--> Tạm ngưng / Chấm dứt
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Chỉ chuyển trạng thái hồ sơ theo danh sách chuyển hợp lệ | `src/services/sellerKycService.ts:41` |
| BR-02 | Người bán phải ký hợp đồng trước khi được đăng bán | `src/services/sellerKycService.ts:186` |
| BR-03 | Hồ sơ bị từ chối phải kèm lý do | `src/services/sellerKycService.ts:147` |

## 8. Thông báo và nhật ký

- Thông báo cho người bán khi hồ sơ được duyệt hoặc bị từ chối.
- Chưa xác minh được có thông báo khi bị áp chế tài hay không.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng người bán | Mã, tên, loại hình, trạng thái hồ sơ | `src/services/sellerKycService.ts:186` |
| Bảng hồ sơ xác minh | Giấy tờ, trạng thái, người xem xét | `src/services/sellerKycService.ts:46` |
| Bảng hợp đồng người bán | Ngày ký, trạng thái | `src/services/sellerKycService.ts:174` |
| Bảng chế tài | Vi phạm, mức chế tài, thời điểm | `src/components/Sellers.tsx:458` |

## 10. Màn hình

- Quản lý Người bán (`src/components/Sellers.tsx:314`, tuyến `/sellers`, 1.338 dòng).
- Quy trình Đăng ký và Duyệt (`src/components/Sellers.tsx:339`).
- Giới hạn và Định mức mặc định (`src/components/Sellers.tsx:383`).
- Kiểm duyệt sản phẩm và Vận hành (`src/components/Sellers.tsx:412`).
- Hiệu suất và Chế tài vi phạm (`src/components/Sellers.tsx:458`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho người bán nộp đủ hồ sơ, Khi kiểm duyệt viên duyệt, Thì trạng thái chuyển sang đã duyệt.
- **AC-02.** Cho người bán chưa ký hợp đồng, Khi đăng bán, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-03.** Cho chuyển trạng thái không nằm trong danh sách hợp lệ, Khi thực hiện, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-04.** Cho hồ sơ bị từ chối, Khi xem, Thì có lý do từ chối.

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình quản lý người bán và dịch vụ xác minh hồ sơ đã có.
- Cần bổ sung chính sách chế tài và chỉ tiêu hiệu suất nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Người bán là pháp nhân hoặc cá nhân kinh doanh có đăng ký.
- **Q-01.** Có bao nhiêu loại hình đối tác và hồ sơ tương ứng?
- **Q-02.** Ngưỡng vi phạm để áp chế tài là gì?

## 14. Ghi chú kỹ thuật

- Máy trạng thái hồ sơ người bán là hàm thuần, kiểm thử được độc lập (`src/services/sellerKycService.ts:41`).
- Xác thực phiên người bán dùng token ký (xem QT-01).

## Chưa xác minh được

- Chưa xác minh được danh sách trạng thái hợp lệ của hồ sơ người bán.
- Chưa xác minh được chính sách chế tài đang áp dụng.
- Chưa xác minh được quy trình ký hợp đồng với người bán.
