# QT-06 — Phát hành Hóa đơn điện tử

- Dự án: VComm
- Mã quy trình: QT-06
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Kế toán
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/1_accounting/05_invoice.md (§2.1, §2.2)`
- Mô-đun hệ thống: MOD-11 Quản lý Đơn hàng (`/orders`) và MOD-31 Đối soát (`/settlement`)
- Hiện trạng mã nguồn: Đã có một phần — có dịch vụ phát hành, nhà cung cấp hóa đơn, và luồng ủy nhiệm

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Kế toán bán hàng | Lập hóa đơn nháp, kiểm tra dữ liệu | `Mo ta nghiep vu/MD_ERP/1_accounting/05_invoice.md (§2.2)` |
| Kế toán trưởng / Người giữ chứng thư số | Ký số và phát hành hóa đơn | `Mo ta nghiep vu/MD_ERP/1_accounting/05_invoice.md (§2.2)` |
| Nhà cung cấp hóa đơn điện tử | Ký số, cấp số, truyền dữ liệu tới cơ quan thuế | `src/services/einvoiceProviders.ts:68` |
| Người bán (Seller) | Ủy nhiệm VComm phát hành hóa đơn trên đơn của mình | `src/services/einvoiceTax.ts:112` |

## 2. Điều kiện trước

- Đã đăng ký ít nhất một nhà cung cấp hóa đơn điện tử (`src/services/einvoiceProviders.ts:68` — `registerProvider`).
- Đã cấu hình thông tin pháp lý của đơn vị phát hành (`src/services/legalEntityService.ts:42`).
- Đơn hàng đã có dữ liệu để lập hóa đơn nháp (`src/services/einvoiceService.ts:107` — `buildEInvoiceDraft`).

## 3. Luồng chính

1. Hệ thống kéo dữ liệu từ chứng từ bán hàng sang hóa đơn nháp, trạng thái chờ phát hành.
2. Kế toán rà soát hóa đơn nháp và kiểm tra tính hợp lệ của dữ liệu.
3. Kế toán chọn một hoặc nhiều hóa đơn rồi bấm phát hành.
4. Hệ thống ký số và cấp số hóa đơn theo thứ tự qua nhà cung cấp đã đăng ký (`einvoiceService.ts:158` — `issueEInvoice`).
5. Nhà cung cấp truyền tệp dữ liệu lên hệ thống cơ quan thuế và trả về mã của cơ quan thuế.
6. Hệ thống gửi hóa đơn cho khách hàng qua thư điện tử kèm tệp và liên kết tra cứu.
7. Nếu có sai sót chưa kê khai, lập thông báo sai sót; nếu đã kê khai, lập hóa đơn điều chỉnh hoặc thay thế.

## 4. Sơ đồ

```
[Chứng từ bán hàng]
        |
        v
[buildEInvoiceDraft :107] --> [Hóa đơn nháp: Chờ phát hành]
                                        |
                                        v
                          [Kiểm tra hợp lệ :145]
                                        |
                                        v
                            [issueEInvoice :158]
                                        |
                    +-------------------+-------------------+
                    |                                       |
                    v                                       v
        [Nhà cung cấp HĐĐT ký số]               [Cấp số hóa đơn]
                    |                                       |
                    +-------------------+-------------------+
                                        |
                                        v
                     [Cơ quan thuế: mã của cơ quan thuế]
                                        |
                                        v
                          [Gửi khách hàng: PDF, XML, link]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Chưa đăng ký nhà cung cấp hóa đơn điện tử | Không thể phát hành; trạng thái chưa sẵn sàng | `src/services/einvoiceService.ts:145` |
| E2 | Dữ liệu hóa đơn không hợp lệ | Từ chối phát hành, trả về danh sách lỗi | `src/services/einvoiceService.ts:158` |
| E3 | Người bán chưa chọn phương thức thuế hợp lệ | Từ chối phát hành hóa đơn ủy nhiệm | `src/services/einvoiceTax.ts:161` |
| E4 | Hóa đơn đã phát hành nhưng sai sót | Lập thông báo sai sót, hoặc hóa đơn điều chỉnh, hoặc hóa đơn thay thế | `Mo ta nghiep vu/MD_ERP/1_accounting/05_invoice.md (§2.1)` |

## 6. Máy trạng thái

