# MOD-31 — Đối soát & Công nợ

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Tài chính & Thanh toán
- Mã module: MOD-31
- Tuyến đường: `/settlement`
- Tệp giao diện: `src/components/Settlement.tsx` (886 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Mục tiêu

Tự động đối soát và quản lý công nợ

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Tài chính & Thanh toán |
| Tuyến đường | `/settlement` |
| Component | `SettlementManagement` |
| Tệp nguồn | `src/components/Settlement.tsx` |
| Quy mô | 886 dòng |
| Tệp kiểm thử liên quan | Chưa có |
| Đặc tả kỹ thuật liên quan | `specs/008-settlement-partner-ledgers` |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/Settlement.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- Đối soát & Hóa đơn Điện tử
- Giải ngân tự động qua Cổng Payout

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-31-F01 | Tự động đối soát và quản lý công nợ | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/settlement` truy cập được, hiển thị đúng component `SettlementManagement`.
- [ ] Có kiểm thử cho luồng chính và luồng từ chối quyền.
- [ ] Không phát sinh lỗi kiểu khi chạy `tsc --noEmit`.
- [ ] Danh mục tính năng ở mục 4 đã được duyệt và đánh dấu trạng thái thật.

## 7. Rủi ro và việc còn mở

- Chưa có tệp kiểm thử riêng cho module — rủi ro hồi quy khi sửa.
- Danh mục tính năng chi tiết chưa được duyệt (cần bước BA).

## 8. Chưa xác minh được

- Danh mục tính năng thật của module (mục 4 mới có mục tiêu, chưa có danh mục đầy đủ).
- Mức độ hoàn thiện thật so với mô tả menu.
- Module có dùng bảng dữ liệu riêng hay dùng chung bảng của hệ thống.
