# Thư mục lưu trữ tạm hủy

Thư mục này chứa các tài liệu thiết kế **tạm hủy** theo yêu cầu của chủ dự án. Không xóa — chỉ dời khỏi cây đang hoạt động để khôi phục dễ dàng.

Tệp lưu trữ **không mang tiền tố mã**. Mã cũ ghi trong bảng dưới đây và trong banner đầu mỗi tệp. Mã của quy trình bị hủy **không giữ chỗ**: các quy trình còn lại được dồn số liên tục (xem `Quy_trinh_nghiep_vu/index.md`, mục "Lịch sử đánh số").

## 2026-10-05 — Cho thuê trả góp và Hỗ trợ tài chính Nhà bán

Hai mô-đun bị tạm hủy:

- **Cho thuê thiết bị (Trả góp)** — tuyến đường `/device-leasing` — mã MOD-34, quy trình cũ QT-50
- **Hỗ trợ Tài chính Nhà bán** — tuyến đường `/seller-finance` — mã MOD-33, quy trình cũ QT-49

**Giữ nguyên:** F2B2B — Gom đơn B2B (MOD-18, Trụ cột 4) theo xác nhận của chủ dự án.

## 2026-10-09 — Bốn quy trình CRM không hợp mô hình thương mại điện tử

Mô hình VComm là thương mại điện tử: khách hàng chỉ sinh ra khi tự đăng ký qua cổng eCommerce, không ai được tạo bằng tay trừ quản trị viên. Do đó không phát sinh chức năng quản lý tiềm năng, liên hệ, cơ hội bán hàng hay báo giá. Bốn quy trình cũ bị dời khỏi cây hoạt động:

| Mã cũ | Tên quy trình | Lý do |
|---|---|---|
| QT-24 | Quản lý Tiềm năng | Mô hình thương mại điện tử không có phễu tiềm năng |
| QT-26 | Quản lý Liên hệ | Không có sổ liên hệ tách rời; thông tin nằm trong tài khoản khách hàng |
| QT-27 | Cơ hội bán hàng | Giao dịch phát sinh từ giỏ hàng, không qua phễu bán hàng |
| QT-28 | Báo giá và Đơn hàng | Giá do người bán niêm yết, đơn hàng do khách tự đặt trên sàn |

Quy trình **Quản trị Khách hàng** được giữ lại, viết lại theo mô hình thương mại điện tử và dồn từ QT-25 thành **QT-24**.

### Dồn số kèm theo

Dồn liên tục để không để trống số: QT-25 → QT-24, QT-29 … QT-48 → QT-25 … QT-44, QT-51 … QT-60 → QT-45 … QT-54. Cây hoạt động còn 54 quy trình, số tiếp theo là QT-55.

## 2026-10-09 — Hợp nhất 24 quy trình cốt lõi vào MD_ERP (nguồn gốc)

Theo rà soát toàn bộ nguồn tài liệu ban đầu, 24 quy trình QT (QT-02…QT-23, QT-25, QT-26) chỉ sao chép lại nội dung bộ đặc tả gốc `Mo ta nghiep vu/MD_ERP/` (4 phân hệ Kế toán, Nhân sự, CRM, Văn phòng). Để giữ MD_ERP làm **nguồn gốc duy nhất** và giảm số nhóm chức năng, 24 quy trình này được **hợp nhất vào MD_ERP**: đưa vào `_Tam_huy/`, giữ nguyên nội dung, bỏ tiền tố mã.

Khác với tạm hủy, đây là **hợp nhất (merge)** — nội dung đã có đủ tại MD_ERP, không mất thông tin. Các mã QT-02…QT-23, QT-25, QT-26 **nghỉ hưu, không dồn số, không tái sử dụng** để bảo toàn truy vết ngược về đặc tả nguồn. Bản đồ đối chiếu đầy đủ xem `Quy_trinh_nghiep_vu/index.md`, mục "Quy trình đã hợp nhất vào MD_ERP".

