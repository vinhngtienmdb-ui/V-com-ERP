# QT-04 — Mua hàng và Công nợ phải trả

- Dự án: VComm
- Mã quy trình: QT-04
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Kế toán
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/1_accounting/03_purchase.md (§2.1, §2.2, §3.2)`
- Mô-đun hệ thống: MOD-27 Mua hàng và Nhà cung cấp (`/scm`) và MOD-29 Tài chính - Kế toán (`/finance`)
- Hiện trạng mã nguồn: Đã có một phần — màn hình mua hàng và nhà cung cấp đã có; phần hạch toán công nợ dùng chung cổng ghi sổ

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên mua hàng | Lập đơn mua hàng, theo dõi tiến độ giao | `Mo ta nghiep vu/MD_ERP/1_accounting/03_purchase.md (§2.2)` |
| Thủ kho | Nhận hàng, xác nhận nhập kho thực tế | `Mo ta nghiep vu/MD_ERP/1_accounting/03_purchase.md (§2.2)` |
| Kế toán công nợ / Kế toán vật tư | Lập chứng từ mua hàng, theo dõi công nợ nhà cung cấp | `Mo ta nghiep vu/MD_ERP/1_accounting/03_purchase.md (§2.2)` |
| Hệ thống | Chặn trùng hóa đơn đầu vào, chặn ghi sổ lệch hoặc trong kỳ đã khóa | `src/services/dbService.ts:1888`, `:1899` |

## 2. Điều kiện trước

- Danh mục nhà cung cấp và danh mục vật tư hàng hóa đã có.
- Đã có kho nhận hàng nếu nghiệp vụ có nhập kho.
- Tài khoản 331 (phải trả nhà cung cấp) và 1331 (thuế giá trị gia tăng đầu vào) đã có trong sổ kế toán.

## 3. Luồng chính

1. Lập đơn mua hàng gửi nhà cung cấp; đơn mua hàng không phát sinh hạch toán.
2. Khi hàng về hoặc nhận hóa đơn, kế toán lập chứng từ mua hàng, có thể kế thừa dữ liệu từ đơn mua hàng.
3. Chọn đồng thời lập phiếu nhập kho nếu hàng nhập vào kho.
4. Chọn nhận kèm hóa đơn nếu nhà cung cấp giao hóa đơn cùng lúc.
5. Hệ thống kiểm tra trùng số hóa đơn theo bộ ba mã nhà cung cấp, số hóa đơn, ký hiệu hóa đơn.
6. Sinh chứng từ thanh toán (ủy nhiệm chi hoặc phiếu chi) từ chứng từ mua hàng nếu trả ngay.
7. Ghi sổ bút toán: Nợ 156 hoặc 152 hoặc 642, Nợ 1331, Có 331 (hoặc Có 111, 112 nếu trả ngay).
8. Nếu hàng lỗi, lập chứng từ trả lại hàng mua; hệ thống ghi giảm công nợ và xuất kho nếu đã nhập.

## 4. Sơ đồ

```
[Đơn mua hàng PO] --kế thừa--> [Chứng từ mua hàng]
                                       |
                    +------------------+------------------+
                    |                                     |
                    v                                     v
        [Phiếu nhập kho (nếu có)]              [Hóa đơn đầu vào (nếu có)]
                    |                                     |
                    +------------------+------------------+
                                       |
                                       v
                          [saveJournalEntry dbService:1883]
                          Nợ 152/156/642 + Nợ 1331 / Có 331
                                       |
                                       v
                     [Thanh toán: Ủy nhiệm chi / Phiếu chi]
                                       |
                                       v
                            [Trả lại hàng mua (nếu có)]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Trùng hóa đơn đầu vào theo mã nhà cung cấp, số hóa đơn, ký hiệu | Cảnh báo và chặn nhập trùng | `Mo ta nghiep vu/MD_ERP/1_accounting/03_purchase.md (§4.2)` |
| E2 | Cờ nhận hàng bật nhưng phiếu nhập kho không tạo được | Giao dịch phải cuộn lại để tránh lệch kho và sổ | `Mo ta nghiep vu/MD_ERP/1_accounting/03_purchase.md (§4.2)` |
| E3 | Bút toán lệch Nợ/Có | Từ chối ghi sổ | `src/services/dbService.ts:1888` |
| E4 | Kỳ kế toán đã khóa | Từ chối ghi sổ | `src/services/dbService.ts:1907` |

## 6. Máy trạng thái

