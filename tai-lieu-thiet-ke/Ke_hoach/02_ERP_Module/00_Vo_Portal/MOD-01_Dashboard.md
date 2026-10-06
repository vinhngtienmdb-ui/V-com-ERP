# MOD-01 — Dashboard (cá nhân)

- Hệ thống: VComm ERP (`vcomm-erp`)
- Nhóm chức năng: Vỏ Portal (Portal shell)
- Mã module: MOD-01
- Tuyến đường: `/dashboard` (kế thừa `/`, `/bi`, `/workflow`, `/workspace`)
- Tệp giao diện: `src/components/Home.tsx` (857 dòng), `src/components/Dashboard.tsx` (978 dòng), `src/components/AnalyticsBI.tsx` (1031 dòng), `src/components/WorkflowHub.tsx` (743 dòng), `src/components/Workspace.tsx` (493 dòng)
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-06

> **GỘP 2026-10-06 (theo chốt chủ dự án).** MOD-01 hợp nhất **năm** mô-đun cũ: MOD-01 Trang chủ, MOD-02 Bảng điều khiển, MOD-03 Phân tích dữ liệu (BI), MOD-04 Điều hành & Workflow, MOD-43 Không gian làm việc. Bản gốc lưu tại `_Tam_huy/` (tệp không mang tiền tố mã). Đây là **trang riêng của từng cá nhân** — Vỏ Portal không còn app nào khác.

## 1. Mục tiêu

Trang chủ riêng của từng cá nhân: tổng quan và truy cập nhanh mọi mô-đun; việc của tôi; luồng chờ tôi xử lý; bảng tin/không gian làm việc nội bộ; chỉ số vận hành và phân tích.

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | `vcomm-erp` (VComm ERP) |
| Nhóm chức năng | Vỏ Portal (Portal shell) |
| Tuyến đường | `/dashboard` (kế thừa `/`, `/bi`, `/workflow`, `/workspace`) |
| Component | `Home`, `Dashboard`, `AnalyticsBI`, `WorkflowHub`, `Workspace` |
| Tệp nguồn | `src/components/Home.tsx`, `src/components/Dashboard.tsx`, `src/components/AnalyticsBI.tsx`, `src/components/WorkflowHub.tsx`, `src/components/Workspace.tsx` |
| Quy mô | 857 + 978 + 1031 + 743 + 493 = **4.102 dòng** |
| Tệp kiểm thử liên quan | `src/__tests__/workspace_features.test.ts` |
| Đặc tả kỹ thuật liên quan | Chưa có |

## 3. Khối giao diện ghi nhận từ mã nguồn

Danh sách dưới đây trích tự động từ năm tệp nguồn nêu trên; dùng làm mốc rà soát, không phải danh mục tính năng đã được duyệt.

- **Từ `Home.tsx`:** Phân hệ Quản trị Sản xuất & Chế biến; Nhu cầu nguyên vật liệu; Chế tạo & Lắp ráp phân xưởng; Quản lý chất lượng (IQC/OQC)
- **Từ `Dashboard.tsx`:** AI Intelligence Summary; Sử dụng gần đây; Tổng quan Hệ thống; Tùy chỉnh Giao diện; Cảnh báo Hiệu suất Thời gian thực; Biểu đồ Tăng trưởng & Xu hướng; Cộng đồng Seller; Tỷ trọng Ngành; Top Sellers; Hệ sinh thái Module Core; Đơn hàng theo Giờ
- **Từ `AnalyticsBI.tsx`:** Business Intelligence; Lãi Gộp Combo & Sản phẩm; Hiệu Quả Kênh CTV / Sellers; Hiệu quả Mua Chung (Group Buy); Fraud Detection Guardian
- **Từ `WorkflowHub.tsx`:** Đồng bộ lịch Google Calendar; Xác nhận đồng bộ Lịch; Đồng bộ hàng loạt; Phê duyệt; Ký số; Mở chi tiết
- **Từ `Workspace.tsx`:** Bảng Tin & Thông Báo Công Ty; Giao diện Mô phỏng Tiện ích Hành chính

Nhãn giao diện ghi nhận thêm (Dashboard): GMV Thực tế; Traffic (Truy cập); Tổng đơn hàng; Khách hàng; Seller hoạt động; Tỉ lệ chuyển đổi; Tổng Doanh thu; Tổng Chi phí; Lợi nhuận gộp.

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-01-F01 | Tổng quan và truy cập nhanh mọi mô-đun | Chưa bắt đầu | Gộp từ MOD-01 Trang chủ |
| MOD-01-F02 | Bảng điều khiển chỉ số vận hành realtime | Chưa bắt đầu | Gộp từ MOD-02 Bảng điều khiển |
| MOD-01-F03 | Phân tích dữ liệu & BI | **Chưa xây dựng trong giai đoạn này** | Gộp từ MOD-03; chủ dự án chốt hoãn (2026-10-06) |
| MOD-01-F04 | Điều hành & Workflow — luồng chờ tôi xử lý | Chưa bắt đầu | Gộp từ MOD-04 Điều hành & Workflow |
| MOD-01-F05 | Không gian làm việc & bảng tin nội bộ | Chưa bắt đầu | Gộp từ MOD-43 Không gian làm việc |

> Danh mục tính năng chi tiết cần bổ sung ở bước BA. Chưa ghi thêm vì chưa có nguồn yêu cầu đã duyệt.

## 5. Phụ thuộc

- Hệ thống: VComm ERP, dùng chung lớp xác thực và điều hướng của `vcomm-erp`.
- Backend: xem `Ke_hoach/01_He_thong/HS-02_VComm_Core_Backend.md` (cổng 5000).
- Dữ liệu: Supabase PostgreSQL, tenant mặc định `tenant-vcomm-prod-01`.

## 6. Tiêu chí nghiệm thu

- [ ] Tuyến đường `/dashboard` truy cập được, hiển thị đúng nội dung hợp nhất của năm component nguồn.
- [ ] Dashboard hiển thị **riêng theo từng cá nhân** (việc của tôi, luồng chờ tôi xử lý, bảng tin) — chưa xác nhận cơ chế phân quyền.
- [ ] Có kiểm thử cho luồng chính và luồng từ chối quyền.
- [ ] Không phát sinh lỗi kiểu khi chạy `tsc --noEmit`.
- [ ] Danh mục tính năng ở mục 4 đã được duyệt và đánh dấu trạng thái thật.

## 7. Rủi ro và việc còn mở

- Gộp năm giao diện lớn (4.102 dòng) vào một app — cần tách nhỏ trước khi mở rộng.
- Phân tích dữ liệu & BI **chưa xây dựng trong giai đoạn này**; nếu sau này cần công cụ phân tích toàn hệ cho quản trị thì phải tách lại, không để chung Dashboard cá nhân.
- Chưa có tệp kiểm thử cho `Home`, `Dashboard`, `AnalyticsBI`, `WorkflowHub`.
- Chưa có đặc tả kỹ thuật trong `specs/` gắn với module.
- Danh mục tính năng chi tiết chưa được duyệt (cần bước BA).

## 8. Chưa xác minh được

- Cơ chế "Dashboard cho từng cá nhân": phân quyền theo vai trò/vị trí thế nào, dữ liệu nào là của tôi — chưa có nguồn trong dự án.
- Cách gộp vật lý năm component thành một giao diện (giữ tab con, hay viết lại) — chưa quyết.
- Danh mục tính năng thật của module (mục 4 mới có mục tiêu, chưa có danh mục đầy đủ).
- Mức độ hoàn thiện thật so với mô tả menu.
