# QT-12 — Tổng hợp, Kết chuyển và Khóa sổ kế toán

- Dự án: VComm
- Mã quy trình: QT-12
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Kế toán
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/1_accounting/11_general_ledger.md (§2.1, §2.2)`
- Mô-đun hệ thống: MOD-30 Kế toán TT99 (`/ke-toan-tt99`) và MOD-29 Tài chính - Kế toán (`/finance`)
- Hiện trạng mã nguồn: Đã có một phần — có sổ cái, khóa sổ, kết chuyển và báo cáo tài chính

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Kế toán tổng hợp | Làm bút toán điều chỉnh, kết chuyển cuối kỳ, lập báo cáo tài chính | `Mo ta nghiep vu/MD_ERP/1_accounting/11_general_ledger.md (§2.2)` |
| Kế toán trưởng / Giám đốc tài chính | Khóa sổ, duyệt báo cáo tài chính | `Mo ta nghiep vu/MD_ERP/1_accounting/11_general_ledger.md (§2.2)` |
| Hệ thống | Kết chuyển tự động tài khoản loại 5, 6, 7, 8 sang 911 rồi sang 421 | `Mo ta nghiep vu/MD_ERP/1_accounting/11_general_ledger.md (§2.1)` |

## 2. Điều kiện trước

- Các job khấu hao tài sản, phân bổ công cụ dụng cụ, tính giá xuất kho và tính giá thành đã chạy xong.
- Không còn chứng từ chưa ghi sổ trong kỳ.
- Kế toán trưởng có thẩm quyền khóa sổ.

## 3. Luồng chính

1. Rà soát chứng từ chưa ghi sổ ở tất cả phân hệ và kiểm tra lệch Nợ/Có.
2. Bảo đảm các job khấu hao, phân bổ, tính giá xuất kho và tính giá thành đã chạy xong.
3. Đánh giá chênh lệch tỷ giá cuối kỳ cho các tài khoản có gốc ngoại tệ và sinh chứng từ chênh lệch.
4. Kết chuyển tài khoản loại 5 và loại 7 sang 911.
5. Kết chuyển tài khoản loại 6 và loại 8 sang 911.
6. Kết chuyển chênh lệch 911 sang 421 để xác định lợi nhuận chưa phân phối.
7. Khóa sổ kỳ: chặn thêm, sửa, xóa chứng từ có ngày hạch toán nhỏ hơn hoặc bằng ngày khóa sổ.
8. Lập báo cáo tài chính: bảng cân đối kế toán, kết quả kinh doanh, lưu chuyển tiền tệ, thuyết minh.
9. Ghi dấu vân tay của kỳ đã khóa để phát hiện sửa đổi về sau.

## 4. Sơ đồ

```
[Rà soát chứng từ + kiểm lệch Nợ/Có]
                    |
                    v
   [Chạy đủ: khấu hao, phân bổ, giá xuất kho, giá thành]
                    |
                    v
        [Đánh giá chênh lệch tỷ giá cuối kỳ]
                    |
                    v
   Kết chuyển loại 5, 7 --> 911 <-- Kết chuyển loại 6, 8
                    |
                    v
              [911 --> 421]
                    |
                    v
        [Khóa sổ: closingLockDate dbService:1899]
                    |
                    v
   [BCTC: Cân đối kế toán, KQKD, Lưu chuyển tiền tệ]
                    |
                    v
        [Ghi vân tay kỳ khóa: hashLedgerClosing :60]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Còn chứng từ chưa ghi sổ trong kỳ | Cảnh báo, không cho khóa sổ | `Mo ta nghiep vu/MD_ERP/1_accounting/11_general_ledger.md (§2.1)` |
| E2 | Chưa chạy đủ job cuối kỳ | Cảnh báo, không cho khóa sổ | `Mo ta nghiep vu/MD_ERP/1_accounting/11_general_ledger.md (§2.1)` |
| E3 | Bút toán kết chuyển lệch Nợ/Có | Từ chối ghi sổ | `src/services/dbService.ts:1888` |
| E4 | Ghi chứng từ vào ngày đã khóa sổ | Từ chối ghi sổ | `src/services/dbService.ts:1907` |
| E5 | Dữ liệu kỳ đã khóa bị sửa đổi | Vân tay kỳ khóa không khớp, phát hiện sai lệch | `src/services/ledgerClosing.ts:60` |

## 6. Máy trạng thái

