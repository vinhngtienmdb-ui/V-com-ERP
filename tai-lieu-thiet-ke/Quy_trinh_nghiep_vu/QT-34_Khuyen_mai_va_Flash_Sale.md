# QT-34 — Khuyến mãi và Flash Sale

- Dự án: VComm
- Mã quy trình: QT-34
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-15 Marketing và Social (`/marketing`) và MOD-16 Flash Sale và Mua chung (`/flash-sale`)
- Hiện trạng mã nguồn: Đã có — màn hình marketing và màn hình khuyến mãi với các mốc giảm giá nhiều bậc

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên marketing | Tạo chiến dịch, tạo mã giảm giá, chọn sản phẩm flash sale | `src/components/Marketing.tsx:481`, `src/components/FlashSale.tsx:407` |
| Người bán | Tạo khuyến mãi cho sản phẩm của mình | `server.ts:3829` (qua `requireSellerAuth`) |
| Hệ thống | Áp mốc giảm giá nhiều bậc khi tính giá | `src/components/FlashSale.tsx:255` |

## 2. Điều kiện trước

- Đã có sản phẩm đang bán và danh mục ngành hàng.
- Đã có khung thời gian chạy khuyến mãi.

## 3. Luồng chính

1. Nhân viên marketing tạo chiến dịch marketing và danh sách mã giảm giá.
2. Chọn sản phẩm tham gia flash sale và thiết lập các mốc giảm giá nhiều bậc.
3. Hệ thống kiểm tra khung thời gian và điều kiện áp dụng.
4. Khi khách đặt hàng trong khung thời gian, hệ thống áp mốc giảm giá tương ứng.
5. Hệ thống ghi nhận doanh thu theo giá đã giảm và phát sự kiện cho kế toán.

## 4. Sơ đồ

```
[Tạo chiến dịch + mã giảm giá]
            |
            v
[Chọn sản phẩm + thiết lập mốc giảm giá nhiều bậc :255]
            |
            v
[Kiểm khung thời gian và điều kiện]
            |
            v
[Khách đặt hàng] --> [Áp mốc giảm giá theo số lượng]
            |
            v
[Ghi nhận doanh thu theo giá đã giảm] --> [Sự kiện cho kế toán]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Chồng lấn khung thời gian giữa hai khuyến mãi cùng sản phẩm | Cảnh báo hoặc chặn tạo khuyến mãi trùng | `src/components/FlashSale.tsx:155` |
| E2 | Mốc giảm giá không giảm dần theo số lượng | Chặn lưu cấu hình mốc | `src/components/FlashSale.tsx:255` |
| E3 | Người bán tạo khuyến mãi cho sản phẩm không thuộc mình | Từ chối qua kiểm tra quyền người bán | `server.ts:424` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Khuyến mãi: Nháp --> Đã lên lịch --> Đang chạy --> Đã kết thúc
Khuyến mãi --hủy trước khi chạy--> Đã hủy
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Giá bán sau giảm áp theo mốc nhiều bậc tương ứng số lượng mua | `src/components/FlashSale.tsx:255` |
| BR-02 | Người bán chỉ tạo được khuyến mãi cho sản phẩm của mình | `server.ts:424` |
| BR-03 | Khuyến mãi chỉ áp trong khung thời gian đã cấu hình | `src/components/FlashSale.tsx:155` |

## 8. Thông báo và nhật ký

- Chưa xác minh được có thông báo cho khách khi khuyến mãi bắt đầu hay không.
- Chưa xác minh được nhật ký kiểm toán cho thay đổi khuyến mãi.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng khuyến mãi | Tên, thời gian, loại giảm giá, phạm vi áp dụng | `src/components/FlashSale.tsx:155` |
| Bảng mốc giảm giá | Số lượng tối thiểu, mức giảm | `src/components/FlashSale.tsx:255` |
| Bảng mã giảm giá | Mã, điều kiện, hạn dùng | `src/components/Marketing.tsx:340` |

## 10. Màn hình

- Marketing và Omnichannel (`src/components/Marketing.tsx:115`).
- Danh sách mã giảm giá (`src/components/Marketing.tsx:340`).
- Tạo chiến dịch Marketing (`src/components/Marketing.tsx:481`).
- Khuyến mãi và Mua chung (`src/components/FlashSale.tsx:155`).
- Các mốc giảm giá nhiều bậc (`src/components/FlashSale.tsx:255`).
- Thêm Sản phẩm Flash Sale (`src/components/FlashSale.tsx:407`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho khách mua đủ số lượng mốc hai, Khi tính giá, Thì áp đúng mức giảm của mốc hai.
- **AC-02.** Cho cấu hình mốc giảm giá không giảm dần, Khi lưu, Thì hệ thống chặn (ca thất bại bắt buộc).
- **AC-03.** Cho khuyến mãi ngoài khung thời gian, Khi khách đặt hàng, Thì giá không được giảm (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình marketing và khuyến mãi đã có.
- Cần bổ sung kiểm tra chồng lấn khung thời gian nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Một sản phẩm chỉ tham gia một khuyến mãi tại một thời điểm.
- **Q-01.** Có cho phép cộng dồn nhiều khuyến mãi trên cùng một đơn không?
- **Q-02.** Mức giảm tối đa cho phép là bao nhiêu phần trăm?

## 14. Ghi chú kỹ thuật

- Có tệp kiểm thử cho dịch vụ mua chung nhưng chưa xác minh được kiểm thử riêng cho khuyến mãi.

## Chưa xác minh được

- Chưa xác minh được quy tắc chồng lấn khuyến mãi.
- Chưa xác minh được có cộng dồn khuyến mãi hay không.
- Chưa xác minh được mức giảm tối đa cho phép.
