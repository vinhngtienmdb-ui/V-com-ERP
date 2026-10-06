# HS-01 — VComm ERP (Cổng Portal)

- Mã hệ thống: HS-01
- Thư mục mã nguồn: `vcomm-erp`
- Cổng chạy mặc định (vỏ Portal): 3000
- Trạng thái: Chưa bắt đầu
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-06

## 1. Vai trò trong hệ sinh thái

Cổng Portal điều hành doanh nghiệp. Theo yêu cầu chủ dự án ngày 2026-10-06, VComm ERP không còn là một ứng dụng đơn mà chuyển thành **cổng Portal**: toàn bộ chức năng được chia nhỏ thành **29 module (mini-app) đang hoạt động**, phân theo **6 nhóm**. Mỗi mini-app có giao diện và cổng riêng, kết nối dữ liệu với nhau qua API server trung tâm (HS-02 VComm Core Backend, cổng 5000).

Vỏ Portal (HS-01, cổng 3000) chỉ giữ vai trò trung chuyển: Trang chủ, Bảng điều khiển, Phân tích dữ liệu. Các mini-app còn lại chạy ở các cổng riêng (dải giả định 3101–3402) và gọi chung HS-02 để chia sẻ dữ liệu.

Mô hình này khớp với các hệ thống con đã có cổng riêng: HS-03 eCommerce (5173), HS-04 iPOS (3002), HS-05 Seller Centre (3004), HS-06 Store Retail (3003), HS-07 Nexthub (3005).

## 2. Định danh và bằng chứng

| Hạng mục | Giá trị |
|---|---|
| Hệ thống | VComm ERP (Cổng Portal) |
| Thư mục mã nguồn | `vcomm-erp` |
| Cổng vỏ Portal | 3000 |
| Cổng mini-app | 3101–3402 (giả định, xem §8) |
| Bằng chứng cấu trúc hiện tại | `src/constants.ts` (navGroups), `src/App.tsx` (51 tuyến đường), `src/components` (78 tệp) — cấu trúc đơn ứng dụng trước tái cấu trúc. |
| Bằng chứng tái cấu trúc | `Ke_hoach/00_INDEX.md` (mục "Cấu trúc Portal VComm và 6 nhóm mini-app"), `Ke_hoach/00_KE_HOACH_TONG_THE.md` (mục 2, 3, 5.1). |
| Thư mục kế hoạch module | `Ke_hoach/02_ERP_Module/` — 29 tệp trong 5 thư mục nhóm. |
| Đối tượng phục vụ chính | 29 mini-app — xem `Ke_hoach/02_ERP_Module/` và `Ke_hoach/00_INDEX.md` mục 3. |

## 3. Bản đồ chức năng

Kiến trúc mục tiêu (tài liệu, chưa tách source):

```
                  [ Vỏ Portal HS-01 — cổng 3000 ]
                  Trang chủ · Bảng điều khiển · Phân tích
                                │
        ┌───────────────┬───────┼───────────────┬───────────────┐
        ▼               ▼       ▼               ▼               ▼
   Kế toán(3101)  Nhân sự(3102)  Kinh doanh(3201–3215)  Văn phòng(3301–3307)  Chia sẻ(3401–3402)
        └───────────────┴───────┼───────────────┴───────────────┘
                                ▼
                [ HS-02 VComm Core Backend — cổng 5000 ]  (API server chung, chia sẻ dữ liệu)
```

Bản đồ chi tiết 29 mini-app theo 6 nhóm được liệt kê ở `Ke_hoach/00_INDEX.md` mục 3 (Vỏ Portal / Nhóm 1 Kế toán / Nhóm 2 Nhân sự / Nhóm 3 Kinh doanh / Nhóm 4 Văn phòng / Nhóm 5 Chia sẻ & Nền tảng), mỗi module có một tệp riêng trong `Ke_hoach/02_ERP_Module/`.

## 4. Danh sách tính năng

| Mã | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| HS-01-F01 | Vỏ Portal điều hành: Trang chủ, Bảng điều khiển, Phân tích dữ liệu (cổng 3000). | Chưa bắt đầu | Vai trò cổng trung chuyển |
| HS-01-F02 | 29 mini-app theo 6 nhóm, mỗi app giao diện và cổng riêng. | Chưa bắt đầu | Chi tiết tại `00_INDEX.md` mục 3 |
| HS-01-F03 | Kết nối dữ liệu liên mini-app qua API server HS-02 (5000). | Chưa bắt đầu | Đầu việc tách source — xem §8 |

> Phân nhóm hiện tại (số module hoạt động): Vỏ Portal (3) · Kế toán (1) · Nhân sự (1) · Kinh doanh (15) · Văn phòng (7) · Chia sẻ & Nền tảng (2). Tổng 29. 15 module khác đã gộp hoặc loại bỏ ngày 2026-10-06, xem `00_INDEX.md` mục 3.1.

## 5. Phụ thuộc

- Hạ tầng dữ liệu: xem `HS-08_Ha_tang_CSDL_trung_tam_va_Cloud.md`.
- Cổng API: xem `HS-02_VComm_Core_Backend.md` (cổng 5000) — mọi mini-app chia sẻ dữ liệu qua đây.
- Hệ thống con có cổng riêng đã tồn tại: HS-03 eCommerce, HS-04 iPOS, HS-05 Seller Centre, HS-06 Store Retail, HS-07 Nexthub.

## 6. Tiêu chí nghiệm thu

- [ ] Vỏ Portal khởi động được ở cổng 3000.
- [ ] Kết nối được cổng API trung tâm HS-02 (5000).
- [ ] 29 mini-app được phân nhóm đúng theo `00_INDEX.md` mục 3.
- [ ] Mỗi mini-app có tệp kế hoạch riêng trong `02_ERP_Module/`.
- [ ] Danh mục tính năng ở mục 4 đã được duyệt.

## 7. Rủi ro và việc còn mở

- Việc tách ERP thành các mini-app có cổng riêng (mỗi app một process/port, nối qua API server) là **đầu việc kỹ thuật theo sau**, nằm ngoài phạm vi tài liệu này — cần bước thiết kế kiến trúc tách source.
- Một số module có thể trùng chức năng với hệ thống con (ví dụ luồng đơn hàng xuất hiện ở cả ERP và eCommerce) — ranh giới trách nhiệm chưa chốt.
- Danh mục tính năng chi tiết chưa được duyệt (cần bước BA).
- Chưa đối chiếu đầy đủ giữa tài liệu và mã nguồn thật của hệ thống này.

## 8. Chưa xác minh được

- Mức độ hoàn thiện thật của từng chức năng.
- Danh sách bảng dữ liệu riêng của hệ thống.
- Tình trạng kiểm thử tự động của hệ thống.
- Cổng (Portal) gán cho mỗi mini-app (dải 3101–3402) là **giả định**; cổng thật sẽ cố định khi tách source thành các ứng dụng riêng — chưa chốt.
- Việc tách ERP thành mini-app có cổng riêng là đầu việc kỹ thuật chưa thực hiện (xem `Checklist_cong_viec.md`).
