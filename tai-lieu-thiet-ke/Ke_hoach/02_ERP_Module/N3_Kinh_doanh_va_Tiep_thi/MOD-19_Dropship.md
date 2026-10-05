# MOD-19 — Dropship

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Kinh doanh & Tiếp thị
- Mã module: MOD-19
- Tuyến đường: `/dropship`
- Tệp giao diện: `src/components/Dropship.tsx` (1152 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Mục tiêu

Trụ cột 1 — Đối tác bán trên kênh của họ, VComm giữ kho & giao hàng, đối tác ăn chênh lệch

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Kinh doanh & Tiếp thị |
| Tuyến đường | `/dropship` |
| Component | `DropshipManager` |
| Tệp nguồn | `src/components/Dropship.tsx` |
| Quy mô | 1152 dòng |
| Tệp kiểm thử liên quan | `src/__tests__/dropship.test.ts` |
| Đặc tả kỹ thuật liên quan | `specs/017-dropship` |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/Dropship.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.



Nhãn giao diện ghi nhận thêm: Thêm đối tác dropship; Niêm yết sản phẩm lên kênh đối tác; Nhận đơn từ kênh đối tác.

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-19-F01 | Trụ cột 1 — Đối tác bán trên kênh của họ, VComm giữ kho & giao hàng, đối tác ăn chênh lệch | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/dropship` truy cập được, hiển thị đúng component `DropshipManager`.
- [ ] Có kiểm thử cho luồng chính và luồng từ chối quyền.
- [ ] Không phát sinh lỗi kiểu khi chạy `tsc --noEmit`.
- [ ] Danh mục tính năng ở mục 4 đã được duyệt và đánh dấu trạng thái thật.

## 7. Rủi ro và việc còn mở

- Danh mục tính năng chi tiết chưa được duyệt (cần bước BA).

## 8. Chưa xác minh được

- Danh mục tính năng thật của module (mục 4 mới có mục tiêu, chưa có danh mục đầy đủ).
- Mức độ hoàn thiện thật so với mô tả menu.
- Module có dùng bảng dữ liệu riêng hay dùng chung bảng của hệ thống.
