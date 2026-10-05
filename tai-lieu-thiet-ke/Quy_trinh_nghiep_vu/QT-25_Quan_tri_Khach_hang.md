# QT-25 — Quản trị Khách hàng

- Dự án: VComm
- Mã quy trình: QT-25
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: CRM
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/3_crm/24_accounts.md (§2)`
- Mô-đun hệ thống: MOD-36 Khách hàng (`/customers`)
- Hiện trạng mã nguồn: Đã có một phần — có màn hình hồ sơ khách hàng 360 độ, hạng thành viên và cấu hình tích điểm

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên kinh doanh | Thêm và sửa khách hàng do mình quản lý | `Mo ta nghiep vu/MD_ERP/3_crm/24_accounts.md (§2)` |
| Trưởng phòng kinh doanh | Toàn quyền thêm, sửa, xóa và bàn giao khách hàng trong phòng | `Mo ta nghiep vu/MD_ERP/3_crm/24_accounts.md (§2)` |
| Nhân viên chăm sóc khách hàng | Xem thông tin, thêm ghi chú hỗ trợ; không được xóa dữ liệu kinh doanh | `Mo ta nghiep vu/MD_ERP/3_crm/24_accounts.md (§2)` |
| Hệ thống | Tự động lấy thông tin doanh nghiệp từ mã số thuế và tính hạng thành viên | `src/services/crmService.ts:19` |

## 2. Điều kiện trước

- Đã có danh mục hạng thành viên và quy tắc tích điểm.
- Đã có mã số thuế khách hàng nếu muốn làm giàu dữ liệu tự động.

## 3. Luồng chính

1. Tạo khách hàng bằng cách chuyển đổi từ tiềm năng, thêm mới thủ công, hoặc đồng bộ hai chiều từ hệ thống kế toán.
2. Làm giàu dữ liệu: khi nhập mã số thuế, hệ thống tự động lấy tên công ty và địa chỉ trụ sở từ cổng thông tin doanh nghiệp.
3. Xem hồ sơ khách hàng 360 độ gồm liên hệ, cơ hội đang mở, báo giá và đơn hàng.
4. Cập nhật hạng thành viên và tỉ lệ tích điểm theo cấu hình.
5. Khi nhân viên nghỉ việc hoặc chuyển vùng, thực hiện bàn giao hàng loạt khách hàng cho nhân viên khác.

## 4. Sơ đồ

```
[Chuyển đổi từ tiềm năng]  [Thêm thủ công]  [Đồng bộ kế toán]
                |                   |                 |
                +-------------------+-----------------+
                                    |
                                    v
                        [Hồ sơ Khách hàng 360 độ]
                                    |
            +-----------------------+-----------------------+
            |                       |                       |
            v                       v                       v
    [Liên hệ]              [Cơ hội đang mở]        [Báo giá, Đơn hàng]
                                    |
                                    v
                    [Hạng thành viên + Tích điểm]
                                    |
                                    v
                    [Bàn giao hàng loạt khi đổi người]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Mã số thuế không tra được thông tin | Giữ dữ liệu nhập tay, cảnh báo không tra được | `Mo ta nghiep vu/MD_ERP/3_crm/24_accounts.md (§2)` |
| E2 | Nhân viên chăm sóc khách hàng cố xóa khách hàng | Từ chối; chỉ trưởng phòng kinh doanh được xóa | `Mo ta nghiep vu/MD_ERP/3_crm/24_accounts.md (§2)` |
| E3 | Bàn giao khách hàng khi người nhận không thuộc phòng | Chặn bàn giao | `Mo ta nghiep vu/MD_ERP/3_crm/24_accounts.md (§2)` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Khách hàng: Mới --> Đang chăm sóc --> Đang giao dịch --> Tạm dừng --> Đã đóng
Hạng thành viên: Mới --> Bạc --> Vàng --> Kim cương
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Hạng thành viên và tỉ lệ tích điểm lấy từ cấu hình, không gắn cứng | `src/components/Customers.tsx:933` |
| BR-02 | Điểm chất lượng khách hàng tính theo mô hình tần suất, thời gian gần nhất, giá trị | `src/services/crmService.ts:19` |
| BR-03 | Chỉ trưởng phòng kinh doanh được xóa khách hàng | `Mo ta nghiep vu/MD_ERP/3_crm/24_accounts.md (§2)` |
| BR-04 | Nhân viên kinh doanh chỉ sửa được khách hàng do mình quản lý | `Mo ta nghiep vu/MD_ERP/3_crm/24_accounts.md (§2)` |

## 8. Thông báo và nhật ký

- Thông báo cho nhân viên nhận khi có bàn giao khách hàng.
- Chưa có thông báo tự động khi khách hàng lâu không phát sinh giao dịch.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng khách hàng | Mã, tên, mã số thuế, địa chỉ, hạng, người phụ trách | `Mo ta nghiep vu/MD_ERP/3_crm/24_accounts.md (§1)` |
| Bảng hạng thành viên | Tên hạng, điều kiện lên hạng, quyền lợi | `src/components/Customers.tsx:888` |
| Bảng cấu hình tích điểm | Tỉ lệ tích điểm, tỉ lệ tiêu điểm | `src/components/Customers.tsx:933` |
| Bảng lịch sử giao dịch | Đơn hàng, giá trị, thời điểm | `Mo ta nghiep vu/MD_ERP/3_crm/24_accounts.md (§2)` |

## 10. Màn hình

- Hồ sơ Khách hàng 360 độ (`src/components/Customers.tsx:203`).
- Danh sách Hạng thành viên (`src/components/Customers.tsx:888`).
- Cấu hình Tích điểm và Tiêu điểm (`src/components/Customers.tsx:933`).
- Thẻ phân loại ưu tiên (`src/components/Customers.tsx:973`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho mã số thuế hợp lệ, Khi làm giàu dữ liệu, Thì hệ thống điền tên công ty và địa chỉ trụ sở.
- **AC-02.** Cho nhân viên chăm sóc khách hàng, Khi cố xóa khách hàng, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-03.** Cho bàn giao hàng loạt khách hàng, Khi hoàn tất, Thì người phụ trách mới được cập nhật cho toàn bộ danh sách.
- **AC-04.** Cho khách hàng đủ điều kiện lên hạng, Khi tính lại hạng, Thì hạng thành viên cập nhật đúng quy tắc.

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình khách hàng và cấu hình tích điểm đã có.
- Cần bổ sung chức năng bàn giao hàng loạt nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Một khách hàng thuộc một nhân viên kinh doanh phụ trách tại một thời điểm.
- **Q-01.** Có chia sẻ dữ liệu khách hàng toàn đơn vị cho mọi nhân viên xem không?
- **Q-02.** Điều kiện lên hạng và quyền lợi theo hạng như thế nào?

## 14. Ghi chú kỹ thuật

- Hàm chấm điểm khách hàng theo mô hình tần suất, thời gian gần nhất, giá trị đã có (`src/services/crmService.ts:19`).
- Có hàm tìm kiếm khách hàng toàn văn (`src/services/fullTextSearchService.ts:236`).

## Chưa xác minh được

- Chưa xác minh được chức năng bàn giao hàng loạt khách hàng có tồn tại hay không.
- Chưa xác minh được nguồn dữ liệu tra cứu theo mã số thuế.
- Chưa xác minh được quy tắc lên hạng đang áp dụng.
