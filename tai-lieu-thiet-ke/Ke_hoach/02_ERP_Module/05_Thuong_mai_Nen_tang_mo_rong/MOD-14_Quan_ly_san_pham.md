# MOD-14 — Quản lý sản phẩm

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Thương mại & Nền tảng mở rộng
- Mã module: MOD-14
- Tuyến đường: `/pim`
- Tệp giao diện: `src/components/PIM.tsx` (2738 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Mục tiêu

Thông tin sản phẩm tập trung (PIM)

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Thương mại & Nền tảng mở rộng |
| Tuyến đường | `/pim` |
| Component | `PIM` |
| Tệp nguồn | `src/components/PIM.tsx` |
| Quy mô | 2738 dòng |
| Tệp kiểm thử liên quan | `src/__tests__/pim_price_history.test.ts` |
| Đặc tả kỹ thuật liên quan | `specs/006-pim-sku-standardization` |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/PIM.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- Ra mắt Công cụ AI Pricing 2.0
- Thêm sản phẩm mới
- Kéo thả file CSV/Excel vào đây
- Đang quét và chuẩn hóa dữ liệu...
- Lỗi xác thực dữ liệu
- Pass: Dữ liệu đạt chuẩn ERP
- Quét mã vạch & Kiểm kê
- Xác nhận xóa sản phẩm?
- Quản lý Sản phẩm (PIM)
- Quản lý Combo sản phẩm
- Tạo Combo mới
- AI Metadata Engine
- Top Profit Categories
- Chi tiết P&L Sản phẩm
- Chi tiết sản phẩm
- Thông số kỹ thuật

Nhãn giao diện ghi nhận thêm: Sinh mã SKU tự động; Tìm kiếm AI; Phê duyệt sản phẩm; Xóa sản phẩm; Bao gồm phí vận chuyển, đóng gói,...; Chi phí bao bì, tem nhãn, quà tặng kèm...; Product Video.

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-14-F01 | Thông tin sản phẩm tập trung (PIM) | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/pim` truy cập được, hiển thị đúng component `PIM`.
- [ ] Có kiểm thử cho luồng chính và luồng từ chối quyền.
- [ ] Không phát sinh lỗi kiểu khi chạy `tsc --noEmit`.
- [ ] Danh mục tính năng ở mục 4 đã được duyệt và đánh dấu trạng thái thật.

## 7. Rủi ro và việc còn mở

- Tệp giao diện lớn (2738 dòng) — nên tách nhỏ trước khi mở rộng.
- Danh mục tính năng chi tiết chưa được duyệt (cần bước BA).

## 8. Chưa xác minh được

- Danh mục tính năng thật của module (mục 4 mới có mục tiêu, chưa có danh mục đầy đủ).
- Mức độ hoàn thiện thật so với mô tả menu.
- Module có dùng bảng dữ liệu riêng hay dùng chung bảng của hệ thống.
