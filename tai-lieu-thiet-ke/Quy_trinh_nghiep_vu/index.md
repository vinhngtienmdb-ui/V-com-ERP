# Mục lục quy trình nghiệp vụ

- Dự án: VComm
- Ngày cập nhật gần nhất: 2026-10-06
- Số quy trình đang hoạt động: 27 (xem Nhóm 5)
- Số quy trình đã hợp nhất vào MD_ERP (nguồn gốc): 24
- Số quy trình lưu trữ / chuyển phạm vi (không mang mã): 9
- Số tiếp theo: QT-52

## Nguyên tắc phân nhóm (chuẩn hóa 2026-10-09)

Bộ quy trình được tổ chức thành **5 nhóm chức năng**. Bốn nhóm đầu (1–4) là nền tảng cốt lõi, lấy trọn vẹn từ bộ đặc tả gốc **`Mo ta nghiep vu/MD_ERP/`** — đây là **nguồn gốc duy nhất** của bốn phân hệ Kế toán, Nhân sự, CRM và Văn phòng. Nhóm 5 gom các quy trình thương mại và nền tảng mở rộng (không có trong MD_ERP).

> Quyết định: 24 quy trình cũ (QT-02…QT-23, QT-25, QT-26) chỉ sao chép lại nội dung MD_ERP nên được **hợp nhất vào MD_ERP** và đưa vào `_Tam_huy/`, giữ nguyên nội dung, bỏ tiền tố mã. Các mã này **nghỉ hưu, không tái sử dụng** (không dồn số) để bảo toàn khả năng truy vết ngược về đặc tả nguồn.

## Quy ước mã

Mã quy trình theo dạng QT-nn, đánh số tăng dần. Các mã đã nghỉ hưu (QT-02…QT-23, QT-25, QT-26) không được cấp lại. Quy trình tạm hủy hoặc hợp nhất vào nguồn thì dời vào `_Tam_huy/`, **bỏ tiền tố mã**; mã cũ ghi trong README của `_Tam_huy/` và trong mục "Lịch sử đánh số" dưới đây.

Mỗi quy trình gồm mười bốn mục đánh số cộng mục "Chưa xác minh được". Mọi khẳng định trong tài liệu phải kèm bằng chứng dạng `đường-dẫn:dòng` hoặc trích dẫn đặc tả nguồn.

---

## Nhóm 1–4 — Nền tảng cốt lõi (nguồn gốc: MD_ERP)

Bốn nhóm này **không có quy trình QT riêng** — nội dung đầy đủ nằm trong `Mo ta nghiep vu/MD_ERP/`. Tra cứu tại thư mục đó.

### Nhóm 1 — Kế toán (MD_ERP `1_accounting/`, 11 đặc tả 01–11)

| Mã nguồn | Tệp MD_ERP | Tên phân hệ |
|---|---|---|
| 01 | `01_cash.md` | Quỹ tiền mặt |
| 02 | `02_bank.md` | Tiền gửi Ngân hàng |
| 03 | `03_purchase.md` | Mua hàng & Công nợ phải trả |
| 04 | `04_sales.md` | Bán hàng & Công nợ phải thu |
| 05 | `05_invoice.md` | Hóa đơn điện tử |
| 06 | `06_inventory.md` | Nhập – Xuất – Tồn kho |
| 07 | `07_tools.md` | Công cụ dụng cụ |
| 08 | `08_assets.md` | Tài sản cố định |
| 09 | `09_taxes.md` | Thuế GTGT |
| 10 | `10_costing.md` | Giá thành |
| 11 | `11_general_ledger.md` | Tổng hợp & Khóa sổ |

> 11 quy trình QT tương ứng (QT-02…QT-12) đã hợp nhất vào MD_ERP — xem `_Tam_huy/`.

### Nhóm 2 — Nhân sự (MD_ERP `2_hrm/`, 11 đặc tả 12–22)

| Mã nguồn | Tệp MD_ERP | Tên phân hệ |
|---|---|---|
| 12 | `12_recruitment.md` | Tuyển dụng |
| 13 | `13_onboarding.md` | Tiếp nhận nhân sự mới |
| 14 | `14_employee_records.md` | Hồ sơ nhân viên |
| 15 | `15_labor_contracts.md` | Hợp đồng lao động |
| 16 | `16_timekeeping.md` | Chấm công |
| 17 | `17_payroll.md` | Tính lương |
| 18 | `18_social_insurance.md` | Bảo hiểm xã hội |
| 19 | `19_pit.md` | Thuế thu nhập cá nhân |
| 20 | `20_kpi_okr.md` | KPI / OKR |
| 21 | `21_training.md` | Đào tạo |
| 22 | `22_rewards_discipline.md` | Khen thưởng – Kỷ luật |

