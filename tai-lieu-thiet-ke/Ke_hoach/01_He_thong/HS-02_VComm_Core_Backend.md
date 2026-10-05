# HS-02 — VComm Core Backend

- Mã hệ thống: HS-02
- Thư mục mã nguồn: `vcomm-core-backend`
- Cổng chạy mặc định: 5000
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Vai trò trong hệ sinh thái

Dịch vụ backend tập trung NestJS: GatewayModule đa kênh, viết lại tuyến đường trong suốt `/api/*` sang `/api/v1/*`.

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | VComm Core Backend |
| Thư mục mã nguồn | `vcomm-core-backend` |
| Cổng mặc định | 5000 |
| Bằng chứng cấu trúc | `src/modules` gồm 11 module: auth, catalog, crm, gateway, hr, integrations, inventory, orders, payments, seller, wallets (12 tệp controller). |
| Đối tượng phục vụ chính | Cổng API dùng chung cho toàn bộ hệ sinh thái. |

## 3. Bản đồ chức năng

`src/modules` gồm 11 module: auth, catalog, crm, gateway, hr, integrations, inventory, orders, payments, seller, wallets (12 tệp controller).

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| HS-02-F01 | Dịch vụ backend tập trung NestJS: GatewayModule đa kênh, viết lại tuyến đường trong suốt `/api/*` sang `/api/v1/*`. | Chưa bắt đầu | Vai trò hệ thống theo bộ nhật ký hệ sinh thái |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA.

## 5. Phụ thuộc

- Hạ tầng dữ liệu: xem `HS-08_Ha_tang_CSDL_trung_tam.md`.
- Cổng API: xem `HS-02_VComm_Core_Backend.md` (cổng 5000).

## 6. Tiêu chí nghiệm thu

- [ ] Hệ thống khởi động được ở cổng 5000.
- [ ] Kết nối được cổng API trung tâm.
- [ ] Có kiểm thử cho luồng chính.
- [ ] Danh mục tính năng ở mục 4 đã được duyệt.

## 7. Rủi ro và việc còn mở

- Danh mục tính năng chi tiết chưa được duyệt (cần bước BA).
- Chưa đối chiếu đầy đủ giữa tài liệu và mã nguồn thật của hệ thống này.

## 8. Chưa xác minh được

- Mức độ hoàn thiện thật của từng chức năng.
- Danh sách bảng dữ liệu riêng của hệ thống.
- Tình trạng kiểm thử tự động của hệ thống.
