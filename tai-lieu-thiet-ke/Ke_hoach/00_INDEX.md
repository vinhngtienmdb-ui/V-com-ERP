# 00 — Mục lục bộ kế hoạch VComm

> Mục lục toàn bộ bộ kế hoạch: kế hoạch tổng thể, kế hoạch từng hệ thống con và kế hoạch từng module ERP.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-06

## Cấu trúc Vỏ Portal + 5 nhóm mini-app — 26 module (chốt 2026-10-06)

Theo yêu cầu chủ dự án, ERP được chuyển thành **cổng Portal**: các chức năng trở thành **mini-app**, mỗi mini-app có giao diện và cổng riêng, kết nối dữ liệu với nhau qua API server (HS-02 VComm Core Backend, cổng 5000). Bộ module đánh số lại (bản **v2**) theo nhóm phân hệ:

| Nhóm | Tên | Module | Cổng |
|---|---|---|---|
| Vỏ Portal (shell) | Dashboard cá nhân | MOD-01 | 3000 |
| 1 | Kế toán | MOD-02 | 3101 |
| 2 | Nhân sự (HRM) | MOD-03, MOD-04 | 3102–3103 |
| 3 | Kinh doanh | MOD-05 … MOD-19 (15) | 3201–3215 |
| 4 | Văn phòng | MOD-20 … MOD-24 (5) | 3301–3305 |
| 5 | Chia sẻ & Nền tảng | MOD-25, MOD-26 | 3401–3402 |

**Tổng: 26 module.** Mô hình này khớp với các hệ thống con đã có cổng riêng: HS-03 eCommerce :5173, HS-04 iPOS :3002, HS-05 Seller :3004, HS-06 Store Retail :3003, HS-07 Nexthub :3005 (xem `01_He_thong/`). Mini-app ERP được gán **cổng giả định** (dải 3101–3402) — cổng thật sẽ được cố định khi tách source (xem mục "Chưa xác minh được").

> Ghi chú: số module hoạt động giảm 42 → 29 (2026-10-06, tái cấu trúc Portal) rồi 29 → **26** (chốt 2026-10-06: gộp Dashboard, tách Nhóm 2 Nhân sự, nhập Workflow/Workspace vào Portal). Chi tiết xem mục 3.1 và `Ke_hoach/05_Cau_truc_dich_ERP.md`.

## 1. Cấu trúc bộ kế hoạch

| Cấp | Thư mục | Số tệp | Nội dung |
|---|---|---|---|
| 0 | `00_KE_HOACH_TONG_THE.md` | 1 | Kế hoạch tổng thể toàn dự án |
| 1 | `01_He_thong/` | 8 | Kế hoạch từng hệ thống con |
| 2 | `02_ERP_Module/` | 26 | Kế hoạch từng module ERP đang hoạt động (15 mô-đun lưu trữ, xem mục 3.1) |
| 3 | `03_Ke_hoach_Tach_Source_Portal_MiniApp.md` | 1 | Kế hoạch kỹ thuật tách source: vỏ Portal + 26 mini-app (S1–S7) — 🟡 chờ duyệt |
| 4 | `04_Mo_ta_Chuc_nang_App_ERP.md` | 1 | Mô tả chức năng 29 app + đề xuất đánh số lần đầu (v1) — ✅ đã chốt, thay bằng KH-05 |
| 5 | `05_Cau_truc_dich_ERP.md` | 1 | **Cấu trúc đích sau chốt 2026-10-06: 26 app, đánh số v2 + ánh xạ QT** — ✅ đã chốt, đã thực thi |

## 2. Cấp 1 — Kế hoạch hệ thống con

