# MOD-43 — Không gian làm việc

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Văn phòng & Điều hành
- Mã module: MOD-43
- Tuyến đường: `/workspace`
- Tệp giao diện: `src/components/Workspace.tsx` (493 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Mục tiêu

Cộng tác nội bộ và chia sẻ tài liệu

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Văn phòng & Điều hành |
| Tuyến đường | `/workspace` |
| Component | `Workspace` |
| Tệp nguồn | `src/components/Workspace.tsx` |
| Quy mô | 493 dòng |
| Tệp kiểm thử liên quan | `src/__tests__/workspace_features.test.ts` |
| Đặc tả kỹ thuật liên quan | Chưa có |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/Workspace.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- Bảng Tin & Thông Báo Công Ty
- Giao diện Mô phỏng Tiện ích Hành chính

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-43-F01 | Cộng tác nội bộ và chia sẻ tài liệu | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/workspace` truy cập được, hiển thị đúng component `Workspace`.
- [ ] Có kiểm thử cho luồng chính và luồng từ chối quyền.
- [ ] Không phát sinh lỗi kiểu khi chạy `tsc --noEmit`.
- [ ] Danh mục tính năng ở mục 4 đã được duyệt và đánh dấu trạng thái thật.

## 7. Rủi ro và việc còn mở

- Chưa có đặc tả kỹ thuật trong `specs/` gắn với module.
- Danh mục tính năng chi tiết chưa được duyệt (cần bước BA).

## 8. Chưa xác minh được

- Danh mục tính năng thật của module (mục 4 mới có mục tiêu, chưa có danh mục đầy đủ).
- Mức độ hoàn thiện thật so với mô tả menu.
- Module có dùng bảng dữ liệu riêng hay dùng chung bảng của hệ thống.
