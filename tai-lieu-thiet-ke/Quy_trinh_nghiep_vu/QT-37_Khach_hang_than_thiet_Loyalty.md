# QT-37 — Khách hàng thân thiết (Loyalty) — Tầng giao diện và giữ chân

- Dự án: VComm
- Mã quy trình: QT-37
- Phiên bản: 2.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án), mã nguồn `_recovery_V-com-ERP`, và Quyết định chủ dự án 2026-10-09 (xem `Phan_tich_chong_cheo_iPOS_Hub_MuaChung_VXu.md`, mục 6.1 quyết định 3 và mục 4.3)
- Mô-đun hệ thống: MOD-23 Khách hàng thân thiết (`/loyalty`) — tầng giao diện; động cơ điểm nằm ở MOD-21 V-Xu (QT-35)
- Hiện trạng mã nguồn: Đã có màn hình Loyalty, nhưng là **giao diện giả** (không có lời gọi cơ sở dữ liệu); động cơ điểm thật là V-Xu

> Quyết định chủ dự án ngày 2026-10-09 (quyết định 3): **V-Xu là động cơ điểm duy nhất**. Loyalty không còn là sổ điểm riêng mà trở thành **tầng giao diện và giữ chân** đọc dữ liệu từ V-Xu. Bản 1.0 mô tả Loyalty là một động cơ điểm độc lập với bảng `loyalty_points_ledger` và trường `points` — mô hình đó bị bãi bỏ, hai sổ này phải gộp vào V-Xu (xem QT-35, mục 9 và 12). Xem mục 12.

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Khách hàng | Xem hạng, điểm V-Xu, ưu đãi và quà đặc quyền (dữ liệu từ V-Xu) | `src/components/VXu.tsx:10` (`import * as vxu from '../services/vxuService'`) |
| Nhân viên chăm sóc khách hàng | Quản lý danh sách thành viên, gửi tin nhắn chăm sóc ZNS, tặng quà đặc quyền | `src/components/Loyalty.tsx:255`, `:374`; `src/services/znsService.ts:255` |
| Hệ thống | Dự đoán khả năng rời bỏ, gợi ý quà giữ chân | `src/components/Loyalty.tsx:482` |

## 2. Điều kiện trước

- Đã có tài khoản V-Xu cho khách (tự tạo khi chưa có) — xem QT-35.
- Đã cấu hình mẫu tin nhắn chăm sóc khách hàng ZNS.
- Đã có danh sách quà tặng đặc quyền theo hạng.

## 3. Luồng chính

1. Khách hàng mở màn hình Loyalty; hệ thống **đọc hạng, điểm V-Xu và ưu đãi từ V-Xu** (`src/components/VXu.tsx:10`).
2. Nhân viên chăm sóc gửi tin nhắn chăm sóc ZNS theo mẫu đã cấu hình (`src/services/znsService.ts:255` — hàm `sendZnsNotification`).
3. Hệ thống phân tích hành vi để dự đoán khả năng rời bỏ (`Loyalty.tsx:482`).
4. Khách đủ điều kiện nhận quà tặng hoặc ưu đãi đặc quyền; nhân viên thực hiện tặng quà (`Loyalty.tsx:374`).
5. Hệ thống gợi ý hoạt động giữ chân (điểm danh, trò chơi thói quen, hội viên trả phí — tham chiếu 省钱月卡) dựa trên điểm V-Xu.

## 4. Sơ đồ