```
Đơn mua hàng: Nháp --> Đã gửi nhà cung cấp --> Đã nhận hàng --> Đã thanh toán
Chứng từ mua hàng: Nháp --> Chờ duyệt --> Đã ghi sổ --> Đã thanh toán một phần --> Đã thanh toán đủ
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Số hóa đơn đầu vào là duy nhất theo bộ ba mã nhà cung cấp, số hóa đơn, ký hiệu hóa đơn | `Mo ta nghiep vu/MD_ERP/1_accounting/03_purchase.md (§4.2)` |
| BR-02 | Định khoản mua hàng nhập kho chưa thanh toán: Nợ 156, Nợ 1331, Có 331 | `Mo ta nghiep vu/MD_ERP/1_accounting/03_purchase.md (§3.2)` |
| BR-03 | Định khoản mua dịch vụ trả tiền mặt: Nợ 642 hoặc 627 hoặc 641, Nợ 1331, Có 111 | `Mo ta nghiep vu/MD_ERP/1_accounting/03_purchase.md (§3.2)` |
| BR-04 | Định khoản trả lại hàng mua: Nợ 331, Có 156, Có 1331 | `Mo ta nghiep vu/MD_ERP/1_accounting/03_purchase.md (§3.2)` |
| BR-05 | Đơn mua hàng không phát sinh hạch toán kế toán | `Mo ta nghiep vu/MD_ERP/1_accounting/03_purchase.md (§2.1)` |

## 8. Thông báo và nhật ký

- Cảnh báo trùng số hóa đơn hiển thị ngay cạnh trường số hóa đơn trên biểu mẫu
- Chưa có thông báo tự động cho kế toán khi chứng từ mua hàng chờ duyệt quá hạn.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| `journal_entries` / `journal_items` | Bút toán mua hàng và công nợ 331 | `src/services/dbService.ts:1913` |
| Danh mục nhà cung cấp | Mã, tên, mã số thuế, điều khoản thanh toán, hạn mức nợ | `Mo ta nghiep vu/MD_ERP/1_accounting/03_purchase.md (§1.1)` |
| Danh mục vật tư hàng hóa | Mã, tên, đơn vị tính, tài khoản kho, tài khoản chi phí | `Mo ta nghiep vu/MD_ERP/1_accounting/03_purchase.md (§1.1)` |
| Phiếu nhập kho | Liên kết với chứng từ mua hàng khi có nhập kho | `Mo ta nghiep vu/MD_ERP/1_accounting/03_purchase.md (§4.2)` |

## 10. Màn hình

- Quản lý Nhà cung cấp (`src/components/Procurement.tsx:110`).
- Phiếu Đề xuất mua hàng (`src/components/Procurement.tsx:370`).
- Chi tiết Đơn đặt hàng (`src/components/Procurement.tsx:548`).
- Sổ cái chi tiết Tài khoản 331 (`src/components/Finance.tsx:845`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho chứng từ mua hàng cân đối, Khi ghi sổ, Thì sinh bút toán Nợ 156, Nợ 1331, Có 331.
- **AC-02.** Cho hóa đơn trùng số theo cùng nhà cung cấp, Khi lưu, Thì hệ thống cảnh báo và chặn (ca thất bại bắt buộc).
- **AC-03.** Cho nghiệp vụ trả lại hàng mua, Khi ghi sổ, Thì công nợ 331 giảm đúng số tiền hàng và thuế.
- **AC-04.** Cho kỳ đã khóa, Khi ghi chứng từ mua hàng trong kỳ, Thì hệ thống từ chối (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình mua hàng hiện có (`/scm`) và cổng ghi sổ chung.
- Cần bổ sung ràng buộc duy nhất cho số hóa đơn đầu vào ở tầng cơ sở dữ liệu.
- Cần bổ sung cuộn giao dịch khi vừa ghi sổ vừa nhập kho.

## 13. Giả định và câu hỏi mở

- **GD-01.** Nhà cung cấp được quản lý tập trung một danh mục dùng chung cho mọi tenant con.
- **Q-01.** Có cần phân bổ chi phí mua hàng (vận chuyển, hải quan) vào giá trị nhập kho không?
- **Q-02.** Có cần đọc tự động tệp XML hóa đơn điện tử đầu vào để điền sẵn biểu mẫu không?

## 14. Ghi chú kỹ thuật

- Trùng hóa đơn nên cài bằng ràng buộc duy nhất ở cơ sở dữ liệu, không chỉ kiểm tra ở tầng ứng dụng.
- Ghi sổ và nhập kho phải nằm trong cùng một giao dịch để tránh lệch kho với sổ.

## Chưa xác minh được

- Chưa xác minh được ràng buộc duy nhất cho số hóa đơn đầu vào đã có trong cơ sở dữ liệu hay chưa.
- Chưa xác minh được đơn mua hàng và chứng từ mua hàng có phải hai bảng riêng trong mã nguồn hay không.
- Chưa xác minh được nghiệp vụ phân bổ chi phí mua hàng đã được triển khai hay chưa.
