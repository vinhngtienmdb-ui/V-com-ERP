# MOD-07 — Nhà bán hàng

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Kinh doanh
- Mã module: MOD-07
- Tuyến đường: `/sellers`
- Tệp giao diện: `src/components/Sellers.tsx` (1338 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-06

## 1. Mục tiêu

Hệ thống quản lý đối tác nhà bán hàng

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Kinh doanh |
| Tuyến đường | `/sellers` |
| Component | `SellerManagement` |
| Tệp nguồn | `src/components/Sellers.tsx` |
| Quy mô | 1338 dòng |
| Tệp kiểm thử liên quan | Chưa có |
| Đặc tả kỹ thuật liên quan | Chưa có |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/Sellers.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- Quản lý Seller / Vendor
- Quy trình Đăng ký & Duyệt
- Giới hạn & Định mức mặc định
- Kiểm duyệt sản phẩm & Vận hành
- Hiệu suất & Chế tài vi phạm
- Vận chuyển & Xử lý đơn hàng (SLA)
- Cơ chế phê duyệt hồ sơ tự động
- Loại hình Đối tác
- Thông tin Người bán

Nhãn giao diện ghi nhận thêm: Tích hợp iPOS, App & Phân quyền; Cộng/Trừ tiền Wallet.

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-07-F01 | Hệ thống quản lý đối tác nhà bán hàng | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/sellers` truy cập được, hiển thị đúng component `SellerManagement`.
- [ ] Có kiểm thử cho luồng chính và luồng từ chối quyền.
- [ ] Không phát sinh lỗi kiểu khi chạy `tsc --noEmit`.
- [ ] Danh mục tính năng ở mục 4 đã được duyệt và đánh dấu trạng thái thật.

## 7. Rủi ro và việc còn mở

- Chưa có tệp kiểm thử riêng cho module — rủi ro hồi quy khi sửa.
- Chưa có đặc tả kỹ thuật trong `specs/` gắn với module.
- Danh mục tính năng chi tiết chưa được duyệt (cần bước BA).

## 8. Chưa xác minh được

- Danh mục tính năng thật của module (mục 4 mới có mục tiêu, chưa có danh mục đầy đủ).
- Mức độ hoàn thiện thật so với mô tả menu.
- Module có dùng bảng dữ liệu riêng hay dùng chung bảng của hệ thống.
