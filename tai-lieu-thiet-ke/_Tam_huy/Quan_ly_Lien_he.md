# Quản lý Liên hệ — TẠM HỦY

> **TẠM HỦY 2026-10-09.** Quy trình này được dời khỏi cây đang hoạt động. Lý do: Mô hình TMĐT không có sổ liên hệ B2B tách rời: thông tin liên hệ nằm ngay trong tài khoản khách hàng. Tệp lưu trữ không mang mã QT; mã cũ là QT-26. Xem `_Tam_huy/README.md`.

- Dự án: VComm
- Mã quy trình: QT-26 (tạm hủy 2026-10-09)
- Phiên bản: 1.0
- Trạng thái: Tạm hủy
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: CRM
- Nguồn nghiệp vụ: `Mo ta nghiep vu/MD_ERP/3_crm/25_contacts.md (§2)`
- Mô-đun hệ thống: MOD-36 Khách hàng (`/customers`)
- Hiện trạng mã nguồn: Đã có một phần — liên hệ nằm trong hồ sơ khách hàng 360 độ

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên kinh doanh | Thu thập và cập nhật liên hệ thuộc khách hàng mình quản lý | `Mo ta nghiep vu/MD_ERP/3_crm/25_contacts.md (§2)` |
| Trưởng phòng kinh doanh | Chia sẻ liên hệ cho cá nhân hoặc phòng ban khác | `Mo ta nghiep vu/MD_ERP/3_crm/25_contacts.md (§2)` |
| Hệ thống | Nhắc ngày sinh nhật liên hệ để gửi lời chúc | `Mo ta nghiep vu/MD_ERP/3_crm/25_contacts.md (§2)` |

## 2. Điều kiện trước

- Đã có khách hàng trong hệ thống.
- Đã có kênh gửi thư điện tử hoặc tin nhắn chăm sóc khách hàng.

## 3. Luồng chính

1. Thu thập liên hệ trong công ty khách hàng để lập sơ đồ tổ chức phía khách hàng.
2. Đánh giá vai trò từng liên hệ: người quyết định, người dùng cuối.
3. Ghi nhận lịch sử gặp gỡ và trao đổi riêng với từng liên hệ.
4. Hệ thống nhắc ngày sinh nhật liên hệ để gửi lời chúc.
5. Khi mở cơ hội bán hàng, chọn các liên hệ tham gia và vai trò của họ trong thương vụ.

## 4. Sơ đồ

```
[Khách hàng]
     |
     v
[Thu thập liên hệ] --> [Sơ đồ tổ chức phía khách hàng]
     |
     v
[Đánh giá vai trò: người quyết định / người dùng cuối]
     |
     v
[Lịch sử gặp gỡ và trao đổi] --> [Nhắc sinh nhật]
     |
     v
[Gắn vào cơ hội bán hàng kèm vai trò]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Liên hệ không thuộc khách hàng nào | Không lưu được; bắt buộc gắn với khách hàng | `Mo ta nghiep vu/MD_ERP/3_crm/25_contacts.md (§1)` |
| E2 | Trùng liên hệ theo số điện thoại hoặc thư điện tử | Cảnh báo trùng lặp | `Mo ta nghiep vu/MD_ERP/3_crm/25_contacts.md (§2)` |
| E3 | Người xem không có quyền với khách hàng mẹ | Từ chối truy cập liên hệ | `Mo ta nghiep vu/MD_ERP/3_crm/25_contacts.md (§2)` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Liên hệ: Mới --> Đang hoạt động --> Không còn làm việc
Vai trò: Người quyết định / Người ảnh hưởng / Người dùng cuối / Người gác cổng
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Liên hệ kế thừa quyền của khách hàng mẹ | `Mo ta nghiep vu/MD_ERP/3_crm/25_contacts.md (§2)` |
| BR-02 | Có thể chia sẻ liên hệ cho cá nhân hoặc phòng ban khác | `Mo ta nghiep vu/MD_ERP/3_crm/25_contacts.md (§2)` |
| BR-03 | Liên hệ phải được gắn vai trò khi tham gia cơ hội bán hàng | `Mo ta nghiep vu/MD_ERP/3_crm/25_contacts.md (§2)` |

## 8. Thông báo và nhật ký

- Nhắc ngày sinh nhật liên hệ để gửi lời chúc.
- Chưa có thông báo khi liên hệ đổi công ty.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng liên hệ | Tên, chức danh, số điện thoại, thư điện tử, ngày sinh, khách hàng mẹ | `Mo ta nghiep vu/MD_ERP/3_crm/25_contacts.md (§1)` |
| Bảng vai trò trong cơ hội | Liên hệ, cơ hội, vai trò | `Mo ta nghiep vu/MD_ERP/3_crm/25_contacts.md (§2)` |
| Bảng chia sẻ liên hệ | Người nhận chia sẻ, phạm vi | `Mo ta nghiep vu/MD_ERP/3_crm/25_contacts.md (§2)` |

## 10. Màn hình

- Hồ sơ Khách hàng 360 độ (`src/components/Customers.tsx:203`).
- Chưa có màn hình danh bạ liên hệ riêng.

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho liên hệ gắn với khách hàng, Khi lưu, Thì liên hệ hiển thị trong hồ sơ khách hàng 360 độ.
- **AC-02.** Cho liên hệ không gắn khách hàng, Khi lưu, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-03.** Cho liên hệ có ngày sinh trong ngày, Khi đến mốc nhắc, Thì hệ thống gửi nhắc cho nhân viên phụ trách (ca bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại hồ sơ khách hàng 360 độ để hiển thị liên hệ.
- Cần bổ sung bảng vai trò trong cơ hội và bảng chia sẻ liên hệ.

## 13. Giả định và câu hỏi mở

- **GD-01.** Một liên hệ chỉ thuộc một khách hàng tại một thời điểm.
- **Q-01.** Có cần lưu lịch sử đổi công ty của liên hệ không?
- **Q-02.** Kênh gửi lời chúc sinh nhật là thư điện tử hay tin nhắn Zalo?

## 14. Ghi chú kỹ thuật

- Có thể dùng lại dịch vụ ZNS để gửi lời chúc sinh nhật (`src/services/znsService.ts:212`).

## Chưa xác minh được

- Chưa xác minh được bảng liên hệ có tồn tại độc lập hay nằm trong bảng khách hàng.
- Chưa xác minh được cơ chế nhắc sinh nhật.
- Chưa xác minh được phạm vi chia sẻ liên hệ.
