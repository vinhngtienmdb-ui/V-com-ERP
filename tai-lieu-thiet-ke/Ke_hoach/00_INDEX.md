# 00 — Mục lục bộ kế hoạch VComm

> Mục lục toàn bộ bộ kế hoạch: kế hoạch tổng thể, kế hoạch từng hệ thống con và kế hoạch từng module ERP.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Cấu trúc bộ kế hoạch

| Cấp | Thư mục | Số tệp | Nội dung |
|---|---|---|---|
| 0 | `00_KE_HOACH_TONG_THE.md` | 1 | Kế hoạch tổng thể toàn dự án |
| 1 | `01_He_thong/` | 8 | Kế hoạch từng hệ thống con |
| 2 | `02_ERP_Module/` | 42 | Kế hoạch từng module chức năng của ERP đang hoạt động (2 mô-đun tạm hủy, xem mục 3.1) |

## 2. Cấp 1 — Kế hoạch hệ thống con

| Mã | Hệ thống | Thư mục mã nguồn | Cổng | Tệp |
|---|---|---|---|---|
| HS-01 | VComm ERP | `vcomm-erp` | 3000 | `01_He_thong/HS-01_VComm_ERP.md` |
| HS-02 | VComm Core Backend | `vcomm-core-backend` | 5000 | `01_He_thong/HS-02_VComm_Core_Backend.md` |
| HS-03 | VComm eCommerce | `vcomm-ecommerce` | 5173 | `01_He_thong/HS-03_VComm_eCommerce.md` |
| HS-04 | VComm iPOS | `vcomm-ipos` | 3002 | `01_He_thong/HS-04_VComm_iPOS.md` |
| HS-05 | VComm Seller Centre | `vcomm-seller` | 3004 | `01_He_thong/HS-05_VComm_Seller_Centre.md` |
| HS-06 | VComm Store Retail | `vcomm-store-retail` | 3003 | `01_He_thong/HS-06_VComm_Store_Retail.md` |
| HS-07 | VComm Nexthub | `vcomm-nexthub` | 3005 | `01_He_thong/HS-07_VComm_Nexthub.md` |
| HS-08 | Hạ tầng CSDL trung tâm và Cloud | `Root SQL / Cloud` | Cloud | `01_He_thong/HS-08_Ha_tang_CSDL_trung_tam_va_Cloud.md` |

## 3. Cấp 2 — Kế hoạch module ERP


### Tổng quan & Điều hành

| Mã | Module | Tuyến đường | Tệp |
|---|---|---|---|
| MOD-01 | Trang chủ | `/` | `02_ERP_Module/N1_Tong_quan_va_Dieu_hanh/MOD-01_Trang_chu.md` |
| MOD-02 | Bảng điều khiển | `/dashboard` | `02_ERP_Module/N1_Tong_quan_va_Dieu_hanh/MOD-02_Bang_dieu_khien.md` |
| MOD-03 | Phân tích dữ liệu | `/bi` | `02_ERP_Module/N1_Tong_quan_va_Dieu_hanh/MOD-03_Phan_tich_du_lieu.md` |
| MOD-04 | Điều hành & Workflow | `/workflow` | `02_ERP_Module/N1_Tong_quan_va_Dieu_hanh/MOD-04_Dieu_hanh_Workflow.md` |
| MOD-05 | Quản lý Công việc | `/tasks` | `02_ERP_Module/N1_Tong_quan_va_Dieu_hanh/MOD-05_Quan_ly_Cong_viec.md` |

### Hành chính & Pháp lý

| Mã | Module | Tuyến đường | Tệp |
|---|---|---|---|
| MOD-06 | Đề xuất & Trình ký | `/requests` | `02_ERP_Module/N2_Hanh_chinh_va_Phap_ly/MOD-06_De_xuat_Trinh_ky.md` |
| MOD-07 | Hợp đồng & Pháp chế | `/contracts` | `02_ERP_Module/N2_Hanh_chinh_va_Phap_ly/MOD-07_Hop_dong_Phap_che.md` |
| MOD-08 | Quản lý Công văn | `/documents` | `02_ERP_Module/N2_Hanh_chinh_va_Phap_ly/MOD-08_Quan_ly_Cong_van.md` |
| MOD-09 | Trung tâm Ký số | `/signature` | `02_ERP_Module/N2_Hanh_chinh_va_Phap_ly/MOD-09_Trung_tam_Ky_so.md` |

