# 00 — Kế hoạch tổng thể dự án VComm

> Tài liệu kế hoạch cấp cao nhất của dự án VComm. Mọi kế hoạch hệ thống con và kế hoạch module đều treo dưới tài liệu này.

- Dự án: VComm
- Phạm vi: toàn bộ hệ sinh thái VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
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
| HS-01 | VComm ERP | `vcomm-erp` | 3000 | `01_He_thong/HS-01_VComm_ERP.md` |
| HS-02 | VComm Core Backend | `vcomm-core-backend` | 5000 | `01_He_thong/HS-02_VComm_Core_Backend.md` |
| HS-03 | VComm eCommerce | `vcomm-ecommerce` | 5173 | `01_He_thong/HS-03_VComm_eCommerce.md` |
| HS-04 | VComm iPOS | `vcomm-ipos` | 3002 | `01_He_thong/HS-04_VComm_iPOS.md` |
| HS-05 | VComm Seller Centre | `vcomm-seller` | 3004 | `01_He_thong/HS-05_VComm_Seller_Centre.md` |
| HS-06 | VComm Store Retail | `vcomm-store-retail` | 3003 | `01_He_thong/HS-06_VComm_Store_Retail.md` |
| HS-07 | VComm Nexthub | `vcomm-nexthub` | 3005 | `01_He_thong/HS-07_VComm_Nexthub.md` |
| HS-08 | Hạ tầng CSDL trung tâm và Cloud | Root SQL / Cloud | Cloud | `01_He_thong/HS-08_Ha_tang_CSDL_trung_tam_va_Cloud.md` |

Riêng VComm ERP được chia nhỏ tiếp thành **44 module chức năng**, mỗi module một tệp kế hoạch trong `02_ERP_Module/`.

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
                    │  Gateway · Orders · Payments │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │     VComm ERP (HS-01)        │  44 module, cổng 3000
                    │  Điều hành trung tâm doanh nghiệp │
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
| 2 | `02_ERP_Module/N<n>_*/MOD-nn_*.md` | 44 | Kiểm soát tính năng của từng module ERP |
| — | `00_INDEX.md` | 1 | Mục lục toàn bộ |

Quy ước mã: `HS-nn` cho hệ thống, `MOD-nn` cho module ERP, `MOD-nn-Fxx` cho tính năng trong module.

## 5. Bản đồ 44 module ERP

Tổng quy mô giao diện: **56,685 dòng** trên 44 module, chia bảy nhóm.


**N1 — Tổng quan & Điều hành (5 module)**

| Mã | Module | Tuyến đường | Tệp giao diện | Dòng | Kiểm thử |
|---|---|---|---|---|---|
| MOD-01 | Trang chủ | `/` | `src/components/Home.tsx` | 857 | — |
| MOD-02 | Bảng điều khiển | `/dashboard` | `src/components/Dashboard.tsx` | 978 | — |
| MOD-03 | Phân tích dữ liệu | `/bi` | `src/components/AnalyticsBI.tsx` | 1031 | — |
| MOD-04 | Điều hành & Workflow | `/workflow` | `src/components/WorkflowHub.tsx` | 743 | — |
| MOD-05 | Quản lý Công việc | `/tasks` | `src/components/TasksPage.tsx` | 215 | — |

**N2 — Hành chính & Pháp lý (4 module)**

| Mã | Module | Tuyến đường | Tệp giao diện | Dòng | Kiểm thử |
|---|---|---|---|---|---|
| MOD-06 | Đề xuất & Trình ký | `/requests` | `src/components/RequestHub.tsx` | 1628 | Có |
| MOD-07 | Hợp đồng & Pháp chế | `/contracts` | `src/components/ContractManager.tsx` | 822 | — |
| MOD-08 | Quản lý Công văn | `/documents` | `src/components/DocumentManager.tsx` | 1126 | — |
| MOD-09 | Trung tâm Ký số | `/signature` | `src/components/SignatureHub.tsx` | 1213 | — |

**N3 — Kinh doanh & Tiếp thị (15 module)**