| Mã | Hệ thống | Thư mục mã nguồn | Cổng | Tệp |
|---|---|---|---|---|
| HS-01 | VComm ERP (Portal) | `vcomm-erp` | 3000 | `01_He_thong/HS-01_VComm_ERP.md` |
| HS-02 | VComm Core Backend (API server) | `vcomm-core-backend` | 5000 | `01_He_thong/HS-02_VComm_Core_Backend.md` |
| HS-03 | VComm eCommerce | `vcomm-ecommerce` | 5173 | `01_He_thong/HS-03_VComm_eCommerce.md` |
| HS-04 | VComm iPOS | `vcomm-ipos` | 3002 | `01_He_thong/HS-04_VComm_iPOS.md` |
| HS-05 | VComm Seller Centre | `vcomm-seller` | 3004 | `01_He_thong/HS-05_VComm_Seller_Centre.md` |
| HS-06 | VComm Store Retail | `vcomm-store-retail` | 3003 | `01_He_thong/HS-06_VComm_Store_Retail.md` |
| HS-07 | VComm Nexthub | `vcomm-nexthub` | 3005 | `01_He_thong/HS-07_VComm_Nexthub.md` |
| HS-08 | Hạ tầng CSDL trung tâm và Cloud | `Root SQL / Cloud` | Cloud | `01_He_thong/HS-08_Ha_tang_CSDL_trung_tam_va_Cloud.md` |

## 3. Cấp 2 — Kế hoạch module ERP (Vỏ Portal + 5 nhóm mini-app)

> Cột "Cổng (Portal)" là cổng giả định của mỗi mini-app; dữ liệu đều qua API server HS-02 (5000).

### Vỏ Portal (shell) — 1 module

| Mã | Module | Tuyến đường | Cổng (Portal) | Tệp |
|---|---|---|---|---|
| MOD-01 | Dashboard (cá nhân) | `/dashboard` | 3000 (shell) | `02_ERP_Module/00_Vo_Portal/MOD-01_Dashboard.md` |

### Nhóm 1 — Kế toán (1 module)

| Mã | Module | Tuyến đường | Cổng (Portal) | Tệp |
|---|---|---|---|---|
| MOD-02 | Kế toán (TT99/2025) | `/ke-toan-tt99` | 3101 | `02_ERP_Module/01_Ke_toan/MOD-02_Ke_toan_TT99_2025.md` |

### Nhóm 2 — Nhân sự (HRM) (2 module)

| Mã | Module | Tuyến đường | Cổng (Portal) | Tệp |
|---|---|---|---|---|
| MOD-03 | Cổng Phòng Nhân sự (HR Portal) | `/hr` | 3102 | `02_ERP_Module/02_Nhan_su/MOD-03_Cong_Phong_Nhan_su.md` |
| MOD-04 | Cổng Tự phục vụ Nhân viên (ESS Portal) | `/ess` | 3103 | `02_ERP_Module/02_Nhan_su/MOD-04_Cong_Tu_phuc_vu_Nhan_vien.md` |

### Nhóm 3 — Kinh doanh (15 module)

| Mã | Module | Tuyến đường | Cổng (Portal) | Tệp |
|---|---|---|---|---|
| MOD-05 | Khách hàng (CRM) | `/customers` | 3201 | `02_ERP_Module/03_Kinh_doanh/MOD-05_Khach_hang_CRM.md` |
| MOD-06 | Chăm sóc Khách hàng | `/cskh` | 3202 | `02_ERP_Module/03_Kinh_doanh/MOD-06_Cham_soc_Khach_hang.md` |
| MOD-07 | Nhà bán hàng | `/sellers` | 3203 | `02_ERP_Module/03_Kinh_doanh/MOD-07_Nha_ban_hang.md` |
| MOD-08 | Quản lý Đơn hàng | `/orders` | 3204 | `02_ERP_Module/03_Kinh_doanh/MOD-08_Quan_ly_Don_hang.md` |
| MOD-09 | Quản lý sản phẩm (PIM) | `/pim` | 3205 | `02_ERP_Module/03_Kinh_doanh/MOD-09_Quan_ly_san_pham.md` |
| MOD-10 | Social | `/social` | 3206 | `02_ERP_Module/03_Kinh_doanh/MOD-10_Social.md` |
| MOD-11 | Quản lý khuyến mại | `/flash-sale` | 3207 | `02_ERP_Module/03_Kinh_doanh/MOD-11_Quan_ly_khuyen_mai.md` |
| MOD-12 | VComm Hub (O2O) | `/vcomm-hub` | 3208 | `02_ERP_Module/03_Kinh_doanh/MOD-12_VComm_Hub_O2O.md` |
| MOD-13 | V-Xu | `/vxu` | 3209 | `02_ERP_Module/03_Kinh_doanh/MOD-13_V_Xu.md` |
| MOD-14 | KOL/KOC & Affiliate | `/affiliate` | 3210 | `02_ERP_Module/03_Kinh_doanh/MOD-14_KOL_KOC_Affiliate.md` |
| MOD-15 | Quản lý Quảng cáo (Ads) | `/ads` | 3211 | `02_ERP_Module/03_Kinh_doanh/MOD-15_Quan_ly_Quang_cao_Ads.md` |
| MOD-16 | Siêu thị VComm (Offline) | `/vcomm-supermarket` | 3212 | `02_ERP_Module/03_Kinh_doanh/MOD-16_Sieu_thi_VComm_Offline.md` |
| MOD-17 | Ví & Thanh toán | `/wallet` | 3213 | `02_ERP_Module/03_Kinh_doanh/MOD-17_Vi_Thanh_toan.md` |
| MOD-18 | Kho vận & Logistics | `/warehouse` | 3214 | `02_ERP_Module/03_Kinh_doanh/MOD-18_Kho_van_Logistics.md` |
| MOD-19 | Mua hàng, NCC & Đối soát | `/scm` | 3215 | `02_ERP_Module/03_Kinh_doanh/MOD-19_Mua_hang_NCC_Doi_soat.md` |

