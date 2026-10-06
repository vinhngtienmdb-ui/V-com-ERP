# QT-26 — Giao việc và Thực hiện Công việc

- Dự án: VComm
- Mã quy trình: QT-26
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Văn phòng
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/4_office/29_tasks.md (§2)`
- Mô-đun hệ thống: MOD-05 Quản lý Công việc (`/tasks`) và MOD-04 Điều hành và Workflow (`/workflow`)
- Hiện trạng mã nguồn: Đã có một phần — có màn hình quản lý công việc và trung tâm điều hành

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Trưởng dự án | Toàn quyền thêm, sửa, xóa công việc, cài đặt dự án, thêm bớt thành viên | `Mo ta nghiep vu/MD_ERP/4_office/29_tasks.md (§2)` |
| Thành viên | Tạo công việc mới, chuyển trạng thái và bình luận trong công việc của mình | `Mo ta nghiep vu/MD_ERP/4_office/29_tasks.md (§2)` |
| Khách hoặc đối tác | Chỉ xem được công việc được chia sẻ | `Mo ta nghiep vu/MD_ERP/4_office/29_tasks.md (§2)` |

## 2. Điều kiện trước

- Đã có dự án và danh sách thành viên tham gia.
- Đã phân quyền cho người giao việc và người nhận việc.

## 3. Luồng chính

1. Trưởng dự án tạo dự án mới và tạo các nhóm công việc theo giai đoạn.
2. Người quản lý hoặc nhân viên tạo công việc mới, điền tiêu đề, mô tả, hạn hoàn thành và chọn người thực hiện.
3. Hệ thống gửi thông báo cho người được giao việc.
4. Người nhận việc đổi trạng thái sang đang làm và trao đổi bằng cách nhắc tên đồng nghiệp trong bình luận.
5. Khi hoàn thành, người nhận việc kéo công việc sang cột đã xong hoặc cập nhật tiến độ lên 100 phần trăm.
6. Người giao việc nhận thông báo để vào nghiệm thu.

## 4. Sơ đồ

```
[Tạo dự án + nhóm công việc]
            |
            v
[Tạo công việc: tiêu đề, mô tả, hạn, người thực hiện]
            |
            v
[Thông báo cho người nhận việc]
            |
            v
[Đang làm] --> [Trao đổi, nhắc tên đồng nghiệp]
            |
            v
[Hoàn thành: kéo sang Đã xong hoặc 100 phần trăm]
            |
            v
[Thông báo cho người giao việc để nghiệm thu]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Công việc không có người thực hiện | Không gửi được; bắt buộc chọn người thực hiện | `Mo ta nghiep vu/MD_ERP/4_office/29_tasks.md (§2)` |
| E2 | Công việc quá hạn | Hệ thống đánh dấu quá hạn và thông báo cho người giao việc | `Mo ta nghiep vu/MD_ERP/4_office/29_tasks.md (§2)` |
| E3 | Thành viên ngoài dự án cố xem công việc | Từ chối truy cập | `Mo ta nghiep vu/MD_ERP/4_office/29_tasks.md (§2)` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Công việc: Mới --> Đang làm --> Chờ nghiệm thu --> Đã xong
Mới --quá hạn--> Quá hạn --> Đang làm
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Công việc bắt buộc có người thực hiện và hạn hoàn thành | `Mo ta nghiep vu/MD_ERP/4_office/29_tasks.md (§2)` |
| BR-02 | Thành viên chỉ đổi trạng thái công việc của mình hoặc công việc công khai trong dự án | `Mo ta nghiep vu/MD_ERP/4_office/29_tasks.md (§2)` |
| BR-03 | Khách hoặc đối tác chỉ xem, không đổi trạng thái | `Mo ta nghiep vu/MD_ERP/4_office/29_tasks.md (§2)` |

## 8. Thông báo và nhật ký

- Thông báo cho người nhận việc khi được giao việc.
- Thông báo cho người giao việc khi công việc hoàn thành.
- Đồng bộ hạn công việc sang lịch làm việc (`src/services/googleCalendar.ts:107`).

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng dự án | Tên dự án, trưởng dự án, thành viên | `Mo ta nghiep vu/MD_ERP/4_office/29_tasks.md (§1)` |
| Bảng nhóm công việc | Giai đoạn, thứ tự | `Mo ta nghiep vu/MD_ERP/4_office/29_tasks.md (§1)` |
| Bảng công việc | Tiêu đề, mô tả, hạn, người thực hiện, trạng thái, tiến độ | `Mo ta nghiep vu/MD_ERP/4_office/29_tasks.md (§1)` |
| Bảng bình luận | Nội dung, người gửi, thời điểm | `Mo ta nghiep vu/MD_ERP/4_office/29_tasks.md (§2)` |

## 10. Màn hình

- Quản lý Công việc (`src/components/TasksPage.tsx:66`).
- Thêm công việc mới (`src/components/TasksPage.tsx:167`).
- Điều hành và Workflow (`src/components/WorkflowHub.tsx`, tuyến `/workflow`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho công việc đủ thông tin, Khi tạo, Thì người thực hiện nhận thông báo.
- **AC-02.** Cho công việc thiếu người thực hiện, Khi tạo, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-03.** Cho thành viên ngoài dự án, Khi xem công việc, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-04.** Cho công việc quá hạn, Khi quét định kỳ, Thì hệ thống đánh dấu quá hạn và thông báo.

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình quản lý công việc và trung tâm điều hành.
- Cần bổ sung bảng dự án và bảng nhóm công việc nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Mỗi công việc thuộc một dự án duy nhất.
- **Q-01.** Có cần hỗ trợ công việc định kỳ tự sinh theo lịch không?
- **Q-02.** Có cần chia sẻ công việc cho khách hoặc đối tác bên ngoài không?

## 14. Ghi chú kỹ thuật

- Đồng bộ hạn công việc sang lịch làm việc dùng dịch vụ lịch chung (`src/services/googleCalendar.ts:107`).

## Chưa xác minh được

- Chưa xác minh được bảng dự án và nhóm công việc có tồn tại hay không.
- Chưa xác minh được cơ chế chia sẻ công việc cho bên ngoài.
- Chưa xác minh được quy tắc đánh dấu quá hạn.