> 11 quy trình QT tương ứng (QT-13…QT-23) đã hợp nhất vào MD_ERP — xem `_Tam_huy/`.

### Nhóm 3 — CRM & Khách hàng (MD_ERP `3_crm/`, 5 đặc tả 23–27)

| Mã nguồn | Tệp MD_ERP | Tên phân hệ |
|---|---|---|
| 23 | `23_leads.md` | Tiềm năng |
| 24 | `24_accounts.md` | Khách hàng (tài khoản) |
| 25 | `25_contacts.md` | Liên hệ |
| 26 | `26_opportunities.md` | Cơ hội bán hàng |
| 27 | `27_quotes_orders.md` | Báo giá & Đơn hàng |

> Lưu ý: mô hình VComm là thương mại điện tử, khách hàng tự đăng ký qua cổng eCommerce. Do đó quy trình **Quản trị Khách hàng** được giữ lại dưới dạng viết lại theo TMĐT tại **QT-24** (không phải MD_ERP `24_accounts.md`). Các quy trình Tiềm năng / Liên hệ / Cơ hội / Báo giá không áp dụng và đã tạm hủy (xem `_Tam_huy/`).

### Nhóm 4 — Văn phòng & Điều hành (MD_ERP `4_office/`, 2 đặc tả 28–29)

| Mã nguồn | Tệp MD_ERP | Tên phân hệ |
|---|---|---|
| 28 | `28_workflows.md` | Quy trình (Workflows/BPM) |
| 29 | `29_tasks.md` | Công việc & Dự án |

> 2 quy trình QT tương ứng (QT-25, QT-26) đã hợp nhất vào MD_ERP — xem `_Tam_huy/`.

---

## Nhóm 5 — Thương mại & Nền tảng mở rộng (27 quy trình, không có trong MD_ERP)

> ⚠️ **Dồn mã 2026-10-06:** loại bỏ **QT-32** (F2B2B) và **QT-39** (Livestream) — dời `_Tam_huy/`, bỏ tiền tố mã; **QT-54** (E-Menu) dời hẳn sang iPOS (HS-04). 27 quy trình còn lại **được dồn số liên tục**: QT-33…QT-38 → QT-32…QT-37; QT-40…QT-53 → QT-38…QT-51. Bảng dưới đây là mã **sau dồn**.

> Bảy quy trình QT-31, QT-34, QT-36, QT-33, QT-35, QT-51 (và QT-54 cũ, nay thuộc iPOS) đã được viết lại theo **bốn quyết định chốt ngày 2026-10-09** về mô hình Pinduoduo (xem `Phan_tich_chong_cheo_iPOS_Hub_MuaChung_VXu.md`, mục 6.1): (1) **V-Xu là động cơ điểm duy nhất**, Loyalty thành tầng giao diện/giữ chân (QT-34, QT-36); (2) **Hub bán tại quầy phân theo loại trạm** — `standard`/`freeze` bán được, `locker` chỉ nhận hàng (QT-33); (3) **Siêu thị và E-Menu là POS nội bộ do VComm vận hành**, khác iPOS đối tác (QT-51, QT-54 cũ); (4) **Mạng Affiliate/KOL gánh vai trò gom nhu cầu** (团长), không xây vai trò mới (QT-35).

### 5A — Xác thực & Khách hàng

| Mã | Tệp | Tên quy trình | Trạng thái |
|---|---|---|---|
| QT-01 | `QT-01_Dang_nhap_va_xac_thuc_phien_nguoi_ban.md` | Đăng nhập & xác thực phiên người bán | Chờ duyệt |
| QT-24 | `QT-24_Quan_tri_Khach_hang.md` | Quản trị Khách hàng (viết lại theo TMĐT) | Chờ duyệt |

### 5B — Sàn, Sản phẩm & Nhà bán hàng

| Mã | Tệp | Tên quy trình | Trạng thái |
|---|---|---|---|
| QT-27 | `QT-27_Vong_doi_Don_hang_va_Phe_duyet_Doi_tra.md` | Vòng đời Đơn hàng & Đổi trả | Chờ duyệt |
| QT-28 | `QT-28_Quan_ly_Thong_tin_San_pham_PIM.md` | Quản lý Thông tin Sản phẩm (PIM) | Chờ duyệt |
| QT-29 | `QT-29_Quan_ly_Nha_ban_hang.md` | Quản lý Nhà bán hàng | Chờ duyệt |
| QT-51 | `QT-51_Sieu_thi_Offline_va_Ban_le_tai_quay.md` | Siêu thị Offline & Bán lẻ tại quầy | Chờ duyệt |

