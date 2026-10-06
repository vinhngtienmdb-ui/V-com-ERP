# QT-53 — Siêu thị Offline và Bán lẻ tại quầy (POS nội bộ do VComm vận hành)

- Dự án: VComm
- Mã quy trình: QT-53
- Phiên bản: 2.0
- Trạng thái: Chờ duyệt
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-09
- Nhóm nghiệp vụ: Thương mại và Vận hành
- Nguồn nghiệp vụ: Bộ đề án `Mo ta nghiep vu/` (9 đề án), mã nguồn `_recovery_V-com-ERP`, và Quyết định chủ dự án 2026-10-09 (xem `Phan_tich_chong_cheo_iPOS_Hub_MuaChung_VXu.md`, mục 6.1 quyết định 1)
- Mô-đun hệ thống: MOD-10 Siêu thị VComm (`/vcomm-supermarket`)
- Hiện trạng mã nguồn: Đã có — màn hình siêu thị offline với quản trị kệ trưng bày và hóa đơn bán lẻ

> Quyết định chủ dự án ngày 2026-10-09 (quyết định 1): **Siêu thị VComm là POS nội bộ do VComm vận hành**, khác với iPOS (shop đối tác, ngoài repo, đa tenant). Cùng với E-Menu (QT-54) và trạm Hub `standard`/`freeze` (QT-34), siêu thị là một trong ba nơi bán lẻ do VComm vận hành. Xem mục 7 và mục 12.

## 1. Tác nhân và quyền

| Tác nhân | Quyền | Bằng chứng |
|---|---|---|
| Nhân viên bán hàng tại quầy (VComm) | Tạo đơn bán lẻ, in hóa đơn bán lẻ | `src/components/VCommSupermarket.tsx:1074` |
| Nhân viên trưng bày | Quản trị kệ trưng bày và tồn phát | `src/components/VCommSupermarket.tsx:779` |
| Hệ thống | Tính thuế bán lẻ và ghi nhận doanh thu tại quầy | `src/services/taxService.ts:142`, `src/services/accountingOutbox.ts:70` |

## 2. Điều kiện trước

- Đã có mặt hàng siêu thị và giá bán lẻ.
- Đã có quy tắc thuế áp cho bán lẻ.
- Đã phân biệt rõ siêu thị là cơ sở do VComm vận hành (không phải shop đối tác iPOS).

## 3. Luồng chính

1. Nhân viên trưng bày thêm mặt hàng lên kệ và quản trị tồn phát (`VCommSupermarket.tsx:779`, `:898`).
2. Khách chọn hàng và thanh toán tại quầy.
3. Hệ thống tính thuế bán lẻ theo quy tắc cấu hình (`taxService.ts:142`).
4. Hệ thống in hóa đơn bán lẻ (`VCommSupermarket.tsx:1074`).
5. Hệ thống ghi nhận doanh thu và phát sự kiện cho kế toán (`accountingOutbox.ts:70`).
6. Tồn kho tại quầy được cập nhật sau mỗi giao dịch.

## 4. Sơ đồ

```
[Thêm mặt hàng lên kệ :898]
            |
            v
[Quản trị kệ trưng bày và tồn phát :779]
            |
            v
[Khách thanh toán tại quầy]
            |
            v
[Tính thuế bán lẻ :142]
            |
            v
[In hóa đơn bán lẻ :1074]
            |
            v
[publishPosSaleCompleted :70] --> [Ghi sổ + cập nhật tồn]
```

## 5. Luồng lỗi

| Mã | Tình huống | Xử lý | Bằng chứng |
|---|---|---|---|
| E1 | Hết hàng tại kệ | Không cho bán; yêu cầu bổ sung hàng | `src/components/VCommSupermarket.tsx:779` |
| E2 | Chưa mở ca bán hàng | Chặn tạo đơn tại quầy | `src/components/VCommSupermarket.tsx` (hàm ca bán hàng — cần xác minh; `hubService.ts:177` bị đánh dấu mã chết) |
| E3 | Bút toán bán lẻ lệch Nợ/Có | Từ chối ghi sổ | `src/services/dbService.ts:1888` |
| E4 | Thiếu quyền xác thực | HTTP 401 | `server.ts:384` |

## 6. Máy trạng thái

```
Ca bán hàng: Đã mở --> Đang bán --> Đã đóng ca
Đơn bán lẻ: Mới --> Đã thanh toán --> Đã in hóa đơn --> Đã ghi sổ
```

## 7. Quy tắc nghiệp vụ