### Nhóm 4 — Văn phòng (5 module)

| Mã | Module | Tuyến đường | Cổng (Portal) | Tệp |
|---|---|---|---|---|
| MOD-20 | Quản lý Công việc | `/tasks` | 3301 | `02_ERP_Module/04_Van_phong/MOD-20_Quan_ly_Cong_viec.md` |
| MOD-21 | Đề xuất & Trình ký | `/requests` | 3302 | `02_ERP_Module/04_Van_phong/MOD-21_De_xuat_Trinh_ky.md` |
| MOD-22 | Hợp đồng & Pháp chế | `/contracts` | 3303 | `02_ERP_Module/04_Van_phong/MOD-22_Hop_dong_Phap_che.md` |
| MOD-23 | Quản lý Công văn | `/documents` | 3304 | `02_ERP_Module/04_Van_phong/MOD-23_Quan_ly_Cong_van.md` |
| MOD-24 | Quản lý chữ ký số | `/signature` | 3305 | `02_ERP_Module/04_Van_phong/MOD-24_Quan_ly_chu_ky_so.md` |

### Nhóm 5 — Chia sẻ & Nền tảng (2 module)

| Mã | Module | Tuyến đường | Cổng (Portal) | Tệp |
|---|---|---|---|---|
| MOD-25 | Tuân thủ & Pháp chế | `/compliance` | 3401 | `02_ERP_Module/05_Chia_se_Nen_tang/MOD-25_Tuan_thu_Phap_che.md` |
| MOD-26 | Cấu hình hệ thống | `/settings` | 3402 | `02_ERP_Module/05_Chia_se_Nen_tang/MOD-26_Cau_hinh_he_thong.md` |

### 3.1. Mô-đun lưu trữ (gộp / tách / loại bỏ / tạm hủy)

**Chốt 2026-10-06 — gộp và tách (bản v2):**

| Mã cũ | Tên | Kết quả |
|---|---|---|
| MOD-01 | Trang chủ | Gộp vào **MOD-01 Dashboard** |
| MOD-02 | Bảng điều khiển | Gộp vào **MOD-01 Dashboard** |
| MOD-03 | Phân tích dữ liệu (BI) | Gộp vào **MOD-01 Dashboard** (chưa xây dựng giai đoạn này) |
| MOD-04 | Điều hành & Workflow | Gộp vào **MOD-01 Dashboard** |
| MOD-43 | Không gian làm việc | Gộp vào **MOD-01 Dashboard** |
| MOD-39 | Quản trị Nhân sự (HRM) | Tách thành **MOD-03** (Phòng Nhân sự) + **MOD-04** (Tự phục vụ Nhân viên) |

**Tái cấu trúc 2026-10-06 (bản 29, trước chốt v2) — gộp / loại bỏ / tạm hủy:**