### Kinh doanh & Tiếp thị

| Mã | Module | Tuyến đường | Tệp |
|---|---|---|---|
| MOD-10 | Siêu thị VComm (Offline) | `/vcomm-supermarket` | `02_ERP_Module/N3_Kinh_doanh_va_Tiep_thi/MOD-10_Sieu_thi_VComm_Offline.md` |
| MOD-11 | Quản lý Đơn hàng | `/orders` | `02_ERP_Module/N3_Kinh_doanh_va_Tiep_thi/MOD-11_Quan_ly_Don_hang.md` |
| MOD-12 | Quản lý Livestream | `/live` | `02_ERP_Module/N3_Kinh_doanh_va_Tiep_thi/MOD-12_Quan_ly_Livestream.md` |
| MOD-13 | Mạng xã hội người dùng | `/social` | `02_ERP_Module/N3_Kinh_doanh_va_Tiep_thi/MOD-13_Mang_xa_hoi_nguoi_dung.md` |
| MOD-14 | Quản lý sản phẩm | `/pim` | `02_ERP_Module/N3_Kinh_doanh_va_Tiep_thi/MOD-14_Quan_ly_san_pham.md` |
| MOD-15 | Marketing & Social | `/marketing` | `02_ERP_Module/N3_Kinh_doanh_va_Tiep_thi/MOD-15_Marketing_Social.md` |
| MOD-16 | Flash Sale & Mua chung | `/flash-sale` | `02_ERP_Module/N3_Kinh_doanh_va_Tiep_thi/MOD-16_Flash_Sale_Mua_chung.md` |
| MOD-17 | Mua chung (Group Buy) | `/group-buy` | `02_ERP_Module/N3_Kinh_doanh_va_Tiep_thi/MOD-17_Mua_chung_Group_Buy.md` |
| MOD-18 | F2B2B — Gom đơn B2B | `/f2b2b` | `02_ERP_Module/N3_Kinh_doanh_va_Tiep_thi/MOD-18_F2B2B_Gom_don_B2B.md` |
| MOD-19 | Dropship | `/dropship` | `02_ERP_Module/N3_Kinh_doanh_va_Tiep_thi/MOD-19_Dropship.md` |
| MOD-20 | VComm Hub (O2O) | `/vcomm-hub` | `02_ERP_Module/N3_Kinh_doanh_va_Tiep_thi/MOD-20_VComm_Hub_O2O.md` |
| MOD-21 | V-Xu | `/vxu` | `02_ERP_Module/N3_Kinh_doanh_va_Tiep_thi/MOD-21_V_Xu.md` |
| MOD-22 | KOL/KOC & Affiliate | `/affiliate` | `02_ERP_Module/N3_Kinh_doanh_va_Tiep_thi/MOD-22_KOL_KOC_Affiliate.md` |
| MOD-23 | Khách hàng thân thiết | `/loyalty` | `02_ERP_Module/N3_Kinh_doanh_va_Tiep_thi/MOD-23_Khach_hang_than_thiet.md` |
| MOD-24 | Quản lý Quảng cáo (Ads) | `/ads` | `02_ERP_Module/N3_Kinh_doanh_va_Tiep_thi/MOD-24_Quan_ly_Quang_cao_Ads.md` |

### Kho & Chuỗi cung ứng

| Mã | Module | Tuyến đường | Tệp |
|---|---|---|---|
| MOD-25 | Quản trị Kho vận | `/warehouse` | `02_ERP_Module/N4_Kho_va_Chuoi_cung_ung/MOD-25_Quan_tri_Kho_van.md` |
| MOD-26 | Vận chuyển (Logistics) | `/logistics` | `02_ERP_Module/N4_Kho_va_Chuoi_cung_ung/MOD-26_Van_chuyen_Logistics.md` |
| MOD-27 | Mua hàng & NCC | `/scm` | `02_ERP_Module/N4_Kho_va_Chuoi_cung_ung/MOD-27_Mua_hang_NCC.md` |
| MOD-28 | Tuân thủ & Pháp chế | `/compliance` | `02_ERP_Module/N4_Kho_va_Chuoi_cung_ung/MOD-28_Tuan_thu_Phap_che.md` |

