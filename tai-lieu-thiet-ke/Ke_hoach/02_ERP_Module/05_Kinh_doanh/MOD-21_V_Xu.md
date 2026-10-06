# MOD-21 — V-Xu

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Kinh doanh
- Mã module: MOD-21
- Tuyến đường: `/vxu`
- Tệp giao diện: `src/components/VXu.tsx` (547 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Mục tiêu

Trụ cột 7 — Điểm thưởng xuyên suốt hệ sinh thái, hoàn tiền 1–5% theo hạng, sổ cái kế toán kép

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Kinh doanh |
| Tuyến đường | `/vxu` |
| Component | `VXuManager` |
| Tệp nguồn | `src/components/VXu.tsx` |
| Quy mô | 547 dòng |
| Tệp kiểm thử liên quan | `src/__tests__/vxu.test.ts` |
| Đặc tả kỹ thuật liên quan | `specs/019-vxu` |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/VXu.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- Cách tính hạng & hoàn tiền
- Ma trận phiếu ưu đãi — mở khoá theo hạng
- Phiếu đã đổi

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-21-F01 | Trụ cột 7 — Điểm thưởng xuyên suốt hệ sinh thái, hoàn tiền 1–5% theo hạng, sổ cái kế toán kép | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/vxu` truy cập được, hiển thị đúng component `VXuManager`.
- [ ] Có kiểm thử cho luồng chính và luồng từ chối quyền.
- [ ] Không phát sinh lỗi kiểu khi chạy `tsc --noEmit`.
- [ ] Danh mục tính năng ở mục 4 đã được duyệt và đánh dấu trạng thái thật.

## 7. Rủi ro và việc còn mở

- Danh mục tính năng chi tiết chưa được duyệt (cần bước BA).

## 8. Chưa xác minh được

- Danh mục tính năng thật của module (mục 4 mới có mục tiêu, chưa có danh mục đầy đủ).
- Mức độ hoàn thiện thật so với mô tả menu.
- Module có dùng bảng dữ liệu riêng hay dùng chung bảng của hệ thống.