> E-Menu & Đặt món tại bàn (**QT-54 cũ**) đã **chuyển sang iPOS (HS-04)** — xem `iPOS/E_Menu_va_Dat_mon_tai_ban.md`.

### 5C — Xúc tiến & Marketing

| Mã | Tệp | Tên quy trình | Trạng thái |
|---|---|---|---|
| QT-30 | `QT-30_Khuyen_mai_va_Flash_Sale.md` | Khuyến mãi & Flash Sale | Chờ duyệt |
| QT-31 | `QT-31_Mua_chung_Group_Buy.md` | Mua chung (Pinduoduo 拼团) — tính năng con của MOD-11 | Chờ duyệt |
| QT-35 | `QT-35_KOL_KOC_va_Tiep_thi_lien_ket.md` | KOL, KOC & Tiếp thị liên kết | Chờ duyệt |
| QT-37 | `QT-37_Quan_ly_Quang_cao_Ads.md` | Quản lý Quảng cáo | Chờ duyệt |

> Livestream bán hàng (**QT-39 cũ**) đã **loại bỏ** — lưu tại `_Tam_huy/Livestream_ban_hang.md`.

### 5D — Mô hình hợp tác & Hậu cần

| Mã | Tệp | Tên quy trình | Trạng thái |
|---|---|---|---|
| QT-32 | `QT-32_Ban_hang_Dropship.md` | Bán hàng Dropship — tính năng con của MOD-07 | Chờ duyệt |
| QT-33 | `QT-33_Van_hanh_VComm_Hub_O2O.md` | Vận hành VComm Hub (O2O) | Chờ duyệt |
| QT-38 | `QT-38_Quan_tri_Kho_van.md` | Quản trị Kho vận | Chờ duyệt |
| QT-39 | `QT-39_Van_chuyen_va_Logistics.md` | Vận chuyển & Logistics — tính năng con của MOD-18 | Chờ duyệt |
| QT-40 | `QT-40_Mua_hang_va_Nha_cung_cap_SCM.md` | Mua hàng & Nhà cung cấp (SCM) | Chờ duyệt |

> Gom đơn B2B F2B2B (**QT-32 cũ**) đã **loại bỏ** — lưu tại `_Tam_huy/Gom_don_B2B_F2B2B.md`.

### 5E — Tài chính mở rộng & Đối soát

| Mã | Tệp | Tên quy trình | Trạng thái |
|---|---|---|---|
| QT-34 | `QT-34_VXu_Diem_thuong_va_Hoan_tien.md` | V-Xu — Điểm thưởng & Hoàn tiền (động cơ điểm duy nhất) | Chờ duyệt |
| QT-36 | `QT-36_Khach_hang_than_thiet_Loyalty.md` | Khách hàng thân thiết (lớp UI trên V-Xu) | Chờ duyệt |
| QT-41 | `QT-41_Doi_soat_va_Cong_no_doi_tac.md` | Đối soát & Công nợ đối tác — tính năng con của MOD-19 | Chờ duyệt |
| QT-42 | `QT-42_Vi_Ky_quy_va_Thanh_toan.md` | Ví, Ký quỹ & Thanh toán | Chờ duyệt |

### 5F — Nền tảng, Tuân thủ & Cấu hình

| Mã | Tệp | Tên quy trình | Trạng thái |
|---|---|---|---|
| QT-43 | `QT-43_Cham_soc_Khach_hang_va_Tong_dai.md` | Chăm sóc Khách hàng & Tổng đài | Chờ duyệt |
| QT-44 | `QT-44_Hop_dong_va_Phap_che.md` | Hợp đồng & Pháp chế | Chờ duyệt |
| QT-45 | `QT-45_Quan_ly_Cong_van.md` | Quản lý Công văn | Chờ duyệt |
| QT-46 | `QT-46_Ky_so.md` | Ký số | Chờ duyệt |
| QT-47 | `QT-47_Tuan_thu_va_Bao_ve_Thuong_hieu.md` | Tuân thủ & Bảo vệ Thương hiệu | Chờ duyệt |
| QT-48 | `QT-48_De_xuat_va_Trinh_ky.md` | Đề xuất & Trình ký | Chờ duyệt |
| QT-49 | `QT-49_Phan_tich_Du_lieu_va_BI.md` | Phân tích Dữ liệu & BI | Chờ duyệt |
| QT-50 | `QT-50_Cau_hinh_He_thong_va_Tich_hop.md` | Cấu hình Hệ thống & Tích hợp | Chờ duyệt |

---

