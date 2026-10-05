# MOD-44 — Cấu hình hệ thống

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Cấu hình
- Mã module: MOD-44
- Tuyến đường: `/settings`
- Tệp giao diện: `src/components/Settings.tsx` (6328 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Mục tiêu

Thiết lập tham số và vận hành hệ thống

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Cấu hình |
| Tuyến đường | `/settings` |
| Component | `SettingsPage` |
| Tệp nguồn | `src/components/Settings.tsx` |
| Quy mô | 6328 dòng |
| Tệp kiểm thử liên quan | `src/__tests__/settings_features.test.ts` |
| Đặc tả kỹ thuật liên quan | Chưa có |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/Settings.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- Cấu hình & Tích hợp Hệ thống
- Màu sắc chủ đạo (Primary Color)
- Bo góc bảng biểu (Border Radius)
- Theme Lễ Tết
- Cấu hình ví & Payout
- Quy tắc điều chuyển số dư (Transfer Rules)
- Danh sách Khối Homepage (Grid Bento)
- Ma trận Quyền hạn chi tiết
- Kế toán MISA SME
- Cổng SePay Gateway
- Tin nhắn Zalo ZNS
- Shopify / Haravan
- Shopee & TikTok Shop
- Custom Webhooks
- Cấu hình Cổng Thanh toán SePay
- Cấu hình Zalo ZNS (Zalo OA)
- Cấu hình Shopify / Haravan Integration
- Cấu hình Shopee / TikTok Shop Integration

Nhãn giao diện ghi nhận thêm: Chỉnh sửa nội dung trang; Click để upload logo; Xóa logo; Xóa phương thức; Tạo API Key mới; Thu hồi khóa; Cấu hình Kế toán Doanh nghiệp MISA; Làm mới; Sao chép; Chỉnh sửa; Xóa bản quyền; Làm mới tài khoản.

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-44-F01 | Thiết lập tham số và vận hành hệ thống | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/settings` truy cập được, hiển thị đúng component `SettingsPage`.
- [ ] Có kiểm thử cho luồng chính và luồng từ chối quyền.
- [ ] Không phát sinh lỗi kiểu khi chạy `tsc --noEmit`.
- [ ] Danh mục tính năng ở mục 4 đã được duyệt và đánh dấu trạng thái thật.

## 7. Rủi ro và việc còn mở

- Tệp giao diện lớn (6328 dòng) — nên tách nhỏ trước khi mở rộng.
- Chưa có đặc tả kỹ thuật trong `specs/` gắn với module.
- Danh mục tính năng chi tiết chưa được duyệt (cần bước BA).

## 8. Chưa xác minh được

- Danh mục tính năng thật của module (mục 4 mới có mục tiêu, chưa có danh mục đầy đủ).
- Mức độ hoàn thiện thật so với mô tả menu.
- Module có dùng bảng dữ liệu riêng hay dùng chung bảng của hệ thống.
