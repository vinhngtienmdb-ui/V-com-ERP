# QT-39 — Livestream bán hàng

> **LOẠI BỎ 2026-10-06.** Chủ dự án chốt loại bỏ quy trình Livestream bán hàng (mô-đun MOD-12 đã loại bỏ). Tệp lưu trữ không mang mã QT; mã cũ là **QT-39**. Xem `_Tam_huy/README.md`.

- Dự án: VComm
- Mã quy trình: QT-39
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-12 Quản lý Livestream (`/live`)
- Hiện trạng mã nguồn: Đã có một phần — có màn hình trung tâm livestream, quy mô nhỏ

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên vận hành livestream | Lên lịch phiên live, gắn sản phẩm, theo dõi đơn | `src/components/LiveCommerce.tsx:58` |
| Người xem | Xem live và đặt hàng trong phiên | `src/components/LiveCommerce.tsx:58` |
| Hệ thống | Ghi nhận đơn phát sinh trong phiên live | `src/components/LiveCommerce.tsx:197` |

## 2. Điều kiện trước

- Đã có sản phẩm đang bán và lịch phát sóng.
- Đã có kênh phát sóng.

## 3. Luồng chính

1. Nhân viên lên lịch phiên live và gắn danh sách sản phẩm.
2. Phiên live bắt đầu; hệ thống mở trung tâm quản lý phiên (`LiveCommerce.tsx:197`).
3. Người xem đặt hàng trong phiên; hệ thống ghi nhận đơn gắn mã phiên live.
4. Khi phiên kết thúc, hệ thống tổng hợp đơn và doanh thu theo phiên.
5. Đơn hàng đi vào luồng xử lý đơn chung.

## 4. Sơ đồ

```
[Lên lịch phiên live + gắn sản phẩm]
            |
            v
[Phiên live bắt đầu :197]
            |
            v
[Người xem đặt hàng] --> [Ghi nhận đơn gắn mã phiên]
            |
            v
[Kết thúc phiên] --> [Tổng hợp đơn và doanh thu]
            |
            v
[Đơn vào luồng xử lý đơn chung QT-27]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Đặt hàng sau khi phiên đã kết thúc | Không gắn được vào phiên; đơn xử lý như đơn thường | `src/components/LiveCommerce.tsx:58` |
| E2 | Sản phẩm trong phiên hết hàng | Không cho đặt; hiển thị hết hàng | `src/components/LiveCommerce.tsx:58` |
| E3 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Phiên live: Đã lên lịch --> Đang phát --> Đã kết thúc --> Đã tổng kết
Đơn trong phiên: Mới --> Đã xác nhận --> Hoàn tất
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Đơn phát sinh trong phiên được gắn mã phiên live | `src/components/LiveCommerce.tsx:197` |
| BR-02 | Đơn trong phiên xử lý theo luồng đơn hàng chung | `src/components/Orders.tsx` |

## 8. Thông báo và nhật ký

- Chưa xác minh được có thông báo cho người theo dõi khi phiên bắt đầu hay không.
- Chưa xác minh được nhật ký kiểm toán cho phiên live.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng phiên live | Mã phiên, thời gian, người dẫn, trạng thái | `src/components/LiveCommerce.tsx:58` |
| Bảng sản phẩm trong phiên | Sản phẩm, thứ tự, giá bán trong phiên | `src/components/LiveCommerce.tsx:58` |
| Bảng đơn trong phiên | Mã đơn, mã phiên, người mua | `src/components/LiveCommerce.tsx:197` |

## 10. Màn hình

- Trung tâm Live-commerce (`src/components/LiveCommerce.tsx:58`).
- Trung tâm quản lý live (`src/components/LiveCommerce.tsx:197`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho phiên live đang phát, Khi người xem đặt hàng, Thì đơn được gắn mã phiên.
- **AC-02.** Cho sản phẩm hết hàng trong phiên, Khi người xem đặt, Thì hệ thống không cho đặt (ca thất bại bắt buộc).
- **AC-03.** Cho phiên kết thúc, Khi tổng kết, Thì doanh thu theo phiên khớp tổng đơn trong phiên.

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình livestream và luồng đơn hàng chung.
- Cần bổ sung bảng phiên live và bảng sản phẩm trong phiên nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Livestream phát trên kênh ngoài, hệ thống chỉ quản lý phiên và đơn.
- **Q-01.** Kênh phát sóng là nền tảng nào?
- **Q-02.** Có cần đồng bộ tồn kho theo thời gian thực trong phiên live không?

## 14. Ghi chú kỹ thuật

- Màn hình livestream nhỏ (222 dòng), là màn hình nhỏ nhất trong nhóm thương mại.

## Chưa xác minh được

- Chưa xác minh được kênh phát sóng.
- Chưa xác minh được cơ chế đồng bộ tồn kho trong phiên.
- Chưa xác minh được luồng tổng kết doanh thu phiên.
