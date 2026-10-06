# QT-16 — Quản lý Hợp đồng lao động

- Dự án: VComm
- Mã quy trình: QT-16
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Nhân sự
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/2_hrm/15_labor_contracts.md (§2)`
- Mô-đun hệ thống: MOD-40 Hồ sơ Nhân sự (`/easyhrm`) và MOD-07 Hợp đồng (`/contracts`)
- Hiện trạng mã nguồn: Đã có một phần — có màn hình hợp đồng dùng chung và dịch vụ tính lương đọc ngày bắt đầu hợp đồng

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân sự tiền lương và chế độ | Tạo, sửa, in và quản lý tệp hợp đồng | `Mo ta nghiep vu/MD_ERP/2_hrm/15_labor_contracts.md (§2)` |
| Nhân viên | Xem danh sách hợp đồng của mình và tải bản mềm | `Mo ta nghiep vu/MD_ERP/2_hrm/15_labor_contracts.md (§2)` |
| Pháp chế / Ban điều hành | Phê duyệt điều khoản đặc thù, ký hợp đồng | `Mo ta nghiep vu/MD_ERP/2_hrm/15_labor_contracts.md (§2)` |
| Hệ thống | Đọc ngày bắt đầu hợp đồng gần nhất để tính lương và thuế | `src/services/hrPayrollBridge.ts:107` |

## 2. Điều kiện trước

- Nhân viên đã có hồ sơ trong hệ thống.
- Đã có mẫu hợp đồng lao động để trộn dữ liệu.

## 3. Luồng chính

1. Nhân sự tạo hợp đồng cho nhân viên mới hoặc nhân viên gia hạn.
2. Hệ thống trộn dữ liệu vào mẫu để in bản cứng trình ký, hoặc ký điện tử.
3. Hệ thống theo dõi thời hạn hợp đồng và báo cáo hợp đồng sắp hết hạn.
4. Trước khi hết hạn từ 30 đến 45 ngày, nhân sự tạo luồng đánh giá gia hạn.
5. Nếu đạt, sinh hợp đồng mới hoặc phụ lục hợp đồng.
6. Khi chấm dứt, đổi trạng thái hợp đồng hiện tại sang đã chấm dứt.

## 4. Sơ đồ

```
[Tạo hợp đồng] --> [Trộn mẫu, in hoặc ký điện tử]
                        |
                        v
        [Theo dõi thời hạn hợp đồng]
                        |
                        v
        [Trước hết hạn 30-45 ngày: đánh giá gia hạn]
                        |
        +---------------+---------------+
        |                               |
        v                               v
[Ký hợp đồng mới / Phụ lục]      [Chấm dứt hợp đồng]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Hợp đồng sắp hết hạn chưa được xử lý | Hệ thống báo cáo danh sách hợp đồng sắp hết hạn | `Mo ta nghiep vu/MD_ERP/2_hrm/15_labor_contracts.md (§2)` |
| E2 | Nhân viên không có hợp đồng còn hiệu lực | Không tính được lương và thuế theo hợp đồng | `src/services/hrPayrollBridge.ts:107` |
| E3 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Hợp đồng: Nháp --> Đã ký --> Đang hiệu lực --> Sắp hết hạn --> Đã gia hạn / Đã chấm dứt
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Hệ thống theo dõi thời hạn và báo cáo hợp đồng sắp hết hạn | `Mo ta nghiep vu/MD_ERP/2_hrm/15_labor_contracts.md (§2)` |
| BR-02 | Đánh giá gia hạn thực hiện trước khi hết hạn từ 30 đến 45 ngày | `Mo ta nghiep vu/MD_ERP/2_hrm/15_labor_contracts.md (§2)` |
| BR-03 | Ngày bắt đầu hợp đồng gần nhất được dùng để xác định nghĩa vụ thuế | `src/services/hrPayrollBridge.ts:107` |
| BR-04 | Nhân viên chỉ xem được hợp đồng của chính mình | `Mo ta nghiep vu/MD_ERP/2_hrm/15_labor_contracts.md (§2)` |

## 8. Thông báo và nhật ký

- Thông báo nhắc nhân sự khi hợp đồng sắp hết hạn.
- Chưa có nhật ký kiểm toán riêng cho thay đổi hợp đồng.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng hợp đồng lao động | Mã hợp đồng, loại, ngày bắt đầu, ngày kết thúc, trạng thái | `Mo ta nghiep vu/MD_ERP/2_hrm/15_labor_contracts.md (§1)` |
| Bảng phụ lục hợp đồng | Nội dung thay đổi, ngày hiệu lực | `Mo ta nghiep vu/MD_ERP/2_hrm/15_labor_contracts.md (§1)` |
| Bảng nhân viên | Liên kết hợp đồng với nhân viên | `Mo ta nghiep vu/MD_ERP/2_hrm/15_labor_contracts.md (§1)` |

## 10. Màn hình

- Chức Năng Thông Tin Nhân Sự Toàn Diện (`src/components/EasyHRM.tsx:624`).
- Quản trị Hợp đồng (`src/components/ContractManager.tsx:655`).
- Tạo hợp đồng mới (`src/components/ContractManager.tsx:782`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho nhân viên mới, Khi tạo hợp đồng, Thì hệ thống sinh tệp hợp đồng từ mẫu với dữ liệu đã trộn.
- **AC-02.** Cho hợp đồng còn 30 ngày là hết hạn, Khi quét định kỳ, Thì hợp đồng xuất hiện trong báo cáo sắp hết hạn (ca bắt buộc).
- **AC-03.** Cho hợp đồng đã chấm dứt, Khi tính lương kỳ sau, Thì nhân viên đó không còn trong bảng lương (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình hợp đồng dùng chung và dịch vụ cầu nối lương.
- Cần bổ sung luồng gia hạn và phụ lục hợp đồng nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Mẫu hợp đồng lao động do đơn vị tự soạn và đưa vào hệ thống.
- **Q-01.** Có cần ký số hợp đồng lao động không?
- **Q-02.** Có bao nhiêu loại hợp đồng được áp dụng?

## 14. Ghi chú kỹ thuật

- Ngày bắt đầu hợp đồng gần nhất là dữ liệu đầu vào cho việc xác định nghĩa vụ thuế thu nhập cá nhân (`src/services/hrPayrollBridge.ts:107`).

## Chưa xác minh được

- Chưa xác minh được luồng gia hạn và phụ lục hợp đồng có tồn tại hay không.
- Chưa xác minh được mẫu hợp đồng đang dùng.
- Chưa xác minh được cơ chế nhắc hạn hợp đồng.
