# HS-01 — VComm ERP

- Mã hệ thống: HS-01
- Thư mục mã nguồn: `vcomm-erp`
- Cổng chạy mặc định: 3000
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Vai trò trong hệ sinh thái

Trung tâm điều hành doanh nghiệp: 44 module chức năng theo 7 nhóm menu.

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | VComm ERP |
| Thư mục mã nguồn | `vcomm-erp` |
| Cổng mặc định | 3000 |
| Bằng chứng cấu trúc | `src/constants.ts` (navGroups), `src/App.tsx` (51 tuyến đường), `src/components` (78 tệp). |
| Đối tượng phục vụ chính | 44 module — xem `Ke_hoach/02_ERP_Module/`. |

## 3. Bản đồ chức năng

`src/constants.ts` (navGroups), `src/App.tsx` (51 tuyến đường), `src/components` (78 tệp).

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| HS-01-F01 | Trung tâm điều hành doanh nghiệp: 44 module chức năng theo 7 nhóm menu. | Chưa bắt đầu | Vai trò hệ thống theo bộ nhật ký hệ sinh thái |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA.

## 5. Phụ thuộc

- Hạ tầng dữ liệu: xem `HS-08_Ha_tang_CSDL_trung_tam.md`.
- Cổng API: xem `HS-02_VComm_Core_Backend.md` (cổng 5000).

## 6. Tiêu chí nghiệm thu

- [ ] Hệ thống khởi động được ở cổng 3000.
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
