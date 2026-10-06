# MOD-18 — F2B2B — Gom đơn B2B

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Thương mại & Nền tảng mở rộng
- Mã module: MOD-18
- Tuyến đường: `/f2b2b`
- Tệp giao diện: `src/components/F2B2B.tsx` (1028 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Mục tiêu

Trụ cột 4 — Gom đủ sản lượng đặt sản xuất từ nguồn, giá bậc thang

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Thương mại & Nền tảng mở rộng |
| Tuyến đường | `/f2b2b` |
| Component | `F2B2BManager` |
| Tệp nguồn | `src/components/F2B2B.tsx` |
| Quy mô | 1028 dòng |
| Tệp kiểm thử liên quan | Chưa có |
| Đặc tả kỹ thuật liên quan | Chưa có |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/F2B2B.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- Bên tham gia gom

Nhãn giao diện ghi nhận thêm: Thêm nguồn hàng (nông trại / nhà máy / HTX); Tạo phiên gom F2B2B; Xoá nháp.

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-18-F01 | Trụ cột 4 — Gom đủ sản lượng đặt sản xuất từ nguồn, giá bậc thang | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/f2b2b` truy cập được, hiển thị đúng component `F2B2BManager`.
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

— TẠM HỦY / XÓA ngày 2026-10-06. F2B2B — Gom đơn B2B bị loại bỏ (trước đây giữ nguyên Trụ cột 4, nay loại bỏ theo tái cấu trúc).

