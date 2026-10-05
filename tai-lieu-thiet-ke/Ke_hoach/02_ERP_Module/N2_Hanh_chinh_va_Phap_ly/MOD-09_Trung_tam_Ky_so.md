# MOD-09 — Trung tâm Ký số

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Hành chính & Pháp lý
- Mã module: MOD-09
- Tuyến đường: `/signature`
- Tệp giao diện: `src/components/SignatureHub.tsx` (1213 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Mục tiêu

Quản lý chữ ký số và xác thực doanh nghiệp

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Hành chính & Pháp lý |
| Tuyến đường | `/signature` |
| Component | `SignatureHub` |
| Tệp nguồn | `src/components/SignatureHub.tsx` |
| Quy mô | 1213 dòng |
| Tệp kiểm thử liên quan | Chưa có |
| Đặc tả kỹ thuật liên quan | Chưa có |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/SignatureHub.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- Trung tâm Ký số (Digital Signature Hub)
- Chờ tôi ký
- Đã hoàn tất
- Chứng thư đang hoạt động
- Quản lý Con dấu (Seal Management)
- Mộc tròn Công ty (MDB)
- Chữ ký mẫu - CEO
- Cấu hình Quy trình Ký số & Phân quyền
- Quản lý Chứng thư số
- Nhật ký Hệ thống Ký số
- Xác minh Tính toàn vẹn Tài liệu
- Xác minh Thành công!
- Cảnh báo: Dữ liệu đã bị thay đổi!
- Bạn chưa có Chứng thư số RSA
- Chữ ký Hợp lệ & Dữ liệu Nguyên vẹn
- Xác thực Thất bại!
- Chi tiết Chữ ký trên tài liệu

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-09-F01 | Quản lý chữ ký số và xác thực doanh nghiệp | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/signature` truy cập được, hiển thị đúng component `SignatureHub`.
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
