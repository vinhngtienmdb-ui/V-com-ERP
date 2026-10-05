# QT-14 — Tiếp nhận nhân sự mới

- Dự án: VComm
- Mã quy trình: QT-14
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Nhân sự
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/2_hrm/13_onboarding.md (§2)`
- Mô-đun hệ thống: MOD-40 Hồ sơ Nhân sự (`/easyhrm`)
- Hiện trạng mã nguồn: Đã có một phần — có màn hình hồ sơ nhân sự và cảnh báo pháp lý hồ sơ

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Quản trị nhân sự | Quản lý mẫu danh sách việc cần làm, theo dõi tiến độ tổng thể | `Mo ta nghiep vu/MD_ERP/2_hrm/13_onboarding.md (§2)` |
| Nhân viên hành chính / Công nghệ thông tin | Xử lý việc cấp phát tài sản và tài khoản | `Mo ta nghiep vu/MD_ERP/2_hrm/13_onboarding.md (§2)` |
| Trưởng bộ phận | Đánh giá thử việc, giao việc trong thời gian thử việc | `Mo ta nghiep vu/MD_ERP/2_hrm/13_onboarding.md (§2)` |
| Nhân sự mới | Điền thông tin cá nhân, xem danh sách việc cần làm của mình | `Mo ta nghiep vu/MD_ERP/2_hrm/13_onboarding.md (§2)` |

## 2. Điều kiện trước

- Ứng viên đã đồng ý thư mời làm việc (xem QT-13).
- Đã có mẫu danh sách việc cần làm theo vị trí.

## 3. Luồng chính

1. Hệ thống sinh danh sách việc cần làm trước ngày nhận việc theo mẫu.
2. Giao việc cho bộ phận công nghệ thông tin và hành chính theo danh sách.
3. Ngày đầu tiên, nhân sự mới điểm danh, cập nhật hồ sơ cá nhân và nhận bàn giao tài sản.
4. Trong thời gian thử việc, thực hiện đào tạo hội nhập và theo dõi bởi người kèm cặp và trưởng bộ phận.
5. Trước khi hết hạn thử việc, hệ thống gửi thông báo cho trưởng bộ phận và nhân sự để làm phiếu đánh giá.
6. Duyệt đánh giá đạt, ký hợp đồng lao động chính thức và chuyển trạng thái sang nhân viên chính thức.

## 4. Sơ đồ

```
[Ứng viên đồng ý thư mời]
        |
        v
[Checklist trước nhận việc: IT, Hành chính, Trưởng bộ phận]
        |
        v
[Ngày đầu tiên: điểm danh, hồ sơ, bàn giao tài sản]
        |
        v
[Thử việc: đào tạo hội nhập, theo dõi]
        |
        v
[Đánh giá thử việc] --đạt--> [Ký hợp đồng chính thức QT-16]
                    --không đạt--> [Chấm dứt thử việc]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Chưa hoàn tất việc cấp tài khoản trước ngày nhận việc | Cảnh báo trên danh sách việc cần làm | `Mo ta nghiep vu/MD_ERP/2_hrm/13_onboarding.md (§2)` |
| E2 | Quá hạn đánh giá thử việc | Hệ thống nhắc trước hạn; nếu quá hạn coi như đạt theo quy định | `Mo ta nghiep vu/MD_ERP/2_hrm/13_onboarding.md (§2)` |
| E3 | Thiếu hồ sơ pháp lý bắt buộc | Cảnh báo pháp lý hồ sơ | `src/components/EasyHRM.tsx:1217` |

## 6. Máy trạng thái

```
Nhân sự mới: Chờ nhận việc --> Đang thử việc --> Chính thức
Đang thử việc --không đạt--> Đã chấm dứt thử việc
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Danh sách việc cần làm sinh theo mẫu gắn với vị trí | `Mo ta nghiep vu/MD_ERP/2_hrm/13_onboarding.md (§2)` |
| BR-02 | Hệ thống nhắc đánh giá thử việc trước khi hết hạn | `Mo ta nghiep vu/MD_ERP/2_hrm/13_onboarding.md (§2)` |
| BR-03 | Hồ sơ thiếu giấy tờ pháp lý bắt buộc phải cảnh báo | `src/components/EasyHRM.tsx:1217` |

## 8. Thông báo và nhật ký

- Thông báo cho trưởng bộ phận và nhân sự trước hạn đánh giá thử việc.
- Chưa có cổng riêng cho nhân sự mới tự cập nhật hồ sơ.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng nhân viên | Trạng thái thử việc, ngày nhận việc, ngày hết hạn thử việc | `Mo ta nghiep vu/MD_ERP/2_hrm/13_onboarding.md (§1)` |
| Bảng danh sách việc cần làm | Việc, người phụ trách, hạn hoàn thành | `Mo ta nghiep vu/MD_ERP/2_hrm/13_onboarding.md (§1)` |
| Bảng bàn giao tài sản | Tài sản, người nhận, ngày bàn giao | `Mo ta nghiep vu/MD_ERP/2_hrm/13_onboarding.md (§1)` |

## 10. Màn hình

- Chức Năng Thông Tin Nhân Sự Toàn Diện (`src/components/EasyHRM.tsx:624`).
- Cảnh báo pháp lý hồ sơ (`src/components/EasyHRM.tsx:1217`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho ứng viên đã đồng ý thư mời, Khi khởi tạo tiếp nhận, Thì hệ thống sinh danh sách việc cần làm theo mẫu.
- **AC-02.** Cho nhân viên thử việc còn 7 ngày là hết hạn, Khi đến mốc nhắc, Thì trưởng bộ phận nhận thông báo.
- **AC-03.** Cho hồ sơ thiếu giấy tờ bắt buộc, Khi lưu, Thì hệ thống cảnh báo pháp lý (ca bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Cần bổ sung bảng danh sách việc cần làm và bảng bàn giao tài sản.
- Dùng lại màn hình hồ sơ nhân sự hiện có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Thời gian thử việc mặc định 60 ngày cho khối văn phòng.
- **Q-01.** Có cần cổng tự phục vụ riêng cho nhân sự mới không?
- **Q-02.** Danh sách việc cần làm có khác nhau theo từng vị trí không?

## 14. Ghi chú kỹ thuật

- Cảnh báo pháp lý hồ sơ đã có sẵn trong màn hình hồ sơ nhân sự, nên tái sử dụng thay vì viết mới.

## Chưa xác minh được

- Chưa xác minh được luồng danh sách việc cần làm có tồn tại trong mã nguồn hay không.
- Chưa xác minh được cổng tự phục vụ cho nhân sự mới.
- Chưa xác minh được mốc nhắc đánh giá thử việc.
