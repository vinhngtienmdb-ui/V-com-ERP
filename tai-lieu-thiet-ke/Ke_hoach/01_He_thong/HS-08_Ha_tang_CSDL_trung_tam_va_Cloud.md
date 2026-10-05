# HS-08 — Hạ tầng CSDL trung tâm và Cloud

- Mã hệ thống: HS-08
- Thư mục mã nguồn: `Root SQL / Cloud`
- Cổng chạy mặc định: Cloud
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Vai trò trong hệ sinh thái

Supabase PostgreSQL dùng chung: Row Level Security, trigger realtime, proxy Vercel, cổng webhook SePay.

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | Hạ tầng CSDL trung tâm và Cloud |
| Thư mục mã nguồn | `Root SQL / Cloud` |
| Cổng mặc định | Cloud |
| Bằng chứng cấu trúc | Tệp schema ở gốc monorepo: `vcomm_core_schema.sql`, `vcomm_hr_schema.sql`, `vcomm_asset_schema.sql`, `create_seller_portal_tables.sql`, `update_seller_kyc_schema.sql`. |
| Đối tượng phục vụ chính | Nền tảng dữ liệu cho toàn hệ sinh thái. |

## 3. Bản đồ chức năng

Tệp schema ở gốc monorepo: `vcomm_core_schema.sql`, `vcomm_hr_schema.sql`, `vcomm_asset_schema.sql`, `create_seller_portal_tables.sql`, `update_seller_kyc_schema.sql`.

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| HS-08-F01 | Supabase PostgreSQL dùng chung: Row Level Security, trigger realtime, proxy Vercel, cổng webhook SePay. | Chưa bắt đầu | Vai trò hệ thống theo bộ nhật ký hệ sinh thái |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA.

## 5. Phụ thuộc

- Là nền tảng dữ liệu; không phụ thuộc hệ thống nào ở trên.
- Cổng API: xem `HS-02_VComm_Core_Backend.md` (cổng 5000).

## 6. Tiêu chí nghiệm thu

- [ ] Hệ thống khởi động được ở cổng Cloud.
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