| Mã | Quy tắc | Bằng chứng |
|---|---|---|
| BR-01 | Thuế bán lẻ tính theo quy tắc cấu hình, không gắn cứng | `src/services/taxService.ts:142` |
| BR-02 | Đơn bán lẻ ghi nhận doanh thu qua hàng đợi ra kế toán | `src/services/accountingOutbox.ts:70` |
| BR-03 | Tồn kho tại quầy cập nhật sau mỗi giao dịch | `src/components/VCommSupermarket.tsx:779` |
| BR-04 | **Siêu thị VComm là POS nội bộ do VComm vận hành**; khác iPOS (shop đối tác, ngoài repo, đa tenant) | Quyết định 1 (2026-10-09); `src/components/VCommHub.tsx:25` (iPOS là SaaS đa tenant riêng) |
| BR-05 | Siêu thị chia sẻ mô hình POS nội bộ với E-Menu (QT-54) và trạm Hub `standard`/`freeze` (QT-34) | Quyết định 1; phân tích mục 4.1 |

## 8. Thông báo và nhật ký

- Chưa xác minh được thông báo khi hàng tại kệ sắp hết.
- Chưa xác minh được nhật ký kiểm toán cho thao tác hủy đơn tại quầy.

## 9. Dữ liệu

| Bảng | Cột dùng | Bằng chứng |
|---|---|---|
| Bảng mặt hàng siêu thị | Mã, tên, giá bán lẻ, tồn | `src/components/VCommSupermarket.tsx:898` |
| Bảng kệ trưng bày | Kệ, mặt hàng, số lượng trưng bày | `src/components/VCommSupermarket.tsx:779` |
| Bảng đơn bán lẻ | Mã đơn, mặt hàng, tổng tiền, thuế | `src/components/VCommSupermarket.tsx:1074` |
| Bảng ca bán hàng | Nhân viên, thời gian mở, thời gian đóng | `src/components/VCommSupermarket.tsx` (cần xác minh; `hubService.ts:177` là mã chết) |

## 10. Màn hình

- Siêu Thị Offline VComm (`src/components/VCommSupermarket.tsx:435`, tuyến `/vcomm-supermarket`, 1.189 dòng).
- Quản Trị Kệ Trưng Bày và Tồn Phát (`src/components/VCommSupermarket.tsx:779`).
- Thêm Mặt Hàng Siêu Thị (`src/components/VCommSupermarket.tsx:898`).
- Hóa đơn bán lẻ (`src/components/VCommSupermarket.tsx:1074`).

## 11. Tiêu chí nghiệm thu

- **AC-01.** Cho mặt hàng còn tồn tại kệ, Khi bán, Thì đơn được tạo và hóa đơn in đúng số tiền.
- **AC-02.** Cho mặt hàng hết tồn tại kệ, Khi bán, Thì hệ thống không cho bán (ca thất bại bắt buộc).
- **AC-03.** Cho đơn bán lẻ thanh toán, Khi ghi sổ, Thì doanh thu và thuế ghi đúng quy tắc cấu hình.
- **AC-04.** Cho siêu thị được gán nhầm là shop iPOS đối tác, Khi phân loại, Thì hệ thống phân biệt rõ là POS nội bộ VComm (ca bắt buộc).

## 12. Ảnh hưởng tới phần có sẵn

- Dùng lại màn hình siêu thị và hàng đợi ra kế toán.
- **Làm rõ phân loại POS:** siêu thị là POS nội bộ do VComm vận hành, khác iPOS đối tác (quyết định 1). Điều này giải quyết chồng chéo "bốn nơi cùng bán lẻ" — mỗi nơi một chủ (xem phân tích mục 2.1 và 4.1).
- **Sửa trích dẫn mã chết:** bản 1.0 ghi ca bán hàng trích `hubService.ts:177`, nhưng `hubService.ts` bị đánh dấu mã chết (phân tích mục 2.1). Cần xác minh hàm ca bán hàng thật của siêu thị trong `VCommSupermarket.tsx`.
- Cần bổ sung quản lý ca bán hàng nếu chưa có.

## 13. Giả định và câu hỏi mở

- **GD-01.** Bán lẻ tại quầy dùng chung tồn kho với kênh trực tuyến.
- **Q-01.** Có dùng chung tồn kho với kênh trực tuyến không?
- **Q-02.** Có cần kết nối máy in hóa đơn tại quầy không?
- **Q-03.** Hàm ca bán hàng thật của siêu thị nằm ở đâu (vì `hubService.ts:177` là mã chết)?

## 14. Ghi chú kỹ thuật

- Sự kiện bán hàng tại quầy đi qua hàng đợi ra (`src/services/accountingOutbox.ts:70`), bảo đảm ghi sổ ít nhất một lần.
- Màn hình siêu thị dùng chung dịch vụ tính thuế với các kênh khác (`src/services/taxService.ts:142`).

## Chưa xác minh được

- Chưa xác minh được việc dùng chung tồn kho với kênh trực tuyến.
- Chưa xác minh được kết nối máy in hóa đơn.
- Chưa xác minh được quy tắc thuế áp cho bán lẻ.
- Chưa xác minh được hàm ca bán hàng thật của siêu thị (vì `hubService.ts:177` bị đánh dấu mã chết).
