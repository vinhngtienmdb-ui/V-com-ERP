# 00 — Kế hoạch tổng thể dự án VComm

> Tài liệu kế hoạch cấp cao nhất của dự án VComm. Mọi kế hoạch hệ thống con và kế hoạch module đều treo dưới tài liệu này.

- Dự án: VComm
- Phạm vi: toàn bộ hệ sinh thái VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-06
- Mục lục bộ kế hoạch: `00_INDEX.md`

## 1. Mục đích

Tài liệu này trả lời bốn câu hỏi ở cấp toàn dự án:

1. Dự án gồm những hệ thống nào, mỗi hệ thống làm gì.
2. Mỗi hệ thống gồm những thành phần chức năng nào.
3. Thành phần nào đang ở trạng thái nào, còn thiếu gì.
4. Việc tiếp theo nên làm theo thứ tự nào.

Mục tiêu kiểm soát: mỗi thành phần có **một tệp kế hoạch riêng**, để nhìn vào là biết phạm vi, phụ thuộc, mức độ hoàn thiện và việc còn mở của riêng thành phần đó.

## 2. Phạm vi

Hệ sinh thái VComm gồm bảy hệ thống con và một tầng hạ tầng dữ liệu dùng chung:

| Mã | Hệ thống | Thư mục | Cổng | Kế hoạch |
|---|---|---|---|---|
| HS-01 | VComm ERP (Portal) | `vcomm-erp` | 3000 | `01_He_thong/HS-01_VComm_ERP.md` |
| HS-02 | VComm Core Backend | `vcomm-core-backend` | 5000 | `01_He_thong/HS-02_VComm_Core_Backend.md` |
| HS-03 | VComm eCommerce | `vcomm-ecommerce` | 5173 | `01_He_thong/HS-03_VComm_eCommerce.md` |
| HS-04 | VComm iPOS | `vcomm-ipos` | 3002 | `01_He_thong/HS-04_VComm_iPOS.md` |
| HS-05 | VComm Seller Centre | `vcomm-seller` | 3004 | `01_He_thong/HS-05_VComm_Seller_Centre.md` |
| HS-06 | VComm Store Retail | `vcomm-store-retail` | 3003 | `01_He_thong/HS-06_VComm_Store_Retail.md` |
| HS-07 | VComm Nexthub | `vcomm-nexthub` | 3005 | `01_He_thong/HS-07_VComm_Nexthub.md` |
| HS-08 | Hạ tầng CSDL trung tâm và Cloud | Root SQL / Cloud | Cloud | `01_He_thong/HS-08_Ha_tang_CSDL_trung_tam_va_Cloud.md` |

Riêng VComm ERP được chuyển thành **cổng Portal** và chia nhỏ tiếp thành **29 module (mini-app) đang hoạt động**, mỗi module một tệp kế hoạch trong `02_ERP_Module/`. 13 mô-đun bị gộp hoặc loại bỏ ngày 2026-10-06, cộng 2 mô-đun tạm hủy trước đó (ngày 2026-10-05, MOD-33, MOD-34) = 15 mô-đun được lưu trữ tại `_Tam_huy/`, chi tiết tại mục 5.1.

## 3. Kiến trúc tổng thể

```
                        [ KHÁCH HÀNG / ĐIỂM BÁN ]
                                   │
   ┌───────────────┬───────────────┼───────────────┬────────────────┐
   ▼               ▼               ▼               ▼                ▼
eCommerce      Store Retail    Seller Centre      iPOS           Nexthub
(HS-03)         (HS-06)          (HS-05)         (HS-04)          (HS-07)
 5173            3003             3004            3002             3005
   └───────────────┴───────────────┼───────────────┴────────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │  VComm Core Backend (HS-02)  │  NestJS, cổng 5000
                    │  Gateway · Orders · Payments │  (API server chung)
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │  VComm ERP Portal (HS-01)    │  cổng 3000 (shell)
                    │  29 mini-app, mỗi app 1 cổng  │  nối qua HS-02
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │  Hạ tầng CSDL trung tâm (HS-08) │
                    │  Supabase PostgreSQL · RLS · Trigger │
                    └──────────────────────────────┘
```

## 4. Cấu trúc bộ kế hoạch