## Quy trình đã hợp nhất vào MD_ERP (nguồn gốc)

24 quy trình dưới đây chỉ sao chép lại nội dung MD_ERP nên được đưa vào `_Tam_huy/`, giữ nguyên nội dung, bỏ tiền tố mã. Truy vết ngược qua mã nguồn MD_ERP tương ứng.

| Mã cũ | Tệp lưu trữ | Tên quy trình | Nguồn MD_ERP |
|---|---|---|---|
| QT-02 | `../_Tam_huy/Quan_ly_Quy_tien_mat.md` | Quỹ tiền mặt | `1_accounting/01_cash.md` |
| QT-03 | `../_Tam_huy/Quan_ly_Tien_gui_Ngan_hang.md` | Tiền gửi Ngân hàng | `1_accounting/02_bank.md` |
| QT-04 | `../_Tam_huy/Mua_hang_va_Cong_no_phai_tra.md` | Mua hàng & Công nợ phải trả | `1_accounting/03_purchase.md` |
| QT-05 | `../_Tam_huy/Ban_hang_va_Cong_no_phai_thu.md` | Bán hàng & Công nợ phải thu | `1_accounting/04_sales.md` |
| QT-06 | `../_Tam_huy/Phat_hanh_Hoa_don_dien_tu.md` | Hóa đơn điện tử | `1_accounting/05_invoice.md` |
| QT-07 | `../_Tam_huy/Nhap_Xuat_Ton_kho.md` | Nhập – Xuất – Tồn kho | `1_accounting/06_inventory.md` |
| QT-08 | `../_Tam_huy/Quan_ly_Cong_cu_dung_cu.md` | Công cụ dụng cụ | `1_accounting/07_tools.md` |
| QT-09 | `../_Tam_huy/Quan_ly_Tai_san_co_dinh.md` | Tài sản cố định | `1_accounting/08_assets.md` |
| QT-10 | `../_Tam_huy/Ke_khai_va_Khau_tru_Thue_GTGT.md` | Thuế GTGT | `1_accounting/09_taxes.md` |
| QT-11 | `../_Tam_huy/Tinh_gia_thanh.md` | Giá thành | `1_accounting/10_costing.md` |
| QT-12 | `../_Tam_huy/Tong_hop_Ket_chuyen_va_Khoa_so.md` | Tổng hợp & Khóa sổ | `1_accounting/11_general_ledger.md` |
| QT-13 | `../_Tam_huy/Tuyen_dung.md` | Tuyển dụng | `2_hrm/12_recruitment.md` |
| QT-14 | `../_Tam_huy/Tiep_nhan_nhan_su_moi.md` | Tiếp nhận nhân sự mới | `2_hrm/13_onboarding.md` |
| QT-15 | `../_Tam_huy/Ho_so_nhan_vien.md` | Hồ sơ nhân viên | `2_hrm/14_employee_records.md` |
| QT-16 | `../_Tam_huy/Hop_dong_lao_dong.md` | Hợp đồng lao động | `2_hrm/15_labor_contracts.md` |
| QT-17 | `../_Tam_huy/Cham_cong.md` | Chấm công | `2_hrm/16_timekeeping.md` |
| QT-18 | `../_Tam_huy/Tinh_luong.md` | Tính lương | `2_hrm/17_payroll.md` |
| QT-19 | `../_Tam_huy/Bao_hiem_xa_hoi.md` | Bảo hiểm xã hội | `2_hrm/18_social_insurance.md` |
| QT-20 | `../_Tam_huy/Thue_thu_nhap_ca_nhan.md` | Thuế thu nhập cá nhân | `2_hrm/19_pit.md` |
| QT-21 | `../_Tam_huy/Danh_gia_hieu_suat_KPI_OKR.md` | KPI / OKR | `2_hrm/20_kpi_okr.md` |
| QT-22 | `../_Tam_huy/Dao_tao_va_Phat_trien.md` | Đào tạo | `2_hrm/21_training.md` |
| QT-23 | `../_Tam_huy/Khen_thuong_va_Ky_luat.md` | Khen thưởng – Kỷ luật | `2_hrm/22_rewards_discipline.md` |
| QT-25 | `../_Tam_huy/Thiet_ke_va_Van_hanh_Quy_trinh.md` | Quy trình (Workflows) | `4_office/28_workflows.md` |
| QT-26 | `../_Tam_huy/Giao_viec_va_Thuc_hien_Cong_viec.md` | Công việc & Dự án | `4_office/29_tasks.md` |

## Quy trình tạm hủy (không mang mã, giữ nguyên nội dung)

