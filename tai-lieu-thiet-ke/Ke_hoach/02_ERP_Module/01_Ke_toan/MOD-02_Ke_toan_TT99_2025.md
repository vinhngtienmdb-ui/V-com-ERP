# MOD-02 — Kế toán (TT99/2025)

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Kế toán
- Mã module: MOD-02
- Tuyến đường: `/ke-toan-tt99`
- Tệp giao diện: `src/components/TT99Accounting.tsx` (2307 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-06

## 1. Mục tiêu

Chế độ kế toán doanh nghiệp TT99 — hệ tài khoản, sổ cái kép, lưu vết Điều 28, hợp nhất Điều 7, IFRS 15, BCTC B01-DN

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Kế toán |
| Tuyến đường | `/ke-toan-tt99` |
| Component | `TT99Accounting` |
| Tệp nguồn | `src/components/TT99Accounting.tsx` |
| Quy mô | 2307 dòng |
| Tệp kiểm thử liên quan | Chưa có |
| Đặc tả kỹ thuật liên quan | Chưa có |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/TT99Accounting.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.



Nhãn giao diện ghi nhận thêm: Chưa thể tải dữ liệu kế toán TT99; Mức độ tuân thủ TT99/2025/TT-BTC; Phạm vi áp dụng; Điều 11 — Tài khoản kế toán; Lỗi tải hệ tài khoản; Danh mục tài khoản; Mở tài khoản cấp 2/3 (Điều 11(2)); Không thể mở tài khoản; Điều 13 — Mở sổ, ghi sổ, khoá sổ; Lỗi; Kỳ kế toán; Khoá sổ — hành động KHÔNG THỂ HOÀN TÁC; TT99 Điều 13(3) — khoá sổ là bất biến; Điều 12 — Chứng từ kế toán & bút toán kép.

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-02-F01 | Chế độ kế toán doanh nghiệp TT99 — hệ tài khoản, sổ cái kép, lưu vết Điều 28, hợp nhất Điều 7, IFRS 15, BCTC B01-DN | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/ke-toan-tt99` truy cập được, hiển thị đúng component `TT99Accounting`.
- [ ] Có kiểm thử cho luồng chính và luồng từ chối quyền.
- [ ] Không phát sinh lỗi kiểu khi chạy `tsc --noEmit`.
- [ ] Danh mục tính năng ở mục 4 đã được duyệt và đánh dấu trạng thái thật.

## 7. Rủi ro và việc còn mở

- Chưa có tệp kiểm thử riêng cho module — rủi ro hồi quy khi sửa.
- Tệp giao diện lớn (2307 dòng) — nên tách nhỏ trước khi mở rộng.
- Chưa có đặc tả kỹ thuật trong `specs/` gắn với module.
- Danh mục tính năng chi tiết chưa được duyệt (cần bước BA).

## 8. Chưa xác minh được

- Danh mục tính năng thật của module (mục 4 mới có mục tiêu, chưa có danh mục đầy đủ).
- Mức độ hoàn thiện thật so với mô tả menu.
- Module có dùng bảng dữ liệu riêng hay dùng chung bảng của hệ thống.