| Mã cũ | Tên | Kết quả |
|---|---|---|
| MOD-29 | Tài chính - Kế toán | Gộp vào Kế toán |
| MOD-40 | Hồ sơ Nhân sự (EasyHRM) | Gộp vào Nhân sự |
| MOD-41 | Sơ đồ tổ chức | Gộp vào Nhân sự |
| MOD-42 | Hiệu suất & Đào tạo | Gộp vào Nhân sự |
| MOD-17 | Mua chung (Group Buy) | Gộp vào Quản lý khuyến mại |
| MOD-23 | Khách hàng thân thiết | Gộp vào V-Xu |
| MOD-26 | Vận chuyển (Logistics) | Gộp vào Kho vận & Logistics |
| MOD-31 | Đối soát & Công nợ | Gộp vào Mua hàng, NCC & Đối soát |
| MOD-19 | Dropship | Gộp vào Nhà bán hàng |
| MOD-12 | Quản lý Livestream | Loại bỏ |
| MOD-13 | Mạng xã hội người dùng | Loại bỏ |
| MOD-18 | F2B2B — Gom đơn B2B | Loại bỏ (trước giữ nguyên Trụ cột 4, nay loại bỏ) |
| MOD-38 | Đội ngũ Kinh doanh | Tạm hủy (Q-03: không còn quản lý khách hàng tiềm năng) |

**Tạm hủy trước đó (2026-10-05):**

| Mã | Tên | Ghi chú |
|---|---|---|
| MOD-33 | Hỗ trợ Tài chính Nhà bán | `_Tam_huy/MOD-33_Ho_tro_Tai_chinh_Nha_ban.md` |
| MOD-34 | Cho thuê thiết bị (Trả góp) | `_Tam_huy/MOD-34_Cho_thue_thiet_bi_Tra_gop.md` |

> Tổng lưu trữ: **15 mô-đun** (13 bản 29 + MOD-33/34). Riêng 6 mô-đun gộp/tách ngày 2026-10-06 lưu tại `_Tam_huy/` **không mang tiền tố mã** (Trang_chu, Bang_dieu_khien, Phan_tich_du_lieu, Dieu_hanh_Workflow, Khong_gian_lam_viec, Quan_tri_Nhan_su_HRM) để tránh trùng mã đã cấp lại.

## 4. Quy ước mã

- `HS-nn`: hệ thống con trong hệ sinh thái VComm.
- `MOD-nn`: module chức năng của VComm ERP, **đánh số liên tục theo nhóm phân hệ** (Vỏ Portal → Nhóm 1→5). Bản **v2** (2026-10-06) là bản hiện hành; bản v0 (42 mã gốc) và v1 (KH-04) chỉ dùng để truy vết — xem `Ke_hoach/05_Cau_truc_dich_ERP.md` §3.
- `MOD-nn-Fxx`: tính năng trong một module.
- Trạng thái dùng một trong các giá trị: Chưa bắt đầu, Đang làm, Chờ duyệt, Đã xong, Tạm dừng.

## 5. Cách dùng

1. Mở `00_KE_HOACH_TONG_THE.md` để nắm bức tranh chung và thứ tự ưu tiên.
2. Vào kế hoạch hệ thống con tương ứng để nắm phạm vi.
3. Vào kế hoạch module để kiểm soát từng tính năng: đổi trạng thái ở cột Trạng thái, ghi chú tiến độ.

## Chưa xác minh được

- Danh mục tính năng chi tiết của từng module và từng hệ thống chưa được duyệt (cần bước BA).
- Cổng (Portal) gán cho mỗi mini-app là **giả định** (dải 3101–3402); cổng thật sẽ cố định khi tách source thành các ứng dụng riêng — chưa chốt.
- Một số module có thể trùng chức năng với hệ thống con (ví dụ luồng đơn hàng xuất hiện ở cả ERP và eCommerce) — chưa chốt ranh giới trách nhiệm.
- Việc tách ERP thành các mini-app có cổng riêng (mỗi app một process/port, nối qua API server) là **đầu việc kỹ thuật theo sau**, nằm ngoài phạm vi tài liệu này (xem `Checklist_cong_viec.md`).
- Cơ chế "Dashboard cho từng cá nhân" (MOD-01) và ranh giới MOD-03/MOD-04 trong `HR.tsx` chưa rà từng màn hình.
