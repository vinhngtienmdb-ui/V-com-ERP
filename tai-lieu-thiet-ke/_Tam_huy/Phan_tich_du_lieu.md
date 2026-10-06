# MOD-03 — Phân tích dữ liệu

> **GỘP / LƯU TRỮ 2026-10-06.** Mô-đun này được hợp nhất vào cấu trúc mới theo chốt của chủ dự án. Tệp lưu trữ không mang mã MOD; mã cũ là **MOD-03** (Phân tích dữ liệu). Xem `_Tam_huy/README.md`.

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Vỏ Portal (Portal shell)
- Mã module: MOD-03
- Tuyến đường: `/bi`
- Tệp giao diện: `src/components/AnalyticsBI.tsx` (1031 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Mục tiêu

Công cụ BI và phân tích chuyên sâu

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Vỏ Portal (Portal shell) |
| Tuyến đường | `/bi` |
| Component | `AnalyticsBI` |
| Tệp nguồn | `src/components/AnalyticsBI.tsx` |
| Quy mô | 1031 dòng |
| Tệp kiểm thử liên quan | Chưa có |
| Đặc tả kỹ thuật liên quan | Chưa có |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/AnalyticsBI.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- Business Intelligence
- Lãi Gộp Combo & Sản phẩm
- Hiệu Quả Kênh CTV / Sellers
- Hiệu Quả Mua Chung (Group Buy)
- Fraud Detection Guardian

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-03-F01 | Công cụ BI và phân tích chuyên sâu | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/bi` truy cập được, hiển thị đúng component `AnalyticsBI`.
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
