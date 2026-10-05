# MOD-34 — Cho thuê thiết bị (Trả góp)

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Tài chính & Thanh toán
- Mã module: MOD-34
- Tuyến đường: `/device-leasing`
- Tệp giao diện: `src/components/DeviceLeasing.tsx` (2363 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Mục tiêu

Quản lý đơn xin duyệt trả góp dưới danh nghĩa thuê thiết bị

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Tài chính & Thanh toán |
| Tuyến đường | `/device-leasing` |
| Component | `DeviceLeasing` |
| Tệp nguồn | `src/components/DeviceLeasing.tsx` |
| Quy mô | 2363 dòng |
| Tệp kiểm thử liên quan | Chưa có |
| Đặc tả kỹ thuật liên quan | Chưa có |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ `src/components/DeviceLeasing.tsx`; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- Trả Góp & Cho Thuê Thiết Bị
- Cơ cấu loại thiết bị thuê
- Doanh thu dự kiến vs Thực tế thu
- Tỷ lệ thanh toán đúng hạn và nợ quá hạn
- Hồ sơ chi tiết
- Mở Đơn Xin Thuê/Trả Góp
- Cổng Cảnh Báo Thu Nợ Định Kỳ

Nhãn giao diện ghi nhận thêm: Phê duyệt hồ sơ; Từ chối/Huỷ hồ sơ; Gửi SMS & Zalo cảnh báo nợ; Mở cổng thanh toán VietQR và đóng phí.

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-34-F01 | Quản lý đơn xin duyệt trả góp dưới danh nghĩa thuê thiết bị | Chưa bắt đầu | Mục tiêu module theo menu hệ thống |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/device-leasing` truy cập được, hiển thị đúng component `DeviceLeasing`.
- [ ] Có kiểm thử cho luồng chính và luồng từ chối quyền.
- [ ] Không phát sinh lỗi kiểu khi chạy `tsc --noEmit`.
- [ ] Danh mục tính năng ở mục 4 đã được duyệt và đánh dấu trạng thái thật.

## 7. Rủi ro và việc còn mở

- Chưa có tệp kiểm thử riêng cho module — rủi ro hồi quy khi sửa.
- Tệp giao diện lớn (2363 dòng) — nên tách nhỏ trước khi mở rộng.
- Chưa có đặc tả kỹ thuật trong `specs/` gắn với module.
- Danh mục tính năng chi tiết chưa được duyệt (cần bước BA).

## 8. Chưa xác minh được

- Danh mục tính năng thật của module (mục 4 mới có mục tiêu, chưa có danh mục đầy đủ).
- Mức độ hoàn thiện thật so với mô tả menu.
- Module có dùng bảng dữ liệu riêng hay dùng chung bảng của hệ thống.
