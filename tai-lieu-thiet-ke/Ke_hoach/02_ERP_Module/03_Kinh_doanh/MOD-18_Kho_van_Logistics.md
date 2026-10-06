# MOD-18 — Kho vận & Logistics

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Kinh doanh
- Mã module: MOD-18
- Tuyến đường: `/warehouse`
- Tệp giao diện: `src/components/Warehouse.tsx` (3794 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-06

## 1. Mục tiêu

Tối ưu tồn kho và quản lý kho bãi

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Kinh doanh |
| Tuyến đường | `/warehouse` |
| Component | `WarehouseModule` |
| Tệp nguồn | `src/components/Warehouse.tsx` |
| Quy mô | 3794 dòng |
| Tệp kiểm thử liên quan | `src/__tests__/warehouseVoucherApproval.test.ts`, `src/__tests__/warehouse_ai_impersonation.test.ts`, `src/__tests__/warehouse_approval_wiring.test.ts` |
| Đặc tả kỹ thuật liên quan | Chưa có |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/Warehouse.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- Quản trị Kho vận
- AI Recommendation
- Độ chính xác mô hình
- Chi tiết Phân khu kệ hàng
- Tính toán Bố cục AI đề xuất
- Đơn đang giao (2)
- Tối ưu Tuyến đường Giao hàng
- Tồn kho nguyên vật liệu
- Phiếu kho (Nhập/Xuất/Luân chuyển)
- Lịch sử Luân chuyển kho
- Tạo phiếu kho mới

Nhãn giao diện ghi nhận thêm: Quét mã QR/Barcode.

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-18-F01 | Tối ưu tồn kho và quản lý kho bãi | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/warehouse` truy cập được, hiển thị đúng component `WarehouseModule`.
- [ ] Có kiểm thử cho luồng chính và luồng từ chối quyền.
- [ ] Không phát sinh lỗi kiểu khi chạy `tsc --noEmit`.
- [ ] Danh mục tính năng ở mục 4 đã được duyệt và đánh dấu trạng thái thật.

## 7. Rủi ro và việc còn mở

- Tệp giao diện lớn (3794 dòng) — nên tách nhỏ trước khi mở rộng.
- Chưa có đặc tả kỹ thuật trong `specs/` gắn với module.
- Danh mục tính năng chi tiết chưa được duyệt (cần bước BA).

## 8. Chưa xác minh được

- Danh mục tính năng thật của module (mục 4 mới có mục tiêu, chưa có danh mục đầy đủ).
- Mức độ hoàn thiện thật so với mô tả menu.
- Module có dùng bảng dữ liệu riêng hay dùng chung bảng của hệ thống.
