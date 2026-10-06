# QT-37 — Quản lý Quảng cáo

- Dự án: VComm
- Mã quy trình: QT-37
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-15 Quản lý Quảng cáo (`/ads`)
- Hiện trạng mã nguồn: Đã có một phần — có màn hình quản lý quảng cáo nội bộ và theo dõi doanh thu quảng cáo

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên marketing | Tạo chiến dịch quảng cáo nội bộ, theo dõi hiệu quả | `src/components/AdManager.tsx:71` |
| Người bán | Mua vị trí quảng cáo trên sàn | `src/components/AdManager.tsx:359` |
| Hệ thống | Theo dõi doanh thu quảng cáo và tính giá theo thuật toán đấu giá | `src/components/AdManager.tsx:236`, `:359` |

## 2. Điều kiện trước

- Đã có vị trí quảng cáo và định dạng hiển thị.
- Đã có quy tắc đấu giá và ngân sách chiến dịch.

## 3. Luồng chính

1. Nhân viên marketing hoặc người bán tạo chiến dịch quảng cáo và đặt ngân sách.
2. Hệ thống xác định giá hiển thị theo thuật toán đấu giá (`AdManager.tsx:359`).
3. Quảng cáo hiển thị theo vị trí và khung thời gian đã đặt.
4. Hệ thống ghi nhận lượt hiển thị, lượt nhấp và chi phí.
5. Hệ thống tổng hợp doanh thu quảng cáo (`AdManager.tsx:236`).
6. Khi hết ngân sách, chiến dịch tự dừng.

## 4. Sơ đồ

```
[Tạo chiến dịch + ngân sách]
            |
            v
[Đấu giá xác định giá hiển thị :359]
            |
            v
[Hiển thị theo vị trí và khung thời gian]
            |
            v
[Ghi nhận hiển thị, nhấp, chi phí]
            |
            v
[Tổng hợp doanh thu quảng cáo :236]
            |
            v
[Hết ngân sách --> tự dừng]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Vượt ngân sách chiến dịch | Tự dừng chiến dịch | `src/components/AdManager.tsx:71` |
| E2 | Vị trí quảng cáo đã bị đặt trước | Không cho đặt trùng khung thời gian | `src/components/AdManager.tsx:71` |
| E3 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Chiến dịch: Nháp --> Đang chạy --> Tạm dừng --> Đã kết thúc
Chiến dịch --hết ngân sách--> Đã kết thúc
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Giá hiển thị xác định theo thuật toán đấu giá | `src/components/AdManager.tsx:359` |
| BR-02 | Chiến dịch tự dừng khi hết ngân sách | `src/components/AdManager.tsx:71` |
| BR-03 | Doanh thu quảng cáo tổng hợp theo kỳ | `src/components/AdManager.tsx:236` |

## 8. Thông báo và nhật ký

- Chưa xác minh được có thông báo cho người bán khi chiến dịch sắp hết ngân sách hay không.
- Chưa xác minh được nhật ký kiểm toán cho thay đổi chiến dịch.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng chiến dịch quảng cáo | Người đặt, vị trí, ngân sách, trạng thái | `src/components/AdManager.tsx:71` |
| Bảng vị trí quảng cáo | Vị trí, định dạng, khung thời gian | `src/components/AdManager.tsx:71` |
| Bảng hiệu quả quảng cáo | Hiển thị, nhấp, chi phí, doanh thu | `src/components/AdManager.tsx:236` |

## 10. Màn hình

- Quản lý Quảng cáo nội bộ (`src/components/AdManager.tsx:71`).
- Xu hướng doanh thu quảng cáo sàn (`src/components/AdManager.tsx:236`).
- Thuật toán đấu giá quảng cáo (`src/components/AdManager.tsx:359`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho chiến dịch có ngân sách, Khi chạy, Thì hệ thống ghi nhận chi phí theo lượt hiển thị.
- **AC-02.** Cho chiến dịch hết ngân sách, Khi tiếp tục chạy, Thì hệ thống tự dừng (ca bắt buộc).
- **AC-03.** Cho vị trí đã được đặt trong cùng khung thời gian, Khi đặt thêm, Thì hệ thống chặn (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình quảng cáo đã có.
- Cần bổ sung bảng đấu giá và nhật ký hiển thị nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Quảng cáo nội bộ trên sàn, chưa kết nối mạng quảng cáo bên ngoài.
- **Q-01.** Có kết nối mạng quảng cáo bên ngoài không?
- **Q-02.** Mô hình tính giá là theo lượt hiển thị hay theo lượt nhấp?

## 14. Ghi chú kỹ thuật

- Màn hình quảng cáo nhỏ (372 dòng), có thể mở rộng mà không cần tách nhỏ.

## Chưa xác minh được

- Chưa xác minh được thuật toán đấu giá đang dùng.
- Chưa xác minh được mô hình tính giá.
- Chưa xác minh được luồng thanh toán chi phí quảng cáo.
