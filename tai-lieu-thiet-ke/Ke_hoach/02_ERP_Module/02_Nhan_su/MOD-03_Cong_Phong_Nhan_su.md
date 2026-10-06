# MOD-03 — Cổng Phòng Nhân sự (HR Portal)

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Nhân sự (HRM)
- Mã module: MOD-03
- Tuyến đường: `/hr`
- Tệp giao diện: `src/components/HR.tsx` (3721 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-06

> **TÁCH 2026-10-06 (theo chốt chủ dự án).** Nhóm Nhân sự tách thành **hai cổng**: MOD-03 (cổng Phòng Nhân sự — nghiệp vụ) và MOD-04 (cổng Tự phục vụ Nhân viên). Cả hai tách từ MOD-39 Quản trị Nhân sự (HRM); bản gốc lưu tại `_Tam_huy/Quan_tri_Nhan_su_HRM.md`.

## 1. Mục tiêu

Cổng nghiệp vụ dành cho **Phòng Nhân sự**: quản lý thông tin và hồ sơ nhân sự, tuyển dụng, hợp đồng lao động, chấm công, tính lương, bảo hiểm xã hội, thuế thu nhập cá nhân, KPI/OKR, đào tạo, khen thưởng–kỷ luật.

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Nhân sự (HRM) |
| Tuyến đường | `/hr` |
| Component | `HumanResources` |
| Tệp nguồn | `src/components/HR.tsx` |
| Quy mô | 3721 dòng (dùng chung với MOD-04) |
| Tệp kiểm thử liên quan | `src/hrSaveEmployee.test.ts` |
| Đặc tả kỹ thuật liên quan | Chưa có |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/HR.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- Quản trị Nguồn nhân lực (HRM)
- Tỷ lệ Tuyển dụng & Nghỉ việc
- Biểu đồ Vi phạm Chấm công
- AI Skill Gap Analysis
- Dynamic Salary Engine
- AI Smart-Sync Optimizer
- AI Phân tích & Đề xuất lương
- Bảng theo dõi mục tiêu chi tiết
- PERFORMANCE LEADERBOARD
- Skill Matrix Heatmap
- GOLDEN BOARD • BẢNG VÀNG DANH VỌNG
- Tất cả góp ý từ tập thể nhân sự
- Danh sách nhân sự cần theo dõi đặc biệt
- Chi tiết Hồ sơ Nhân sự
- Phân quyền chi tiết (Permissions)
- Chế độ bảo mật Cao

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-03-F01 | Quản lý thông tin nhân sự | Chưa bắt đầu | Chủ dự án liệt kê |
| MOD-03-F02 | Hồ sơ nhân sự | Chưa bắt đầu | Chủ dự án liệt kê |
| MOD-03-F03 | Bảo hiểm xã hội (BHXH) | Chưa bắt đầu | Chủ dự án liệt kê |
| MOD-03-F04 | Thuế thu nhập cá nhân (TNCN) | Chưa bắt đầu | Chủ dự án liệt kê |
| MOD-03-F05 | Tuyển dụng & tiếp nhận | Chưa bắt đầu | Từ MD_ERP `2_hrm` |
| MOD-03-F06 | Hợp đồng lao động | Chưa bắt đầu | Từ MD_ERP `2_hrm` |
| MOD-03-F07 | Chấm công | Chưa bắt đầu | Từ MD_ERP `2_hrm` |
| MOD-03-F08 | Tính lương | Chưa bắt đầu | Từ MD_ERP `2_hrm` |
| MOD-03-F09 | KPI/OKR, đào tạo, khen thưởng–kỷ luật | Chưa bắt đầu | Từ MD_ERP `2_hrm` |

> Phân bổ giữa MOD-03 và MOD-04 là **đề xuất**, chủ dự án đã đồng ý cách chia (nghiệp vụ ↔ tự phục vụ). Danh mục chi tiết cần bổ sung ở bước BA.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.
- Nguồn nghiệp vụ: `Quy_trinh_nghiep_vu/Mo ta nghiep vu/MD_ERP/2_hrm/` (11 đặc tả).

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/hr` truy cập được, hiển thị đúng phần nghiệp vụ của `HumanResources`.
- [ ] Có kiểm thử cho luồng chính và luồng từ chối quyền.
- [ ] Không phát sinh lỗi kiểu khi chạy `tsc --noEmit`.
- [ ] Danh mục tính năng ở mục 4 đã được duyệt và đánh dấu trạng thái thật.

## 7. Rủi ro và việc còn mở

- Tệp giao diện lớn (3721 dòng, dùng chung với MOD-04) — phải tách vật lý trước khi mở rộng.
- Chưa có đặc tả kỹ thuật trong `specs/` gắn với module.
- Danh mục tính năng chi tiết chưa được duyệt (cần bước BA).

## 8. Chưa xác minh được

- Ranh giới chính xác giữa MOD-03 và MOD-04 trong mã nguồn `HR.tsx` — chưa rà từng màn hình.
- Danh mục tính năng thật của module (mục 4 mới có mục tiêu, chưa có danh mục đầy đủ).
- Module có dùng bảng dữ liệu riêng hay dùng chung bảng của hệ thống.
