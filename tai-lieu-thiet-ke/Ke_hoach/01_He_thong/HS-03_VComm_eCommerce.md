# HS-03 — VComm eCommerce

- Mã hệ thống: HS-03
- Thư mục mã nguồn: `vcomm-ecommerce`
- Cổng chạy mặc định: 5173
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Vai trò trong hệ sinh thái

Sàn thương mại điện tử đa kênh B2C/B2B, mua chung, livestream, vòng quay may mắn, ví và V-Xu.

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | VComm eCommerce |
| Thư mục mã nguồn | `vcomm-ecommerce` |
| Cổng mặc định | 5173 |
| Bằng chứng cấu trúc | `src/App.tsx` 38 tuyến đường, `src/pages` 33 trang, 15 component. |
| Đối tượng phục vụ chính | Khách hàng cuối. |

## 3. Bản đồ chức năng

`src/App.tsx` 38 tuyến đường, `src/pages` 33 trang, 15 component.

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| HS-03-F01 | Sàn thương mại điện tử đa kênh B2C/B2B, mua chung, livestream, vòng quay may mắn, ví và V-Xu. | Chưa bắt đầu | Vai trò hệ thống theo bộ nhật ký hệ sinh thái |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA.

## 5. Phụ thuộc

- Hạ tầng dữ liệu: xem `HS-08_Ha_tang_CSDL_trung_tam.md`.
- Cổng API: xem `HS-02_VComm_Core_Backend.md` (cổng 5000).

## 6. Tiêu chí nghiệm thu

- [ ] Hệ thống khởi động được ở cổng 5173.
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
