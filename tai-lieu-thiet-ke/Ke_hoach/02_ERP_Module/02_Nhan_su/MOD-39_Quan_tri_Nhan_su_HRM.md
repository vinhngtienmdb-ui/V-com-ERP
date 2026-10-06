# MOD-39 — Quản trị Nhân sự (HRM)

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Nhân sự (HRM)
- Mã module: MOD-39
- Tuyến đường: `/hr`
- Tệp giao diện: `src/components/HR.tsx` (3721 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Mục tiêu

Tuyển dụng, hồ sơ và chế độ nhân viên

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Nhân sự (HRM) |
| Tuyến đường | `/hr` |
| Component | `HumanResources` |
| Tệp nguồn | `src/components/HR.tsx` |
| Quy mô | 3721 dòng |
| Tệp kiểm thử liên quan | `src/hrSaveEmployee.test.ts` |
| Đặc tả kỹ thuật liên quan | Chưa có |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/HR.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- Tỷ lệ Tuyển dụng & Nghỉ việc
- Biểu đồ Vi phạm Chấm công
- Quản trị Nguồn nhân lực (HRM)
- AI Skill Gap Analysis
- Dynamic Salary Engine
- AI Smart-Sync Optimizer
- Chế độ bảo mật Cao
- Bảng theo dõi mục tiêu chi tiết
- PERFORMANCE LEADERBOARD
- Skill Matrix Heatmap
- AI Phân tích & Đề xuất lương
- Lịch sử giao dịch điểm
- GOLDEN BOARD • BẢNG VÀNG DANH VỌNG
- Tất cả góp ý từ tập thể nhân sự
- Danh sách nhân sự cần theo dõi đặc biệt
- Phân hệ đang được phát triển
- Chi tiết Hồ sơ Nhân sự
- Phân quyền chi tiết (Permissions)

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-39-F01 | Tuyển dụng, hồ sơ và chế độ nhân viên | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/hr` truy cập được, hiển thị đúng component `HumanResources`.
- [ ] Có kiểm thử cho luồng chính và luồng từ chối quyền.
- [ ] Không phát sinh lỗi kiểu khi chạy `tsc --noEmit`.
- [ ] Danh mục tính năng ở mục 4 đã được duyệt và đánh dấu trạng thái thật.

## 7. Rủi ro và việc còn mở

- Tệp giao diện lớn (3721 dòng) — nên tách nhỏ trước khi mở rộng.
- Chưa có đặc tả kỹ thuật trong `specs/` gắn với module.
- Danh mục tính năng chi tiết chưa được duyệt (cần bước BA).

## 8. Chưa xác minh được

- Danh mục tính năng thật của module (mục 4 mới có mục tiêu, chưa có danh mục đầy đủ).
- Mức độ hoàn thiện thật so với mô tả menu.
- Module có dùng bảng dữ liệu riêng hay dùng chung bảng của hệ thống.