| Cấp | Nơi lưu | Số tệp | Vai trò |
|---|---|---|---|
| 0 | `00_KE_HOACH_TONG_THE.md` | 1 | Bức tranh chung, thứ tự ưu tiên |
| 1 | `01_He_thong/HS-nn_*.md` | 8 | Phạm vi và chức năng của từng hệ thống con |
| 2 | `02_ERP_Module/{01_Ke_toan,02_Nhan_su,04_Van_phong_Dieu_hanh,05_Kinh_doanh,06_Chia_se_Nen_tang}/MOD-nn_*.md` | 29 | Kiểm soát tính năng của từng module ERP đang hoạt động |
| — | `00_INDEX.md` | 1 | Mục lục toàn bộ |

Quy ước mã: `HS-nn` cho hệ thống, `MOD-nn` cho module ERP, `MOD-nn-Fxx` cho tính năng trong module.

## 5. Bản đồ 29 module ERP (Portal + 6 nhóm mini-app)

Theo tái cấu trúc ngày 2026-10-06, ERP chuyển thành **cổng Portal**, các chức năng thành **mini-app** (mỗi app một cổng riêng, nối qua API server HS-02). Tổng quy mô giao diện: **41,922 dòng** trên 29 module đang hoạt động (chưa tính 13 module đã gộp/loại bỏ và 2 tạm hủy trước đó).

> **Đã kiểm chứng 2026-10-06** trên mã nguồn chuẩn `_recovery_V-com-ERP` (nhánh `main`): đủ **29/29** tệp giao diện tồn tại tại đường dẫn đã ghi; tổng thực tế **41.892 dòng**, khớp con số **41.922** (lệch 30 dòng ≈ 0,07% — do quy ước đếm dòng cuối). Cột “Dòng” là số liệu **chính xác**.
>
> ⚠️ Lưu ý nguồn: còn một bản ERP **cũ** ở `D:/VComm/vcomm-erp` (nhánh `feat/digital-signature-upgrade`, HEAD 2026-09-24, **thiếu** các bản vá M1/M2) có cấu trúc component khác (thư mục `accounting/`, các tệp `Task*`). Bản này **không phải nguồn chuẩn**; nguồn chuẩn là `_recovery_V-com-ERP` (nhánh `main`).

> Cổng trong bảng là **cổng giả định** của mini-app (dải 3101–3402); cổng thật cố định khi tách source. Mọi dữ liệu qua HS-02 (5000).

**Vỏ Portal (shell) — 3 module**

| Mã | Module | Tuyến đường | Cổng | Tệp giao diện | Dòng | Kiểm thử |
|---|---|---|---|---|---|---|
| MOD-01 | Trang chủ | `/` | 3000 | `src/components/Home.tsx` | 857 | — |
| MOD-02 | Bảng điều khiển | `/dashboard` | 3000 | `src/components/Dashboard.tsx` | 978 | — |
| MOD-03 | Phân tích dữ liệu | `/bi` | 3000 | `src/components/AnalyticsBI.tsx` | 1031 | — |

**Nhóm 1 — Kế toán (1 module)**

| Mã | Module | Tuyến đường | Cổng | Tệp giao diện | Dòng | Kiểm thử |
|---|---|---|---|---|---|---|
| MOD-30 | Kế toán (TT99/2025) | `/ke-toan-tt99` | 3101 | `src/components/TT99Accounting.tsx` | 2307 | — |

**Nhóm 2 — Nhân sự (HRM) (1 module)**

| Mã | Module | Tuyến đường | Cổng | Tệp giao diện | Dòng | Kiểm thử |
|---|---|---|---|---|---|---|
| MOD-39 | Quản trị Nhân sự (HRM) | `/hr` | 3102 | `src/components/HR.tsx` | 3721 | Có |

**Nhóm 3 — Kinh doanh (15 module)**

