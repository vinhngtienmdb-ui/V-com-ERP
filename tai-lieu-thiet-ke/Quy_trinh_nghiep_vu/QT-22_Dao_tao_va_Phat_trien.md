# QT-22 — Đào tạo và Phát triển

- Dự án: VComm
- Mã quy trình: QT-22
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Nhân sự
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/2_hrm/21_training.md (§2)`
- Mô-đun hệ thống: MOD-42 Hiệu suất và Đào tạo (`/performance`)
- Hiện trạng mã nguồn: Đã có một phần — có màn hình hiệu suất và đào tạo, có phân tích khoảng trống kỹ năng

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Chuyên viên đào tạo | Tạo khóa học, lập kế hoạch, điểm danh, quản lý ngân sách | `Mo ta nghiep vu/MD_ERP/2_hrm/21_training.md (§2)` |
| Giảng viên | Xem danh sách học viên lớp mình, chấm điểm, đánh giá | `Mo ta nghiep vu/MD_ERP/2_hrm/21_training.md (§2)` |
| Nhân viên | Đăng ký học, làm bài kiểm tra, đánh giá chất lượng giảng viên | `Mo ta nghiep vu/MD_ERP/2_hrm/21_training.md (§2)` |
| Quản lý | Phê duyệt cho nhân viên đi học | `Mo ta nghiep vu/MD_ERP/2_hrm/21_training.md (§2)` |

## 2. Điều kiện trước

- Đã tổng hợp nhu cầu đào tạo từ các phòng ban.
- Đã có ngân sách đào tạo được duyệt.

## 3. Luồng chính

1. Các phòng ban gửi nhu cầu đào tạo; nhân sự tổng hợp thành kế hoạch đào tạo và dự toán ngân sách trình duyệt.
2. Nhân sự tạo lớp học, thêm tài liệu và thiết lập giảng viên.
3. Nhân viên đăng ký tham gia hoặc được chỉ định bắt buộc vào lớp.
4. Giảng viên giảng dạy, điểm danh và phát bài kiểm tra.
5. Nhân viên làm bài kiểm tra.
6. Cập nhật kết quả đạt hoặc không đạt vào hồ sơ nhân viên.
7. Với khóa học bên ngoài có chi phí lớn, nhân viên ký cam kết đào tạo về thời gian làm việc tối thiểu.

## 4. Sơ đồ

```
[Nhu cầu đào tạo các phòng] --> [Kế hoạch + ngân sách] --> [Duyệt]
                                                                    |
                                                                    v
                                                    [Tạo lớp học, tài liệu, giảng viên]
                                                                    |
                                                                    v
                                        [Đăng ký hoặc chỉ định] --> [Giảng dạy, điểm danh]
                                                                    |
                                                                    v
                                                        [Bài kiểm tra, kết quả]
                                                                    |
                                                    +---------------+---------------+
                                                    |                               |
                                                    v                               v
                                        [Cập nhật hồ sơ nhân viên]      [Cam kết đào tạo]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Vượt ngân sách đào tạo | Chặn hoặc buộc trình cấp cao hơn duyệt | `Mo ta nghiep vu/MD_ERP/2_hrm/21_training.md (§2)` |
| E2 | Nhân viên không đạt bài kiểm tra | Ghi nhận không đạt; có thể phải học lại | `Mo ta nghiep vu/MD_ERP/2_hrm/21_training.md (§2)` |
| E3 | Nhân viên nghỉ trước hạn cam kết | Xử lý đền bù theo cam kết đào tạo | `Mo ta nghiep vu/MD_ERP/2_hrm/21_training.md (§2)` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Lớp học: Nháp --> Đã mở đăng ký --> Đang diễn ra --> Đã kết thúc
Học viên: Đã đăng ký --> Đã điểm danh --> Đạt / Không đạt
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Kế hoạch đào tạo phải nằm trong ngân sách đã duyệt | `Mo ta nghiep vu/MD_ERP/2_hrm/21_training.md (§2)` |
| BR-02 | Khóa học chi phí lớn phải có cam kết thời gian làm việc tối thiểu | `Mo ta nghiep vu/MD_ERP/2_hrm/21_training.md (§2)` |
| BR-03 | Kết quả đào tạo cập nhật vào hồ sơ nhân viên | `Mo ta nghiep vu/MD_ERP/2_hrm/21_training.md (§2)` |

## 8. Thông báo và nhật ký

- Thông báo mời nhân viên tham gia lớp học.
- Chưa có thông báo nhắc nhân viên hoàn thành bài kiểm tra.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng khóa học | Tên khóa, giảng viên, thời gian, chi phí | `Mo ta nghiep vu/MD_ERP/2_hrm/21_training.md (§1)` |
| Bảng đăng ký học | Học viên, lớp, trạng thái | `Mo ta nghiep vu/MD_ERP/2_hrm/21_training.md (§1)` |
| Bảng kết quả đào tạo | Điểm, kết quả đạt hoặc không đạt | `Mo ta nghiep vu/MD_ERP/2_hrm/21_training.md (§1)` |
| Bảng cam kết đào tạo | Thời gian cam kết, mức đền bù | `Mo ta nghiep vu/MD_ERP/2_hrm/21_training.md (§2)` |

## 10. Màn hình

- Hiệu suất và Đào tạo (`src/components/Performance.tsx:78`).
- Hệ thống Đào tạo và Đánh giá 360 Độ (`src/components/Performance.tsx:296`).
- Phân tích khoảng trống kỹ năng (`src/components/HR.tsx:1038`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho kế hoạch đào tạo trong ngân sách, Khi trình duyệt, Thì được duyệt.
- **AC-02.** Cho kế hoạch vượt ngân sách, Khi trình duyệt, Thì hệ thống chặn hoặc buộc duyệt cấp cao hơn (ca thất bại bắt buộc).
- **AC-03.** Cho nhân viên hoàn thành bài kiểm tra, Khi cập nhật, Thì kết quả vào hồ sơ nhân viên (ca bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình hiệu suất và đào tạo đã có.
- Cần bổ sung bảng khóa học, đăng ký học và cam kết đào tạo.

## 13. Giả định và câu hỏi mở

- **GD-01.** Đào tạo nội bộ chiếm phần lớn, đào tạo bên ngoài theo từng trường hợp.
- **Q-01.** Có cần quản lý ngân sách đào tạo theo từng phòng ban không?
- **Q-02.** Thời gian cam kết làm việc tối thiểu sau đào tạo là bao lâu?

## 14. Ghi chú kỹ thuật

- Phân tích khoảng trống kỹ năng đã có trong màn hình nhân sự, có thể tái sử dụng để gợi ý khóa học.

## Chưa xác minh được

- Chưa xác minh được bảng khóa học và đăng ký học có tồn tại hay không.
- Chưa xác minh được cơ chế quản lý ngân sách đào tạo.
- Chưa xác minh được mẫu cam kết đào tạo.
