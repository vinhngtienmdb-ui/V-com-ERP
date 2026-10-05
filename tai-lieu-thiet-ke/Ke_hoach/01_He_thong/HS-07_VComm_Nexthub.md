# HS-07 — VComm Nexthub

- Mã hệ thống: HS-07
- Thư mục mã nguồn: `vcomm-nexthub`
- Cổng chạy mặc định: 3005
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Vai trò trong hệ sinh thái

Nền tảng B2B kết nối nhà cung cấp, chuẩn hóa danh mục và đồng bộ dữ liệu tham chiếu đa kênh.

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | VComm Nexthub |
| Thư mục mã nguồn | `vcomm-nexthub` |
| Cổng mặc định | 3005 |
| Bằng chứng cấu trúc | `src/App.jsx` (không khai báo route theo mẫu `path=`), 8 component: CartDrawer, CategoryGrid, Footer, Header, HeroSlider, ProductCard, ProductTabs, QuickViewModal. |
| Đối tượng phục vụ chính | Nhà cung cấp B2B. |

## 3. Bản đồ chức năng

`src/App.jsx` (không khai báo route theo mẫu `path=`), 8 component: CartDrawer, CategoryGrid, Footer, Header, HeroSlider, ProductCard, ProductTabs, QuickViewModal.

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| HS-07-F01 | Nền tảng B2B kết nối nhà cung cấp, chuẩn hóa danh mục và đồng bộ dữ liệu tham chiếu đa kênh. | Chưa bắt đầu | Vai trò hệ thống theo bộ nhật ký hệ sinh thái |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA.

## 5. Phụ thuộc

- Hạ tầng dữ liệu: xem `HS-08_Ha_tang_CSDL_trung_tam.md`.
- Cổng API: xem `HS-02_VComm_Core_Backend.md` (cổng 5000).

## 6. Tiêu chí nghiệm thu

- [ ] Hệ thống khởi động được ở cổng 3005.
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
