# BẢN ĐỒ TÍCH HỢP HỆ THỐNG KẾ TOÁN TT99 VÀO VCOMM ERP (BƯỚC I0)

> **Căn cứ:** `13_PLAYBOOK_TRIEN_KHAI.md` (§PHASE 1, BƯỚC I0), `04_PROMPTS_TICH_HOP_ERP.md`, `11_CAU_HINH_STACK_VCOMM_ERP.md`
> **Mục tiêu:** Khảo sát và xác lập bản đồ liên thông giữa các module ERP và lõi kế toán sổ kép TT99/2025/TT-BTC.
> **Nguyên tắc:** Kế toán VComm là nguồn chân lý độc lập; loại bỏ phụ thuộc MISA; không trùng lặp danh mục; bảo toàn RLS và Multi-tenant.

---

## 1. KHẢO SÁT HỆ THỐNG HIỆN HỮU (A.1 – A.12)

### 1.1. Cấu trúc Solution & Công nghệ
- **Monorepo:** `D:\VComm` (workspace `vcomm.code-workspace`).
- **Backend (`vcomm-core-backend`):** NestJS 11 + TypeScript trên Node 22; REST API base `/api/v1`.
- **Frontend (`vcomm-erp`):** React 19 + TypeScript + Vite 6 + Tailwind CSS 4.
- **CSDL:** Supabase PostgreSQL; extension `uuid-ossp`, `pgcrypto`. Truy cập raw SQL qua `@supabase/supabase-js` và `pg`.
- **Multi-tenant:** Cột `tenant_id TEXT NOT NULL DEFAULT 'tenant-vcomm-prod-01'` trên mọi bảng, RLS kích hoạt.

### 1.2. Xác thực & Phân quyền (RBAC)
- Khai thác qua `src/context/AuthContext.tsx` và JWT Claims của Supabase.
- Các vai trò kế toán bổ sung:
  - `DIRECTOR` (Người đại diện pháp luật): Quyền phê duyệt lưu trữ vĩnh viễn (NĐ 174 Đ.14), chủ tịch hội đồng tiêu hủy.
  - `CHIEF_ACCOUNTANT` (Kế toán trưởng): Phê duyệt khóa sổ, cấu hình quy tắc hạch toán, kết xuất BCTC.
  - `ACCOUNTANT` (Kế toán viên): Nhập liệu S03-DN, gắn hồ sơ, đối chiếu công nợ.
  - `CASHIER` / `WAREHOUSE`: Thủ quỹ, thủ kho.

### 1.3. Bản đồ Danh mục ERP ↔ Kế toán (Tái sử dụng 100%, không nhân bản)
| Danh mục ERP | Bảng CSDL ERP | Tái sử dụng trong Kế toán | Cột kế toán bổ sung |
|---|---|---|---|
| Khách hàng B2B/B2C | `customers` / `dm_doi_tuong` | TK công nợ 131, đối tượng hóa đơn | `tk_cong_no_mac_dinh` (131) |
| Nhà cung cấp | `sellers` / `suppliers` / `dm_doi_tuong` | TK công nợ 331, theo dõi mua hàng | `tk_cong_no_mac_dinh` (331) |
| Nhân viên | `employees` | TK 334, 141 (tạm ứng), trích lương | `tk_tam_ung` (141), `tk_luong` (334) |
| Hàng hóa / Sản phẩm | `products` / `warehouse_stock` | TK 156 (kho), 511 (DT), 632 (GV) | `tk_kho`, `tk_doanh_thu`, `tk_gia_von` |
| Kho bãi | `warehouses` / `dm_kho` | Định danh kho trong chứng từ xuất/nhập | `ma_kho`, `thu_kho_id` |

---

## 2. BẢN ĐỒ SỰ KIỆN ERP → BÚT TOÁN KẾ TOÁN TT99 (KHỐI D)

Mọi sự kiện sau đây được liên thông tự động thông qua bộ máy quy tắc hạch toán (`cfg_quy_tac_hach_toan`):

