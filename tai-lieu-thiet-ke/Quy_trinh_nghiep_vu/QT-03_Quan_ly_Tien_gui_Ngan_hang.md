# QT-03 — Quản lý Tiền gửi Ngân hàng và Đối chiếu sao kê

- Dự án: VComm
- Mã quy trình: QT-03
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Kế toán
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/1_accounting/02_bank.md (§2.1, §2.2)`
- Mô-đun hệ thống: MOD-29 Tài chính - Kế toán (`/finance`)
- Hiện trạng mã nguồn: Đã có một phần — có dịch vụ đối chiếu sao kê `bankReconciliationService.ts`; chưa có màn hình ủy nhiệm chi riêng

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Kế toán ngân hàng | Lập, sửa chứng từ báo Có / báo Nợ; thực hiện đối chiếu sao kê | `Mo ta nghiep vu/MD_ERP/1_accounting/02_bank.md (§2.2)` |
| Kế toán trưởng | Duyệt chi, kiểm tra sổ tiền gửi | `Mo ta nghiep vu/MD_ERP/1_accounting/02_bank.md (§2.2)` |
| Giám đốc | Phê duyệt ủy nhiệm chi trực tuyến | `Mo ta nghiep vu/MD_ERP/1_accounting/02_bank.md (§2.2)` |
| Hệ thống đối chiếu | Ghép giao dịch sao kê với chứng từ đã ghi sổ theo ngày, số tiền và diễn giải | `src/services/bankReconciliationService.ts:243` |

## 2. Điều kiện trước

- Tài khoản 112 (tiền gửi ngân hàng) đã có trong sổ kế toán (`src/services/tt99Service.ts:156`).
- Đã có dữ liệu sao kê ngân hàng (nhập tay, tệp Excel, hoặc qua kết nối ngân hàng).
- Chứng từ báo Nợ / báo Có đã được ghi sổ trước khi đối chiếu.

## 3. Luồng chính

1. Nhận sao kê hoặc thông báo biến động số dư từ ngân hàng.
2. Kế toán lập chứng từ Thu tiền gửi (báo Có) hoặc Chi tiền gửi (báo Nợ / ủy nhiệm chi).
3. Với nghiệp vụ thu nợ khách hàng, kế toán phân bổ số tiền nhận được cho từng hóa đơn.
4. Hệ thống chuẩn hóa mã tham chiếu giao dịch trước khi so khớp (`bankReconciliationService.ts:129` — `normalizeRef`).
5. Hệ thống đối chiếu sao kê với chứng từ đã ghi sổ (`bankReconciliationService.ts:243` — `reconcileBankStatement`).
6. Kế toán xác nhận các cặp khớp, và lập chứng từ bổ sung cho giao dịch có trên sao kê nhưng chưa có trên sổ (lãi, phí ngân hàng).
7. Ghi sổ các chứng từ mới qua `saveJournalEntry` (`dbService.ts:1883`) và kết thúc kỳ đối chiếu.

## 4. Sơ đồ

```
[Sao kê ngân hàng]
        |
        v
[normalizeRef :129] --> [reconcileBankStatement :243]
        |                          |
        |                          v
        |                 [Cặp giao dịch khớp]
        |                          |
        v                          v
[Chứng từ đã ghi sổ]      [Kế toán xác nhận]
                                   |
                                   v
                    [Chứng từ bổ sung: lãi, phí]
                                   |
                                   v
                        [saveJournalEntry dbService:1883]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Sao kê có giao dịch nhưng sổ chưa có chứng từ | Kế toán lập chứng từ bổ sung (lãi, phí ngân hàng) | `Mo ta nghiep vu/MD_ERP/1_accounting/02_bank.md (§2.1)` |
| E2 | Số tiền hoặc ngày lệch giữa sao kê và chứng từ | Không tự khớp; kế toán kiểm tra và xử lý thủ công | `src/services/bankReconciliationService.ts:171` |
| E3 | Bút toán lệch Nợ/Có | Từ chối ghi sổ | `src/services/dbService.ts:1888` |
| E4 | Kỳ kế toán đã khóa | Từ chối ghi sổ | `src/services/dbService.ts:1907` |

