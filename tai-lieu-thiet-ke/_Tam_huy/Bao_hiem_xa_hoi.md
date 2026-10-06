# QT-19 — Bảo hiểm xã hội

- Dự án: VComm
- Mã quy trình: QT-19
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Nhân sự
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/2_hrm/18_social_insurance.md (§2)`
- Mô-đun hệ thống: MOD-39 Quản trị Nhân sự (`/hr`)
- Hiện trạng mã nguồn: Đã có một phần — chính sách bảo hiểm đã được đưa vào động cơ tính lương

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Chuyên viên tiền lương và chế độ | Báo tăng giảm, tính toán, làm hồ sơ chế độ | `Mo ta nghiep vu/MD_ERP/2_hrm/18_social_insurance.md (§2)` |
| Nhân viên | Gửi giấy tờ hưởng chế độ, xem thông tin đóng bảo hiểm của mình | `Mo ta nghiep vu/MD_ERP/2_hrm/18_social_insurance.md (§2)` |
| Hệ thống | Áp dụng tỷ lệ đóng và mức lương trần sàn theo ngày hiệu lực | `src/services/payrollEngine.ts:101`, `:139` |

## 2. Điều kiện trước

- Đã cập nhật tỷ lệ đóng và mức lương trần, sàn theo quy định hiện hành.
- Nhân viên đã có hợp đồng lao động và mức lương làm căn cứ đóng.

## 3. Luồng chính

1. Nhân sự cập nhật tỷ lệ đóng và mức lương trần, sàn theo quy định mới nhất.
2. Hàng tháng, rà soát danh sách nhân sự mới, nhân sự nghỉ việc và nhân sự thay đổi lương để chốt danh sách biến động.
3. Hệ thống truyền mức đóng bảo hiểm của từng nhân viên sang phân hệ lương để khấu trừ vào lương gộp.
4. Hệ thống tính số tiền đơn vị phải nộp.
5. Khi nhân viên hưởng chế độ, nhận giấy tờ và làm hồ sơ điện tử gửi cơ quan bảo hiểm xã hội.
6. Cơ quan bảo hiểm duyệt chi, đơn vị trả tiền cho nhân viên.
7. Lập báo cáo đối chiếu kết quả đóng bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp.

## 4. Sơ đồ

```
[Cập nhật tỷ lệ và mức trần sàn]
        |
        v
[Chốt danh sách biến động tăng / giảm / điều chỉnh]
        |
        v
[insurancePolicyAt :139] --> [Khấu trừ vào lương gộp]
        |
        v
[Tính số tiền đơn vị phải nộp]
        |
        +-------------------+-------------------+
        |                                       |
        v                                       v
[Giải quyết chế độ: hồ sơ điện tử]      [Báo cáo đối chiếu đóng bảo hiểm]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Mức lương đóng thấp hơn sàn hoặc cao hơn trần | Hệ thống kẹp về mức sàn hoặc trần theo chính sách | `src/services/payrollEngine.ts:101` |
| E2 | Chậm báo tăng giảm nhân sự | Phát sinh truy thu hoặc nộp thừa | `Mo ta nghiep vu/MD_ERP/2_hrm/18_social_insurance.md (§2)` |
| E3 | Hồ sơ chế độ thiếu giấy tờ | Trả lại yêu cầu bổ sung | `Mo ta nghiep vu/MD_ERP/2_hrm/18_social_insurance.md (§2)` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Nhân sự tham gia: Chưa đóng --> Đang đóng --> Tạm dừng --> Đã giảm
Hồ sơ chế độ: Tiếp nhận --> Đã gửi cơ quan --> Đã duyệt chi --> Đã trả nhân viên
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Tỷ lệ đóng và mức trần sàn áp dụng theo ngày hiệu lực | `src/services/payrollEngine.ts:101`, `:139` |
| BR-02 | Mức đóng khấu trừ vào lương gộp trước khi tính thuế thu nhập cá nhân | `Mo ta nghiep vu/MD_ERP/2_hrm/18_social_insurance.md (§2)` |
| BR-03 | Báo cáo đối chiếu lập theo mẫu quy định của cơ quan bảo hiểm | `Mo ta nghiep vu/MD_ERP/2_hrm/18_social_insurance.md (§2)` |

## 8. Thông báo và nhật ký

- Thông báo nhắc nhân sự chốt danh sách biến động hàng tháng.
- Chưa có thông báo cho nhân viên khi hồ sơ chế độ được duyệt chi.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng nhân viên | Mức lương đóng, số sổ bảo hiểm, trạng thái tham gia | `Mo ta nghiep vu/MD_ERP/2_hrm/18_social_insurance.md (§1)` |
| Chính sách bảo hiểm | Tỷ lệ đóng, mức sàn, mức trần, ngày hiệu lực | `src/services/payrollEngine.ts:101` |
| Bảng hồ sơ chế độ | Loại chế độ, giấy tờ, trạng thái | `Mo ta nghiep vu/MD_ERP/2_hrm/18_social_insurance.md (§2)` |

## 10. Màn hình

- Quản trị Nguồn nhân lực (`src/components/HR.tsx:890`).
- Chức Năng Thông Tin Nhân Sự Toàn Diện (`src/components/EasyHRM.tsx:624`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho nhân viên có mức lương thấp hơn mức sàn, Khi tính đóng bảo hiểm, Thì hệ thống áp dụng mức sàn (ca bắt buộc).
- **AC-02.** Cho chính sách thay đổi theo ngày hiệu lực, Khi tính kỳ trước ngày hiệu lực, Thì áp dụng chính sách cũ.
- **AC-03.** Cho nhân sự nghỉ việc trong tháng, Khi chốt biến động, Thì nhân sự đó nằm trong danh sách giảm.

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại chính sách bảo hiểm đã có trong động cơ tính lương.
- Cần bổ sung bảng hồ sơ chế độ và báo cáo đối chiếu theo mẫu quy định.

## 13. Giả định và câu hỏi mở

- **GD-01.** Đơn vị đóng bảo hiểm cho toàn bộ nhân viên có hợp đồng từ một tháng trở lên.
- **Q-01.** Có cần hỗ trợ nhiều mức đóng theo từng loại hợp đồng không?
- **Q-02.** Mẫu báo cáo đối chiếu nào được áp dụng?

## 14. Ghi chú kỹ thuật

- Chính sách bảo hiểm tra theo ngày hiệu lực, cùng cơ chế với chính sách thuế (`src/services/payrollEngine.ts:139`).

## Chưa xác minh được

- Chưa xác minh được bảng hồ sơ chế độ có tồn tại hay không.
- Chưa xác minh được mẫu báo cáo đối chiếu đang dùng.
- Chưa xác minh được tỷ lệ đóng hiện đang cấu hình.