| Mã | Module | Tuyến đường | Tệp giao diện | Dòng | Kiểm thử |
|---|---|---|---|---|---|
| MOD-10 | Siêu thị VComm (Offline) | `/vcomm-supermarket` | `src/components/VCommSupermarket.tsx` | 1189 | — |
| MOD-11 | Quản lý Đơn hàng | `/orders` | `src/components/Orders.tsx` | 1998 | — |
| MOD-12 | Quản lý Livestream | `/live` | `src/components/LiveCommerce.tsx` | 222 | — |
| MOD-13 | Mạng xã hội người dùng | `/social` | `src/components/SocialCommerce.tsx` | 228 | — |
| MOD-14 | Quản lý sản phẩm | `/pim` | `src/components/PIM.tsx` | 2738 | Có |
| MOD-15 | Marketing & Social | `/marketing` | `src/components/Marketing.tsx` | 530 | — |
| MOD-16 | Flash Sale & Mua chung | `/flash-sale` | `src/components/FlashSale.tsx` | 825 | — |
| MOD-17 | Mua chung (Group Buy) | `/group-buy` | `src/components/GroupBuy.tsx` | 720 | — |
| MOD-18 | F2B2B — Gom đơn B2B | `/f2b2b` | `src/components/F2B2B.tsx` | 1028 | — |
| MOD-19 | Dropship | `/dropship` | `src/components/Dropship.tsx` | 1152 | Có |
| MOD-20 | VComm Hub (O2O) | `/vcomm-hub` | `src/components/VCommHub.tsx` | 685 | — |
| MOD-21 | V-Xu | `/vxu` | `src/components/VXu.tsx` | 547 | Có |
| MOD-22 | KOL/KOC & Affiliate | `/affiliate` | `src/components/Affiliate.tsx` | 288 | — |
| MOD-23 | Khách hàng thân thiết | `/loyalty` | `src/components/Loyalty.tsx` | 500 | Có |
| MOD-24 | Quản lý Quảng cáo (Ads) | `/ads` | `src/components/AdManager.tsx` | 372 | — |

**N4 — Kho & Chuỗi cung ứng (4 module)**

| Mã | Module | Tuyến đường | Tệp giao diện | Dòng | Kiểm thử |
|---|---|---|---|---|---|
| MOD-25 | Quản trị Kho vận | `/warehouse` | `src/components/Warehouse.tsx` | 3794 | Có |
| MOD-26 | Vận chuyển (Logistics) | `/logistics` | `src/components/Logistics.tsx` | 544 | — |
| MOD-27 | Mua hàng & NCC | `/scm` | `src/components/Procurement.tsx` | 817 | — |
| MOD-28 | Tuân thủ & Pháp chế | `/compliance` | `src/components/Compliance.tsx` | 344 | — |

**N5 — Tài chính & Thanh toán (6 module)**

| Mã | Module | Tuyến đường | Tệp giao diện | Dòng | Kiểm thử |
|---|---|---|---|---|---|
| MOD-29 | Tài chính - Kế toán | `/finance` | `src/components/Finance.tsx` | 2336 | Có |
| MOD-30 | Kế toán TT99/2025 | `/ke-toan-tt99` | `src/components/TT99Accounting.tsx` | 2307 | — |
| MOD-31 | Đối soát & Công nợ | `/settlement` | `src/components/Settlement.tsx` | 886 | — |
| MOD-32 | Ví & Thanh toán | `/wallet` | `src/components/Wallet.tsx` | 1051 | Có |
| MOD-33 | Hỗ trợ Tài chính Nhà bán | `/seller-finance` | `src/components/SellerFinance.tsx` | 1497 | — |
| MOD-34 | Cho thuê thiết bị (Trả góp) | `/device-leasing` | `src/components/DeviceLeasing.tsx` | 2363 | — |

**N6 — Khách hàng & Nhân sự (9 module)**

| Mã | Module | Tuyến đường | Tệp giao diện | Dòng | Kiểm thử |
|---|---|---|---|---|---|
| MOD-35 | Nhà bán hàng | `/sellers` | `src/components/Sellers.tsx` | 1338 | — |
| MOD-36 | Khách hàng (CRM) | `/customers` | `src/components/Customers.tsx` | 2221 | — |
| MOD-37 | Chăm sóc Khách hàng | `/cskh` | `src/components/CustomerService.tsx` | 1723 | — |
| MOD-38 | Đội ngũ Kinh doanh | `/sales` | `src/components/Sales.tsx` | 412 | — |
| MOD-39 | Quản trị Nhân sự (HRM) | `/hr` | `src/components/HR.tsx` | 3721 | Có |
| MOD-40 | Hồ sơ Nhân sự (EasyHRM) | `/easyhrm` | `src/components/EasyHRM.tsx` | 2080 | — |
| MOD-41 | Sơ đồ tổ chức | `/org` | `src/components/OrgStructure.tsx` | 488 | — |
| MOD-42 | Hiệu suất & Đào tạo | `/performance` | `src/components/Performance.tsx` | 307 | — |
| MOD-43 | Không gian làm việc | `/workspace` | `src/components/Workspace.tsx` | 493 | Có |

**N7 — Cấu hình (1 module)**

| Mã | Module | Tuyến đường | Tệp giao diện | Dòng | Kiểm thử |
|---|---|---|---|---|---|
| MOD-44 | Cấu hình hệ thống | `/settings` | `src/components/Settings.tsx` | 6328 | Có |