| Mã | Module | Tuyến đường | Cổng | Tệp giao diện | Dòng | Kiểm thử |
|---|---|---|---|---|---|---|
| MOD-36 | Khách hàng (CRM) | `/customers` | 3201 | `src/components/Customers.tsx` | 2221 | — |
| MOD-37 | Chăm sóc Khách hàng | `/cskh` | 3202 | `src/components/CustomerService.tsx` | 1723 | — |
| MOD-35 | Nhà bán hàng | `/sellers` | 3203 | `src/components/Sellers.tsx` | 1338 | — |
| MOD-11 | Quản lý Đơn hàng | `/orders` | 3204 | `src/components/Orders.tsx` | 1998 | — |
| MOD-14 | Quản lý sản phẩm | `/pim` | 3205 | `src/components/PIM.tsx` | 2738 | Có |
| MOD-15 | Social | `/social` | 3206 | `src/components/Marketing.tsx` | 530 | — |
| MOD-16 | Quản lý khuyến mại | `/flash-sale` | 3207 | `src/components/FlashSale.tsx` | 825 | — |
| MOD-20 | VComm Hub (O2O) | `/vcomm-hub` | 3208 | `src/components/VCommHub.tsx` | 685 | — |
| MOD-21 | V-Xu | `/vxu` | 3209 | `src/components/VXu.tsx` | 547 | Có |
| MOD-22 | KOL/KOC & Affiliate | `/affiliate` | 3210 | `src/components/Affiliate.tsx` | 288 | — |
| MOD-24 | Quản lý Quảng cáo (Ads) | `/ads` | 3211 | `src/components/AdManager.tsx` | 372 | — |
| MOD-10 | Siêu thị VComm (Offline) | `/vcomm-supermarket` | 3212 | `src/components/VCommSupermarket.tsx` | 1189 | — |
| MOD-32 | Ví & Thanh toán | `/wallet` | 3213 | `src/components/Wallet.tsx` | 1051 | Có |
| MOD-25 | Kho vận & Logistics | `/warehouse` | 3214 | `src/components/Warehouse.tsx` | 3794 | Có |
| MOD-27 | Mua hàng, NCC & Đối soát | `/scm` | 3215 | `src/components/Procurement.tsx` | 817 | — |

**Nhóm 4 — Văn phòng (7 module)**

| Mã | Module | Tuyến đường | Cổng | Tệp giao diện | Dòng | Kiểm thử |
|---|---|---|---|---|---|---|
| MOD-04 | Điều hành & Workflow | `/workflow` | 3301 | `src/components/WorkflowHub.tsx` | 743 | — |
| MOD-05 | Quản lý Công việc | `/tasks` | 3302 | `src/components/TasksPage.tsx` | 215 | — |
| MOD-06 | Đề xuất & Trình ký | `/requests` | 3303 | `src/components/RequestHub.tsx` | 1628 | Có |
| MOD-07 | Hợp đồng & Pháp chế | `/contracts` | 3304 | `src/components/ContractManager.tsx` | 822 | — |
| MOD-08 | Quản lý Công văn | `/documents` | 3305 | `src/components/DocumentManager.tsx` | 1126 | — |
| MOD-09 | Trung tâm Ký số | `/signature` | 3306 | `src/components/SignatureHub.tsx` | 1213 | — |
| MOD-43 | Không gian làm việc | `/workspace` | 3307 | `src/components/Workspace.tsx` | 493 | Có |

**Nhóm 5 — Chia sẻ & Nền tảng (2 module)**

| Mã | Module | Tuyến đường | Cổng | Tệp giao diện | Dòng | Kiểm thử |
|---|---|---|---|---|---|---|
| MOD-28 | Tuân thủ & Pháp chế | `/compliance` | 3401 | `src/components/Compliance.tsx` | 344 | — |
| MOD-44 | Cấu hình hệ thống | `/settings` | 3402 | `src/components/Settings.tsx` | 6328 | Có |

### 5.1. Mô-đun đã gộp / tạm hủy / loại bỏ

Ngày 2026-10-06, 13 module bị gộp hoặc loại bỏ theo tái cấu trúc ERP thành Portal. Mã đã cấp được giữ nguyên, không tái sử dụng. Chi tiết tại `_Tam_huy/README.md`.

**Đã gộp (chức năng hợp nhất vào module đích):**

| Mã | Tên | Gộp vào | Tệp giao diện | Dòng |
|---|---|---|---|---|
| MOD-29 | Tài chính - Kế toán | MOD-30 Kế toán | `src/components/Finance.tsx` | 2336 |
| MOD-40 | Hồ sơ Nhân sự (EasyHRM) | MOD-39 HRM | `src/components/EasyHRM.tsx` | 2080 |
| MOD-41 | Sơ đồ tổ chức | MOD-39 HRM | `src/components/OrgStructure.tsx` | 488 |
| MOD-42 | Hiệu suất & Đào tạo | MOD-39 HRM | `src/components/Performance.tsx` | 307 |
| MOD-17 | Mua chung (Group Buy) | MOD-16 Quản lý khuyến mại | `src/components/GroupBuy.tsx` | 720 |
| MOD-23 | Khách hàng thân thiết | MOD-21 V-Xu | `src/components/Loyalty.tsx` | 500 |
| MOD-26 | Vận chuyển (Logistics) | MOD-25 Kho vận & Logistics | `src/components/Logistics.tsx` | 544 |
| MOD-31 | Đối soát & Công nợ | MOD-27 Mua hàng, NCC & Đối soát | `src/components/Settlement.tsx` | 886 |
| MOD-19 | Dropship | MOD-35 Nhà bán hàng | `src/components/Dropship.tsx` | 1152 |

