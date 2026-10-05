# QT-17 — Chấm công và Chốt công

- Dự án: VComm
- Mã quy trình: QT-17
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Nhân sự
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/2_hrm/16_timekeeping.md (§2)`
- Mô-đun hệ thống: MOD-39 Quản trị Nhân sự (`/hr`)
- Hiện trạng mã nguồn: Đã có một phần — có màn hình nhân sự và biểu đồ vi phạm chấm công

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên | Chấm công vào ra, xem bảng công cá nhân, tạo đơn nghỉ phép và giải trình | `Mo ta nghiep vu/MD_ERP/2_hrm/16_timekeeping.md (§2)` |
| Quản lý trực tiếp | Duyệt đơn nghỉ phép và giải trình, xem bảng công của phòng | `Mo ta nghiep vu/MD_ERP/2_hrm/16_timekeeping.md (§2)` |
| Nhân sự phụ trách chấm công | Quản lý ca làm việc, đồng bộ dữ liệu máy chấm công, chốt công toàn đơn vị | `Mo ta nghiep vu/MD_ERP/2_hrm/16_timekeeping.md (§2)` |

## 2. Điều kiện trước

- Đã phân ca làm việc cho nhân sự và khai báo ngày nghỉ lễ trong năm.
- Đã có nguồn dữ liệu chấm công thô (máy vân tay, ứng dụng di động).

## 3. Luồng chính

1. Nhân sự thiết lập ca làm việc và khai báo ngày nghỉ lễ.
2. Nhân viên chấm công vào ra qua máy vân tay, ứng dụng di động hoặc nhận diện khuôn mặt.
3. Hệ thống kéo dữ liệu thô và ghép vào ca làm việc để tính giờ vào, giờ ra, số phút đi muộn, về sớm và công thực tế.
4. Nhân viên làm đơn giải trình chấm công hoặc đơn xin nghỉ phép khi có ngoại lệ.
5. Quản lý trực tiếp duyệt đơn.
6. Cuối tháng, hệ thống cập nhật bảng công theo các đơn đã duyệt.
7. Nhân sự khóa bảng công để chuyển sang tính lương.

## 4. Sơ đồ

```
[Cấu hình ca + ngày lễ]
        |
        v
[Chấm công: vân tay / di động / khuôn mặt]
        |
        v
[Đồng bộ log] --> [Ghép ca: giờ vào, giờ ra, đi muộn, về sớm]
        |
        v
[Đơn giải trình / nghỉ phép] --> [Quản lý duyệt]
        |
        v
[Chốt công cuối tháng] --> [Khóa bảng công] --> [Chuyển sang QT-18 Tính lương]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Nhân viên quên chấm công | Làm đơn giải trình, quản lý duyệt để bù công | `Mo ta nghiep vu/MD_ERP/2_hrm/16_timekeeping.md (§2)` |
| E2 | Dữ liệu chấm công không ghép được vào ca | Đưa vào danh sách ngoại lệ để xử lý thủ công | `Mo ta nghiep vu/MD_ERP/2_hrm/16_timekeeping.md (§2)` |
| E3 | Chốt công khi còn đơn chưa duyệt | Cảnh báo, không cho khóa bảng công | `Mo ta nghiep vu/MD_ERP/2_hrm/16_timekeeping.md (§2)` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Bảng công: Đang mở --> Chờ chốt --> Đã khóa
Đơn nghỉ phép: Nháp --> Chờ duyệt --> Đã duyệt / Từ chối
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Dữ liệu thô phải ghép vào ca làm việc mới tính được công thực tế | `Mo ta nghiep vu/MD_ERP/2_hrm/16_timekeeping.md (§2)` |
| BR-02 | Chỉ khóa bảng công khi mọi đơn ngoại lệ đã được duyệt | `Mo ta nghiep vu/MD_ERP/2_hrm/16_timekeeping.md (§2)` |
| BR-03 | Bảng công đã khóa là dữ liệu đầu vào cho tính lương | `Mo ta nghiep vu/MD_ERP/2_hrm/16_timekeeping.md (§2)` |

## 8. Thông báo và nhật ký

- Thông báo cho quản lý khi có đơn nghỉ phép hoặc giải trình chờ duyệt.
- Chưa có thông báo tự động khi nhân viên đi muộn nhiều lần.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng chấm công | Ngày, giờ vào, giờ ra, công thực tế | `Mo ta nghiep vu/MD_ERP/2_hrm/16_timekeeping.md (§1)` |
| Bảng ca làm việc | Ca, giờ bắt đầu, giờ kết thúc | `Mo ta nghiep vu/MD_ERP/2_hrm/16_timekeeping.md (§1)` |
| Bảng đơn nghỉ phép và giải trình | Loại đơn, lý do, trạng thái duyệt | `Mo ta nghiep vu/MD_ERP/2_hrm/16_timekeeping.md (§1)` |
| Bảng ngày nghỉ lễ | Ngày lễ trong năm | `Mo ta nghiep vu/MD_ERP/2_hrm/16_timekeeping.md (§2)` |

## 10. Màn hình

- Quản trị Nguồn nhân lực (`src/components/HR.tsx:890`).
- Biểu đồ Vi phạm Chấm công (`src/components/HR.tsx:848`).
- Bảng Phân Ca & Chấm Công CSKH (`src/components/CustomerService.tsx:936`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho dữ liệu chấm công khớp ca, Khi đồng bộ, Thì hệ thống tính đúng giờ vào, giờ ra và công thực tế.
- **AC-02.** Cho nhân viên đi muộn 15 phút, Khi chốt công, Thì số phút đi muộn được ghi nhận (ca bắt buộc).
- **AC-03.** Cho bảng công còn đơn chưa duyệt, Khi khóa bảng công, Thì hệ thống chặn (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình nhân sự và biểu đồ vi phạm chấm công.
- Cần bổ sung bảng ca làm việc, bảng ngày lễ và luồng duyệt đơn ngoại lệ.

## 13. Giả định và câu hỏi mở

- **GD-01.** Đơn vị dùng ca hành chính cố định trong giai đoạn đầu.
- **Q-01.** Có cần hỗ trợ ca xoay và ca gãy không?
- **Q-02.** Quy tắc tính công cho ngày lễ và ngày nghỉ tuần như thế nào?

## 14. Ghi chú kỹ thuật

- Nên tách hàm ghép dữ liệu chấm công với ca thành hàm thuần nhận ngày để dễ kiểm thử.

## Chưa xác minh được

- Chưa xác minh được luồng đồng bộ dữ liệu máy chấm công có tồn tại hay không.
- Chưa xác minh được quy tắc tính công cho ngày lễ và ca xoay.
- Chưa xác minh được cơ chế khóa bảng công.