| Sự kiện ERP | Nguồn phát sinh (File:Line) | Nợ (TK Lá TT99) | Có (TK Lá TT99) | Cơ chế liên thông |
|---|---|---|---|---|
| **Đơn hàng thanh toán thành công** | `src/components/Orders.tsx`<br>`trg_order_paid_processor` | `112` (Bank) / `111` (Tiền mặt) | `511` (Doanh thu bán hàng)<br>`33311` (Thuế GTGT đầu ra) | Outbox Processor + Transaction |
| **Xuất kho giao hàng (Giá vốn)** | `src/components/Warehouse.tsx`<br>`DigitalTwinWMS.tsx` | `632` (Giá vốn hàng bán) | `156` (Hàng hóa tồn kho) | Outbox Event `GOODS_ISSUED` |
| **Hàng bán bị trả lại / Đổi trả** | `src/components/Orders.tsx` (Status: `RETURNED`) | `521` (Các khoản giảm trừ DT)<br>`33311` (Thuế GTGT giảm) | `131` (Công nợ KH) / `112` | Outbox Event `ORDER_RETURNED` |
| **Hóa đơn mua hàng (Ghi nhận nợ NCC)** | `src/components/Procurement.tsx`<br>`SCM.tsx` | `156` / `152` (Hàng/NVL)<br>`1331` (Thuế GTGT vào) | `331` (Phải trả người bán) | Outbox Event `PO_RECEIVED` |
| **Phiếu chi trả tiền NCC** | `src/components/Finance.tsx`<br>`Settlement.tsx` | `331` (Phải trả người bán) | `112` (Tiền gửi ngân hàng) | Bút toán tự động từ UNC |
| **Duyệt bảng tính lương tháng** | `src/components/PayrollApp.tsx`<br>`HR.tsx` | `6421` (Lương bán hàng)<br>`6422` (Lương QLDN) | `334` (Phải trả người lao động) | Event `PAYROLL_APPROVED` |
| **Trích nộp BHXH, BHYT, BHTN** | `src/components/InsuranceApp.tsx` | `6421` / `6422`<br>`334` (Trừ lương NV) | `3383` (BHXH)<br>`3384` (BHYT)<br>`3386` (BHTN) | Event `INSURANCE_ACCRUED` |
| **Trích khấu hao TSCĐ định kỳ** | `src/components/AssetManagement.tsx` | `6424` (Khấu hao TSCĐ) | `2141` (Hao mòn TSCĐ hữu hình) | Cron job kỳ kế toán |
| **Nâng cấp, cải tạo TSCĐ hoàn thành** | `src/components/AssetManagement.tsx` | `211` (TSCĐ hữu hình) | `2414` (Cải tạo TSCĐ dở dang) | Quyết định bàn giao TSCĐ |
| **Khấu trừ thuế sàn TMĐT (NĐ 126)** | `src/components/Finance.tsx`<br>`src/components/TaxPIT.tsx` | `3388` (Thu hộ Seller) | `33311` (VAT)<br>`3335` (TNCN) | Tự động khi đối soát sàn |
| **Kết chuyển KQKD cuối kỳ** | `src/components/Finance.tsx` | `511`, `515`, `711` → `911`<br>`911` → `632`, `6421`, `6422`, `8211`<br>`911` ↔ `4212` | Bút toán kết chuyển cuối kỳ |

---

## 3. PHƯƠNG ÁN KIẾN TRÚC ĐƯỢC CHỌN (KHUYẾN NGHỊ B)
- **Phương án lựa chọn:** **Transactional Outbox Pattern** kết hợp CSDL PostgreSQL Trigger & Outbox Worker.
- **Lý do:** VComm ERP vận hành nhiều module phân tán (Bán hàng, Kho vận, Mua hàng, Nhân sự, Thuế). Gọi trực tiếp dễ nghẽn transaction khi tải cao; do đó sự kiện ghi vào `int_outbox` trong cùng transaction với chứng từ nguồn. Worker kế toán tiêu thụ tuần tự (FIFO), kiểm tra tính bất biến (`auto_posted = true`), kiểm tra cân đối số học và ghi nhận vào `ct_chung_tu` + `ct_hach_toan`.