```
Nháp --phát hành--> Chờ cơ quan thuế --> Đã cấp mã --> Đã gửi khách hàng
Đã phát hành --sai sót chưa kê khai--> Thông báo sai sót
Đã phát hành --sai sót đã kê khai--> Hóa đơn điều chỉnh / Hóa đơn thay thế
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Số hóa đơn cấp theo thứ tự, không nhảy số | `Mo ta nghiep vu/MD_ERP/1_accounting/05_invoice.md (§2.1)` |
| BR-02 | Hệ thống không hủy hóa đơn; sai sót xử lý bằng thông báo sai sót hoặc hóa đơn điều chỉnh, thay thế | `tai-lieu-thiet-ke/LEGAL_REFERENCE.md`; Thông tư 91/2026 Điều 10 |
| BR-03 | Đơn ủy nhiệm chỉ phát hành khi người bán đã khai phương thức thuế hợp lệ | `src/services/einvoiceTax.ts:161` |
| BR-04 | Thuế của đơn ủy nhiệm tính bằng hàm riêng theo phương thức của người bán | `src/services/einvoiceTax.ts:112` |
| BR-05 | Nhà cung cấp hóa đơn chọn qua sổ đăng ký nhà cung cấp, không gắn cứng một nhà cung cấp | `src/services/einvoiceProviders.ts:103` |

## 8. Thông báo và nhật ký

- Gửi hóa đơn cho khách hàng qua thư điện tử kèm liên kết tra cứu.
- Có bộ nhớ đệm cấu hình nhà cung cấp để tránh tra cứu lặp (`src/services/einvoiceService.ts:30`).

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng hóa đơn điện tử | Số hóa đơn, ký hiệu, trạng thái, mã cơ quan thuế | `src/services/einvoiceService.ts:158` |
| Bảng đơn hàng | Liên kết hóa đơn với đơn hàng | `src/services/einvoiceService.ts:107` |
| Cấu hình pháp lý đơn vị | Tên, mã số thuế, địa chỉ | `src/services/legalEntityService.ts:42` |
| Bảng phương thức thuế người bán | Phương thức thuế tại thời điểm phát hành | `src/services/einvoiceTax.ts:161` |

## 10. Màn hình

- Quản lý Đơn hàng (`src/components/Orders.tsx`, tuyến `/orders`).
- Đối soát và Hóa đơn Điện tử (`src/components/Settlement.tsx:434`).
- Trang công khai thông tin ủy nhiệm phát hành (`src/components/PublicLegalInfo.tsx:434`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho hóa đơn nháp hợp lệ và đã đăng ký nhà cung cấp, Khi phát hành, Thì hệ thống trả về số hóa đơn và mã cơ quan thuế.
- **AC-02.** Cho chưa đăng ký nhà cung cấp hóa đơn, Khi phát hành, Thì hệ thống từ chối và báo chưa sẵn sàng (ca thất bại bắt buộc).
- **AC-03.** Cho hóa đơn đã phát hành bị sai, Khi xử lý, Thì hệ thống không hủy mà sinh thông báo sai sót hoặc hóa đơn điều chỉnh.
- **AC-04.** Cho đơn ủy nhiệm có người bán chưa khai phương thức thuế, Khi phát hành, Thì hệ thống từ chối (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại `einvoiceService.ts`, `einvoiceProviders.ts`, `einvoiceTax.ts` đã có.
- Có tệp kiểm thử đi kèm cho cả ba dịch vụ, thuận lợi khi sửa đổi.

## 13. Giả định và câu hỏi mở

- **GD-01.** Mỗi đơn vị phát hành dùng một nhà cung cấp hóa đơn điện tử chủ đạo, có thể đổi qua sổ đăng ký.
- **Q-01.** Có cần hỗ trợ đồng thời nhiều nhà cung cấp hóa đơn theo từng loại đơn không?
- **Q-02.** Kênh gửi hóa đơn cho khách hàng ngoài thư điện tử có cần thêm Zalo hoặc SMS không?

## 14. Ghi chú kỹ thuật

- Sổ đăng ký nhà cung cấp cho phép thay nhà cung cấp mà không sửa mã nguồn (`src/services/einvoiceProviders.ts:68`).
- Quy tắc pháp lý về sai sót hóa đơn đã được tách thành bốn luồng theo Thông tư 91/2026 Điều 10.

## Chưa xác minh được

- Chưa xác minh được kết nối thật tới nhà cung cấp hóa đơn điện tử nào đang hoạt động.
- Chưa xác minh được định dạng tệp gửi cơ quan thuế có đúng chuẩn hiện hành hay không.
- Chưa xác minh được kênh gửi hóa đơn cho khách hàng ngoài thư điện tử.
