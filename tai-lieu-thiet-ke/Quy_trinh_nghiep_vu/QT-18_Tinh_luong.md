# QT-18 — Tính lương và Chi trả

- Dự án: VComm
- Mã quy trình: QT-18
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Nhân sự
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/2_hrm/17_payroll.md (§2)`
- Mô-đun hệ thống: MOD-39 Quản trị Nhân sự (`/hr`) và MOD-40 Hồ sơ Nhân sự (`/easyhrm`)
- Hiện trạng mã nguồn: Đã có một phần — có động cơ tính lương, cầu nối lương nhân sự và bảng kê khai thuế

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Chuyên viên tiền lương và chế độ | Thực hiện tính lương, cấu hình công thức | `Mo ta nghiep vu/MD_ERP/2_hrm/17_payroll.md (§2)` |
| Ban điều hành / Giám đốc tài chính | Phê duyệt bảng lương | `Mo ta nghiep vu/MD_ERP/2_hrm/17_payroll.md (§2)` |
| Nhân viên | Xem phiếu lương của mình và gửi thắc mắc | `Mo ta nghiep vu/MD_ERP/2_hrm/17_payroll.md (§2)` |
| Hệ thống | Tính lương gộp, các khoản giảm trừ và lương thực nhận | `src/services/payrollEngine.ts:279` |

## 2. Điều kiện trước

- Bảng công kỳ đã được khóa (xem QT-17).
- Đã cấu hình mức lương tối thiểu vùng và chính sách bảo hiểm, thuế (`src/services/payrollEngine.ts:101`, `:107`).
- Đã có hợp đồng lao động còn hiệu lực cho từng nhân viên.

## 3. Luồng chính

1. Cuối kỳ hoặc đầu năm, nhân sự cấu hình công thức tính lương và các loại phụ cấp.
2. Hệ thống tổng hợp dữ liệu đầu vào: công từ phân hệ chấm công, doanh số nếu có, phụ cấp biến đổi.
3. Hệ thống xác định lương gộp cho từng nhân viên (`src/services/hrPayrollBridge.ts:157`).
4. Hệ thống tính các khoản giảm trừ bảo hiểm và thuế thu nhập cá nhân (`payrollEngine.ts:180` — `computePit`).
5. Hệ thống tính lương thực nhận cho toàn bộ nhân viên (`payrollEngine.ts:279` — `computeSalary`).
6. Chuyên viên tiền lương rà soát bảng lương và trình kế toán trưởng, giám đốc phê duyệt.
7. Sau khi duyệt, hệ thống gửi phiếu lương cho nhân viên qua thư điện tử hoặc ứng dụng.
8. Kết xuất tệp ủy nhiệm chi để ngân hàng thanh toán và ghi sổ qua cổng ghi sổ chung.

## 4. Sơ đồ

```
[Bảng công đã khóa]  [Doanh số / KPI]  [Phụ cấp biến đổi]
            |                   |                 |
            +-------------------+-----------------+
                                |
                                v
              [resolveEmployeeGross hrPayrollBridge:157]
                                |
                                v
        [computePit :180]  và  [Bảo hiểm :139]
                                |
                                v
              [computeSalary :279] --> [Bảng lương]
                                |
                                v
        [Duyệt] --> [Gửi phiếu lương] --> [Ủy nhiệm chi] --> [Ghi sổ]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Nhân viên không có hợp đồng còn hiệu lực | Không xác định được lương gộp; loại khỏi bảng lương hoặc báo lỗi | `src/services/hrPayrollBridge.ts:107` |
| E2 | Chưa chốt công mà đã chạy lương | Kết quả sai; phải chốt công trước | `Mo ta nghiep vu/MD_ERP/2_hrm/17_payroll.md (§2)` |
| E3 | Bảng lương chưa duyệt mà đã chi | Chặn kết xuất ủy nhiệm chi | `Mo ta nghiep vu/MD_ERP/2_hrm/17_payroll.md (§2)` |
| E4 | Bút toán lương lệch Nợ/Có | Từ chối ghi sổ | `src/services/dbService.ts:1888` |

