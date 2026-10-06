# QT-13 — Tuyển dụng nhân sự

- Dự án: VComm
- Mã quy trình: QT-13
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Nhân sự
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/2_hrm/12_recruitment.md (§2)`
- Mô-đun hệ thống: MOD-39 Quản trị Nhân sự (`/hr`)
- Hiện trạng mã nguồn: Đã có một phần — có màn hình nhân sự và thống kê tuyển dụng; chưa có luồng yêu cầu tuyển dụng và phỏng vấn

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Trưởng bộ phận | Lập yêu cầu tuyển dụng, xem hồ sơ phòng mình, đánh giá phỏng vấn | `Mo ta nghiep vu/MD_ERP/2_hrm/12_recruitment.md (§2)` |
| Chuyên viên tuyển dụng | Quản lý toàn bộ luồng, đặt lịch, gửi thư mời, lập đề nghị tuyển | `Mo ta nghiep vu/MD_ERP/2_hrm/12_recruitment.md (§2)` |
| Giám đốc nhân sự / Ban điều hành | Phê duyệt yêu cầu tuyển dụng và đề nghị vượt khung | `Mo ta nghiep vu/MD_ERP/2_hrm/12_recruitment.md (§2)` |

## 2. Điều kiện trước

- Đã có định biên nhân sự và ngân sách tuyển dụng được duyệt.
- Đã có danh mục chức danh và phòng ban (`src/components/EasyHRM.tsx:1524`).

## 3. Luồng chính

1. Trưởng bộ phận lập yêu cầu tuyển dụng khi phát sinh nhu cầu nhân sự.
2. Giám đốc nhân sự phê duyệt yêu cầu dựa trên định biên và ngân sách.
3. Chuyên viên tuyển dụng đăng tin lên các kênh và thu thập hồ sơ ứng viên.
4. Sơ loại hồ sơ, chuyển danh sách rút gọn cho trưởng bộ phận xem xét.
5. Đặt lịch phỏng vấn, gửi thư mời và ghi nhận đánh giá trên hệ thống.
6. Lập thư mời làm việc, trình duyệt mức lương và gửi ứng viên.
7. Ứng viên đồng ý, hệ thống chuyển dữ liệu sang phân hệ tiếp nhận nhân sự.

## 4. Sơ đồ

```
[Trưởng bộ phận: Yêu cầu tuyển dụng]
                |
                v
        [Giám đốc nhân sự phê duyệt]
                |
                v
   [Đăng tuyển] --> [Thu thập hồ sơ] --> [Sơ loại]
                |
                v
        [Phỏng vấn và đánh giá]
                |
                v
        [Thư mời làm việc] --> [Ứng viên đồng ý]
                |
                v
        [Chuyển sang QT-14 Tiếp nhận nhân sự mới]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Yêu cầu tuyển dụng vượt định biên | Chặn hoặc buộc trình cấp cao hơn duyệt | `Mo ta nghiep vu/MD_ERP/2_hrm/12_recruitment.md (§2)` |
| E2 | Đề nghị lương vượt khung | Chuyển cấp phê duyệt vượt khung | `Mo ta nghiep vu/MD_ERP/2_hrm/12_recruitment.md (§2)` |
| E3 | Ứng viên từ chối thư mời | Đóng yêu cầu hoặc chuyển sang ứng viên khác | `Mo ta nghiep vu/MD_ERP/2_hrm/12_recruitment.md (§2)` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Yêu cầu: Nháp --> Chờ duyệt --> Đã duyệt --> Đang tuyển --> Đã tuyển / Đã đóng
Ứng viên: Mới --> Sơ loại --> Phỏng vấn --> Đề nghị --> Đã nhận việc / Từ chối
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Yêu cầu tuyển dụng phải nằm trong định biên đã duyệt | `Mo ta nghiep vu/MD_ERP/2_hrm/12_recruitment.md (§2)` |
| BR-02 | Đề nghị lương vượt khung phải qua cấp phê duyệt cao hơn | `Mo ta nghiep vu/MD_ERP/2_hrm/12_recruitment.md (§2)` |
| BR-03 | Chỉ chuyển sang tiếp nhận khi ứng viên đã đồng ý thư mời | `Mo ta nghiep vu/MD_ERP/2_hrm/12_recruitment.md (§2)` |

## 8. Thông báo và nhật ký

- Thư mời phỏng vấn gửi cho ứng viên qua thư điện tử.
- Chưa có thông báo nhắc trưởng bộ phận khi yêu cầu tuyển dụng chờ duyệt quá lâu.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng yêu cầu tuyển dụng | Vị trí, số lượng, định biên, ngân sách, trạng thái | `Mo ta nghiep vu/MD_ERP/2_hrm/12_recruitment.md (§1)` |
| Bảng ứng viên | Hồ sơ, kênh nguồn, trạng thái, đánh giá | `Mo ta nghiep vu/MD_ERP/2_hrm/12_recruitment.md (§1)` |
| Danh mục chức danh và phòng ban | Vị trí tuyển, phòng ban yêu cầu | `src/components/EasyHRM.tsx:1524` |

## 10. Màn hình

- Quản trị Nguồn nhân lực (`src/components/HR.tsx:890`).
- Thống kê Tỷ lệ Tuyển dụng và Nghỉ việc (`src/components/HR.tsx:831`).
- Danh mục Chức danh (`src/components/EasyHRM.tsx:1524`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho yêu cầu tuyển dụng trong định biên, Khi trình duyệt, Thì giám đốc nhân sự duyệt được.
- **AC-02.** Cho yêu cầu vượt định biên, Khi trình duyệt, Thì hệ thống chặn hoặc buộc duyệt cấp cao hơn (ca thất bại bắt buộc).
- **AC-03.** Cho ứng viên đồng ý thư mời, Khi xác nhận, Thì hồ sơ chuyển sang phân hệ tiếp nhận.

## 12. Ảnh hưởng tới phần có sẵn

- Cần bổ sung bảng yêu cầu tuyển dụng và bảng ứng viên.
- Dùng lại màn hình nhân sự hiện có để hiển thị thống kê.

## 13. Giả định và câu hỏi mở

- **GD-01.** Quy trình tuyển dụng áp dụng cho nhân sự khối văn phòng, chưa mở cho khối vận hành.
- **Q-01.** Có cần tích hợp đăng tin và thu hồ sơ tự động từ các kênh tuyển dụng không?
- **Q-02.** Ai được xem hồ sơ ứng viên ngoài phòng đang tuyển?

## 14. Ghi chú kỹ thuật

- Nên tách hàm tính định biên và ngân sách thành hàm thuần để kiểm thử.

## Chưa xác minh được

- Chưa xác minh được luồng yêu cầu tuyển dụng có tồn tại trong mã nguồn hay không.
- Chưa xác minh được có tích hợp kênh tuyển dụng nào hay chưa.
- Chưa xác minh được cơ chế xét định biên nhân sự.
