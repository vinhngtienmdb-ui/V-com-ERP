# MOD-29 — Tài chính - Kế toán

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Kế toán
- Mã module: MOD-29
- Tuyến đường: `/finance`
- Tệp giao diện: `src/components/Finance.tsx` (2336 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Mục tiêu

Báo cáo tài chính và hạch toán kế toán

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Kế toán |
| Tuyến đường | `/finance` |
| Component | `Finance` |
| Tệp nguồn | `src/components/Finance.tsx` |
| Quy mô | 2336 dòng |
| Tệp kiểm thử liên quan | `src/__tests__/finance_ledger_lock.test.ts`, `src/__tests__/seller_finance.test.ts` |
| Đặc tả kỹ thuật liên quan | Chưa có |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/Finance.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- Tài chính & Kế toán
- Productivity Tip
- Sổ cái chi tiết Tài khoản (Ledger Accounts)
- Báo cáo Kết quả Hoạt động Kinh doanh (P&L)
- Bảng Cân đối Phát sinh Tài khoản (Trial Balance)
- Bảng Cân đối Kế toán (Balance Sheet)
- A. TÀI SẢN
- B. NGUỒN VỐN
- Báo cáo Lưu chuyển Tiền tệ (Phương pháp Trực tiếp)
- CFO Trợ lý Tài chính AI
- Bảng phân tích Tuổi nợ Phải thu Khách hàng
- Bảo mật & Tuân thủ Tài chính
- Báo cáo chuẩn Thông tư 99/2025/TT-BTC

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-29-F01 | Báo cáo tài chính và hạch toán kế toán | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/finance` truy cập được, hiển thị đúng component `Finance`.
- [ ] Có kiểm thử cho luồng chính và luồng từ chối quyền.
- [ ] Không phát sinh lỗi kiểu khi chạy `tsc --noEmit`.
- [ ] Danh mục tính năng ở mục 4 đã được duyệt và đánh dấu trạng thái thật.

## 7. Rủi ro và việc còn mở

- Tệp giao diện lớn (2336 dòng) — nên tách nhỏ trước khi mở rộng.
- Chưa có đặc tả kỹ thuật trong `specs/` gắn với module.
- Danh mục tính năng chi tiết chưa được duyệt (cần bước BA).

## 8. Chưa xác minh được

- Danh mục tính năng thật của module (mục 4 mới có mục tiêu, chưa có danh mục đầy đủ).
- Mức độ hoàn thiện thật so với mô tả menu.
- Module có dùng bảng dữ liệu riêng hay dùng chung bảng của hệ thống.