| Mã cũ | Tệp lưu trữ | Nguồn MD_ERP |
|---|---|---|
| QT-02 | `Quan_ly_Quy_tien_mat.md` | `1_accounting/01_cash.md` |
| QT-03 | `Quan_ly_Tien_gui_Ngan_hang.md` | `1_accounting/02_bank.md` |
| QT-04 | `Mua_hang_va_Cong_no_phai_tra.md` | `1_accounting/03_purchase.md` |
| QT-05 | `Ban_hang_va_Cong_no_phai_thu.md` | `1_accounting/04_sales.md` |
| QT-06 | `Phat_hanh_Hoa_don_dien_tu.md` | `1_accounting/05_invoice.md` |
| QT-07 | `Nhap_Xuat_Ton_kho.md` | `1_accounting/06_inventory.md` |
| QT-08 | `Quan_ly_Cong_cu_dung_cu.md` | `1_accounting/07_tools.md` |
| QT-09 | `Quan_ly_Tai_san_co_dinh.md` | `1_accounting/08_assets.md` |
| QT-10 | `Ke_khai_va_Khau_tru_Thue_GTGT.md` | `1_accounting/09_taxes.md` |
| QT-11 | `Tinh_gia_thanh.md` | `1_accounting/10_costing.md` |
| QT-12 | `Tong_hop_Ket_chuyen_va_Khoa_so.md` | `1_accounting/11_general_ledger.md` |
| QT-13 | `Tuyen_dung.md` | `2_hrm/12_recruitment.md` |
| QT-14 | `Tiep_nhan_nhan_su_moi.md` | `2_hrm/13_onboarding.md` |
| QT-15 | `Ho_so_nhan_vien.md` | `2_hrm/14_employee_records.md` |
| QT-16 | `Hop_dong_lao_dong.md` | `2_hrm/15_labor_contracts.md` |
| QT-17 | `Cham_cong.md` | `2_hrm/16_timekeeping.md` |
| QT-18 | `Tinh_luong.md` | `2_hrm/17_payroll.md` |
| QT-19 | `Bao_hiem_xa_hoi.md` | `2_hrm/18_social_insurance.md` |
| QT-20 | `Thue_thu_nhap_ca_nhan.md` | `2_hrm/19_pit.md` |
| QT-21 | `Danh_gia_hieu_suat_KPI_OKR.md` | `2_hrm/20_kpi_okr.md` |
| QT-22 | `Dao_tao_va_Phat_trien.md` | `2_hrm/21_training.md` |
| QT-23 | `Khen_thuong_va_Ky_luat.md` | `2_hrm/22_rewards_discipline.md` |
| QT-25 | `Thiet_ke_va_Van_hanh_Quy_trinh.md` | `4_office/28_workflows.md` |
| QT-26 | `Giao_viec_va_Thuc_hien_Cong_viec.md` | `4_office/29_tasks.md` |

## Tệp đã dời

| Tệp gốc | Vị trí lưu trữ | Mã cũ |
|---|---|---|
| `Quy_trinh_nghiep_vu/QT-49_Ho_tro_Tai_chinh_Nha_ban.md` | `_Tam_huy/Ho_tro_Tai_chinh_Nha_ban.md` | QT-49 |
| `Quy_trinh_nghiep_vu/QT-50_Cho_thue_va_Tra_gop_Thiet_bi.md` | `_Tam_huy/Cho_thue_va_Tra_gop_Thiet_bi.md` | QT-50 |
| `Ke_hoach/02_ERP_Module/N5_Tai_chinh_va_Thanh_toan/MOD-33_Ho_tro_Tai_chinh_Nha_ban.md` | `_Tam_huy/MOD-33_Ho_tro_Tai_chinh_Nha_ban.md` | — |
| `Ke_hoach/02_ERP_Module/N5_Tai_chinh_va_Thanh_toan/MOD-34_Cho_thue_thiet_bi_Tra_gop.md` | `_Tam_huy/MOD-34_Cho_thue_thiet_bi_Tra_gop.md` | — |
| `Quy_trinh_nghiep_vu/QT-24_Quan_ly_Tiem_nang_Leads.md` | `_Tam_huy/Quan_ly_Tiem_nang_Leads.md` | QT-24 |
| `Quy_trinh_nghiep_vu/QT-26_Quan_ly_Lien_he.md` | `_Tam_huy/Quan_ly_Lien_he.md` | QT-26 |
| `Quy_trinh_nghiep_vu/QT-27_Co_hoi_ban_hang.md` | `_Tam_huy/Co_hoi_ban_hang.md` | QT-27 |
| `Quy_trinh_nghiep_vu/QT-28_Bao_gia_va_Don_hang_CRM.md` | `_Tam_huy/Bao_gia_va_Don_hang_CRM.md` | QT-28 |

## Mục lục đã cập nhật

- `Quy_trinh_nghiep_vu/index.md` — còn 54 quy trình đang hoạt động, 6 quy trình tạm hủy, số tiếp theo QT-55; thêm mục "Lịch sử đánh số".
- `Ke_hoach/00_INDEX.md` — thêm mục 3.1 "Mô-đun tạm hủy"; còn 42 mô-đun đang hoạt động trên 44 mã đã cấp.
- `Ke_hoach/00_KE_HOACH_TONG_THE.md` — thêm mục 5.1 "Mô-đun tạm hủy"; cập nhật lại tổng số mô-đun, tổng số dòng giao diện và các chỉ số liên quan.

## Mã nguồn đi kèm

Mã nguồn của hai mô-đun Cho thuê trả góp và Hỗ trợ Tài chính Nhà bán nằm trong repo `_recovery_V-com-ERP`, thư mục `_tam_huy/2026-10-05/`, kèm README riêng ghi rõ các chỗ nối đã gỡ và cách khôi phục.

Bốn quy trình CRM bị dời **không có mã nguồn đi kèm** — chúng chưa từng có màn hình riêng trong ERP; màn hình `Customers` vẫn hoạt động và đã được viết lại theo mô hình thương mại điện tử ở QT-24.

## Cách khôi phục

1. `git mv _Tam_huy/<tệp>.md <thư mục đích ban đầu>/`
2. Đặt lại tiền tố mã nếu cần, rồi cập nhật lại mục lục và dồn số cho liền mạch.
3. Khôi phục mã nguồn theo README trong `_tam_huy/2026-10-05/` nếu là hai mô-đun tài chính.
