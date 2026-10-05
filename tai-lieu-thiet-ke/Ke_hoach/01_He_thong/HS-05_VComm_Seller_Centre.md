# HS-05 — VComm Seller Centre

- Mã hệ thống: HS-05
- Thư mục mã nguồn: `vcomm-seller`
- Cổng chạy mặc định: 3004
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Vai trò trong hệ sinh thái

Cổng thông tin nhà bán hàng: quản lý đơn, doanh thu, ví số dư, nhân viên gian hàng, yêu cầu hóa đơn VAT.

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | VComm Seller Centre |
| Thư mục mã nguồn | `vcomm-seller` |
| Cổng mặc định | 3004 |
| Bằng chứng cấu trúc | `src/App.tsx` 4 tuyến đường (`/`, `/login`, `/register`), 16 component. |
| Đối tượng phục vụ chính | Nhà bán hàng. |

## 3. Bản đồ chức năng

`src/App.tsx` 4 tuyến đường (`/`, `/login`, `/register`), 16 component.

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| HS-05-F01 | Cổng thông tin nhà bán hàng: quản lý đơn, doanh thu, ví số dư, nhân viên gian hàng, yêu cầu hóa đơn VAT. | Chưa bắt đầu | Vai trò hệ thống theo bộ nhật ký hệ sinh thái |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA.

## 5. Phụ thuộc

- Hạ tầng dữ liệu: xem `HS-08_Ha_tang_CSDL_trung_tam.md`.
- Cổng API: xem `HS-02_VComm_Core_Backend.md` (cổng 5000).

## 6. Tiêu chí nghiệm thu

- [ ] Hệ thống khởi động được ở cổng 3004.
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
