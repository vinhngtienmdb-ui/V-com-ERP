# MOD-23 — Khách hàng thân thiết

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Thương mại & Nền tảng mở rộng
- Mã module: MOD-23
- Tuyến đường: `/loyalty`
- Tệp giao diện: `src/components/Loyalty.tsx` (500 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Mục tiêu

Chương trình điểm thưởng và hạng thành viên

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Thương mại & Nền tảng mở rộng |
| Tuyến đường | `/loyalty` |
| Component | `LoyaltyManagement` |
| Tệp nguồn | `src/components/Loyalty.tsx` |
| Quy mô | 500 dòng |
| Tệp kiểm thử liên quan | `src/__tests__/crm_loyalty_persistence.test.ts`, `src/__tests__/crm_loyalty_sla.test.ts` |
| Đặc tả kỹ thuật liên quan | `specs/010-crm-loyalty-sla` |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/Loyalty.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- Loyalty & Club Prestige
- Quản lý Thành viên VIP & Tự động hóa ZNS
- Quà tặng đặc quyền
- Retention AI Engine

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-23-F01 | Chương trình điểm thưởng và hạng thành viên | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/loyalty` truy cập được, hiển thị đúng component `LoyaltyManagement`.
- [ ] Có kiểm thử cho luồng chính và luồng từ chối quyền.
- [ ] Không phát sinh lỗi kiểu khi chạy `tsc --noEmit`.
- [ ] Danh mục tính năng ở mục 4 đã được duyệt và đánh dấu trạng thái thật.

## 7. Rủi ro và việc còn mở

- Danh mục tính năng chi tiết chưa được duyệt (cần bước BA).

## 8. Chưa xác minh được

- Danh mục tính năng thật của module (mục 4 mới có mục tiêu, chưa có danh mục đầy đủ).
- Mức độ hoàn thiện thật so với mô tả menu.
- Module có dùng bảng dữ liệu riêng hay dùng chung bảng của hệ thống.

— ĐÃ GỘP VÀO MOD-21 (V-Xu) ngày 2026-10-06. Khách hàng thân thiết (Loyalty) hợp nhất vào V-Xu.

