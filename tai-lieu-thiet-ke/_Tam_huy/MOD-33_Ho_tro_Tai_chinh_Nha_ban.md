# MOD-33 — Hỗ trợ Tài chính Nhà bán

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Tài chính & Thanh toán
- Mã module: MOD-33
- Tuyến đường: `/seller-finance`
- Tệp giao diện: `src/components/SellerFinance.tsx` (1497 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Mục tiêu

Gói vay và hỗ trợ vốn cho nhà bán

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Tài chính & Thanh toán |
| Tuyến đường | `/seller-finance` |
| Component | `SellerFinance` |
| Tệp nguồn | `src/components/SellerFinance.tsx` |
| Quy mô | 1497 dòng |
| Tệp kiểm thử liên quan | Chưa có |
| Đặc tả kỹ thuật liên quan | Chưa có |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/SellerFinance.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- Supply Chain Finance (Hỗ trợ tài chính nhà bán)
- Xem trước Hợp đồng Tín dụng số
- Xu hướng Dòng tiền & Yêu cầu giải ngân sớm
- Chi tiết cơ cấu nợ thấu chi quá hạn (Debt Aging Breakdown)
- Số dư khả dụng
- Lịch sử giao dịch ví
- Thuật toán Xếp hạng Tín nhiệm (Financial Rating Engine)
- Quy trình duyệt ứng vốn giải ngân
- Xác minh tình trạng vận đơn vận chuyển
- Chi tiết khấu trừ phí & số tiền chuyển khoản
- Xác thực chứng thư & Ký số duyệt chi
- Giải ngân đã được duyệt chi & Ký số thành công!
- Tạo yêu cầu rút tiền

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-33-F01 | Gói vay và hỗ trợ vốn cho nhà bán | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/seller-finance` truy cập được, hiển thị đúng component `SellerFinance`.
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
