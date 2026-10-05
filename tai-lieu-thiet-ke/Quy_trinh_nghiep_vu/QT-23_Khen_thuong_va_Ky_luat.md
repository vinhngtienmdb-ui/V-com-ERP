# QT-23 — Khen thưởng và Kỷ luật

- Dự án: VComm
- Mã quy trình: QT-23
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Nhân sự
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/2_hrm/22_rewards_discipline.md (§2)`
- Mô-đun hệ thống: MOD-39 Quản trị Nhân sự (`/hr`) và MOD-06 Đề xuất và Trình ký (`/requests`)
- Hiện trạng mã nguồn: Đã có một phần — có luồng đề xuất và trình ký dùng chung

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên | Đề xuất khen thưởng đồng nghiệp, xem kỷ luật của mình | `Mo ta nghiep vu/MD_ERP/2_hrm/22_rewards_discipline.md (§2)` |
| Quản lý | Đề xuất khen thưởng hoặc kỷ luật nhân viên cấp dưới | `Mo ta nghiep vu/MD_ERP/2_hrm/22_rewards_discipline.md (§2)` |
| Nhân sự / Pháp chế | Soạn thảo quyết định, tổ chức họp hội đồng kỷ luật | `Mo ta nghiep vu/MD_ERP/2_hrm/22_rewards_discipline.md (§2)` |
| Ban điều hành | Phê duyệt quyết định chính thức | `Mo ta nghiep vu/MD_ERP/2_hrm/22_rewards_discipline.md (§2)` |

## 2. Điều kiện trước

- Đã có quy chế khen thưởng và nội quy lao động.
- Đã có luồng đề xuất và trình ký hoạt động (xem QT-56).

## 3. Luồng chính

1. Quản lý hoặc đồng nghiệp tạo đề xuất khen thưởng cho cá nhân hoặc tập thể có thành tích.
2. Khi có vi phạm, quản lý lập biên bản sự việc.
3. Với kỷ luật nặng, ghi nhận biên bản họp hội đồng kỷ luật và cho người lao động giải trình.
4. Nhân sự tổng hợp đề xuất trình giám đốc phê duyệt.
5. Hệ thống sinh quyết định bản mềm, ký số và lưu vào hồ sơ nhân sự.
6. Tùy chọn đăng quyết định lên bảng tin nội bộ.
7. Chuyển số tiền thưởng hoặc phạt sang bảng lương kỳ hiện tại.

## 4. Sơ đồ

```
[Đề xuất khen thưởng]        [Biên bản vi phạm]
        |                              |
        |                              v
        |                  [Họp hội đồng kỷ luật + giải trình]
        |                              |
        +--------------+---------------+
                       |
                       v
        [Nhân sự tổng hợp, trình giám đốc]
                       |
                       v
        [Quyết định bản mềm + ký số] --> [Lưu hồ sơ nhân sự]
                       |
                       v
        [Bảng tin nội bộ (tùy chọn)]
                       |
                       v
        [Chuyển tiền thưởng / phạt sang bảng lương]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Kỷ luật nặng thiếu biên bản họp hội đồng | Không ra quyết định; yêu cầu bổ sung hồ sơ | `Mo ta nghiep vu/MD_ERP/2_hrm/22_rewards_discipline.md (§2)` |
| E2 | Người lao động chưa được giải trình | Chặn ban hành quyết định kỷ luật | `Mo ta nghiep vu/MD_ERP/2_hrm/22_rewards_discipline.md (§2)` |
| E3 | Bảng lương kỳ hiện tại đã chốt | Không chuyển được khoản thưởng phạt; phải chuyển sang kỳ sau | `Mo ta nghiep vu/MD_ERP/2_hrm/22_rewards_discipline.md (§2)` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Đề xuất: Nháp --> Chờ duyệt --> Đã duyệt --> Đã ban hành quyết định --> Đã chi trả
Kỷ luật: Ghi nhận --> Họp hội đồng --> Đã ban hành --> Đã thi hành
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Kỷ luật nặng phải qua họp hội đồng và cho người lao động giải trình | `Mo ta nghiep vu/MD_ERP/2_hrm/22_rewards_discipline.md (§2)` |
| BR-02 | Quyết định phải được ký số và lưu vào hồ sơ nhân sự | `Mo ta nghiep vu/MD_ERP/2_hrm/22_rewards_discipline.md (§2)` |
| BR-03 | Tiền thưởng hoặc phạt chuyển sang bảng lương kỳ hiện tại | `Mo ta nghiep vu/MD_ERP/2_hrm/22_rewards_discipline.md (§2)` |

## 8. Thông báo và nhật ký

- Thông báo cho người liên quan khi đề xuất được duyệt hoặc quyết định được ban hành.
- Tùy chọn công bố quyết định trên bảng tin nội bộ.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng đề xuất khen thưởng, kỷ luật | Đối tượng, nội dung, mức thưởng hoặc hình thức kỷ luật | `Mo ta nghiep vu/MD_ERP/2_hrm/22_rewards_discipline.md (§1)` |
| Bảng quyết định | Số quyết định, ngày ban hành, người ký | `Mo ta nghiep vu/MD_ERP/2_hrm/22_rewards_discipline.md (§1)` |
| Bảng lương kỳ | Khoản thưởng hoặc phạt | `src/services/payrollEngine.ts:279` |
| Bảng hồ sơ nhân viên | Lưu vết khen thưởng và kỷ luật | `Mo ta nghiep vu/MD_ERP/2_hrm/22_rewards_discipline.md (§2)` |

## 10. Màn hình

- Quản trị Nguồn nhân lực (`src/components/HR.tsx:890`).
- Phiếu Đề xuất (`src/components/RequestHub.tsx:1292`).
- Cài đặt Cấu trúc Phiếu (`src/components/RequestHub.tsx:905`).
- Bảng Tin và Thông Báo Công Ty (`src/components/Workspace.tsx:259`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho đề xuất khen thưởng đã duyệt, Khi ban hành, Thì hệ thống sinh quyết định và lưu vào hồ sơ nhân sự.
- **AC-02.** Cho quyết định kỷ luật nặng thiếu biên bản hội đồng, Khi ban hành, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-03.** Cho khoản thưởng đã duyệt, Khi chuyển sang bảng lương, Thì số tiền xuất hiện trong kỳ lương hiện tại.

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại luồng đề xuất và trình ký hiện có.
- Cần bổ sung bảng quyết định và liên kết sang bảng lương.

## 13. Giả định và câu hỏi mở

- **GD-01.** Khen thưởng đột xuất chiếm phần lớn; khen thưởng định kỳ theo quý và năm.
- **Q-01.** Hình thức kỷ luật nào được áp dụng và ai có thẩm quyền quyết định từng hình thức?
- **Q-02.** Có cần công bố quyết định lên bảng tin nội bộ theo mặc định không?

## 14. Ghi chú kỹ thuật

- Có thể tái sử dụng mẫu phiếu của luồng đề xuất để dựng phiếu khen thưởng và kỷ luật.

## Chưa xác minh được

- Chưa xác minh được bảng quyết định khen thưởng, kỷ luật có tồn tại hay không.
- Chưa xác minh được mức độ liên kết giữa quyết định và bảng lương.
- Chưa xác minh được mẫu quyết định đang dùng.
