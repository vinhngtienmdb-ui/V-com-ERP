# QT-31 — Mua chung

- Dự án: VComm
- Mã quy trình: QT-31
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-17 Mua chung (`/group-buy`)
- Hiện trạng mã nguồn: Đã có — có dịch vụ mua chung đầy đủ vòng đời và tệp kiểm thử đi kèm

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Người mua | Tham gia phiên mua chung, rời phiên trước khi chốt | `src/services/groupBuyService.ts:210`, `:259` |
| Người bán hoặc ban tổ chức | Tạo phiên mua chung, chốt phiên | `src/services/groupBuyService.ts:162`, `:307` |
| Hệ thống | Chốt phiên khi đủ điều kiện và sinh đơn cho người tham gia | `src/services/groupBuyService.ts:307` |

## 2. Điều kiện trước

- Đã có sản phẩm và giá theo bậc số lượng.
- Đã cấu hình thời gian mở và đóng phiên.

## 3. Luồng chính

1. Ban tổ chức tạo phiên mua chung với giá theo bậc số lượng.
2. Hệ thống mở phiên và hiển thị danh sách phiên đang mở (`groupBuyService.ts:79`).
3. Người mua tham gia phiên (`groupBuyService.ts:210`).
4. Người mua có thể rời phiên trước khi chốt (`groupBuyService.ts:259`).
5. Hệ thống theo dõi số người tham gia và giá theo bậc (`groupBuyService.ts:76`).
6. Khi đủ điều kiện hoặc hết thời gian, hệ thống chốt phiên (`groupBuyService.ts:307`).
7. Sinh đơn hàng cho người tham gia theo giá đã chốt.

## 4. Sơ đồ

```
[Tạo phiên mua chung :162]
            |
            v
[Mở phiên] --> [Người mua tham gia :210]
            |
            v
[Theo dõi số người + resolveTierPrice :76]
            |
            +-----------+-----------+
            |                       |
            v                       v
[Người mua rời phiên :259]   [Đủ điều kiện chốt]
                                    |
                                    v
                            [Chốt phiên :307]
                                    |
                                    v
                            [Sinh đơn theo giá chốt]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Tham gia phiên đã đóng | Từ chối tham gia | `src/services/groupBuyService.ts:210` |
| E2 | Rời phiên sau khi đã chốt | Từ chối rời | `src/services/groupBuyService.ts:259` |
| E3 | Chốt phiên khi chưa đủ số người tối thiểu | Không chốt hoặc chốt theo cấu hình cho phép | `src/services/groupBuyService.ts:307` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Phiên mua chung: Nháp --> Đang mở --> Đã chốt --> Đã hoàn tất
Đang mở --hết thời gian không đủ người--> Đã hủy
Người tham gia: Đã tham gia --> Đã rời / Đã chốt đơn
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Giá áp theo bậc số lượng người tham gia | `src/services/groupBuyService.ts:76` |
| BR-02 | Chỉ rời phiên được trước khi chốt | `src/services/groupBuyService.ts:259` |
| BR-03 | Chốt phiên là thao tác một chiều, không hoàn tác | `src/services/groupBuyService.ts:307` |

## 8. Thông báo và nhật ký

- Chưa xác minh được có thông báo cho người tham gia khi phiên chốt hay không.
- Có tệp kiểm thử cho dịch vụ mua chung (`src/services/groupBuyService.ts` đi kèm kiểm thử).

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng phiên mua chung | Mã phiên, sản phẩm, thời gian, trạng thái | `src/services/groupBuyService.ts:162` |
| Bảng người tham gia | Người mua, số lượng, thời điểm tham gia | `src/services/groupBuyService.ts:122` |
| Bảng bậc giá | Số người tối thiểu, giá tương ứng | `src/services/groupBuyService.ts:65` |

## 10. Màn hình

- Mua chung (`src/components/GroupBuy.tsx`, tuyến `/group-buy`, 720 dòng).
- Người tham gia (`src/components/GroupBuy.tsx:417`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho phiên đang mở, Khi người mua tham gia, Thì người mua vào danh sách phiên.
- **AC-02.** Cho phiên đã chốt, Khi người mua rời, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-03.** Cho phiên đủ số người tối thiểu, Khi chốt, Thì giá áp theo bậc tương ứng.
- **AC-04.** Cho phiên đã chốt, Khi chốt lần hai, Thì hệ thống chặn (ca thất bại bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại dịch vụ mua chung và màn hình đã có.
- Cần bổ sung luồng sinh đơn hàng tự động nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Phiên mua chung gắn với một sản phẩm duy nhất.
- **Q-01.** Số người tối thiểu để chốt phiên là bao nhiêu?
- **Q-02.** Có cần đặt cọc khi tham gia phiên không?

## 14. Ghi chú kỹ thuật

- Dịch vụ mua chung là hàm thuần theo mã phiên, thuận lợi cho kiểm thử.
- Có bảng giá theo bậc chuẩn hóa qua hàm riêng (`src/services/groupBuyService.ts:65`).

## Chưa xác minh được

- Chưa xác minh được luồng sinh đơn hàng sau khi chốt phiên.
- Chưa xác minh được số người tối thiểu để chốt phiên.
- Chưa xác minh được cơ chế đặt cọc.
