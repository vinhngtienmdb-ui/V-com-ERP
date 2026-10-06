# QT-37 — Khách hàng thân thiết

- Dự án: VComm
- Mã quy trình: QT-37
- Phiên bản: 1.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án) và mã nguồn `_recovery_V-com-ERP`
- Mô-đun hệ thống: MOD-23 Khách hàng thân thiết (`/loyalty`)
- Hiện trạng mã nguồn: Đã có — có màn hình khách hàng thân thiết, quản lý thành viên và tự động hóa tin nhắn

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên chăm sóc khách hàng | Quản lý thành viên, quà tặng đặc quyền | `src/components/Loyalty.tsx:255`, `:374` |
| Khách hàng | Tích điểm, lên hạng, nhận ưu đãi | `src/components/Loyalty.tsx:123` |
| Hệ thống | Tự động hóa tin nhắn chăm sóc và dự đoán khả năng rời bỏ | `src/components/Loyalty.tsx:482` |

## 2. Điều kiện trước

- Đã có hạng thành viên và quy tắc tích điểm.
- Đã cấu hình mẫu tin nhắn chăm sóc khách hàng.

## 3. Luồng chính

1. Khách hàng được xếp hạng dựa trên chi tiêu tích lũy.
2. Hệ thống tự động gửi tin nhắn chăm sóc theo mẫu đã cấu hình (`znsService.ts:212`).
3. Nhân viên chăm sóc quản lý danh sách thành viên và quà tặng đặc quyền.
4. Hệ thống phân tích hành vi để dự đoán khả năng rời bỏ (`Loyalty.tsx:482`).
5. Khách đủ điều kiện nhận quà tặng hoặc ưu đãi đặc quyền.

## 4. Sơ đồ

```
[Chi tiêu tích lũy] --> [Xếp hạng thành viên]
                                |
                                v
                    [Tự động hóa tin nhắn ZNS]
                                |
            +-------------------+-------------------+
            |                                       |
            v                                       v
    [Quà tặng đặc quyền]              [Dự đoán khả năng rời bỏ]
            |                                       |
            +-------------------+-------------------+
                                |
                                v
                    [Ưu đãi giữ chân khách]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Khách chưa đủ điều kiện nhận quà tặng | Không cho nhận; hiển thị mục tiêu lên hạng còn thiếu | `src/components/Customers.tsx:256` |
| E2 | Tin nhắn chăm sóc gửi trùng | Cần cơ chế chống gửi trùng | `src/services/znsService.ts:212` |
| E3 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Thành viên: Mới --> Bạc --> Vàng --> Kim cương
Thành viên --không phát sinh giao dịch--> Nguy cơ rời bỏ --> Đã giữ chân / Đã rời
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Hạng thành viên xác định theo chi tiêu tích lũy | `src/components/Customers.tsx:888` |
| BR-02 | Tin nhắn chăm sóc gửi theo mẫu đã cấu hình | `src/services/znsService.ts:212` |
| BR-03 | Quà tặng đặc quyền chỉ áp cho hạng đủ điều kiện | `src/components/Loyalty.tsx:374` |

## 8. Thông báo và nhật ký

- Tự động gửi tin nhắn chăm sóc khách hàng theo mẫu (`src/services/znsService.ts:212`).
- Chưa xác minh được cơ chế chống gửi trùng tin nhắn.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng hạng thành viên | Tên hạng, điều kiện, quyền lợi | `src/components/Customers.tsx:888` |
| Bảng thành viên | Khách hàng, hạng, điểm tích lũy | `src/components/Loyalty.tsx:255` |
| Bảng quà tặng đặc quyền | Quà tặng, hạng áp dụng, điều kiện | `src/components/Loyalty.tsx:374` |
| Bảng nhật ký tin nhắn | Người nhận, mẫu, thời điểm gửi | `src/services/znsService.ts:212` |

## 10. Màn hình

- Loyalty và Club Prestige (`src/components/Loyalty.tsx:123`).
- Quản lý Thành viên VIP và Tự động hóa tin nhắn (`src/components/Loyalty.tsx:255`).
- Quà tặng đặc quyền (`src/components/Loyalty.tsx:374`).
- Động cơ giữ chân khách hàng (`src/components/Loyalty.tsx:482`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho khách đạt ngưỡng chi tiêu, Khi tính hạng, Thì hạng được nâng đúng quy tắc.
- **AC-02.** Cho khách chưa đủ điều kiện, Khi nhận quà tặng, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-03.** Cho khách lâu không giao dịch, Khi phân tích, Thì khách vào danh sách nguy cơ rời bỏ (ca bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình khách hàng thân thiết và dịch vụ tin nhắn.
- Cần bổ sung cơ chế chống gửi trùng tin nhắn nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Chương trình khách hàng thân thiết áp dụng cho toàn sàn.
- **Q-01.** Ngưỡng chi tiêu cho từng hạng là bao nhiêu?
- **Q-02.** Quà tặng đặc quyền gồm những gì?

## 14. Ghi chú kỹ thuật

- Dịch vụ tin nhắn hỗ trợ mẫu tin theo loại sự kiện (`src/services/znsService.ts:32`).

## Chưa xác minh được

- Chưa xác minh được ngưỡng chi tiêu từng hạng.
- Chưa xác minh được cơ chế chống gửi trùng tin nhắn.
- Chưa xác minh được thuật toán dự đoán khả năng rời bỏ.