**Loại bỏ / Tạm hủy:**

| Mã | Tên | Trạng thái | Tệp giao diện | Dòng | Ghi chú |
|---|---|---|---|---|---|
| MOD-12 | Quản lý Livestream | Loại bỏ | `src/components/LiveCommerce.tsx` | 222 | Loại bỏ theo tái cấu trúc Portal |
| MOD-13 | Mạng xã hội người dùng | Loại bỏ | `src/components/SocialCommerce.tsx` | 228 | Loại bỏ theo tái cấu trúc Portal |
| MOD-18 | F2B2B — Gom đơn B2B | Loại bỏ | `src/components/F2B2B.tsx` | 1028 | Trước đây giữ nguyên Trụ cột 4, nay loại bỏ |
| MOD-38 | Đội ngũ Kinh doanh | Tạm hủy | `src/components/Sales.tsx` | 412 | Q-03 đã chốt: không còn quản lý khách hàng tiềm năng |

**Tạm hủy trước đó (2026-10-05):**

| Mã | Module | Tệp giao diện | Dòng | Lý do |
|---|---|---|---|---|
| MOD-33 | Hỗ trợ Tài chính Nhà bán | `src/components/SellerFinance.tsx` | 1497 | Tạm hủy 2026-10-05 |
| MOD-34 | Cho thuê thiết bị (Trả góp) | `src/components/DeviceLeasing.tsx` | 2363 | Tạm hủy 2026-10-05 |

Nơi lưu trữ: `_Tam_huy/` (tài liệu) và `_tam_huy/2026-10-05/` (mã nguồn trong repo `_recovery_V-com-ERP`).

## 6. Hiện trạng kiểm soát

| Chỉ số | Giá trị | Ý nghĩa |
|---|---|---|
| Số module ERP đang hoạt động | 29 (mục tiêu tài liệu) | **Mã nguồn hiện tại chưa giảm**: `src/constants.ts` (navGroups) vẫn còn **42 mục menu**, gồm cả 3 module tài liệu đã loại bỏ (`/live`, `/social`, `/sales`). Con số 29 là cấu trúc **đích** sau tái cấu trúc tài liệu; việc giảm mã nguồn về 29 thuộc đầu việc tách source S1–S7 (xem `Checklist_cong_viec.md` §2.5, `03_Ke_hoach_Tach_Source_Portal_MiniApp.md`) |
| Module có tệp kiểm thử riêng | 8 | Còn 21 module chưa có kiểm thử riêng |
| Module có đặc tả trong `specs/` | 7 | Còn 22 module chưa có đặc tả kỹ thuật |
| Tệp kiểm thử toàn hệ thống | 84 | Trải trên nhiều tầng (đã trừ tệp kiểm thử của module tạm hủy/đã gộp) |
| Module có tệp giao diện trên 2.000 dòng | 6 | Ứng viên cần tách nhỏ |
| Module backend NestJS | 11 | auth, catalog, crm, gateway, hr, integrations, inventory, orders, payments, seller, wallets |

Module có tệp giao diện lớn nhất:

- Cấu hình hệ thống — `src/components/Settings.tsx` (6,328 dòng)
- Quản trị Kho vận — `src/components/Warehouse.tsx` (3,794 dòng)
- Quản trị Nhân sự (HRM) — `src/components/HR.tsx` (3,721 dòng)
- Quản lý sản phẩm — `src/components/PIM.tsx` (2,738 dòng)
- Kế toán TT99/2025 — `src/components/TT99Accounting.tsx` (2,307 dòng)
- Khách hàng (CRM) — `src/components/Customers.tsx` (2,221 dòng)

## 7. Thứ tự ưu tiên đề xuất