## 6. Máy trạng thái

```
Chứng từ nháp --trình duyệt--> Chờ duyệt --duyệt--> Đã duyệt --ghi sổ--> Đã ghi sổ
Đối chiếu: Chưa đối chiếu --khớp--> Đã đối chiếu --phát hiện lệch--> Cần xử lý
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Mã tham chiếu giao dịch được chuẩn hóa trước khi so khớp để tránh lệch định dạng | `src/services/bankReconciliationService.ts:129` |
| BR-02 | Chỉ tự động khớp khi trùng ngày, trùng số tiền và trùng mã tham chiếu | `src/services/bankReconciliationService.ts:171`, `:200` |
| BR-03 | Mọi chứng từ tiền gửi phải qua cổng kiểm soát cân đối và khóa sổ | `src/services/dbService.ts:1883` |

## 8. Thông báo và nhật ký

- Chưa có thông báo tự động cho kế toán trưởng khi ủy nhiệm chi chờ duyệt.
- Kết quả đối chiếu hiện trả về dữ liệu cho màn hình, chưa có nhật ký kiểm toán riêng.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| `journal_entries` / `journal_items` | Bút toán tiền gửi và tài khoản đối ứng 112 | `src/services/dbService.ts:1913` |
| Dữ liệu sao kê ngân hàng | Ngày, số tiền, mã tham chiếu, diễn giải | `src/services/bankReconciliationService.ts:143`, `:200` |
| `tenant_settings` | `data.closingLockDate` | `src/services/dbService.ts:1899` |

## 10. Màn hình

- Sổ cái chi tiết Tài khoản (`src/components/Finance.tsx:845`).
- Bảng Cân đối Phát sinh Tài khoản (`src/components/Finance.tsx:1493`).
- Chưa có màn hình ủy nhiệm chi chuyên biệt.

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho sao kê có giao dịch trùng ngày, số tiền và mã tham chiếu với chứng từ, Khi chạy đối chiếu, Thì hệ thống trả về cặp khớp.
- **AC-02.** Cho sao kê có phí ngân hàng chưa ghi sổ, Khi chạy đối chiếu, Thì giao dịch đó nằm trong danh sách chưa khớp để kế toán bổ sung.
- **AC-03.** Cho chứng từ tiền gửi lệch Nợ/Có, Khi ghi sổ, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-04.** Cho kỳ đã khóa, Khi ghi chứng từ trong kỳ, Thì hệ thống từ chối (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại `bankReconciliationService.ts` đã có, không cần thay cấu trúc bảng.
- Cần bổ sung màn hình ủy nhiệm chi và kết nối ngân hàng nếu muốn tự động lấy sao kê.

## 13. Giả định và câu hỏi mở

- **GD-01.** Giai đoạn đầu nhập sao kê thủ công hoặc bằng tệp Excel, chưa kết nối trực tiếp ngân hàng.
- **Q-01.** Có cần tích hợp kết nối ngân hàng tự động lấy sao kê không, và với ngân hàng nào?
- **Q-02.** Ai có thẩm quyền phê duyệt ủy nhiệm chi theo từng ngưỡng tiền?

## 14. Ghi chú kỹ thuật

- Đối chiếu dùng hàm thuần `reconcileBankStatement` (`src/services/bankReconciliationService.ts:243`), thuận lợi cho việc viết kiểm thử.
- Có tệp kiểm thử đi kèm `src/services/bankReconciliationService.test.ts`.

## Chưa xác minh được

- Màn hình ủy nhiệm chi và luồng phê duyệt trực tuyến chưa có trong mã nguồn — chưa xác minh được.
- Chưa xác minh được định dạng sao kê ngân hàng mà hệ thống chấp nhận khi nhập tay.
- Chưa xác minh được có phân quyền riêng cho vai trò kế toán ngân hàng hay không.