### Tài chính & Thanh toán

| Mã | Module | Tuyến đường | Tệp |
|---|---|---|---|
| MOD-29 | Tài chính - Kế toán | `/finance` | `02_ERP_Module/N5_Tai_chinh_va_Thanh_toan/MOD-29_Tai_chinh_Ke_toan.md` |
| MOD-30 | Kế toán TT99/2025 | `/ke-toan-tt99` | `02_ERP_Module/N5_Tai_chinh_va_Thanh_toan/MOD-30_Ke_toan_TT99_2025.md` |
| MOD-31 | Đối soát & Công nợ | `/settlement` | `02_ERP_Module/N5_Tai_chinh_va_Thanh_toan/MOD-31_Doi_soat_Cong_no.md` |
| MOD-32 | Ví & Thanh toán | `/wallet` | `02_ERP_Module/N5_Tai_chinh_va_Thanh_toan/MOD-32_Vi_Thanh_toan.md` |

### Khách hàng & Nhân sự

| Mã | Module | Tuyến đường | Tệp |
|---|---|---|---|
| MOD-35 | Nhà bán hàng | `/sellers` | `02_ERP_Module/N6_Khach_hang_va_Nhan_su/MOD-35_Nha_ban_hang.md` |
| MOD-36 | Khách hàng (CRM) | `/customers` | `02_ERP_Module/N6_Khach_hang_va_Nhan_su/MOD-36_Khach_hang_CRM.md` |
| MOD-37 | Chăm sóc Khách hàng | `/cskh` | `02_ERP_Module/N6_Khach_hang_va_Nhan_su/MOD-37_Cham_soc_Khach_hang.md` |
| MOD-38 | Đội ngũ Kinh doanh | `/sales` | `02_ERP_Module/N6_Khach_hang_va_Nhan_su/MOD-38_Doi_ngu_Kinh_doanh.md` |
| MOD-39 | Quản trị Nhân sự (HRM) | `/hr` | `02_ERP_Module/N6_Khach_hang_va_Nhan_su/MOD-39_Quan_tri_Nhan_su_HRM.md` |
| MOD-40 | Hồ sơ Nhân sự (EasyHRM) | `/easyhrm` | `02_ERP_Module/N6_Khach_hang_va_Nhan_su/MOD-40_Ho_so_Nhan_su_EasyHRM.md` |
| MOD-41 | Sơ đồ tổ chức | `/org` | `02_ERP_Module/N6_Khach_hang_va_Nhan_su/MOD-41_So_do_to_chuc.md` |
| MOD-42 | Hiệu suất & Đào tạo | `/performance` | `02_ERP_Module/N6_Khach_hang_va_Nhan_su/MOD-42_Hieu_suat_Dao_tao.md` |
| MOD-43 | Không gian làm việc | `/workspace` | `02_ERP_Module/N6_Khach_hang_va_Nhan_su/MOD-43_Khong_gian_lam_viec.md` |

### Cấu hình

| Mã | Module | Tuyến đường | Tệp |
|---|---|---|---|
| MOD-44 | Cấu hình hệ thống | `/settings` | `02_ERP_Module/N7_Cau_hinh/MOD-44_Cau_hinh_he_thong.md` |

### 3.1. Mô-đun tạm hủy

Ngày 2026-10-05, hai mô-đun được tạm hủy theo yêu cầu chủ dự án. Mã đã cấp được giữ nguyên, không tái sử dụng.

| Mã | Module | Tuyến đường | Tệp kế hoạch (đã dời) |
|---|---|---|---|
| MOD-33 | Hỗ trợ Tài chính Nhà bán | `/seller-finance` | `_Tam_huy/MOD-33_Ho_tro_Tai_chinh_Nha_ban.md` |
| MOD-34 | Cho thuê thiết bị (Trả góp) | `/device-leasing` | `_Tam_huy/MOD-34_Cho_thue_thiet_bi_Tra_gop.md` |

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
- Hai mô-đun tạm hủy (MOD-33, MOD-34) có thể được khôi phục; thời điểm khôi phục chưa chốt.
- Một số module có thể trùng chức năng với hệ thống con (ví dụ luồng đơn hàng xuất hiện ở cả ERP và eCommerce) — chưa chốt ranh giới trách nhiệm.
