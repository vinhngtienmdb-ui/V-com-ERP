# QT-05 — Bán hàng và Công nợ phải thu

- Dự án: VComm
- Mã quy trình: QT-05
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Kế toán
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/1_accounting/04_sales.md (§2.1, §2.2, §3.2)`
- Mô-đun hệ thống: MOD-11 Quản lý Đơn hàng (`/orders`) và MOD-29 Tài chính - Kế toán (`/finance`)
- Hiện trạng mã nguồn: Đã có một phần — có luồng ghi sổ đơn hàng qua outbox; chưa có màn hình báo giá và đơn đặt hàng riêng

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên kinh doanh | Lập báo giá, lập đơn đặt hàng, xem doanh số cá nhân | `Mo ta nghiep vu/MD_ERP/1_accounting/04_sales.md (§2.2)` |
| Kế toán bán hàng | Lập chứng từ bán hàng, phát hành hóa đơn, theo dõi công nợ phải thu | `Mo ta nghiep vu/MD_ERP/1_accounting/04_sales.md (§2.2)` |
| Thủ kho | Chốt xuất kho khi quy trình tách bạch kho và kế toán | `Mo ta nghiep vu/MD_ERP/1_accounting/04_sales.md (§2.2)` |
| Hệ thống | Tự động ghi bút toán doanh thu và giá vốn khi đơn hoàn tất | `src/services/accountingOutbox.ts:52` |

## 2. Điều kiện trước

- Đã có danh mục khách hàng và danh mục hàng hóa.
- Tài khoản 131 (phải thu khách hàng), 511 (doanh thu), 632 (giá vốn) đã có trong sổ kế toán.
- Chính sách thuế giá trị gia tăng đầu ra đã được cấu hình (`src/services/taxService.ts:142` — `resolveVatRate`).

## 3. Luồng chính

1. Nhân viên kinh doanh lập báo giá gửi khách hàng; báo giá không phát sinh hạch toán.
2. Khách chốt mua, lập đơn đặt hàng và theo dõi trạng thái giao hàng.
3. Kế toán lập chứng từ bán hàng, có thể kế thừa từ đơn đặt hàng hoặc báo giá.
4. Chọn kiêm phiếu xuất kho để ghi nhận đồng thời doanh thu và giá vốn.
5. Chọn lập kèm hóa đơn để chuyển dữ liệu sang phân hệ quản lý hóa đơn.
6. Khi đơn hoàn tất, hệ thống phát sự kiện và ghi bút toán doanh thu qua hàng đợi ra (`accountingOutbox.ts:52` — `publishOrderCompleted`).
7. Sinh phiếu thu tiền mặt hoặc báo Có nếu khách thanh toán ngay.
8. Nếu khách trả hàng, lập chứng từ hàng bán bị trả lại; hệ thống ghi giảm doanh thu, giảm công nợ và nhập lại kho.

## 4. Sơ đồ

```
[Báo giá] --> [Đơn đặt hàng SO] --> [Chứng từ bán hàng]
                                            |
                        +-------------------+-------------------+
                        |                                       |
                        v                                       v
             [Phiếu xuất kho]                        [Hóa đơn điện tử]
                        |                                       |
                        +-------------------+-------------------+
                                            |
                                            v
                          [publishOrderCompleted accountingOutbox:52]
                                            |
                                            v
                              [postOrderJournalEntries :249]
                                            |
                                            v
                     Nợ 131 / Có 511, Có 3331  và  Nợ 632 / Có 156
                                            |
                                            v
                                  [Thu tiền: 111 / 112]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Đơn hàng chưa hoàn tất nhưng cố ghi nhận doanh thu | Không phát sự kiện, không ghi bút toán | `src/services/accountingOutbox.ts:52` |
| E2 | Bút toán lệch Nợ/Có | Từ chối ghi sổ | `src/services/dbService.ts:1888` |
| E3 | Kỳ kế toán đã khóa | Từ chối ghi sổ | `src/services/dbService.ts:1907` |
| E4 | Ghi trùng bút toán cho cùng một đơn hàng | Hàng đợi ra bảo đảm xử lý ít nhất một lần; cần khóa theo mã đơn | `src/services/accountingOutbox.ts:52` |

## 6. Máy trạng thái

