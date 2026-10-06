# MOD-06 — Đề xuất & Trình ký

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Văn phòng & Điều hành
- Mã module: MOD-06
- Tuyến đường: `/requests`
- Tệp giao diện: `src/components/RequestHub.tsx` (1628 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Mục tiêu

Hệ thống phê duyệt và trình ký điện tử

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Văn phòng & Điều hành |
| Tuyến đường | `/requests` |
| Component | `RequestHub` |
| Tệp nguồn | `src/components/RequestHub.tsx` |
| Quy mô | 1628 dòng |
| Tệp kiểm thử liên quan | `src/requesthubDbError.test.ts` |
| Đặc tả kỹ thuật liên quan | Chưa có |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/RequestHub.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- Cài đặt Cấu trúc Phiếu (E-Form)
- Xác thực Chữ ký số
- Omni-System Enterprise
- PHIẾU ĐỀ XUẤT
- Luân chuyển văn bản điện tử

Nhãn giao diện ghi nhận thêm: Làm mới; Gửi ký số; Luân chuyển văn bản; In ngay.

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-06-F01 | Hệ thống phê duyệt và trình ký điện tử | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/requests` truy cập được, hiển thị đúng component `RequestHub`.
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
