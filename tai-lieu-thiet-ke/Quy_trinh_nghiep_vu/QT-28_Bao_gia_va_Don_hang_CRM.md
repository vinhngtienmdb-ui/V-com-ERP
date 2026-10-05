# QT-28 — Báo giá và Đơn hàng

- Dự án: VComm
- Mã quy trình: QT-28
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: CRM
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/3_crm/27_quotes_orders.md (§2)`
- Mô-đun hệ thống: MOD-38 Đội ngũ Kinh doanh (`/sales`) và MOD-11 Quản lý Đơn hàng (`/orders`)
- Hiện trạng mã nguồn: Đã có một phần — đơn hàng và hóa đơn đã có; chưa có màn hình báo giá riêng

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên kinh doanh | Tạo báo giá và đơn hàng; chỉ sửa được khi còn ở trạng thái nháp | `Mo ta nghiep vu/MD_ERP/3_crm/27_quotes_orders.md (§2)` |
| Trưởng phòng kinh doanh | Phê duyệt báo giá và đơn hàng vượt hạn mức chiết khấu | `Mo ta nghiep vu/MD_ERP/3_crm/27_quotes_orders.md (§2)` |
| Kế toán và kho | Xem đơn hàng, cập nhật tình trạng giao hàng và thanh toán | `Mo ta nghiep vu/MD_ERP/3_crm/27_quotes_orders.md (§2)` |

## 2. Điều kiện trước

- Đã có bảng giá và danh mục hàng hóa.
- Đã có khách hàng và hạn mức chiết khấu theo cấp.

## 3. Luồng chính

1. Nhân viên chọn khách hàng, chọn hàng hóa từ bảng giá, điền số lượng và chiết khấu.
2. Nếu chiết khấu vượt thẩm quyền, hệ thống khóa báo giá và gửi thông báo cho quản lý duyệt.
3. Nhân viên kết xuất tệp hoặc gửi thư điện tử báo giá cho khách hàng.
4. Khi khách đồng ý, nhân viên bấm tạo đơn hàng từ báo giá.
5. Đơn hàng được chuyển thông tin sang bộ phận kho để xuất hàng và kế toán để xuất hóa đơn, ghi nhận công nợ.

## 4. Sơ đồ

```
[Chọn khách hàng + hàng hóa từ bảng giá]
                    |
                    v
        [Lập báo giá: số lượng, chiết khấu]
                    |
        +-----------+-----------+
        |                       |
        v                       v
[Trong thẩm quyền]      [Vượt thẩm quyền] --> [Quản lý duyệt]
        |                       |
        +-----------+-----------+
                    |
                    v
        [Gửi khách hàng] --> [Khách chấp nhận]
                    |
                    v
        [Tạo đơn hàng] --> [Kho xuất hàng] + [Kế toán xuất hóa đơn]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Chiết khấu vượt thẩm quyền | Khóa báo giá, gửi quản lý duyệt | `Mo ta nghiep vu/MD_ERP/3_crm/27_quotes_orders.md (§2)` |
| E2 | Sửa báo giá đã gửi hoặc đã duyệt | Chặn sửa; chỉ xem | `Mo ta nghiep vu/MD_ERP/3_crm/27_quotes_orders.md (§2)` |
| E3 | Tạo đơn hàng từ báo giá chưa được chấp nhận | Chặn tạo đơn | `Mo ta nghiep vu/MD_ERP/3_crm/27_quotes_orders.md (§2)` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Báo giá: Nháp --> Đã gửi --> Đã chấp nhận / Đã từ chối / Hết hiệu lực
Đơn hàng: Mới --> Đang xử lý --> Đang giao --> Hoàn tất
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Chỉ sửa hoặc xóa báo giá và đơn hàng khi còn ở trạng thái nháp | `Mo ta nghiep vu/MD_ERP/3_crm/27_quotes_orders.md (§2)` |
| BR-02 | Chiết khấu vượt hạn mức phải qua quản lý phê duyệt | `Mo ta nghiep vu/MD_ERP/3_crm/27_quotes_orders.md (§2)` |
| BR-03 | Chỉ tạo đơn hàng từ báo giá đã được khách chấp nhận | `Mo ta nghiep vu/MD_ERP/3_crm/27_quotes_orders.md (§2)` |

## 8. Thông báo và nhật ký

- Thông báo cho quản lý khi báo giá chờ duyệt chiết khấu.
- Gửi báo giá cho khách hàng qua thư điện tử.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng báo giá | Số báo giá, khách hàng, hàng hóa, số lượng, chiết khấu, trạng thái | `Mo ta nghiep vu/MD_ERP/3_crm/27_quotes_orders.md (§1)` |
| Bảng đơn hàng | Mã đơn, khách hàng, giá trị, trạng thái | `Mo ta nghiep vu/MD_ERP/3_crm/27_quotes_orders.md (§1)` |
| Bảng hạn mức chiết khấu | Cấp, hạn mức chiết khấu tối đa | `Mo ta nghiep vu/MD_ERP/3_crm/27_quotes_orders.md (§2)` |
| Bảng giá | Mã hàng, đơn giá theo bảng giá | `Mo ta nghiep vu/MD_ERP/3_crm/27_quotes_orders.md (§2)` |

## 10. Màn hình

- Quản trị Kinh doanh (`src/components/Sales.tsx:78`).
- Quản lý Đơn hàng (`src/components/Orders.tsx`, tuyến `/orders`).
- Chưa có màn hình báo giá riêng trong mã nguồn hiện tại.

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho báo giá có chiết khấu trong thẩm quyền, Khi gửi, Thì không cần duyệt.
- **AC-02.** Cho báo giá có chiết khấu vượt thẩm quyền, Khi gửi, Thì hệ thống khóa và chuyển quản lý duyệt (ca bắt buộc).
- **AC-03.** Cho báo giá đã gửi, Khi sửa, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-04.** Cho tạo đơn hàng từ báo giá đã chấp nhận, Khi xác nhận, Thì đơn hàng sinh ra với đúng dòng hàng và giá.

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình đơn hàng hiện có và luồng phát hành hóa đơn.
- Cần bổ sung bảng báo giá và bảng hạn mức chiết khấu.

## 13. Giả định và câu hỏi mở

- **GD-01.** Báo giá có hiệu lực trong 30 ngày kể từ ngày gửi.
- **Q-01.** Hạn mức chiết khấu theo cấp như thế nào?
- **Q-02.** Có cần nhiều mẫu báo giá theo từng loại khách hàng không?

## 14. Ghi chú kỹ thuật

- Có thể tái sử dụng mẫu in đơn đặt hàng đã có (`src/components/Procurement.tsx:548`).

## Chưa xác minh được

- Chưa xác minh được bảng báo giá có tồn tại hay không.
- Chưa xác minh được hạn mức chiết khấu đang áp dụng.
- Chưa xác minh được thời hạn hiệu lực của báo giá.
