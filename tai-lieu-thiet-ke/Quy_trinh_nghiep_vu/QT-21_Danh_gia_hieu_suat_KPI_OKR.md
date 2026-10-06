# QT-21 — Đánh giá hiệu suất KPI và OKR

- Dự án: VComm
- Mã quy trình: QT-21
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Nhân sự
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/2_hrm/20_kpi_okr.md (§2)`
- Mô-đun hệ thống: MOD-42 Hiệu suất và Đào tạo (`/performance`)
- Hiện trạng mã nguồn: Đã có một phần — có màn hình hiệu suất, đánh giá 360 độ và bảng theo dõi mục tiêu

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên | Đặt mục tiêu cá nhân, cập nhật tiến độ, tự đánh giá, đánh giá đồng nghiệp | `Mo ta nghiep vu/MD_ERP/2_hrm/20_kpi_okr.md (§2)` |
| Quản lý | Giao mục tiêu, duyệt mục tiêu nhân viên, chấm điểm nhân viên cấp dưới | `Mo ta nghiep vu/MD_ERP/2_hrm/20_kpi_okr.md (§2)` |
| Nhân sự | Quản lý chu kỳ, mở và đóng cổng đánh giá, theo dõi tiến độ toàn đơn vị | `Mo ta nghiep vu/MD_ERP/2_hrm/20_kpi_okr.md (§2)` |
| Hội đồng hiệu chỉnh | Điều chỉnh điểm số để tránh chênh lệch giữa các phòng | `Mo ta nghiep vu/MD_ERP/2_hrm/20_kpi_okr.md (§2)` |

## 2. Điều kiện trước

- Đã có chu kỳ đánh giá và bộ mục tiêu được giao.
- Đã có dữ liệu doanh số hoặc dữ liệu công việc làm căn cứ chấm điểm.

## 3. Luồng chính

1. Đầu kỳ, giám đốc giao mục tiêu xuống trưởng phòng; trưởng phòng phân bổ hoặc nhân viên tự đề xuất mục tiêu.
2. Quản lý duyệt bộ mục tiêu của nhân viên.
3. Định kỳ hàng tuần hoặc hàng tháng, nhân viên cập nhật giá trị thực tế và ghi chú tiến độ.
4. Cuối kỳ, nhân viên tự đánh giá, quản lý trực tiếp đánh giá, và có thể đánh giá đồng nghiệp 360 độ.
5. Hội đồng hiệu chỉnh điểm số để bảo đảm công bằng giữa các phòng.
6. Chốt xếp loại và truyền kết quả sang phân hệ lương thưởng.

## 4. Sơ đồ

```
[Giao mục tiêu: Giám đốc -> Trưởng phòng -> Nhân viên]
                |
                v
        [Quản lý duyệt mục tiêu]
                |
                v
        [Check-in định kỳ: giá trị thực tế + ghi chú]
                |
                v
   [Tự đánh giá] + [Quản lý đánh giá] + [Đồng nghiệp 360 độ]
                |
                v
        [Hội đồng hiệu chỉnh điểm]
                |
                v
        [Chốt xếp loại] --> [Truyền sang lương thưởng]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Mục tiêu chưa được duyệt | Không tính vào kết quả đánh giá | `Mo ta nghiep vu/MD_ERP/2_hrm/20_kpi_okr.md (§2)` |
| E2 | Nhân viên chưa cập nhật tiến độ | Điểm mục tiêu để trống hoặc tính theo giá trị mặc định | `Mo ta nghiep vu/MD_ERP/2_hrm/20_kpi_okr.md (§2)` |
| E3 | Cổng đánh giá đã đóng | Không cho gửi đánh giá muộn | `Mo ta nghiep vu/MD_ERP/2_hrm/20_kpi_okr.md (§2)` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Chu kỳ: Chưa mở --> Đang mở --> Đã đóng
Mục tiêu: Nháp --> Chờ duyệt --> Đã duyệt --> Đang thực hiện --> Đã chấm điểm
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Chỉ mục tiêu đã duyệt mới được tính vào kết quả | `Mo ta nghiep vu/MD_ERP/2_hrm/20_kpi_okr.md (§2)` |
| BR-02 | Điểm cuối kỳ có thể bị hiệu chỉnh bởi hội đồng | `Mo ta nghiep vu/MD_ERP/2_hrm/20_kpi_okr.md (§2)` |
| BR-03 | Kết quả xếp loại là dữ liệu đầu vào cho lương thưởng | `Mo ta nghiep vu/MD_ERP/2_hrm/20_kpi_okr.md (§2)` |

## 8. Thông báo và nhật ký

- Thông báo mở và đóng cổng đánh giá cho toàn đơn vị.
- Chưa có thông báo nhắc nhân viên cập nhật tiến độ định kỳ.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng mục tiêu | Mục tiêu, chỉ tiêu, giá trị mục tiêu, giá trị thực tế, trọng số | `Mo ta nghiep vu/MD_ERP/2_hrm/20_kpi_okr.md (§1)` |
| Bảng đánh giá | Điểm tự đánh giá, điểm quản lý, điểm đồng nghiệp | `Mo ta nghiep vu/MD_ERP/2_hrm/20_kpi_okr.md (§1)` |
| Bảng chu kỳ đánh giá | Kỳ, thời gian mở, thời gian đóng | `Mo ta nghiep vu/MD_ERP/2_hrm/20_kpi_okr.md (§1)` |

## 10. Màn hình

- Hiệu suất và Đào tạo (`src/components/Performance.tsx:78`).
- Nhận xét đánh giá của Quản lý (`src/components/Performance.tsx:261`).
- Hệ thống Đào tạo và Đánh giá 360 Độ (`src/components/Performance.tsx:296`).
- Bảng theo dõi mục tiêu chi tiết (`src/components/HR.tsx:2168`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho mục tiêu đã duyệt và có giá trị thực tế, Khi chấm điểm, Thì điểm tính theo trọng số.
- **AC-02.** Cho mục tiêu chưa duyệt, Khi chấm điểm, Thì mục tiêu đó không vào kết quả (ca thất bại bắt buộc).
- **AC-03.** Cho cổng đánh giá đã đóng, Khi gửi đánh giá, Thì hệ thống từ chối (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình hiệu suất và đánh giá 360 độ đã có.
- Cần bổ sung luồng hiệu chỉnh điểm và khóa cổng đánh giá nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Chu kỳ đánh giá là theo quý, có đánh giá năm.
- **Q-01.** Có cần áp quy tắc phân phối chuẩn khi xếp loại không?
- **Q-02.** Trọng số mục tiêu do quản lý đặt hay do nhân viên đề xuất?

## 14. Ghi chú kỹ thuật

- Nên tách hàm tính điểm theo trọng số thành hàm thuần để kiểm thử.

## Chưa xác minh được

- Chưa xác minh được luồng hiệu chỉnh điểm có tồn tại hay không.
- Chưa xác minh được quy tắc xếp loại đang áp dụng.
- Chưa xác minh được mức độ liên kết giữa kết quả đánh giá và lương thưởng.
