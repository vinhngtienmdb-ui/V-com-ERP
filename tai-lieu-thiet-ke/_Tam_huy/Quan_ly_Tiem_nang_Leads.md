# Quản lý Tiềm năng — TẠM HỦY

> **TẠM HỦY 2026-10-09.** Quy trình này được dời khỏi cây đang hoạt động. Lý do: Mô hình TMĐT không có phễu tiềm năng: khách hàng chỉ sinh ra khi tự đăng ký qua cổng eCommerce. Tệp lưu trữ không mang mã QT; mã cũ là QT-24. Xem `_Tam_huy/README.md`.

- Dự án: VComm
- Mã quy trình: QT-24 (tạm hủy 2026-10-09)
- Phiên bản: 1.0
- Trạng thái: Tạm hủy
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: CRM
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/3_crm/23_leads.md (§2, §3)`
- Mô-đun hệ thống: MOD-36 Khách hàng (`/customers`) và MOD-38 Đội ngũ Kinh doanh (`/sales`)
- Hiện trạng mã nguồn: Đã có một phần — có hồ sơ khách hàng 360 độ và cấu hình nguồn theo dõi; chưa có màn hình tiềm năng riêng

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên kinh doanh | Xem và sửa tiềm năng của mình, chuyển đổi, ghi chú chăm sóc; không được xóa | `Mo ta nghiep vu/MD_ERP/3_crm/23_leads.md (§2)` |
| Trưởng phòng kinh doanh | Xem toàn bộ tiềm năng của phòng, phân bổ lại, xóa tiềm năng | `Mo ta nghiep vu/MD_ERP/3_crm/23_leads.md (§2)` |
| Nhân viên marketing | Nhập danh sách tiềm năng, xem báo cáo chuyển đổi | `Mo ta nghiep vu/MD_ERP/3_crm/23_leads.md (§2)` |
| Hệ thống | Chấm điểm tiềm năng và cảnh báo trùng lặp | `src/services/crmService.ts:19` — `calculateRfmScores` |

## 2. Điều kiện trước

- Đã có danh mục nguồn tiềm năng và tình trạng tiềm năng.
- Đã có nhân viên kinh doanh phụ trách theo vùng hoặc theo phòng.

## 3. Luồng chính

1. Thu thập tiềm năng: nhập thủ công, nhập từ tệp, hoặc tự động từ biểu mẫu web, giao diện lập trình, Zalo, Facebook.
2. Phân bổ tiềm năng cho nhân viên kinh doanh theo vùng hoặc theo vòng lặp.
3. Nhân viên tiếp cận bằng điện thoại, thư điện tử hoặc Zalo và ghi nhận lịch sử chăm sóc.
4. Cập nhật tình trạng tiềm năng và đánh giá mức độ nóng.
5. Khi tiềm năng có nhu cầu rõ ràng, thực hiện chuyển đổi thành khách hàng, liên hệ và tùy chọn sinh cơ hội.
6. Chuyển toàn bộ lịch sử chăm sóc từ tiềm năng sang khách hàng mới.
7. Nếu tiềm năng không hợp lệ hoặc từ chối, cập nhật tình trạng thất bại kèm lý do.

## 4. Sơ đồ

```
[Thu thập: thủ công / tệp / webform / Zalo / Facebook]
                        |
                        v
                [Phân bổ cho nhân viên]
                        |
                        v
        [Tiếp cận: gọi, thư, Zalo, ghi lịch sử chăm sóc]
                        |
                        v
                [Phân loại tình trạng]
                        |
            +-----------+-----------+
            |                       |
            v                       v
   [Chuyển đổi]              [Đóng thất bại + lý do]
            |
            v
   [Khách hàng + Liên hệ + Cơ hội] --> [Chuyển lịch sử chăm sóc]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Trùng số điện thoại hoặc thư điện tử với tiềm năng khác | Cảnh báo và tùy cấu hình chặn hoặc chỉ cảnh báo | `Mo ta nghiep vu/MD_ERP/3_crm/23_leads.md (§4)` |