## 6. Máy trạng thái

```
Kỳ lương: Chưa chạy --> Đã tính --> Chờ duyệt --> Đã duyệt --> Đã chi trả --> Đã ghi sổ
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Chính sách thuế và bảo hiểm áp dụng theo ngày hiệu lực, không gắn cứng | `src/services/payrollEngine.ts:134`, `:139` |
| BR-02 | Mức lương tối thiểu vùng lấy theo cấu hình | `src/services/payrollEngine.ts:107` |
| BR-03 | Phương pháp tính thuế chọn theo hồ sơ nhân viên | `src/services/hrPayrollBridge.ts:124` |
| BR-04 | Chỉ chi trả sau khi bảng lương được duyệt | `Mo ta nghiep vu/MD_ERP/2_hrm/17_payroll.md (§2)` |

## 8. Thông báo và nhật ký

- Gửi phiếu lương cho nhân viên sau khi bảng lương được duyệt.
- Có tệp kiểm thử cho động cơ tính lương và cầu nối lương.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng lương kỳ | Lương gộp, bảo hiểm, thuế, lương thực nhận | `src/services/payrollEngine.ts:279` |
| Bảng chấm công đã khóa | Công thực tế làm đầu vào | `Mo ta nghiep vu/MD_ERP/2_hrm/17_payroll.md (§2)` |
| Bảng hợp đồng lao động | Ngày bắt đầu, mức lương hợp đồng | `src/services/hrPayrollBridge.ts:107` |
| Bảng người phụ thuộc | Số người phụ thuộc để giảm trừ gia cảnh | `Mo ta nghiep vu/MD_ERP/2_hrm/17_payroll.md (§2)` |

## 10. Màn hình

- Quản trị Nguồn nhân lực (`src/components/HR.tsx:890`).
- Động cơ lương động (`src/components/HR.tsx:1071` — Dynamic Salary Engine).
- Chức Năng Thông Tin Nhân Sự Toàn Diện (`src/components/EasyHRM.tsx:624`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho nhân viên có hợp đồng và bảng công đã khóa, Khi chạy lương, Thì hệ thống tính đúng lương gộp, bảo hiểm, thuế và lương thực nhận.
- **AC-02.** Cho nhân viên không có hợp đồng còn hiệu lực, Khi chạy lương, Thì hệ thống loại khỏi bảng lương và báo lỗi (ca thất bại bắt buộc).
- **AC-03.** Cho bảng lương chưa duyệt, Khi kết xuất ủy nhiệm chi, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-04.** Cho chính sách thuế thay đổi theo ngày hiệu lực, Khi tính lương kỳ trước ngày hiệu lực, Thì áp dụng chính sách cũ.

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại `payrollEngine.ts`, `hrPayrollBridge.ts`, `payrollDeclaration.ts` đã có.
- Cần bổ sung màn hình bảng lương và luồng duyệt nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Kỳ lương là theo tháng cho toàn bộ nhân sự.
- **Q-01.** Có cần tính lương theo sản phẩm hoặc theo doanh số không?
- **Q-02.** Kênh gửi phiếu lương cho nhân viên là thư điện tử hay ứng dụng?

## 14. Ghi chú kỹ thuật

- Chính sách thuế và bảo hiểm được tra theo ngày hiệu lực (`src/services/payrollEngine.ts:134`, `:139`), thuận lợi khi luật thay đổi.
- Có tệp kiểm thử `src/services/payrollEngine.test.ts` và `src/services/payrollDeclaration.test.ts`.

## Chưa xác minh được

- Chưa xác minh được màn hình bảng lương và luồng duyệt chi trả có tồn tại hay không.
- Chưa xác minh được có tính lương theo sản phẩm hay doanh số hay không.
- Chưa xác minh được kênh gửi phiếu lương.
