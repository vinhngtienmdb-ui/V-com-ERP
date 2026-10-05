# QT-10 — Kê khai và Khấu trừ Thuế giá trị gia tăng

- Dự án: VComm
- Mã quy trình: QT-10
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Kế toán
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/1_accounting/09_taxes.md (§2.1, §2.2)`
- Mô-đun hệ thống: MOD-29 Tài chính - Kế toán (`/finance`) và MOD-30 Kế toán TT99 (`/ke-toan-tt99`)
- Hiện trạng mã nguồn: Đã có một phần — có dịch vụ thuế, lịch nộp tờ khai, và báo cáo định kỳ

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Kế toán thuế | Lập báo cáo thuế, bảng kê mua vào bán ra | `Mo ta nghiep vu/MD_ERP/1_accounting/09_taxes.md (§2.2)` |
| Kế toán trưởng | Kiểm tra và ký nộp | `Mo ta nghiep vu/MD_ERP/1_accounting/09_taxes.md (§2.2)` |
| Lịch chạy tự động | Xác định kỳ đến hạn nộp và tạo lô tờ khai | `src/services/taxFilingService.ts:112` |

## 2. Điều kiện trước

- Tài khoản 1331 (thuế đầu vào), 1332, 33311 (thuế đầu ra) đã có trong sổ kế toán.
- Chứng từ mua vào và bán ra trong kỳ đã ghi sổ đầy đủ.
- Đã cấu hình chính sách thuế theo tenant (`src/services/taxService.ts:92`).

## 3. Luồng chính

1. Cuối tháng hoặc cuối quý, kế toán thuế chọn kỳ kê khai.
2. Hệ thống rà soát toàn bộ chứng từ mua vào, bán ra và chứng từ khác có hạch toán thuế giá trị gia tăng trong kỳ.
3. Hệ thống điền số liệu lên biểu mẫu tờ khai theo mẫu chuẩn.
4. Kế toán rà soát bảng kê mua vào và bán ra, loại bỏ hóa đơn không hợp lệ.
5. Hệ thống xác định hạn nộp và xếp kỳ vào lô tờ khai đến hạn (`taxFilingService.ts:112`).
6. Lưu và ghi sổ khấu trừ thuế: kết chuyển số dư tài khoản 133 và 3331.
7. Kết xuất tệp dữ liệu đúng chuẩn để nộp qua cổng thuế điện tử.
8. Với sàn thương mại điện tử, gửi báo cáo định kỳ cho cơ quan quản lý (`cqReportingService.ts:64`).

## 4. Sơ đồ

```
[Chứng từ mua vào]  [Chứng từ bán ra]
        |                    |
        +---------+----------+
                  |
                  v
     [Rà soát thuế GTGT trong kỳ]
                  |
                  v
        [Điền biểu mẫu tờ khai]
                  |
                  v
   [computeFilingDeadline :34] --> [buildFilingBatch :112]
                  |
                  v
        [Ghi sổ khấu trừ 133 / 3331]
                  |
        +---------+---------+
        |                   |
        v                   v
[Kết xuất tệp nộp thuế]  [Báo cáo định kỳ sàn :64]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Hóa đơn đầu vào không hợp lệ | Loại khỏi bảng kê; không tính vào thuế được khấu trừ | `Mo ta nghiep vu/MD_ERP/1_accounting/09_taxes.md (§2.1)` |
| E2 | Chậm hạn nộp tờ khai | Hệ thống tính hạn nộp và cảnh báo; có cơ chế gia hạn khi có sự cố | `src/services/taxFilingService.ts:34`, `:66` |
| E3 | Bút toán khấu trừ lệch Nợ/Có | Từ chối ghi sổ | `src/services/dbService.ts:1888` |
| E4 | Kỳ kế toán đã khóa | Từ chối ghi sổ | `src/services/dbService.ts:1907` |

## 6. Máy trạng thái

```
Tờ khai: Chưa lập --> Đang lập --> Đã lưu --> Đã nộp
Kỳ thuế: Chưa đến hạn --> Đến hạn nộp --> Đã nộp --> Đã đối chiếu
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Thuế suất lấy từ cấu hình chính sách thuế theo tenant, không gắn cứng | `src/services/taxService.ts:142` |
| BR-02 | Hạn nộp tờ khai tính theo lịch làm việc, có xét ngày nghỉ | `src/services/taxFilingService.ts:34`, `:81` |
| BR-03 | Có cơ chế gia hạn khi xảy ra sự cố theo quy định | `src/services/taxFilingService.ts:66` |
| BR-04 | Mọi căn cứ pháp lý của việc nộp tờ khai được khai báo tập trung | `src/services/taxFilingService.ts:154` |

## 8. Thông báo và nhật ký

- Lịch chạy tự động xác định kỳ đến hạn nộp (`src/services/taxFilingService.ts:142`).
- Báo cáo định kỳ cho cơ quan quản lý sàn thương mại điện tử có hàm riêng (`src/services/cqReportingService.ts:64`).

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng chứng từ mua vào, bán ra | Tiền hàng, tiền thuế, thuế suất | `Mo ta nghiep vu/MD_ERP/1_accounting/09_taxes.md (§1)` |
| Bảng kê khai thuế | Kỳ, chỉ tiêu, số tiền | `src/services/taxFilingService.ts:112` |
| Cấu hình chính sách thuế | Thuế suất, quy tắc áp dụng | `src/services/taxService.ts:92` |
| `journal_entries` / `journal_items` | Bút toán khấu trừ thuế | `src/services/dbService.ts:1913` |

## 10. Màn hình

- Kế toán TT99 (`src/components/TT99Accounting.tsx`, tuyến `/ke-toan-tt99`).
- Sổ cái chi tiết Tài khoản 133, 3331 (`src/components/Finance.tsx:845`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho kỳ có chứng từ mua vào và bán ra, Khi lập tờ khai, Thì số liệu khớp với tổng phát sinh trên sổ.
- **AC-02.** Cho hóa đơn đầu vào bị đánh dấu không hợp lệ, Khi lập tờ khai, Thì hóa đơn đó không vào bảng kê (ca bắt buộc).
- **AC-03.** Cho ngày nộp rơi vào ngày nghỉ, Khi tính hạn nộp, Thì hạn được dời sang ngày làm việc kế tiếp.
- **AC-04.** Cho kỳ đã khóa, Khi ghi bút toán khấu trừ, Thì hệ thống từ chối (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại `taxService.ts`, `taxFilingService.ts`, `cqReportingService.ts` đã có.
- Cần bổ sung biểu mẫu tờ khai và kết xuất tệp nộp thuế nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Kỳ kê khai của doanh nghiệp là theo tháng; hộ kinh doanh theo quý.
- **Q-01.** Có cần tích hợp nộp thuế điện tử trực tiếp qua tổ chức cung cấp dịch vụ không?
- **Q-02.** Có cần hỗ trợ đồng thời nhiều mẫu tờ khai cho nhiều loại hình kinh doanh không?

## 14. Ghi chú kỹ thuật

- Căn cứ pháp lý được gom vào một hằng số duy nhất (`src/services/taxFilingService.ts:154`), thuận lợi khi luật thay đổi.
- Có tệp kiểm thử `src/services/taxFilingService.test.ts`.

## Chưa xác minh được

- Chưa xác minh được biểu mẫu tờ khai cụ thể nào đã được cài đặt.
- Chưa xác minh được kết nối cổng thuế điện tử có hoạt động thật hay chỉ mô phỏng.
- Chưa xác minh được có hỗ trợ kê khai theo quý cho hộ kinh doanh hay không.