| E2 | Thiếu cả số điện thoại và thư điện tử | Không lưu được; bắt buộc ít nhất một thông tin liên lạc | `Mo ta nghiep vu/MD_ERP/3_crm/23_leads.md (§4)` |
| E3 | Sửa tiềm năng đã chuyển đổi thành công | Chặn vì hồ sơ đã ở trạng thái chỉ đọc | `Mo ta nghiep vu/MD_ERP/3_crm/23_leads.md (§4)` |
| E4 | Nhân viên kinh doanh cố xóa tiềm năng | Từ chối; chỉ trưởng phòng được xóa | `Mo ta nghiep vu/MD_ERP/3_crm/23_leads.md (§2)` |

## 6. Máy trạng thái

```
Chưa liên hệ --> Đã liên hệ --> Đang theo dõi --> Chuyển đổi thành công
Chưa liên hệ --> Đóng thất bại (kèm lý do)
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Phải có ít nhất số điện thoại hoặc thư điện tử mới lưu được | `Mo ta nghiep vu/MD_ERP/3_crm/23_leads.md (§4)` |
| BR-02 | Tiềm năng đã chuyển đổi thành công là chỉ đọc | `Mo ta nghiep vu/MD_ERP/3_crm/23_leads.md (§4)` |
| BR-03 | Nhân viên kinh doanh không được xóa tiềm năng | `Mo ta nghiep vu/MD_ERP/3_crm/23_leads.md (§2)` |
| BR-04 | Điểm chất lượng khách hàng tính theo mô hình tần suất, thời gian gần nhất, giá trị | `src/services/crmService.ts:19` |

## 8. Thông báo và nhật ký

- Thông báo cho nhân viên khi được phân bổ tiềm năng mới.
- Cảnh báo trùng lặp hiển thị ngay khi nhập thông tin liên lạc.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng tiềm năng | Mã, tên, công ty, liên lạc, nguồn, tình trạng, người phụ trách, đánh giá | `Mo ta nghiep vu/MD_ERP/3_crm/23_leads.md (§1)` |
| Bảng nguồn tiềm năng | Nguồn sinh tiềm năng | `Mo ta nghiep vu/MD_ERP/3_crm/23_leads.md (§1)` |
| Bảng tình trạng tiềm năng | Các bước của tiềm năng | `Mo ta nghiep vu/MD_ERP/3_crm/23_leads.md (§1)` |
| Bảng lịch sử chăm sóc | Cuộc gọi, ghi chú, cuộc họp | `Mo ta nghiep vu/MD_ERP/3_crm/23_leads.md (§3)` |

## 10. Màn hình

- Hồ sơ Khách hàng 360 độ (`src/components/Customers.tsx:203`).
- Cấu hình Nguồn Tracking (`src/components/Customers.tsx:1003`).
- Quản trị Kinh doanh (`src/components/Sales.tsx:78`).
- Chưa có màn hình tiềm năng riêng trong mã nguồn hiện tại.

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho tiềm năng có đủ thông tin liên lạc, Khi lưu, Thì hồ sơ được tạo và phân bổ được cho nhân viên.
- **AC-02.** Cho tiềm năng thiếu cả số điện thoại và thư điện tử, Khi lưu, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-03.** Cho tiềm năng đã chuyển đổi, Khi sửa thông tin, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-04.** Cho chuyển đổi tiềm năng, Khi xác nhận, Thì hệ thống sinh khách hàng, liên hệ và chuyển lịch sử chăm sóc.

## 12. Ảnh hưởng tới phần có sẵn

- Cần bổ sung bảng tiềm năng, bảng nguồn và bảng lịch sử chăm sóc.
- Dùng lại hồ sơ khách hàng và cấu hình nguồn theo dõi đã có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Tiềm năng dùng chung một bảng với khách hàng, phân biệt bằng trạng thái.
- **Q-01.** Quy tắc trùng lặp là chặn cứng hay chỉ cảnh báo?
- **Q-02.** Phân bổ tiềm năng theo vùng hay theo vòng lặp?

## 14. Ghi chú kỹ thuật

- Hàm chấm điểm khách hàng đã có (`src/services/crmService.ts:19`), có thể dùng cho cả tiềm năng.
- Tìm kiếm khách hàng đã có hàm riêng (`src/services/fullTextSearchService.ts:236`).

## Chưa xác minh được

- Chưa xác minh được màn hình tiềm năng riêng có tồn tại hay không.
- Chưa xác minh được cơ chế chống trùng lặp.
- Chưa xác minh được quy tắc phân bổ tiềm năng.
