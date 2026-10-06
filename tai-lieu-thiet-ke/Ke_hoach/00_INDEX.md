# 00 — Mục lục bộ kế hoạch VComm

> Mục lục toàn bộ bộ kế hoạch: kế hoạch tổng thể, kế hoạch từng hệ thống con và kế hoạch từng module ERP.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-06

## Cấu trúc Portal VComm và 6 nhóm mini-app — 2026-10-06

Theo yêu cầu chủ dự án ngày 2026-10-06, ERP được chuyển thành **cổng Portal**: các chức năng trở thành **mini-app**, mỗi mini-app có giao diện và cổng riêng, kết nối dữ liệu với nhau qua API server (HS-02 VComm Core Backend, cổng 5000). Bộ module được tái cấu trúc từ 5 nhóm chức năng thành **Portal + 6 nhóm mini-app**:

| Nhóm | Tên | Module tiêu biểu |
|---|---|---|
| Vỏ Portal (shell) | Trang chủ, Bảng điều khiển, Phân tích dữ liệu | MOD-01, MOD-02, MOD-03 |
| 1 | Kế toán | MOD-30 |
| 2 | Nhân sự (HRM) | MOD-39 |
| 3 | Kinh doanh | MOD-36, MOD-37, MOD-35, MOD-11, MOD-14, MOD-15, MOD-16, MOD-20, MOD-21, MOD-22, MOD-24, MOD-10, MOD-32, MOD-25, MOD-27 |
| 4 | Văn phòng | MOD-04, MOD-05, MOD-06, MOD-07, MOD-08, MOD-09, MOD-43 |
| 5 | Chia sẻ & Nền tảng | MOD-28, MOD-44 |

Mô hình này khớp với các hệ thống con đã có cổng riêng: HS-03 eCommerce :5173, HS-04 iPOS :3002, HS-05 Seller :3004, HS-06 Store Retail :3003, HS-07 Nexthub :3005 (xem `01_He_thong/`). Mini-app ERP được gán **cổng giả định** (dải 3101–3402) — cổng thật sẽ được cố định khi tách source (xem mục "Chưa xác minh được").

> Ghi chú: ngày 2026-10-06, 13 module bị gộp (MOD-29, 40, 41, 42, 17, 23, 26, 31, 19) hoặc loại bỏ (MOD-12, 13, 18, 38) theo tái cấu trúc này; số module hoạt động giảm từ 42 xuống 29. Xem mục 3.1.

## 1. Cấu trúc bộ kế hoạch

| Cấp | Thư mục | Số tệp | Nội dung |
|---|---|---|---|
| 0 | `00_KE_HOACH_TONG_THE.md` | 1 | Kế hoạch tổng thể toàn dự án |
| 1 | `01_He_thong/` | 8 | Kế hoạch từng hệ thống con |
| 2 | `02_ERP_Module/` | 29 | Kế hoạch từng module chức năng của ERP đang hoạt động (15 mô-đun tạm hủy/đã gộp, xem mục 3.1) |
| 3 | `03_Ke_hoach_Tach_Source_Portal_MiniApp.md` | 1 | Kế hoạch kỹ thuật tách source: vỏ Portal + 29 mini-app (S1–S7) — 🟡 chờ duyệt |

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

## 3. Cấp 2 — Kế hoạch module ERP (Portal + 6 nhóm mini-app)

> Cột "Cổng (Portal)" là cổng giả định của mỗi mini-app; dữ liệu đều qua API server HS-02 (5000).


### Vỏ Portal (shell) — 3 module

| Mã | Module | Tuyến đường | Cổng (Portal) | Tệp |
|---|---|---|---|---|
| MOD-01 | Trang chủ | `/` | 3000 (shell) | `02_ERP_Module/04_Van_phong_Dieu_hanh/MOD-01_Trang_chu.md` |
| MOD-02 | Bảng điều khiển | `/dashboard` | 3000 (shell) | `02_ERP_Module/04_Van_phong_Dieu_hanh/MOD-02_Bang_dieu_khien.md` |
| MOD-03 | Phân tích dữ liệu | `/bi` | 3000 (shell) | `02_ERP_Module/04_Van_phong_Dieu_hanh/MOD-03_Phan_tich_du_lieu.md` |

### Nhóm 1 — Kế toán (1 module)