Thứ tự dưới đây suy ra từ bằng chứng, không phải từ cảm tính:

1. **Việc bảo mật đang treo** — M2.1 (JWT thiếu claim `tenant_id`), ba endpoint Gemini chưa có guard (`/api/gemini/db-query`, `/legal-audit`, `/diagnostics`), M3 (giao dịch đường tiền), M7 (rà soát toàn bộ 86 tuyến đường). Xem `19_Bao_mat.md`.
2. **Module có tệp lớn mà chưa có kiểm thử** — rủi ro cao nhất khi sửa. Ưu tiên: MOD-44 Cấu hình hệ thống (6.328 dòng), MOD-25 Quản trị Kho vận (3.794 dòng), MOD-39 Quản trị Nhân sự (3.721 dòng), MOD-14 Quản lý sản phẩm (2.738 dòng), MOD-30 Kế toán TT99 (2.307 dòng), MOD-36 Khách hàng CRM (2.221 dòng).
3. **Module thiếu cả kiểm thử và đặc tả** — 21 module, cần bổ sung kiểm thử cho luồng chính.
4. **Danh mục tính năng chi tiết** — bổ sung theo bước BA cho từng module, bắt đầu từ Kế toán và Kho vận vì ảnh hưởng tiền và hàng.
5. **Hệ thống con ngoài ERP** — đối chiếu tài liệu với mã nguồn thật cho HS-03 đến HS-07.
6. **Tách ERP thành Portal + mini-app** — đầu việc kỹ thuật theo sau (mỗi mini-app một process/port), nằm ngoài phạm vi tài liệu này (xem `Checklist_cong_viec.md`).

## 8. Quan hệ phụ thuộc

- Mọi hệ thống con đều dùng chung hạ tầng dữ liệu HS-08.
- Mọi hệ thống con đều gọi cổng API trung tâm HS-02.
- HS-01 (ERP) là cổng Portal điều hành tập trung; HS-03 đến HS-07 là kênh đầu cuối.
- Ranh giới trách nhiệm giữa ERP và các hệ thống con **chưa được chốt** — ví dụ luồng đơn hàng xuất hiện ở cả ERP (`/orders`) và eCommerce. Đây là việc cần quyết định ở bước BA.

## 9. Quy ước trạng thái

Dùng thống nhất một trong các giá trị sau, ở mọi tệp trong bộ kế hoạch:

| Trạng thái | Nghĩa |
|---|---|
| Chưa bắt đầu | Chưa có việc gì được làm |
| Đang làm | Đang triển khai |
| Chờ duyệt | Đã làm xong, chờ chủ dự án nghiệm thu |
| Đã xong | Đã nghiệm thu, đạt tiêu chí |
| Tạm dừng | Cố ý dừng, có lý do ghi kèm |

## 10. Rủi ro tổng thể

- **Ranh giới hệ thống chưa rõ:** cùng một nghiệp vụ có mặt ở nhiều hệ thống, dễ sửa một nơi mà quên nơi khác.
- **Kiểm thử mỏng ở tầng giao diện:** 21/29 module ERP chưa có kiểm thử riêng.
- **Tệp giao diện quá lớn:** 6 module vượt 2.000 dòng, khó kiểm soát thay đổi.
- **Hai nguồn dữ liệu tài liệu:** bộ tài liệu thiết kế tồn tại ở hai nơi (bản gốc và bản sao trong repo mã nguồn) — cần chốt một nguồn duy nhất.
- **Bộ kế hoạch mới ở mức khung:** danh mục tính năng chi tiết chưa được duyệt, nên chưa dùng để nghiệm thu được.

## 11. Chưa xác minh được

- Mức độ hoàn thiện thật của từng module so với mô tả trên menu.
- Ranh giới trách nhiệm giữa ERP và sáu hệ thống con còn lại.
- Danh sách bảng dữ liệu riêng của từng module.
- Cổng chạy của HS-07 Nexthub và HS-08 lấy theo bộ nhật ký hệ sinh thái, chưa đọc lại mã nguồn để xác nhận.
- Thư mục `src/pages` của `vcomm-seller` có danh sách tệp giống hệt `vcomm-ecommerce` — chưa xác minh đây là bản sao hay là dùng chung thật.
- Cổng (Portal) gán cho mỗi mini-app là **giả định** (dải 3101–3402); cổng thật cố định khi tách source thành các ứng dụng riêng — chưa chốt.