```
[Khách mở Loyalty] --> [Đọc hạng/điểm V-Xu :VXu.tsx:10]
                                |
                                v
        +-----------------------+-----------------------+
        |                                               |
        v                                               v
[ZNS chăm sóc :znsService.ts:255]          [Dự đoán rời bỏ :Loyalty.tsx:482]
        |                                               |
        v                                               v
[Quà tặng đặc quyền :Loyalty.tsx:374]     [Gợi ý giữ chân]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Khách chưa đủ điều kiện nhận quà tặng | Không cho nhận; hiển thị mục tiêu lên hạng còn thiếu | `src/components/Customers.tsx:256` |
| E2 | Tin nhắn ZNS gửi trùng hoặc thất bại | Cần cơ chế chống gửi trùng; `sendZnsNotification` trả về trạng thái | `src/services/znsService.ts:255` |
| E3 | Màn hình Loyalty không nối được V-Xu | Hiển thị lỗi; không dùng dữ liệu giả | `src/components/Loyalty.tsx:34` (`MOCK_LOYALTY`) |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Thành viên: Mới --> Bạc --> Vàng --> Kim cương   (hạng do V-Xu quản lý, xem QT-35)
Thành viên --không phát sinh giao dịch--> Nguy cơ rời bỏ --> Đã giữ chân / Đã rời
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | **V-Xu là động cơ điểm duy nhất**; Loyalty chỉ đọc, không ghi điểm riêng | Quyết định chủ dự án 2026-10-09 (quyết định 3); QT-35 mục 7 |
| BR-02 | Màn hình Loyalty phải nối vào V-Xu; **không dùng dữ liệu giả** (`MOCK_LOYALTY`, `REWARDS`) | `src/components/Loyalty.tsx:34`, `:64`; phân tích mục 2.3 |
| BR-03 | Tin nhắn chăm sóc gửi qua hàm `sendZnsNotification` (`znsService.ts:255`), không phải `getZnsLogs` (`:212` là hàm đọc nhật ký) | `src/services/znsService.ts:255`, `:212` |
| BR-04 | Quà tặng đặc quyền chỉ áp cho hạng đủ điều kiện (hạng lấy từ V-Xu) | `src/components/Loyalty.tsx:374` |

## 8. Thông báo và nhật ký

- Gửi tin nhắn chăm sóc khách hàng qua ZNS (`src/services/znsService.ts:255`).
- Chưa xác minh được có thông báo cho khách khi điểm sắp hết hạn hay không (điểm do V-Xu quản lý — xem QT-35).
- Chưa xác minh được cơ chế chống gửi trùng tin nhắn.

## 9. Dữ liệu

| Bảng / nguồn | Cột dùng | Bằng chứng |
|---|---|---|
| **Nguồn đọc:** ví V-Xu `vxu_accounts`, sổ cái `vxu_ledger`, phiếu `vxu_redemptions` | hạng, số dư, chi tiêu lũy kế, số đơn | `src/services/vxuService.ts:98`, `:203`, `:446` |
| Bảng nhật ký tin nhắn ZNS | Người nhận, mẫu, thời điểm gửi | `src/services/znsService.ts:255` |
| ~~Bảng hạng thành viên riêng~~ | — | **Bãi bỏ** — hạng thuộc V-Xu |
| ~~Bảng thành viên `loyalty_points_ledger`~~ | — | **Gộp vào V-Xu** (QT-35 mục 9) |

## 10. Màn hình

- V-Xu (`src/components/VXu.tsx`, tuyến `/vxu`, 546 dòng) — nguồn dữ liệu thật.
- Loyalty và Club Prestige (`src/components/Loyalty.tsx:123`) — **hiện là giao diện giả**, cần nối V-Xu.
- Quản lý Thành viên VIP và Tự động hóa tin nhắn (`src/components/Loyalty.tsx:255`).
- Quà tặng đặc quyền (`src/components/Loyalty.tsx:374`).
- Động cơ giữ chân khách hàng (`src/components/Loyalty.tsx:482`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho khách mở màn hình Loyalty, Khi hệ thống đọc hạng, Thì hạng khớp với hạng V-Xu của khách (ca bắt buộc).
- **AC-02.** Cho khách chưa đủ điều kiện, Khi nhận quà tặng, Thì hệ thống từ chối (ca thất bại bắt buộc).
- **AC-03.** Cho khách lâu không giao dịch, Khi phân tích, Thì khách vào danh sách nguy cơ rời bỏ (ca bắt buộc).
- **AC-04.** Cho màn hình Loyalty đang dùng `MOCK_LOYALTY`, Khi kiểm thử, Thì hệ thống từ chối dùng dữ liệu giả và báo lỗi thiếu nối V-Xu (ca bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- **Bãi bỏ động cơ điểm riêng của Loyalty.** Bản 1.0 mô tả bảng `loyalty_points_ledger` và trường `points` trên hồ sơ khách là động cơ điểm của Loyalty. Quyết định 3 bãi bỏ điều đó: hai sổ này gộp vào V-Xu (xem QT-35 mục 12).
- **Màn hình Loyalty là giao diện giả.** `Loyalty.tsx` không có lời gọi cơ sở dữ liệu nào (`MOCK_LOYALTY` ở `:34`, `REWARDS` ở `:64`, danh sách VIP bằng `useState` ở `:72`). Phải nối vào V-Xu (`VXu.tsx:10`) thì mới có dữ liệu thật.
- **Sửa trích dẫn sai:** bản 1.0 ghi tin nhắn chăm sóc trỏ `znsService.ts:212`, nhưng dòng 212 là `getZnsLogs` (hàm đọc nhật ký); hàm gửi thật là `sendZnsNotification` ở `znsService.ts:255`.
- Giữ lại phần riêng có giá trị: tin nhắn chăm sóc, quà tặng đặc quyền, dự đoán rời bỏ.

## 13. Giả định và câu hỏi mở

- **GD-01.** Chương trình khách hàng thân thiết áp dụng cho toàn sàn, dữ liệu lấy từ V-Xu.
- **Q-01.** Ngưỡng chi tiêu cho từng hạng là bao nhiêu? (do V-Xu quản lý — xem QT-35)
- **Q-02.** Có thêm tầng hội viên trả phí theo tháng không (tham chiếu 省钱月卡)?
- **Q-03.** Cơ chế chống gửi trùng tin nhắn ZNS nằm ở đâu?

## 14. Ghi chú kỹ thuật

- Hàm gửi ZNS hỗ trợ mẫu tin theo loại sự kiện (`src/services/znsService.ts:32`); hàm gửi thật là `sendZnsNotification` (`:255`), hàm đọc nhật ký là `getZnsLogs` (`:212`).
- Màn hình Loyalty có thể bịa dữ liệu (`MOCK_LOYALTY`); rủi ro cao nếu đem đi demo — phải nối V-Xu trước khi trình bày.

## Chưa xác minh được

- Chưa xác minh được ngưỡng chi tiêu từng hạng (do V-Xu quản lý).
- Chưa xác minh được cơ chế chống gửi trùng tin nhắn.
- Chưa xác minh được thuật toán dự đoán khả năng rời bỏ.
- Chưa xác minh được dịch vụ ZNS có gửi tin thật qua API hay chỉ lưu cục bộ — `znsService.ts` đọc/ghi `localStorage` ở nhiều hàm (`:108`, `:146`, `:212`).
