# QT-20 — Thuế thu nhập cá nhân

- Dự án: VComm
- Mã quy trình: QT-20
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Nhân sự
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/2_hrm/19_pit.md (§2)`
- Mô-đun hệ thống: MOD-39 Quản trị Nhân sự (`/hr`)
- Hiện trạng mã nguồn: Đã có một phần — có chính sách thuế, tính thuế, và bảng kê khai theo kỳ

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Chuyên viên tiền lương / Kế toán thuế | Quản lý mức giảm trừ, tính toán, kết xuất tờ khai quyết toán | `Mo ta nghiep vu/MD_ERP/2_hrm/19_pit.md (§2)` |
| Nhân viên | Nộp chứng từ người phụ thuộc, ủy quyền quyết toán thuế | `Mo ta nghiep vu/MD_ERP/2_hrm/19_pit.md (§2)` |
| Hệ thống | Xác định kỳ kê khai theo tháng hoặc theo quý và tính thuế lũy tiến | `src/services/payrollDeclaration.ts:62` |

## 2. Điều kiện trước

- Nhân viên đã có mã số thuế cá nhân và hồ sơ người phụ thuộc đã được duyệt.
- Đã cấu hình biểu thuế lũy tiến và mức giảm trừ gia cảnh theo ngày hiệu lực (`src/services/payrollEngine.ts:75`).

## 3. Luồng chính

1. Cập nhật mã số thuế cá nhân cho nhân viên mới.
2. Nhân viên nộp hồ sơ chứng minh người phụ thuộc; nhân sự duyệt và nhập thời gian giảm trừ.
3. Trong quá trình tính lương, hệ thống xác định phương pháp tính thuế theo hồ sơ nhân viên (`hrPayrollBridge.ts:124`).
4. Hệ thống tính thuế phải nộp theo biểu lũy tiến hoặc khấu trừ theo tỷ lệ cố định (`payrollEngine.ts:180` — `computePit`).
5. Hệ thống xác định kỳ kê khai theo tần suất tháng hoặc quý (`payrollDeclaration.ts:62`).
6. Kết xuất tờ khai thuế để nộp cho cơ quan thuế.
7. Cuối năm, gom toàn bộ thu nhập của nhân viên và tính lại tổng thuế phải nộp trong năm.
8. Bù trừ với số đã tạm khấu trừ để xác định số nộp thêm hoặc số được hoàn.

## 4. Sơ đồ

```
[Hồ sơ nhân viên + người phụ thuộc]
                |
                v
     [pickPitMethodFromEmployee :124]
                |
                v
     [pitPolicyAt :134] --> [computePit :180]
                |
                v
     [Khấu trừ thuế trong kỳ lương]
                |
                v
   [getDeclarationFrequencyForDate :62] --> [Kỳ kê khai tháng / quý]
                |
                v
        [Kết xuất tờ khai thuế]
                |
                v
     [Quyết toán cuối năm: nộp thêm hoặc hoàn]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Nhân viên chưa có mã số thuế | Không kê khai được; đưa vào danh sách cần bổ sung | `Mo ta nghiep vu/MD_ERP/2_hrm/19_pit.md (§2)` |
| E2 | Hồ sơ người phụ thuộc chưa duyệt | Không áp dụng giảm trừ gia cảnh | `Mo ta nghiep vu/MD_ERP/2_hrm/19_pit.md (§2)` |
| E3 | Kê khai sai kỳ | Hệ thống xác định kỳ theo tần suất cấu hình; sai thì phải kê khai bổ sung | `src/services/payrollDeclaration.ts:62` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Kỳ kê khai: Chưa lập --> Đã lập --> Đã nộp
Quyết toán năm: Chưa tổng hợp --> Đã tổng hợp --> Đã nộp --> Đã hoàn tất
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Biểu thuế lũy tiến và mức giảm trừ áp dụng theo ngày hiệu lực | `src/services/payrollEngine.ts:75`, `:134` |
| BR-02 | Phương pháp tính thuế chọn theo hồ sơ nhân viên | `src/services/hrPayrollBridge.ts:124` |
| BR-03 | Tần suất kê khai xác định theo ngày, không gắn cứng theo tháng | `src/services/payrollDeclaration.ts:62` |
| BR-04 | Quyết toán năm phải bù trừ với số đã tạm khấu trừ trong năm | `Mo ta nghiep vu/MD_ERP/2_hrm/19_pit.md (§2)` |

## 8. Thông báo và nhật ký

- Thông báo cho nhân viên khi cần bổ sung chứng từ người phụ thuộc.
- Có tệp kiểm thử cho bảng kê khai thuế (`src/services/payrollDeclaration.test.ts`).

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng nhân viên | Mã số thuế, phương pháp tính thuế | `src/services/hrPayrollBridge.ts:124` |
| Bảng người phụ thuộc | Thời gian giảm trừ, mối quan hệ | `Mo ta nghiep vu/MD_ERP/2_hrm/19_pit.md (§2)` |
| Chính sách thuế | Biểu thuế, mức giảm trừ, ngày hiệu lực | `src/services/payrollEngine.ts:75` |
| Bảng kê khai thuế | Kỳ, chỉ tiêu, số thuế phải nộp | `src/services/payrollDeclaration.ts:76` |

## 10. Màn hình

- Quản trị Nguồn nhân lực (`src/components/HR.tsx:890`).
- Chức Năng Thông Tin Nhân Sự Toàn Diện (`src/components/EasyHRM.tsx:624`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho nhân viên có thu nhập chịu thuế, Khi tính lương, Thì thuế tính theo biểu lũy tiến đúng kỳ.
- **AC-02.** Cho người phụ thuộc chưa duyệt, Khi tính thuế, Thì không áp dụng giảm trừ gia cảnh (ca thất bại bắt buộc).
- **AC-03.** Cho ngày nằm trong kỳ quy định kê khai theo quý, Khi xác định tần suất, Thì hệ thống trả về theo quý.
- **AC-04.** Cho quyết toán năm, Khi bù trừ, Thì số thuế nộp thêm hoặc hoàn lại khớp với số đã tạm khấu trừ.

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại `payrollEngine.ts`, `payrollDeclaration.ts`, `hrPayrollBridge.ts` đã có.
- Cần bổ sung biểu mẫu tờ khai và màn hình quyết toán nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Nhân viên ủy quyền cho đơn vị quyết toán thuế thay.
- **Q-01.** Có cần hỗ trợ nhân viên tự quyết toán trên ứng dụng không?
- **Q-02.** Tần suất kê khai của đơn vị là theo tháng hay theo quý?

## 14. Ghi chú kỹ thuật

- Tần suất kê khai được suy ra từ ngày (`src/services/payrollDeclaration.ts:62`), nên luật thay đổi chỉ cần sửa cấu hình.

## Chưa xác minh được

- Chưa xác minh được biểu mẫu tờ khai đã được cài đặt hay chưa.
- Chưa xác minh được màn hình quyết toán thuế có tồn tại hay không.
- Chưa xác minh được tần suất kê khai hiện hành của đơn vị.
