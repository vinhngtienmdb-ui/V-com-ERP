# MOD-04 — Cổng Tự phục vụ Nhân viên (ESS Portal)

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Nhân sự (HRM)
- Mã module: MOD-04
- Tuyến đường: `/ess`
- Tệp giao diện: `src/components/HR.tsx` (3721 dòng, dùng chung — chưa tách vật lý)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-06
- Ngày cập nhật: 2026-10-06

> **TÁCH 2026-10-06 (theo chốt chủ dự án).** Nhóm Nhân sự tách thành **hai cổng**: MOD-03 (cổng Phòng Nhân sự) và MOD-04 (cổng Tự phục vụ Nhân viên). Cả hai tách từ MOD-39 Quản trị Nhân sự (HRM); bản gốc lưu tại `_Tam_huy/Quan_tri_Nhan_su_HRM.md`.

## 1. Mục tiêu

Cổng **tự phục vụ** để mỗi nhân viên tự xử lý phần của mình: đăng ký/xem nghỉ phép, xem phiếu lương cá nhân, cập nhật thông tin cá nhân, xem chấm công cá nhân, gửi yêu cầu nội bộ.

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Nhân sự (HRM) |
| Tuyến đường | `/ess` |
| Component | (chưa có — sẽ tách từ `HumanResources`) |
| Tệp nguồn | `src/components/HR.tsx` (dùng chung với MOD-03, chưa tách) |
| Quy mô | 3721 dòng (dùng chung với MOD-03) |
| Tệp kiểm thử liên quan | Chưa có |
| Đặc tả kỹ thuật liên quan | Chưa có |

## 3. Khối giao diện ghi nhận từ mã nguồn

Chưa tách được khối giao diện riêng — cổng này dùng chung `src/components/HR.tsx` với MOD-03. Các mục liên quan nhiều khả năng nằm ở phần "Chi tiết Hồ sơ Nhân sự" và "Lịch sử giao dịch điểm" (xem MOD-03 §3). Cần rà mã nguồn để xác định.

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-04-F01 | Nghỉ phép (đăng ký, xem, duyệt) | Chưa bắt đầu | Chủ dự án liệt kê |
| MOD-04-F02 | Phiếu lương cá nhân | Chưa bắt đầu | Chủ dự án liệt kê |
| MOD-04-F03 | Thông tin cá nhân | Chưa bắt đầu | Chủ dự án liệt kê |
| MOD-04-F04 | Chấm công cá nhân | Chưa bắt đầu | Đề xuất |
| MOD-04-F05 | Yêu cầu nội bộ | Chưa bắt đầu | Đề xuất |

> Phân bổ giữa MOD-03 và MOD-04 là **đề xuất**, chủ dự án đã đồng ý cách chia (nghiệp vụ ↔ tự phục vụ). Danh mục chi tiết cần bổ sung ở bước BA.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.
- Nguồn nghiệp vụ: `Quy_trinh_nghiep_vu/Mo ta nghiep vu/MD_ERP/2_hrm/`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/ess` truy cập được, hiển thị đúng phần tự phục vụ.
- [ ] Nhân viên chỉ thấy dữ liệu của chính mình (phân quyền theo người dùng).
- [ ] Có kiểm thử cho luồng chính và luồng từ chối quyền.
- [ ] Không phát sinh lỗi kiểu khi chạy `tsc --noEmit`.
- [ ] Danh mục tính năng ở mục 4 đã được duyệt và đánh dấu trạng thái thật.

## 7. Rủi ro và việc còn mở

- **Chưa có giao diện riêng** — hiện dùng chung `HR.tsx` với MOD-03; phải tách vật lý.
- Chưa có đặc tả kỹ thuật trong `specs/` gắn với module.
- Danh mục tính năng chi tiết chưa được duyệt (cần bước BA).

## 8. Chưa xác minh được

- Ranh giới chính xác giữa MOD-03 và MOD-04 trong mã nguồn `HR.tsx` — chưa rà từng màn hình.
- Có cần cơ chế xác thực riêng cho cổng nhân viên (khác cổng quản trị) hay không.
- Danh mục tính năng thật của module (mục 4 mới có mục tiêu, chưa có danh mục đầy đủ).