```
Kỳ kế toán: Đang mở --> Chờ chốt --> Đã khóa sổ
Đã khóa sổ --phát hiện sai sót--> Mở lại kỳ (có kiểm soát) --> Đã khóa sổ (vân tay mới)
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Kết chuyển doanh thu và thu nhập (loại 5, 7) cùng chi phí (loại 6, 8) sang tài khoản 911 | `Mo ta nghiep vu/MD_ERP/1_accounting/11_general_ledger.md (§2.1)` |
| BR-02 | Chênh lệch 911 kết chuyển sang 421 | `Mo ta nghiep vu/MD_ERP/1_accounting/11_general_ledger.md (§2.1)` |
| BR-03 | Không ghi sổ chứng từ có ngày hạch toán nhỏ hơn hoặc bằng ngày khóa sổ | `src/services/dbService.ts:1907` |
| BR-04 | Kỳ đã khóa được ghi vân tay để phát hiện sửa đổi về sau | `src/services/ledgerClosing.ts:31`, `:60` |
| BR-05 | Sai sót trong kỳ đã khóa xử lý bằng bút toán đảo, không xóa dữ liệu lịch sử | `tai-lieu-thiet-ke/LEGAL_REFERENCE.md` |

## 8. Thông báo và nhật ký

- Lịch chạy cuối tháng tự động gọi các job khấu hao (`src/services/monthEndScheduler.ts:117`).
- Chưa có thông báo tự động cho kế toán trưởng khi kỳ sẵn sàng khóa.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| `journal_entries` / `journal_items` | Bút toán kết chuyển và điều chỉnh | `src/services/dbService.ts:1913` |
| `tenant_settings` | `data.closingLockDate` | `src/services/dbService.ts:1899` |
| Bảng vân tay kỳ khóa | Mã băm của kỳ đã khóa | `src/services/ledgerClosing.ts:60` |
| Bảng tài khoản | Danh mục tài khoản 911, 421, 413 | `src/services/tt99Service.ts:156` |

## 10. Màn hình

- Kế toán TT99 (`src/components/TT99Accounting.tsx`, tuyến `/ke-toan-tt99`).
- Sổ cái chi tiết Tài khoản (`src/components/Finance.tsx:845`).
- Báo cáo Kết quả Hoạt động Kinh doanh (`src/components/Finance.tsx:1415`).
- Bảng Cân đối Phát sinh Tài khoản (`src/components/Finance.tsx:1493`).
- Bảng Cân đối Kế toán (`src/components/Finance.tsx:1558`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho kỳ có doanh thu và chi phí, Khi kết chuyển, Thì tài khoản 911 về không và 421 nhận đúng lợi nhuận.
- **AC-02.** Cho kỳ đã khóa ngày 30/09, Khi ghi chứng từ ngày 20/09, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-03.** Cho dữ liệu kỳ đã khóa bị sửa trực tiếp trong cơ sở dữ liệu, Khi kiểm tra vân tay, Thì phát hiện không khớp.
- **AC-04.** Cho kỳ còn chứng từ chưa ghi sổ, Khi khóa sổ, Thì hệ thống cảnh báo và không cho khóa (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại `tt99Service.ts`, `ledgerClosing.ts`, `monthEndScheduler.ts`, `Finance.tsx` đã có.
- Cần bổ sung màn hình kết chuyển và khóa sổ tập trung nếu muốn đủ luồng theo đặc tả.

## 13. Giả định và câu hỏi mở

- **GD-01.** Hệ thống áp dụng chế độ kế toán Thông tư 99/2025 cho mọi tenant.
- **Q-01.** Khi phát hiện sai sót ở kỳ đã khóa, ai có thẩm quyền mở lại kỳ?
- **Q-02.** Có cần lập báo cáo tài chính theo chuẩn quốc tế song song không?

## 14. Ghi chú kỹ thuật

- Vân tay kỳ khóa dùng mã băm SHA-256 (`src/services/ledgerClosing.ts:60`), bảo đảm phát hiện sửa đổi.
- Cổng khóa sổ nằm ở tầng lưu trữ (`src/services/dbService.ts:1899`) nên mọi phân hệ đều bị chặn như nhau.

## Chưa xác minh được

- Chưa xác minh được màn hình kết chuyển và khóa sổ tập trung có tồn tại hay không.
- Chưa xác minh được quy trình mở lại kỳ đã khóa và thẩm quyền tương ứng.
- Chưa xác minh được phạm vi báo cáo tài chính đã cài đặt đầy đủ bốn biểu mẫu hay chưa.