| Mã | Module | Tuyến đường | Cổng (Portal) | Tệp |
|---|---|---|---|---|
| MOD-30 | Kế toán (TT99/2025) | `/ke-toan-tt99` | 3101 | `02_ERP_Module/01_Ke_toan/MOD-30_Ke_toan_TT99_2025.md` |

### Nhóm 2 — Nhân sự (HRM) (1 module)

| Mã | Module | Tuyến đường | Cổng (Portal) | Tệp |
|---|---|---|---|---|
| MOD-39 | Quản trị Nhân sự (HRM) | `/hr` | 3102 | `02_ERP_Module/02_Nhan_su/MOD-39_Quan_tri_Nhan_su_HRM.md` |

### Nhóm 3 — Kinh doanh (15 module)

| Mã | Module | Tuyến đường | Cổng (Portal) | Tệp |
|---|---|---|---|---|
| MOD-36 | Khách hàng (CRM) | `/customers` | 3201 | `02_ERP_Module/05_Kinh_doanh/MOD-36_Khach_hang_CRM.md` |
| MOD-37 | Chăm sóc Khách hàng | `/cskh` | 3202 | `02_ERP_Module/05_Kinh_doanh/MOD-37_Cham_soc_Khach_hang.md` |
| MOD-35 | Nhà bán hàng | `/sellers` | 3203 | `02_ERP_Module/05_Kinh_doanh/MOD-35_Nha_ban_hang.md` |
| MOD-11 | Quản lý Đơn hàng | `/orders` | 3204 | `02_ERP_Module/05_Kinh_doanh/MOD-11_Quan_ly_Don_hang.md` |
| MOD-14 | Quản lý sản phẩm | `/pim` | 3205 | `02_ERP_Module/05_Kinh_doanh/MOD-14_Quan_ly_san_pham.md` |
| MOD-15 | Social | `/social` | 3206 | `02_ERP_Module/05_Kinh_doanh/MOD-15_Social.md` |
| MOD-16 | Quản lý khuyến mại | `/flash-sale` | 3207 | `02_ERP_Module/05_Kinh_doanh/MOD-16_Flash_Sale_Mua_chung.md` |
| MOD-20 | VComm Hub (O2O) | `/vcomm-hub` | 3208 | `02_ERP_Module/05_Kinh_doanh/MOD-20_VComm_Hub_O2O.md` |
| MOD-21 | V-Xu | `/vxu` | 3209 | `02_ERP_Module/05_Kinh_doanh/MOD-21_V_Xu.md` |
| MOD-22 | KOL/KOC & Affiliate | `/affiliate` | 3210 | `02_ERP_Module/05_Kinh_doanh/MOD-22_KOL_KOC_Affiliate.md` |
| MOD-24 | Quản lý Quảng cáo (Ads) | `/ads` | 3211 | `02_ERP_Module/05_Kinh_doanh/MOD-24_Quan_ly_Quang_cao_Ads.md` |
| MOD-10 | Siêu thị VComm (Offline) | `/vcomm-supermarket` | 3212 | `02_ERP_Module/05_Kinh_doanh/MOD-10_Sieu_thi_VComm_Offline.md` |
| MOD-32 | Ví & Thanh toán | `/wallet` | 3213 | `02_ERP_Module/05_Kinh_doanh/MOD-32_Vi_Thanh_toan.md` |
| MOD-25 | Kho vận & Logistics | `/warehouse` | 3214 | `02_ERP_Module/05_Kinh_doanh/MOD-25_Quan_tri_Kho_van.md` |
| MOD-27 | Mua hàng, NCC & Đối soát | `/scm` | 3215 | `02_ERP_Module/05_Kinh_doanh/MOD-27_Mua_hang_NCC.md` |

### Nhóm 4 — Văn phòng (7 module)