```
Báo giá: Nháp --> Đã gửi --> Đã chấp nhận / Đã từ chối
Đơn hàng: Mới --> Đang xử lý --> Đang giao --> Hoàn tất --> (Đổi trả)
Công nợ: Chưa thu --> Thu một phần --> Đã thu đủ
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Định khoản bán hàng: Nợ 131, Có 511, Có 3331 | `Mo ta nghiep vu/MD_ERP/1_accounting/04_sales.md (§3.2)` |
| BR-02 | Định khoản giá vốn: Nợ 632, Có 156 | `Mo ta nghiep vu/MD_ERP/1_accounting/04_sales.md (§3.2)` |
| BR-03 | Thuế suất đầu ra lấy từ cấu hình thuế theo tenant | `src/services/taxService.ts:142` |
| BR-04 | Hàng bán bị trả lại ghi giảm doanh thu, giảm công nợ và nhập lại kho | `Mo ta nghiep vu/MD_ERP/1_accounting/04_sales.md (§2.1)` |
| BR-05 | Cầu nối kế toán TT99 chỉ hoạt động khi cờ cấu hình được bật | `src/services/accountingService.ts:99` |

## 8. Thông báo và nhật ký

- Trạng thái đơn hàng gửi thông báo cho khách qua dịch vụ ZNS (`src/services/orderStatusNotification.ts:50`).
- Chưa có thông báo cho kế toán khi công nợ quá hạn.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| `journal_entries` / `journal_items` | Bút toán doanh thu và giá vốn | `src/services/dbService.ts:1913` |
| Bảng đơn hàng | Mã đơn, trạng thái, tổng tiền, thuế | `src/services/accountingOutbox.ts:52` |
| `tenant_settings` | Chính sách thuế, ngày khóa sổ | `src/services/dbService.ts:1899` |
| Danh mục khách hàng | Mã, tên, mã số thuế, hạn mức công nợ | `Mo ta nghiep vu/MD_ERP/1_accounting/04_sales.md (§1.1)` |

## 10. Màn hình

- Quản lý Đơn hàng (`src/components/Orders.tsx`, tuyến `/orders`).
- Báo cáo Kết quả Hoạt động Kinh doanh (`src/components/Finance.tsx:1415`).
- Chưa có màn hình báo giá và đơn đặt hàng riêng cho kế toán bán hàng.

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho đơn hàng hoàn tất, Khi hệ thống phát sự kiện, Thì sinh bút toán Nợ 131, Có 511, Có 3331 và bút toán giá vốn.
- **AC-02.** Cho đơn hàng chưa hoàn tất, Khi kiểm tra sổ, Thì không có bút toán doanh thu (ca thất bại bắt buộc).
- **AC-03.** Cho hàng bán bị trả lại, Khi ghi sổ, Thì doanh thu và công nợ giảm đúng số tiền.
- **AC-04.** Cho kỳ đã khóa, Khi ghi chứng từ bán hàng trong kỳ, Thì hệ thống từ chối (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại hàng đợi ra kế toán đã có (`src/services/accountingOutbox.ts`), không đổi hợp đồng sự kiện.
- Cần bổ sung khóa chống ghi trùng bút toán theo mã đơn hàng.
- Cần bổ sung màn hình báo giá và đơn đặt hàng nếu muốn đủ luồng theo đặc tả.

## 13. Giả định và câu hỏi mở

- **GD-01.** Doanh thu ghi nhận tại thời điểm đơn hàng hoàn tất, không ghi tại thời điểm xuất kho.
- **Q-01.** Có cần ghi nhận doanh thu theo tiến độ hoặc theo từng lần giao hàng không?
- **Q-02.** Hạn mức công nợ khách hàng có bắt buộc chặn bán khi vượt không?

## 14. Ghi chú kỹ thuật

- Ghi sổ đi qua hàng đợi ra để bảo đảm xử lý ít nhất một lần (`src/services/accountingOutbox.ts:126` — `postJournalViaOutbox`).
- Worker hàng đợi chạy ở phía trình duyệt trong chế độ trình diễn (`src/services/outboxWorker.ts:118`).

## Chưa xác minh được

- Chưa xác minh được màn hình báo giá và đơn đặt hàng có tồn tại trong mã nguồn hay không.
- Chưa xác minh được cơ chế chống ghi trùng bút toán theo mã đơn hàng đã có hay chưa.
- Chưa xác minh được ngưỡng hạn mức công nợ khách hàng.
