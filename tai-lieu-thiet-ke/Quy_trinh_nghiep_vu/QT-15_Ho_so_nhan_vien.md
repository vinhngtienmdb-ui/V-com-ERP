# QT-15 — Quản lý Hồ sơ nhân viên

- Dự án: VComm
- Mã quy trình: QT-15
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Nhân sự
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/2_hrm/14_employee_records.md (§2)`
- Mô-đun hệ thống: MOD-40 Hồ sơ Nhân sự (`/easyhrm`) và MOD-41 Sơ đồ tổ chức (`/org`)
- Hiện trạng mã nguồn: Đã có một phần — có màn hình hồ sơ nhân sự đầy đủ và sơ đồ tổ chức

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Quản trị nhân sự | Quản lý hồ sơ, duyệt yêu cầu cập nhật của nhân viên | `Mo ta nghiep vu/MD_ERP/2_hrm/14_employee_records.md (§2)` |
| Nhân viên | Tự cập nhật thông tin cá nhân và gửi yêu cầu phê duyệt | `Mo ta nghiep vu/MD_ERP/2_hrm/14_employee_records.md (§2)` |
| Trưởng bộ phận | Khởi tạo quyết định điều chuyển, bổ nhiệm | `Mo ta nghiep vu/MD_ERP/2_hrm/14_employee_records.md (§2)` |
| Hệ thống | Đồng bộ hồ sơ sang hệ thống kế toán khi cần | `src/services/misaService.ts:81` |

## 2. Điều kiện trước

- Đã có danh mục phòng ban, chức danh, trình độ và hình thức làm việc.
- Nhân viên đã có mã số thuế cá nhân nếu cần tính thuế.

## 3. Luồng chính

1. Khởi tạo hồ sơ nhân viên từ ứng viên đã tiếp nhận hoặc nhập từ tệp danh sách.
2. Nhân viên tự cập nhật thông tin cá nhân và gửi yêu cầu phê duyệt cho nhân sự.
3. Quản trị nhân sự duyệt hoặc từ chối yêu cầu cập nhật.
4. Khi có điều chuyển hoặc bổ nhiệm, trưởng bộ phận hoặc nhân sự khởi tạo quyết định thay đổi vị trí, phòng ban, lương.
5. Hệ thống cập nhật sơ đồ tổ chức theo thay đổi mới.
6. Khi nhân viên nghỉ việc, ghi nhận đơn, duyệt, bàn giao công việc và tài sản, ra quyết định nghỉ việc.
7. Chốt lương và bảo hiểm xã hội cho nhân viên nghỉ việc.

## 4. Sơ đồ

```
[Khởi tạo hồ sơ] --> [Nhân viên tự cập nhật]
                                |
                                v
                    [Nhân sự duyệt thay đổi]
                                |
                                v
            [Điều chuyển / Bổ nhiệm] --> [Cập nhật sơ đồ tổ chức]
                                |
                                v
                    [Nghỉ việc: đơn, duyệt, bàn giao]
                                |
                                v
                    [Chốt lương và bảo hiểm xã hội]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Thiếu giấy tờ pháp lý bắt buộc trong hồ sơ | Cảnh báo pháp lý hồ sơ | `src/components/EasyHRM.tsx:1217` |
| E2 | Yêu cầu cập nhật bị từ chối | Trả về lý do, hồ sơ giữ nguyên | `Mo ta nghiep vu/MD_ERP/2_hrm/14_employee_records.md (§2)` |
| E3 | Nghỉ việc khi còn tài sản chưa bàn giao | Chặn hoàn tất nghỉ việc cho tới khi bàn giao xong | `Mo ta nghiep vu/MD_ERP/2_hrm/14_employee_records.md (§2)` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Hồ sơ: Đang thử việc --> Chính thức --> Đã nghỉ việc
Thay đổi: Nháp --> Chờ duyệt --> Đã duyệt / Từ chối
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Nhân viên tự cập nhật nhưng phải qua nhân sự duyệt | `Mo ta nghiep vu/MD_ERP/2_hrm/14_employee_records.md (§2)` |
| BR-02 | Điều chuyển và bổ nhiệm cập nhật đồng thời hồ sơ và sơ đồ tổ chức | `Mo ta nghiep vu/MD_ERP/2_hrm/14_employee_records.md (§2)` |
| BR-03 | Hồ sơ thiếu giấy tờ bắt buộc phải cảnh báo | `src/components/EasyHRM.tsx:1217` |

## 8. Thông báo và nhật ký

- Thông báo cho nhân sự khi có yêu cầu cập nhật hồ sơ chờ duyệt.
- Chưa có nhật ký kiểm toán riêng cho thay đổi hồ sơ nhân sự.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng nhân viên | Thông tin cá nhân, phòng ban, chức danh, trạng thái | `Mo ta nghiep vu/MD_ERP/2_hrm/14_employee_records.md (§1)` |
| Bảng danh mục | Chức danh, trình độ, bằng cấp, hình thức làm việc | `src/components/EasyHRM.tsx:1524`, `:1532`, `:1540` |
| Bảng người phụ thuộc | Thông tin người phụ thuộc phục vụ giảm trừ thuế | `Mo ta nghiep vu/MD_ERP/2_hrm/14_employee_records.md (§2)` |
| Bảng sơ đồ tổ chức | Phòng ban, vị trí, quan hệ báo cáo | `src/components/OrgStructure.tsx:188` |

## 10. Màn hình

- Chức Năng Thông Tin Nhân Sự Toàn Diện (`src/components/EasyHRM.tsx:624`).
- Danh mục Chức danh (`src/components/EasyHRM.tsx:1524`).
- Cơ cấu Tổ chức (`src/components/OrgStructure.tsx:188`).
- Quản trị Nguồn nhân lực (`src/components/HR.tsx:890`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho nhân viên gửi yêu cầu cập nhật, Khi nhân sự duyệt, Thì hồ sơ cập nhật đúng giá trị mới.
- **AC-02.** Cho quyết định điều chuyển phòng ban, Khi duyệt, Thì sơ đồ tổ chức cập nhật theo (ca bắt buộc).
- **AC-03.** Cho nhân viên nghỉ việc còn tài sản chưa bàn giao, Khi hoàn tất nghỉ việc, Thì hệ thống chặn (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình hồ sơ nhân sự và sơ đồ tổ chức đã có.
- Cần bổ sung luồng duyệt yêu cầu cập nhật hồ sơ.

## 13. Giả định và câu hỏi mở

- **GD-01.** Nhân viên dùng chung một tài khoản hệ thống để tự phục vụ.
- **Q-01.** Có cần lưu vết lịch sử mọi thay đổi hồ sơ nhân sự không?
- **Q-02.** Ai được xem thông tin lương trong hồ sơ nhân viên?

## 14. Ghi chú kỹ thuật

- Đồng bộ hồ sơ sang hệ thống kế toán đã có hàm riêng (`src/services/misaService.ts:81`).

## Chưa xác minh được

- Chưa xác minh được luồng duyệt yêu cầu cập nhật hồ sơ có tồn tại hay không.
- Chưa xác minh được phạm vi trường thông tin nhân viên đang lưu.
- Chưa xác minh được quy tắc chặn nghỉ việc khi chưa bàn giao tài sản.