| Mã | Module | Tuyến đường | Cổng (Portal) | Tệp |
|---|---|---|---|---|
| MOD-04 | Điều hành & Workflow | `/workflow` | 3301 | `02_ERP_Module/04_Van_phong_Dieu_hanh/MOD-04_Dieu_hanh_Workflow.md` |
| MOD-05 | Quản lý Công việc | `/tasks` | 3302 | `02_ERP_Module/04_Van_phong_Dieu_hanh/MOD-05_Quan_ly_Cong_viec.md` |
| MOD-06 | Đề xuất & Trình ký | `/requests` | 3303 | `02_ERP_Module/04_Van_phong_Dieu_hanh/MOD-06_De_xuat_Trinh_ky.md` |
| MOD-07 | Hợp đồng & Pháp chế | `/contracts` | 3304 | `02_ERP_Module/04_Van_phong_Dieu_hanh/MOD-07_Hop_dong_Phap_che.md` |
| MOD-08 | Quản lý Công văn | `/documents` | 3305 | `02_ERP_Module/04_Van_phong_Dieu_hanh/MOD-08_Quan_ly_Cong_van.md` |
| MOD-09 | Trung tâm Ký số | `/signature` | 3306 | `02_ERP_Module/04_Van_phong_Dieu_hanh/MOD-09_Trung_tam_Ky_so.md` |
| MOD-43 | Không gian làm việc | `/workspace` | 3307 | `02_ERP_Module/04_Van_phong_Dieu_hanh/MOD-43_Khong_gian_lam_viec.md` |

### Nhóm 5 — Chia sẻ & Nền tảng (2 module)

| Mã | Module | Tuyến đường | Cổng (Portal) | Tệp |
|---|---|---|---|---|
| MOD-28 | Tuân thủ & Pháp chế | `/compliance` | 3401 | `02_ERP_Module/06_Chia_se_Nen_tang/MOD-28_Tuan_thu_Phap_che.md` |
| MOD-44 | Cấu hình hệ thống | `/settings` | 3402 | `02_ERP_Module/06_Chia_se_Nen_tang/MOD-44_Cau_hinh_he_thong.md` |

### 3.1. Mô-đun đã gộp / tạm hủy / loại bỏ

Ngày 2026-10-06, 13 module bị gộp hoặc loại bỏ theo tái cấu trúc ERP thành Portal. Mã đã cấp được giữ nguyên, không tái sử dụng. Chi tiết xem `_Tam_huy/README.md`.

**Đã gộp (chức năng hợp nhất vào module đích):**

| Mã | Tên | Gộp vào |
|---|---|---|
| MOD-29 | Tài chính - Kế toán | MOD-30 Kế toán |
| MOD-40 | Hồ sơ Nhân sự (EasyHRM) | MOD-39 HRM |
| MOD-41 | Sơ đồ tổ chức | MOD-39 HRM |
| MOD-42 | Hiệu suất & Đào tạo | MOD-39 HRM |
| MOD-17 | Mua chung (Group Buy) | MOD-16 Quản lý khuyến mại |
| MOD-23 | Khách hàng thân thiết | MOD-21 V-Xu |
| MOD-26 | Vận chuyển (Logistics) | MOD-25 Kho vận & Logistics |
| MOD-31 | Đối soát & Công nợ | MOD-27 Mua hàng, NCC & Đối soát |
| MOD-19 | Dropship | MOD-35 Nhà bán hàng |

**Loại bỏ / Tạm hủy:**

| Mã | Tên | Trạng thái | Ghi chú |
|---|---|---|---|
| MOD-12 | Quản lý Livestream | Loại bỏ | Loại bỏ theo tái cấu trúc Portal |
| MOD-13 | Mạng xã hội người dùng | Loại bỏ | Loại bỏ theo tái cấu trúc Portal |
| MOD-18 | F2B2B — Gom đơn B2B | Loại bỏ | Trước đây giữ nguyên Trụ cột 4, nay loại bỏ |
| MOD-38 | Đội ngũ Kinh doanh | Tạm hủy | Q-03 đã chốt: không còn quản lý khách hàng tiềm năng |

**Tạm hủy trước đó (2026-10-05):**

| Mã | Tên | Ghi chú |
|---|---|---|
| MOD-33 | Hỗ trợ Tài chính Nhà bán | `_Tam_huy/MOD-33_Ho_tro_Tai_chinh_Nha_ban.md` |
| MOD-34 | Cho thuê thiết bị (Trả góp) | `_Tam_huy/MOD-34_Cho_thue_thiet_bi_Tra_gop.md` |

## 4. Quy ước mã

- `HS-nn`: hệ thống con trong hệ sinh thái VComm.
- `MOD-nn`: module chức năng của VComm ERP, đánh số liên tục theo thứ tự menu.
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
