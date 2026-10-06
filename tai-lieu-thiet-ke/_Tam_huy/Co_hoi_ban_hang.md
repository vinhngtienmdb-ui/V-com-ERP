# Cơ hội bán hàng — TẠM HỦY

> **TẠM HỦY 2026-10-09.** Quy trình này được dời khỏi cây đang hoạt động. Lý do: Mô hình TMĐT không có cơ hội bán hàng: giao dịch phát sinh từ giỏ hàng, không qua phễu bán hàng. Tệp lưu trữ không mang mã QT; mã cũ là QT-27. Xem `_Tam_huy/README.md`.

- Dự án: VComm
- Mã quy trình: QT-27 (tạm hủy 2026-10-09)
- Phiên bản: 1.0
- Trạng thái: Tạm hủy
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: CRM
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/3_crm/26_opportunities.md (§2)`
- Mô-đun hệ thống: MOD-38 Đội ngũ Kinh doanh (`/sales`) và MOD-36 Khách hàng (`/customers`)
- Hiện trạng mã nguồn: Đã có một phần — có màn hình quản trị kinh doanh và thiết lập bậc hoa hồng

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên kinh doanh | Quản lý cơ hội của mình, chuyển giai đoạn | `Mo ta nghiep vu/MD_ERP/3_crm/26_opportunities.md (§2)` |
| Trưởng phòng kinh doanh | Theo dõi đường ống bán hàng của cả đội, chỉnh hạn mức dự báo | `Mo ta nghiep vu/MD_ERP/3_crm/26_opportunities.md (§2)` |
| Hệ thống | Dự báo doanh thu theo xác suất và ngày kết thúc dự kiến | `Mo ta nghiep vu/MD_ERP/3_crm/26_opportunities.md (§2)` |

## 2. Điều kiện trước

- Đã có khách hàng và liên hệ.
- Đã có các giai đoạn của đường ống bán hàng và xác suất tương ứng.

## 3. Luồng chính

1. Nhân viên mở cơ hội khi khách hàng có nhu cầu rõ ràng, có ngân sách và thời gian mua cụ thể.
2. Thực hiện các hoạt động họp, trình diễn, báo giá và kéo cơ hội qua từng giai đoạn.
3. Trưởng phòng dùng danh sách cơ hội kèm ngày kết thúc dự kiến và xác suất để dự báo doanh thu.
4. Đóng cơ hội thắng khi hợp đồng được ký hoặc tiền được thanh toán; sinh báo giá hoặc đơn hàng.
5. Đóng cơ hội thua khi khách từ chối; bắt buộc nhập lý do thất bại để phân tích.

## 4. Sơ đồ

```
[Nhu cầu rõ ràng] --> [Mở cơ hội]
                            |
                            v
    [Giai đoạn 1] --> [Giai đoạn 2] --> [Giai đoạn 3] --> [Đàm phán]
                            |
                +-----------+-----------+
                |                       |
                v                       v
        [Thắng: ký, thu tiền]     [Thua: nhập lý do]
                |
                v
        [Báo giá / Đơn hàng] --> [Dự báo doanh thu theo xác suất]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Sửa doanh số kỳ vọng khi đã gắn báo giá hoặc hợp đồng đã duyệt | Chặn sửa | `Mo ta nghiep vu/MD_ERP/3_crm/26_opportunities.md (§2)` |
| E2 | Đóng thua nhưng không nhập lý do | Không cho đóng cơ hội | `Mo ta nghiep vu/MD_ERP/3_crm/26_opportunities.md (§2)` |
| E3 | Cơ hội không có ngày kết thúc dự kiến | Không tính vào dự báo doanh thu | `Mo ta nghiep vu/MD_ERP/3_crm/26_opportunities.md (§2)` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Khảo sát --> Xác định nhu cầu --> Đề xuất --> Đàm phán --> Thắng / Thua
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Dự báo doanh thu bằng giá trị cơ hội nhân xác suất theo giai đoạn | `Mo ta nghiep vu/MD_ERP/3_crm/26_opportunities.md (§2)` |
| BR-02 | Đóng thua bắt buộc nhập lý do | `Mo ta nghiep vu/MD_ERP/3_crm/26_opportunities.md (§2)` |
| BR-03 | Không sửa doanh số kỳ vọng khi đã gắn báo giá hoặc hợp đồng đã duyệt | `Mo ta nghiep vu/MD_ERP/3_crm/26_opportunities.md (§2)` |

## 8. Thông báo và nhật ký

- Thông báo cho trưởng phòng khi cơ hội đổi giai đoạn.
- Chưa có thông báo nhắc cơ hội sắp đến ngày kết thúc dự kiến.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng cơ hội | Tên, khách hàng, giá trị, giai đoạn, xác suất, ngày kết thúc dự kiến | `Mo ta nghiep vu/MD_ERP/3_crm/26_opportunities.md (§1)` |
| Bảng giai đoạn đường ống | Tên giai đoạn, xác suất mặc định | `Mo ta nghiep vu/MD_ERP/3_crm/26_opportunities.md (§1)` |
| Bảng lý do thất bại | Lý do đóng thua | `Mo ta nghiep vu/MD_ERP/3_crm/26_opportunities.md (§2)` |

## 10. Màn hình

- Quản trị Kinh doanh (`src/components/Sales.tsx:78`).
- Trí tuệ kinh doanh (`src/components/Sales.tsx:132`).
- Thiết lập Bậc và Hoa hồng (`src/components/Sales.tsx:358`).
- Hồ sơ Khách hàng 360 độ (`src/components/Customers.tsx:203`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho cơ hội giá trị 100 triệu, xác suất 40 phần trăm, Khi tính dự báo, Thì giá trị dự báo là 40 triệu.
- **AC-02.** Cho đóng cơ hội thua mà không nhập lý do, Khi lưu, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-03.** Cho cơ hội đã gắn hợp đồng đã duyệt, Khi sửa doanh số kỳ vọng, Thì hệ thống chặn (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình quản trị kinh doanh và thiết lập hoa hồng.
- Cần bổ sung bảng cơ hội và bảng lý do thất bại.

## 13. Giả định và câu hỏi mở

- **GD-01.** Đường ống bán hàng có năm giai đoạn tiêu chuẩn.
- **Q-01.** Xác suất theo giai đoạn cố định hay do nhân viên nhập?
- **Q-02.** Có cần dự báo doanh thu theo từng nhân viên và theo từng phòng không?

## 14. Ghi chú kỹ thuật

- Hàm tính hoa hồng và bậc kinh doanh đã có màn hình cấu hình riêng (`src/components/Sales.tsx:358`).

## Chưa xác minh được

- Chưa xác minh được bảng cơ hội có tồn tại hay không.
- Chưa xác minh được số giai đoạn đường ống đang áp dụng.
- Chưa xác minh được cách tính dự báo doanh thu.
