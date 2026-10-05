# Thư mục lưu trữ tạm hủy

Thư mục này chứa các tài liệu thiết kế **tạm hủy** theo yêu cầu của chủ dự án ngày 2026-10-05. Không xóa — chỉ dời khỏi cây đang hoạt động để khôi phục dễ dàng. Mã đã cấp được giữ nguyên, không tái sử dụng.

## 2026-10-05 — Cho thuê trả góp và Hỗ trợ tài chính Nhà bán

Hai mô-đun bị tạm hủy:

- **Cho thuê thiết bị (Trả góp)** — tuyến đường `/device-leasing` — mã MOD-34, quy trình QT-50
- **Hỗ trợ Tài chính Nhà bán** — tuyến đường `/seller-finance` — mã MOD-33, quy trình QT-49

**Giữ nguyên:** F2B2B — Gom đơn B2B (MOD-18, Trụ cột 4) theo xác nhận của chủ dự án.

### Tệp đã dời

| Tệp gốc | Vị trí lưu trữ |
|---|---|
| `Quy_trinh_nghiep_vu/QT-49_Ho_tro_Tai_chinh_Nha_ban.md` | `_Tam_huy/QT-49_Ho_tro_Tai_chinh_Nha_ban.md` |
| `Quy_trinh_nghiep_vu/QT-50_Cho_thue_va_Tra_gop_Thiet_bi.md` | `_Tam_huy/QT-50_Cho_thue_va_Tra_gop_Thiet_bi.md` |
| `Ke_hoach/02_ERP_Module/N5_Tai_chinh_va_Thanh_toan/MOD-33_Ho_tro_Tai_chinh_Nha_ban.md` | `_Tam_huy/MOD-33_Ho_tro_Tai_chinh_Nha_ban.md` |
| `Ke_hoach/02_ERP_Module/N5_Tai_chinh_va_Thanh_toan/MOD-34_Cho_thue_thiet_bi_Tra_gop.md` | `_Tam_huy/MOD-34_Cho_thue_thiet_bi_Tra_gop.md` |

### Mục lục đã cập nhật

- `Quy_trinh_nghiep_vu/index.md` — thêm mục "Quy trình tạm hủy"; còn 58 quy trình đang hoạt động trên 60 mã đã cấp.
- `Ke_hoach/00_INDEX.md` — thêm mục 3.1 "Mô-đun tạm hủy"; còn 42 mô-đun đang hoạt động trên 44 mã đã cấp.
- `Ke_hoach/00_KE_HOACH_TONG_THE.md` — thêm mục 5.1 "Mô-đun tạm hủy"; cập nhật lại tổng số mô-đun, tổng số dòng giao diện và các chỉ số liên quan.

### Mã nguồn đi kèm

Mã nguồn của hai mô-đun nằm trong repo `_recovery_V-com-ERP`, thư mục `_tam_huy/2026-10-05/`, kèm README riêng ghi rõ các chỗ nối đã gỡ và cách khôi phục.

### Cách khôi phục

1. `git mv _Tam_huy/<tệp>.md <thư mục đích ban đầu>/`
2. Khôi phục dòng tương ứng trong các mục lục, xóa mục "tạm hủy".
3. Khôi phục mã nguồn theo README trong `_tam_huy/2026-10-05/`.