| Mã cũ | Tệp lưu trữ | Tên quy trình | Lý do |
|---|---|---|---|
| QT-24 (cũ) | `../_Tam_huy/Quan_ly_Tiem_nang_Leads.md` | Quản lý Tiềm năng | Mô hình TMĐT không có phễu tiềm năng |
| QT-26 (cũ) | `../_Tam_huy/Quan_ly_Lien_he.md` | Quản lý Liên hệ | Không có sổ liên hệ tách rời |
| QT-27 (cũ) | `../_Tam_huy/Co_hoi_ban_hang.md` | Cơ hội bán hàng | Giao dịch từ giỏ hàng, không qua phễu |
| QT-28 (cũ) | `../_Tam_huy/Bao_gia_va_Don_hang_CRM.md` | Báo giá & Đơn hàng | Giá niêm yết, khách tự đặt |
| QT-49 (cũ) | `../_Tam_huy/Ho_tro_Tai_chinh_Nha_ban.md` | Hỗ trợ Tài chính Nhà bán | Tạm hủy 2026-10-05 |
| QT-50 (cũ) | `../_Tam_huy/Cho_thue_va_Tra_gop_Thiet_bi.md` | Cho thuê & Trả góp Thiết bị | Tạm hủy 2026-10-05 |

## Trạng thái quy trình

Chỉ dùng các giá trị: Chưa bắt đầu, Đang soạn, Chờ duyệt, Đã duyệt, Cần cập nhật.

## Nguồn nghiệp vụ

- QT-01: mã nguồn `server.ts` (luồng xác thực) và `src/lib/sellerAuth.ts`.
- Nhóm 1–4: đặc tả `Mo ta nghiep vu/MD_ERP/` (Kế toán 01–11, Nhân sự 12–22, CRM 23–27, Văn phòng 28–29) — **nguồn gốc duy nhất**.
- QT-24: mã nguồn `_recovery_V-com-ERP` (mô hình thương mại điện tử); đặc tả `3_crm/24_accounts.md` không còn áp dụng.
- QT-27 … QT-51: bộ đề án nghiệp vụ và mã nguồn hiện có trong `_recovery_V-com-ERP`.

## Lịch sử đánh số

- 2026-10-05 — Cấp mã QT-01 … QT-60.
- 2026-10-05 — Tạm hủy QT-49, QT-50 (giữ nguyên mã).
- 2026-10-09 — Tạm hủy bốn quy trình CRM cũ (tiềm năng, liên hệ, cơ hội, báo giá); dồn số: QT-25→QT-24, QT-29…QT-48→QT-25…QT-44, QT-51…QT-60→QT-45…QT-54.
- 2026-10-09 — Hợp nhất 24 quy trình cốt lõi (QT-02…QT-23, QT-25, QT-26) vào MD_ERP: đưa vào `_Tam_huy/`, bỏ tiền tố mã. **Các mã này nghỉ hưu, không dồn số, không tái sử dụng** để bảo toàn truy vết ngược về đặc tả nguồn. Quy trình đang hoạt động còn 30 (QT-01, QT-24, QT-27…QT-54); số tiếp theo QT-55.
- **2026-10-06 — Dồn mã theo chốt cấu trúc v2 (KH-05):** loại bỏ **QT-32** (Gom đơn B2B F2B2B) và **QT-39** (Livestream bán hàng) → dời `_Tam_huy/`, bỏ tiền tố mã; **QT-54** (E-Menu & Đặt món tại bàn) **chuyển sang iPOS (HS-04)**. Dồn số liên tục: QT-33→QT-32, QT-34→QT-33, QT-35→QT-34, QT-36→QT-35, QT-37→QT-36, QT-38→QT-37, QT-40→QT-38, QT-41→QT-39, QT-42→QT-40, QT-43→QT-41, QT-44→QT-42, QT-45→QT-43, QT-46→QT-44, QT-47→QT-45, QT-48→QT-46, QT-49→QT-47, QT-50→QT-48, QT-51→QT-49, QT-52→QT-50, QT-53→QT-51. Còn **27 quy trình** hoạt động (QT-01, QT-24, QT-27…QT-51); số tiếp theo **QT-52**.

## Việc còn lại

- Toàn bộ 27 quy trình Nhóm 5 đang ở trạng thái "Chờ duyệt".
- Bốn nhóm cốt lõi (1–4) chưa có quy trình QT riêng — nội dung nằm ở MD_ERP; cần chủ dự án xác nhận có viết lại thành QT theo mô hình VComm hay giữ nguyên MD_ERP.
- Các mục "Chưa xác minh được" trong từng tệp là câu hỏi mở cần người dùng trả lời trước khi chuyển sang "Đã duyệt".
