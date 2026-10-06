# MOD-36 — Khách hàng (CRM)

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: CRM & Khách hàng
- Mã module: MOD-36
- Tuyến đường: `/customers`
- Tệp giao diện: `src/components/Customers.tsx` (2221 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Mục tiêu

Quản lý quan hệ khách hàng đa kênh

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | CRM & Khách hàng |
| Tuyến đường | `/customers` |
| Component | `Customers` |
| Tệp nguồn | `src/components/Customers.tsx` |
| Quy mô | 2221 dòng |
| Tệp kiểm thử liên quan | Chưa có |
| Đặc tả kỹ thuật liên quan | Chưa có |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/Customers.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- Hồ sơ Khách hàng 360°
- Mục tiêu lên hạng
- Danh sách Hạng thành viên
- Cấu hình Tích điểm & Tiêu điểm
- Tỉ lệ tích điểm
- Tỉ lệ tiêu điểm (Thanh toán)
- Thẻ phân loại ưu tiên (VIP, Fraud...)
- Cấu hình Nguồn Tracking
- Landing Page Nệm Foam
- Chiến dịch Mùa Hè - Zalo Ads
- Facebook Shop
- Quản trị Khách hàng & CRM
- Chiến dịch tự động
- Điều chỉnh Điểm / Ví

Nhãn giao diện ghi nhận thêm: Copy; Cấu hình & Phân tích Nâng cao; Thêm Khách hàng mới; Đã ghi sổ MISA; Cộng/Trừ Điểm & Tiền; Click để mở hồ sơ khách hàng — kéo để đổi phân đoạn.

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-36-F01 | Quản lý quan hệ khách hàng đa kênh | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/customers` truy cập được, hiển thị đúng component `Customers`.
- [ ] Có kiểm thử cho luồng chính và luồng từ chối quyền.
- [ ] Không phát sinh lỗi kiểu khi chạy `tsc --noEmit`.
- [ ] Danh mục tính năng ở mục 4 đã được duyệt và đánh dấu trạng thái thật.

## 7. Rủi ro và việc còn mở

- Chưa có tệp kiểm thử riêng cho module — rủi ro hồi quy khi sửa.
- Tệp giao diện lớn (2221 dòng) — nên tách nhỏ trước khi mở rộng.
- Chưa có đặc tả kỹ thuật trong `specs/` gắn với module.
- Danh mục tính năng chi tiết chưa được duyệt (cần bước BA).

## 8. Chưa xác minh được

- Danh mục tính năng thật của module (mục 4 mới có mục tiêu, chưa có danh mục đầy đủ).
- Mức độ hoàn thiện thật so với mô tả menu.
- Module có dùng bảng dữ liệu riêng hay dùng chung bảng của hệ thống.
