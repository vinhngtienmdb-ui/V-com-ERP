# Cho thuê và Trả góp Thiết bị — TẠM HỦY

> **TẠM HỦY 2026-10-09.** Quy trình này được dời khỏi cây đang hoạt động. Lý do: Tạm hủy 2026-10-05 theo yêu cầu chủ dự án. Tệp lưu trữ không mang mã QT; mã cũ là QT-50. Xem `_Tam_huy/README.md`.

- Dự án: VComm
- Mã quy trình: QT-50 (tạm hủy 2026-10-09)
- Phiên bản: 1.0
- Trạng thái: Tạm hủy
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-34 Cho thuê thiết bị (`/device-leasing`)
- Hiện trạng mã nguồn: Đã có — màn hình cho thuê và trả góp thiết bị với hồ sơ chi tiết và theo dõi thanh toán

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên cho thuê | Lập hồ sơ thuê hoặc trả góp, theo dõi thanh toán | `src/components/DeviceLeasing.tsx:1952`, `:1467` |
| Khách hàng | Ký hồ sơ thuê, thanh toán định kỳ | `src/components/DeviceLeasing.tsx:1952` |
| Kế toán | Theo dõi doanh thu và nợ quá hạn | `src/components/DeviceLeasing.tsx:1277`, `:1314` |

## 2. Điều kiện trước

- Đã có danh mục thiết bị và biểu giá thuê hoặc trả góp.
- Đã có chính sách thời hạn thuê và lãi suất trả góp.

## 3. Luồng chính

1. Nhân viên mở hồ sơ xin thuê hoặc trả góp thiết bị (`DeviceLeasing.tsx:1952`).
2. Hệ thống kiểm tra điều kiện và lập lịch thanh toán.
3. Khách hàng ký hồ sơ và nhận thiết bị.
4. Hệ thống theo dõi doanh thu dự kiến và thực tế thu (`DeviceLeasing.tsx:1277`).
5. Hệ thống theo dõi tỉ lệ thanh toán đúng hạn và nợ quá hạn (`DeviceLeasing.tsx:1314`).
6. Khi thu đủ, hệ thống đóng hồ sơ và chuyển quyền sở hữu nếu là trả góp.

## 4. Sơ đồ

```
[Mở hồ sơ thuê hoặc trả góp :1952]
            |
            v
[Kiểm điều kiện + lập lịch thanh toán]
            |
            v
[Ký hồ sơ + nhận thiết bị]
            |
            v
[Theo dõi doanh thu dự kiến và thực tế :1277]
            |
            v
[Theo dõi thanh toán đúng hạn và nợ quá hạn :1314]
            |
            v
[Thu đủ --> đóng hồ sơ / chuyển quyền sở hữu]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Khách không đủ điều kiện thuê | Từ chối mở hồ sơ | `src/components/DeviceLeasing.tsx:1952` |
| E2 | Thanh toán quá hạn | Ghi nhận nợ quá hạn và nhắc thanh toán | `src/components/DeviceLeasing.tsx:1314` |
| E3 | Thiết bị bị mất hoặc hỏng | Xử lý theo điều khoản hợp đồng thuê | `src/components/DeviceLeasing.tsx:1467` |
| E4 | Bút toán lệch Nợ/Có | Từ chối ghi sổ | `src/services/dbService.ts:1888` |

## 6. Máy trạng thái

```
Hồ sơ thuê: Mới --> Đang hiệu lực --> Đã trả thiết bị --> Đã đóng
Hồ sơ trả góp: Mới --> Đang trả góp --> Đã tất toán --> Đã chuyển quyền sở hữu
Đang trả góp --quá hạn--> Nợ quá hạn
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Lịch thanh toán lập theo điều khoản hồ sơ | `src/components/DeviceLeasing.tsx:1952` |
| BR-02 | Doanh thu dự kiến và thực tế thu theo dõi song song | `src/components/DeviceLeasing.tsx:1277` |
| BR-03 | Chỉ chuyển quyền sở hữu khi tất toán đủ | `src/components/DeviceLeasing.tsx:1314` |

## 8. Thông báo và nhật ký

- Nhắc thanh toán đến hạn và quá hạn.
- Chưa xác minh được kênh nhắc thanh toán.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng hồ sơ thuê, trả góp | Khách hàng, thiết bị, giá trị, kỳ hạn, trạng thái | `src/components/DeviceLeasing.tsx:1952` |
| Bảng lịch thanh toán | Kỳ, số tiền, hạn, trạng thái | `src/components/DeviceLeasing.tsx:1277` |
| Bảng thiết bị cho thuê | Mã thiết bị, loại, tình trạng | `src/components/DeviceLeasing.tsx:1248` |

## 10. Màn hình

- Trả Góp và Cho Thuê Thiết Bị (`src/components/DeviceLeasing.tsx:1129`, tuyến `/device-leasing`, 2.363 dòng).
- Cơ cấu loại thiết bị thuê (`src/components/DeviceLeasing.tsx:1248`).
- Doanh thu dự kiến so với thực tế thu (`src/components/DeviceLeasing.tsx:1277`).
- Tỷ lệ thanh toán đúng hạn và nợ quá hạn (`src/components/DeviceLeasing.tsx:1314`).
- Hồ sơ chi tiết (`src/components/DeviceLeasing.tsx:1467`).
- Mở Đơn Xin Thuê hoặc Trả Góp (`src/components/DeviceLeasing.tsx:1952`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho khách đủ điều kiện, Khi mở hồ sơ trả góp, Thì hệ thống lập lịch thanh toán đúng điều khoản.
- **AC-02.** Cho kỳ thanh toán quá hạn, Khi quét định kỳ, Thì hồ sơ vào danh sách nợ quá hạn (ca bắt buộc).
- **AC-03.** Cho hồ sơ chưa tất toán, Khi chuyển quyền sở hữu, Thì hệ thống chặn (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình cho thuê thiết bị và cổng ghi sổ chung.
- Cần bổ sung chính sách lãi suất và điều khoản thuê nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Thiết bị cho thuê thuộc sở hữu của đơn vị.
- **Q-01.** Lãi suất trả góp tính theo dư nợ giảm dần hay cố định?
- **Q-02.** Có cần quản lý tình trạng thiết bị sau khi trả lại không?

## 14. Ghi chú kỹ thuật

- Màn hình cho thuê thiết bị thuộc nhóm lớn trong kho mã (2.363 dòng).

## Chưa xác minh được

- Chưa xác minh được chính sách lãi suất trả góp.
- Chưa xác minh được quy trình nhận lại và kiểm tra thiết bị.
- Chưa xác minh được kênh nhắc thanh toán.