## 6. Hiện trạng kiểm soát

| Chỉ số | Giá trị | Ý nghĩa |
|---|---|---|
| Số module ERP | 44 | Theo menu điều hướng thật (`src/constants.ts`) |
| Module có tệp kiểm thử riêng | 11 | Còn 33 module chưa có kiểm thử riêng |
| Module có đặc tả trong `specs/` | 7 | Còn 37 module chưa có đặc tả kỹ thuật |
| Tệp kiểm thử toàn hệ thống | 86 | Trải trên nhiều tầng |
| Module có tệp giao diện trên 2.000 dòng | 9 | Ứng viên cần tách nhỏ |
| Module backend NestJS | 11 | auth, catalog, crm, gateway, hr, integrations, inventory, orders, payments, seller, wallets |

Module có tệp giao diện lớn nhất:

- Cấu hình hệ thống — `src/components/Settings.tsx` (6,328 dòng)
- Quản trị Kho vận — `src/components/Warehouse.tsx` (3,794 dòng)
- Quản trị Nhân sự (HRM) — `src/components/HR.tsx` (3,721 dòng)
- Quản lý sản phẩm — `src/components/PIM.tsx` (2,738 dòng)
- Cho thuê thiết bị (Trả góp) — `src/components/DeviceLeasing.tsx` (2,363 dòng)
- Tài chính - Kế toán — `src/components/Finance.tsx` (2,336 dòng)
- Kế toán TT99/2025 — `src/components/TT99Accounting.tsx` (2,307 dòng)
- Khách hàng (CRM) — `src/components/Customers.tsx` (2,221 dòng)
- Hồ sơ Nhân sự (EasyHRM) — `src/components/EasyHRM.tsx` (2,080 dòng)

## 7. Thứ tự ưu tiên đề xuất

Thứ tự dưới đây suy ra từ bằng chứng, không phải từ cảm tính:

1. **Việc bảo mật đang treo** — M2.1 (JWT thiếu claim `tenant_id`), ba endpoint Gemini chưa có guard (`/api/gemini/db-query`, `/legal-audit`, `/diagnostics`), M3 (giao dịch đường tiền), M7 (rà soát toàn bộ 86 tuyến đường). Xem `19_Bao_mat.md`.
2. **Module có tệp lớn mà chưa có kiểm thử** — rủi ro cao nhất khi sửa. Ưu tiên: MOD-44 Cấu hình hệ thống (6.328 dòng), MOD-39 Quản trị Nhân sự (3.721 dòng), MOD-30 Kế toán TT99 (2.307 dòng), MOD-36 Khách hàng CRM (2.221 dòng).
3. **Module thiếu cả kiểm thử và đặc tả** — 33 module, cần bổ sung kiểm thử cho luồng chính.
4. **Danh mục tính năng chi tiết** — bổ sung theo bước BA cho từng module, bắt đầu từ nhóm N5 Tài chính và N4 Kho vận vì ảnh hưởng tiền và hàng.
5. **Hệ thống con ngoài ERP** — đối chiếu tài liệu với mã nguồn thật cho HS-03 đến HS-07.

## 8. Quan hệ phụ thuộc

- Mọi hệ thống con đều dùng chung hạ tầng dữ liệu HS-08.
- Mọi hệ thống con đều gọi cổng API trung tâm HS-02.
- HS-01 (ERP) là nơi điều hành tập trung; HS-03 đến HS-07 là kênh đầu cuối.
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
- **Kiểm thử mỏng ở tầng giao diện:** 33/44 module ERP chưa có kiểm thử riêng.
- **Tệp giao diện quá lớn:** 9 module vượt 2.000 dòng, khó kiểm soát thay đổi.
- **Hai nguồn dữ liệu tài liệu:** bộ tài liệu thiết kế tồn tại ở hai nơi (bản gốc và bản sao trong repo mã nguồn) — cần chốt một nguồn duy nhất.
- **Bộ kế hoạch mới ở mức khung:** danh mục tính năng chi tiết chưa được duyệt, nên chưa dùng để nghiệm thu được.

## 11. Chưa xác minh được

- Mức độ hoàn thiện thật của từng module so với mô tả trên menu.
- Ranh giới trách nhiệm giữa ERP và sáu hệ thống con còn lại.
- Danh sách bảng dữ liệu riêng của từng module.
- Cổng chạy của HS-07 Nexthub và HS-08 lấy theo bộ nhật ký hệ sinh thái, chưa đọc lại mã nguồn để xác nhận.
- Thư mục `src/pages` của `vcomm-seller` có danh sách tệp giống hệt `vcomm-ecommerce` — chưa xác minh đây là bản sao hay là dùng chung thật.
