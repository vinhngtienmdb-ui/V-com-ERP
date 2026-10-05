# MOD-32 — Ví & Thanh toán

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Tài chính & Thanh toán
- Mã module: MOD-32
- Tuyến đường: `/wallet`
- Tệp giao diện: `src/components/Wallet.tsx` (1051 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Mục tiêu

Xử lý giao dịch và cổng thanh toán

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Tài chính & Thanh toán |
| Tuyến đường | `/wallet` |
| Component | `WalletHub` |
| Tệp nguồn | `src/components/Wallet.tsx` |
| Quy mô | 1051 dòng |
| Tệp kiểm thử liên quan | `src/__tests__/updateWalletBalance.test.ts` |
| Đặc tả kỹ thuật liên quan | Chưa có |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/Wallet.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- Ví Tài chính & Ký quỹ (Kho lưu trữ Số)
- Link New Bank Account
- Instant Settlement Protocol
- Escrow Smart Protocol
- SePay Bank Hub Connection
- Tích điểm Loyalty
- Hoàn tiền / Đổi điểm
- Tra cứu Giao dịch
- Chi tiết Biến động Ví gần đây
- Vault Guard™ AI Monitoring

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-32-F01 | Xử lý giao dịch và cổng thanh toán | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/wallet` truy cập được, hiển thị đúng component `WalletHub`.
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
