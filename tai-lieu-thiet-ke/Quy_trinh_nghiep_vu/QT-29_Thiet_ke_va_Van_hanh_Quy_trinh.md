# QT-29 — Thiết kế và Vận hành Quy trình

- Dự án: VComm
- Mã quy trình: QT-29
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Văn phòng
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/4_office/28_workflows.md (§2)`
- Mô-đun hệ thống: MOD-04 Điều hành và Workflow (`/workflow`) và MOD-06 Đề xuất và Trình ký (`/requests`)
- Hiện trạng mã nguồn: Đã có một phần — có trung tâm điều hành, thiết kế biểu mẫu và trình ký

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Quản trị viên hệ thống | Thiết kế biểu mẫu, vẽ luồng xử lý, phân quyền người xem và người chạy | `Mo ta nghiep vu/MD_ERP/4_office/28_workflows.md (§2)` |
| Người đề xuất | Điền biểu mẫu và gửi đề xuất; chỉ xem được đề xuất do mình tạo | `Mo ta nghiep vu/MD_ERP/4_office/28_workflows.md (§2)` |
| Người duyệt | Xem dữ liệu biểu mẫu, đồng ý, từ chối hoặc yêu cầu bổ sung | `Mo ta nghiep vu/MD_ERP/4_office/28_workflows.md (§2)` |
| Người theo dõi | Nhìn thấy tiến trình nhưng không có quyền duyệt | `Mo ta nghiep vu/MD_ERP/4_office/28_workflows.md (§2)` |

## 2. Điều kiện trước

- Đã có biểu mẫu và luồng xử lý được thiết kế và kích hoạt.
- Đã phân quyền người duyệt cho từng bước của luồng.

## 3. Luồng chính

1. Quản trị viên tạo biểu mẫu nhập liệu bằng cách kéo thả các trường văn bản, số, tệp đính kèm và bảng chi tiết.
2. Quản trị viên vẽ luồng xử lý với các bước duyệt và điều kiện rẽ nhánh.
3. Người đề xuất chọn quy trình, điền biểu mẫu và đính kèm chứng từ rồi gửi.
4. Hệ thống chuyển đề xuất đến người duyệt ở bước đầu tiên.
5. Người duyệt xem, chọn đồng ý, từ chối hoặc yêu cầu bổ sung.
6. Hệ thống tự động chuyển tiếp đến các bước tiếp theo theo logic rẽ nhánh.
7. Khi hoàn tất toàn bộ luồng, người đề xuất nhận thông báo đề xuất đã được duyệt.

## 4. Sơ đồ

```
[Thiết kế biểu mẫu + vẽ luồng]
                |
                v
        [Người đề xuất điền và gửi]
                |
                v
        [Bước 1: Quản lý trực tiếp] --đồng ý--> [Bước 2: Kế toán]
                |                                      |
                |--từ chối--> [Kết thúc]                v
                                            [Bước 3: Giám đốc nếu vượt ngưỡng]
                                                       |
                                                       v
                                            [Hoàn tất + thông báo]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Người đề xuất cố xem đề xuất của người khác | Từ chối truy cập | `Mo ta nghiep vu/MD_ERP/4_office/28_workflows.md (§2)` |
| E2 | Người duyệt sửa dữ liệu ở bước không cho phép sửa | Chặn sửa | `Mo ta nghiep vu/MD_ERP/4_office/28_workflows.md (§2)` |
| E3 | Rút lại đề xuất khi đã có người duyệt | Chặn rút; chỉ rút được khi chưa ai duyệt | `Mo ta nghiep vu/MD_ERP/4_office/28_workflows.md (§2)` |
| E4 | Luồng thiếu người duyệt ở một bước | Chặn kích hoạt luồng | `Mo ta nghiep vu/MD_ERP/4_office/28_workflows.md (§2)` |

## 6. Máy trạng thái

```
Đề xuất: Nháp --> Chờ duyệt bước 1 --> Chờ duyệt bước 2 --> Đã duyệt
Chờ duyệt --từ chối--> Đã từ chối
Chờ duyệt --yêu cầu bổ sung--> Cần bổ sung --> Chờ duyệt
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Người đề xuất chỉ xem được đề xuất do mình tạo | `Mo ta nghiep vu/MD_ERP/4_office/28_workflows.md (§2)` |
| BR-02 | Chỉ rút lại được khi chưa có ai duyệt | `Mo ta nghiep vu/MD_ERP/4_office/28_workflows.md (§2)` |
| BR-03 | Người duyệt chỉ sửa dữ liệu nếu bước đó cho phép | `Mo ta nghiep vu/MD_ERP/4_office/28_workflows.md (§2)` |
| BR-04 | Người theo dõi thấy tiến trình nhưng không có quyền duyệt | `Mo ta nghiep vu/MD_ERP/4_office/28_workflows.md (§2)` |

## 8. Thông báo và nhật ký

- Thông báo cho người duyệt khi có đề xuất đến bước của mình.
- Thông báo cho người đề xuất khi đề xuất hoàn tất.
- Đồng bộ hạn xử lý sang lịch làm việc (`src/services/googleCalendar.ts:107`).

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng định nghĩa biểu mẫu | Trường, kiểu dữ liệu, bắt buộc | `src/components/RequestHub.tsx:905` |
| Bảng định nghĩa luồng | Bước, người duyệt, điều kiện rẽ nhánh | `Mo ta nghiep vu/MD_ERP/4_office/28_workflows.md (§1)` |
| Bảng đề xuất | Người tạo, biểu mẫu, dữ liệu, trạng thái | `src/components/RequestHub.tsx:1292` |
| Bảng lịch sử xử lý | Bước, người xử lý, ý kiến, thời điểm | `Mo ta nghiep vu/MD_ERP/4_office/28_workflows.md (§1)` |

## 10. Màn hình

- Điều hành và Workflow (`src/components/WorkflowHub.tsx`, tuyến `/workflow`).
- Cài đặt Cấu trúc Phiếu (`src/components/RequestHub.tsx:905`).
- Phiếu Đề xuất (`src/components/RequestHub.tsx:1292`).
- Đồng bộ lịch Google Calendar (`src/components/WorkflowHub.tsx:272`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho đề xuất gửi ở bước 1, Khi quản lý đồng ý, Thì hệ thống chuyển sang bước 2.
- **AC-02.** Cho đề xuất đã có người duyệt, Khi người tạo rút lại, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-03.** Cho luồng thiếu người duyệt một bước, Khi kích hoạt, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-04.** Cho đề xuất vượt ngưỡng tiền, Khi qua bước kế toán, Thì hệ thống tự chuyển tiếp tới giám đốc.

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại trung tâm điều hành và thiết kế biểu mẫu đã có.
- Cần bổ sung bảng lịch sử xử lý và điều kiện rẽ nhánh nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Luồng xử lý có tối đa năm bước trong giai đoạn đầu.
- **Q-01.** Điều kiện rẽ nhánh được biểu diễn theo ngưỡng tiền hay theo phòng ban?
- **Q-02.** Có cần ký số trên phiếu đề xuất không?

## 14. Ghi chú kỹ thuật

- Có dịch vụ xác thực chữ ký số cho phiếu (`src/components/RequestHub.tsx:1136`) và lưu vết kiểm toán (`src/services/auditTrailService.ts:203`).

## Chưa xác minh được

- Chưa xác minh được phạm vi điều kiện rẽ nhánh đang hỗ trợ.
- Chưa xác minh được số bước tối đa của một luồng.
- Chưa xác minh được cơ chế phân quyền người theo dõi.
