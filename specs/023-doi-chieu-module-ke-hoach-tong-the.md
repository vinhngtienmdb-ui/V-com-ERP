# Spec 023 — Đối chiếu module chi tiết & Kế hoạch nâng cấp tổng thể

**Ngày:** 02/09/2026  
**Đối tượng:** `tannhdev/viet-erp` (fork của `nclamvn/Viet-ERP`)  
**Câu hỏi:** So sánh tính năng từng module; VietERP có tối ưu hơn VComm không;  
lập kế hoạch nâng cấp tổng thể.  
**Tài liệu đi kèm:** `specs/022-chuan-hoa-nen-tang.md` (góc nhìn hạ tầng)

---

## 1. Sự thật về "16 app con"

Trước hết phải trả lời thẳng: **16 app con không phải là 16 năng lực.** Tôi đã tải  
toàn bộ cây thư mục qua GitHub API (13.070 mục, không bị cắt) và đo từng app.

### 1.1 Phân bố thực tế

| App            |  File |      Dung lượng | `page.tsx` | `route.ts` | Nhận xét                    |
| -------------- | ----: | --------------: | ---------: | ---------: | --------------------------- |
| MRP            | 2.719 | **40 MB (47%)** |        211 |        359 | Sản xuất — VComm không cần  |
| ExcelAI        |   734 |       8 MB (9%) |          0 |          0 | Chỉ lib                     |
| HRM-unified    | 1.297 |       7 MB (8%) |        162 |        338 |                             |
| HRM-AI         | 1.292 |       7 MB (8%) |        162 |        338 | **Bản sao của HRM-unified** |
| TPM-web        |   530 |       6 MB (7%) |          0 |          0 | Chỉ frontend                |
| HRM            |   413 |       5 MB (5%) |         55 |        132 | Bản HRM thứ 3               |
| OTB            |   326 |       3 MB (4%) |         19 |          4 | Kế hoạch mua hàng bán lẻ    |
| CRM            |   468 |       2 MB (2%) |         52 |        109 |                             |
| TPM-api-nestjs |   307 |            1 MB |          0 |          0 |                             |
| TPM-api        |   224 |            1 MB |          0 |          1 |                             |
| PM             |   107 |            1 MB |          0 |          0 | Chỉ lib                     |
| liphoco        |    54 |           74 KB |         12 |         13 |                             |
| **Accounting** |    31 |      **198 KB** |      **0** |          4 | **Không có UI**             |
| **Ecommerce**  |    21 |      **106 KB** |      **0** |          4 | **Không có UI**             |
| landing-page   |    25 |           86 KB |          1 |          0 |                             |
| docs           |    10 |           19 KB |          0 |          4 |                             |

### 1.2 Ba phát hiện quyết định

**(1) HRM-AI là bản sao của HRM-unified — trùng 99% đường dẫn.**  
Đối chiếu tập đường dẫn tương đối: **1.290 / 1.292 file trùng nhau**. Dung lượng  
7.887 KB vs 7.870 KB, cùng 162 page, cùng 338 route.  
→ 16 app thực chất chỉ có **15 app khác biệt**.

**(2) 47% codebase là MRP — sản xuất.** VComm là **sàn TMĐT + chuỗi bán lẻ**, không  
phải nhà máy. Khối code lớn nhất của họ nằm đúng chỗ VComm không dùng đến.

**(3) Hai module VComm quan tâm nhất gần như trống rỗng.**

- **`Accounting` — 198 KB, 0 trang UI.** Chỉ có 4 file lib (`gl-engine`, `tax-engine`,  
  `invoice-engine`, `reports`) + `vas/chart-of-accounts.ts` 32 KB + 7 file e2e test.  
  Tức là **có engine nhưng không có giao diện người dùng**, và có **e2e test mô tả UI  
  mà UI đó không tồn tại**.
- **`Ecommerce` — 106 KB, 0 trang UI.** 4 file lib (cart, catalog, order, payment-gateway)
  - 5 file e2e test + schema Prisma 17,5 KB. **Không có một trang bán hàng nào.**

### 1.3 Chỉ số cộng đồng

|                     |                                 |
| ------------------- | ------------------------------- |
| Star / Watch / Fork | **0 / 0 / 0**                   |
| Open issue          | 0                               |
| Là fork của         | `nclamvn/Viet-ERP`              |
| Tạo & push lần cuối | **01/04/2026** — để yên 5 tháng |
| Commit              | 28 commit trong 1 ngày          |

> **Kết luận §1:** "16 app" là con số **đếm thư mục**, không phải năng lực.  
> Sau khi trừ bản sao HRM-AI và MRP (không liên quan), phần **dùng được cho VComm**  
> chỉ còn CRM (52 page) + OTB (19 page) + liphoco (12 page) ≈ **83 trang**.

---

## 2. So sánh từng module

### 2.1 Bản đồ đối chiếu

| Nhóm VComm (7 nhóm, 51 route)                                                                                                                              | VietERP                           | Ai hơn                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------- |
| **Kinh doanh & Tiếp thị** (Đơn hàng, PIM, Livestream, Social, Marketing, Flash Sale, Group Buy, F2B2B, Dropship, VComm Hub, V-Xu, Affiliate, Loyalty, Ads) | `Ecommerce` 106 KB / **0 trang**  | **VComm áp đảo**                  |
| **Tài chính & Kế toán** (Finance, TT99, Đối soát, Ví, Seller Finance, Device Leasing)                                                                      | `Accounting` 198 KB / **0 trang** | **VComm hơn** (TT99 + có UI)      |
| **Kho & Chuỗi cung ứng** (Kho vận, Logistics, Mua hàng & NCC, Tuân thủ)                                                                                    | `MRP`, `OTB`                      | Hòa — khác trọng tâm              |
| **Khách hàng & Nhân sự** (Sellers, CRM, CSKH, Sales, HRM, EasyHRM, Org, KPI)                                                                               | `CRM` 52 page, `HRM` ×3           | **VietERP hơn về HRM**, ngang CRM |
| **Hành chính & Pháp lý** (Đề xuất, Hợp đồng, Công văn, Ký số)                                                                                              | không có                          | **VComm hơn**                     |
| **Tổng quan & Điều hành** (Home, Dashboard, BI, Workflow, Tasks)                                                                                           | `PM`, `TPM`                       | **VComm hơn** (đang chạy thật)    |
| **Cấu hình**                                                                                                                                               | —                                 | Ngang                             |

### 2.2 Đo cùng một thước

| Thước đo                     | VietERP                                    | VComm                                          |
| ---------------------------- | ------------------------------------------ | ---------------------------------------------- |
| Tổng UI (component .tsx)     | 674 page, nhưng **83 page dùng được**      | **75 component / 51 route**, toàn bộ chạy được |
| Dung lượng UI                | không đo được (phân tán)                   | **3.302 KB component**                         |
| Business logic (`services/`) | 27 package = **1,2 MB tổng**               | **446 KB / 25 service**                        |
| Module tuân thủ VN           | `@vierp/vietnam` = **114 KB / 25 file**    | tt99+tax+escrow+kyc+consent+misa = **134 KB**  |
| E2E test                     | 157 spec — **nhưng test UI không tồn tại** | 0 E2E, **318 unit test chạy thật**             |

---

## 3. VietERP có "tối ưu hơn" không?

Chia "tối ưu" thành 5 trục và chấm riêng. **Không có câu trả lời một chữ.**

### Trục 1 — Kiến trúc: VietERP thắng trên giấy, nhưng chưa được kiểm chứng ⚠️

|             |                                                                                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VietERP hơn | Monorepo Turborepo, 27 package, NATS event bus, Prisma 980 model, Keycloak, Kong, Meilisearch, Terraform 3 cloud                                                                                        |
| Nhưng       | 99% trùng lặp HRM-AI/HRM-unified; 47% code ở MRP; 27 package tổng cộng chỉ **1,2 MB** (`logger` 13 KB, `errors` 11 KB, `i18n` 15 KB, `feature-flags` 8 KB) — **đây là stub, không phải implementation** |
| Đánh giá    | **Kiến trúc đẹp trên sơ đồ, chưa ai chạy tải thật.** 0 star, ngủ 5 tháng                                                                                                                                |

→ **VComm KHÔNG thua về kiến trúc thực dụng.** VComm là 1 SPA 93K LOC chạy thật  
cho 51 route; VietERP là 85 MB trong đó 47% là module không ai dùng.

### Trục 2 — Nghiệp vụ: VComm thắng áp đảo ở lĩnh vực của mình ✅

VComm có **và đang chạy**: Escrow (Luật 36/2024), KYC sàn (NĐ 52/85), thuế sàn  
(NĐ 252/2026), dữ liệu cá nhân (Luật 86/2025), TT99, O2O Hub, V-Xu, Dropship,  
Group Buy, F2B2B, Affiliate, Loyalty, Livestream, COD reconciliation.

VietERP: **Ecommerce 0 trang, Accounting 0 trang.** Không có một tính năng sàn nào.

### Trục 3 — Tuân thủ VN: VComm thắng ✅ — **trừ mảng lương/thuế** ⚠️

- **Kế toán:** VComm **TT99/2025** (hiệu lực 1/1/2026) vs VietERP **TT200**  
  (**hết hiệu lực 1/1/2026**). Hôm nay 02/09/2026 — chuẩn của họ đã chết được 8 tháng.
- **Pháp lý sàn:** VComm có escrow/KYC/NĐ117/Luật 86; VietERP không nêu.
- **Độ sâu code:** `@vierp/vietnam` 114 KB vs VComm 134 KB — ngang nhau, nhưng  
  VComm trải đều ra 6 service có test chạy thật.

> 🔄 **Đính chính (02/09/2026):** kết luận trên đúng ở **toàn hệ thống**, nhưng
> **đảo ngược ở riêng nhóm Khách hàng & Nhân sự**.
> VietERP có engine lương VN thật (`sprint3_payroll_vn_engine`, `lib/compliance/tax`,
> `lib/compliance/insurance`, sinh mẫu D02/D03/C12); VComm **không có gì**, và công
> thức lương hiện tại **sai luật** (thuế TNCN 5% phẳng trên gross, BHXH 10% thay vì
> 10,5%, không có giảm trừ gia cảnh).
> Hằng số của VietERP cũng đã lỗi thời 2 thế hệ (niên hạn 2024 trong repo cập nhật
> 01/2026) → **học kiến trúc, tự viết hằng số**.
> Xem [spec 024](./024-khach-hang-nhan-su.md) — riêng nhóm này trục 3 là **VietERP 7–3**.

### Trục 4 — Vận hành: VietERP thắng về cấu hình ⚠️

VietERP **có sẵn** CI/CD 7 job, Prometheus/Grafana/Loki, health check, 17 Dockerfile.  
VComm có **0**. Đây là khoảng cách thật — đã lên kế hoạch ở spec 022.

⚠️ Nhưng lưu ý: VietERP có health-check route trong mọi app (`/api/health`,  
`/api/metrics`) — trong khi VComm **không có**. Đây là chi tiết nhỏ nhưng là  
**điểm VComm nên copy ngay**, vì quá rẻ.

### Trục 5 — Hiệu năng: không thể kết luận, VComm có điểm yếu riêng ⚠️

- VComm entry bundle **701 kB** (gzip 179 kB), `vendor-recharts` **442 kB** — nặng.  
  Đây là **điểm yếu thật của VComm**, không liên quan gì đến VietERP.
- VietERP chia 16 app nên mỗi app bundle nhỏ hơn — nhưng đánh đổi bằng 16 lần  
  deploy, 16 Dockerfile, 16 CI pipeline.
- Không bên nào có dữ liệu đo tải thật.

### 🎯 Tổng kết

> **VietERP không tối ưu hơn VComm. Nó rộng hơn nhưng nông hơn, và nặng nhất đúng  
> chỗ VComm không cần (MRP) trong khi trống rỗng đúng chỗ VComm cần nhất  
> (Ecommerce, Accounting).**
>
> Chỉ có **2 thứ đáng copy**: (a) lớp vận hành — health check, metrics, CI/CD;  
> (b) ý tưởng tách module theo app. **Tuyệt đối không copy kế toán (TT200 đã chết).**

---


## 4. Khoảng cách tính năng THẬT của VComm

Bỏ qua hạ tầng (đã có spec 022), đây là những **nghiệp vụ ERP chuẩn** mà VComm thiếu —  
đo bằng grep trên `src/`:

| Nghiệp vụ                           | VComm hiện tại                                                                                                                                                                                            | Mức độ                                                                  |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **TSCĐ & khấu hao**                 | ⚠️ **Chỉ 4 file UI nhắc đến từ "khấu hao"** (DeviceLeasing, EmployeeDetailModal, VCommSupermarket) — **không có service nào xử lý**. TT99 đã seed TK 211/214/241 nhưng **không có engine trích khấu hao** | 🔴 **Thiếu hoàn toàn**                                                  |
| **Nhân sự & bảng lương** 🆕          | ⚠️ **8.649 dòng (62%) không có nguồn chân lý trên server**: EasyHRM (2.076), EmployeeDetailModal (1.733), OrgStructure (487), Performance (306), Sales (411) = **0 kết nối**; HR (3.636) lưu `localStorage`. Công thức lương **sai luật** (PIT 5% phẳng, BHXH 10% thay vì 10,5%). **Không có bút toán lương nào** | 🔴 **Thiếu + sai luật** — xem [spec 024](./024-khach-hang-nhan-su.md)   |
| **Khấu trừ tại nguồn (CTV/KOL)** 🆕 | ⚠️ **Hoa hồng cộng tác viên đang chi nguyên gốc, không khấu trừ đồng nào.** `Settlement.tsx` 832 dòng có **0** từ khóa thuế; `postWithdrawalJournalEntries` chỉ ghi Nợ 3388 / Có 1121. TK `3335` có trong seed COA nhưng **chưa từng được ghi**. Ngoài ra luồng rút tiền thật (`confirmPendingApproval`) **không sinh bút toán nào**, trong khi 2 luồng MOCK lại có | 🔴 **Đang sai — tiền đang chạy** — xem [spec 024 §2.5](./024-khach-hang-nhan-su.md) |
| **Đối chiếu ngân hàng**             | 1 file. Có `codReconciliationService` (đối soát COD) nhưng **không có bank reconciliation**                                                                                                               | 🔴 Thiếu                                                                |
| **Quản lý dự án**                   | 2 file                                                                                                                                                                                                    | 🟡 Rất mỏng                                                             |
| **Ngân sách (Budget)**              | 10 file — có nhưng chưa rõ mức độ                                                                                                                                                                         | 🟡 Cần rà lại                                                           |
| **MRP / BOM / sản xuất**            | 22 file                                                                                                                                                                                                   | ⚫ **Không cần** — VComm không sản xuất                                  |
| **Open-to-Buy (kế hoạch mua hàng)** | 14 file mua hàng                                                                                                                                                                                          | 🟡 **Có giá trị cho VComm Hub** — đây là thứ duy nhất đáng học từ `OTB` |
| **Excel import/export AI**          | 10 file                                                                                                                                                                                                   | 🟡                                                                      |

**Phát hiện đáng chú ý nhất: TSCĐ & khấu hao thiếu hoàn toàn.** Đây là module kế toán  
cốt lõi — một ERP không có trích khấu hao thì BCTC không đúng. Với VComm Hub (cửa hàng  
vật lý có thiết bị, kệ, POS) và DeviceLeasing (cho thuê thiết bị trả góp), **thiếu TSCĐ  
là lỗ hổng nghiêm trọng**, vì chính những nghiệp vụ đó sinh ra tài sản cố định.

---

## 5. Kế hoạch nâng cấp tổng thể

### ⛔ GĐ0 — Việc chặn (làm ngay, trước mọi thứ)

- [ ] **Chạy 5 migration TT99 lên Supabase** (mới chỉ validate trong rollback)
- [ ] Bật `TT99_BRIDGE_ENABLED = true`
- [ ] Trả lời 3 câu hỏi: nhân lực dev · số VComm Hub vật lý · team iPOS

---

### GĐ1 — Nền tảng vận hành *(2–3 tuần · chi phí thấp · giá trị cao)*

Mượn trực tiếp từ VietERP — họ làm đúng, và đây là thứ rẻ nhất để copy.

| #   | Việc                                                                                          |
| --- | --------------------------------------------------------------------------------------------- |
| 1.1 | CI/CD GitHub Actions (`.github` đang rỗng)                                                    |
| 1.2 | Nối `test` + ESLint vào npm script (hiện `lint` chỉ chạy `tsc`, không có script `test`)       |
| 1.3 | **`GET /health` + `GET /ready` + `GET /metrics`** — copy pattern của VietERP, họ có ở mọi app |
| 1.4 | Structured logging (`pino`) thay 258 lệnh `console.*`; xử lý 10 khối `catch {}`               |
| 1.5 | Dockerfile multi-stage + graceful shutdown                                                    |

**Xong khi:** PR nào cũng CI xanh; `/health` trả 200 kèm trạng thái DB.

---

### GĐ2 — Bù lỗ hổng nghiệp vụ kế toán *(3–4 tuần)*

Ưu tiên cao nhất về mặt **đúng đắn của BCTC**.

| #   | Việc                          | Chi tiết                                                                                                                                                                                                                 |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2.1 | **Module TSCĐ & khấu hao** 🔴 | Bảng `fixed_assets`, `asset_depreciation_schedules`. Hỗ trợ phương pháp **đường thẳng** và **số dư giảm dần**. Tự sinh bút toán định kỳ `Nợ 627/641/642 — Có 214`. Tận dụng TK 211/214/241 **đã có sẵn trong seed TT99** |
| 2.2 | **Đối chiếu ngân hàng**       | Bảng `bank_statements`, engine match tự động với `journal_entries` theo (số tiền, ngày, tham chiếu). Phục vụ luôn SePay webhook                                                                                          |
| 2.3 | **Ngân sách (Budget)**        | Rà lại 10 file hiện có; nếu chỉ là UI thì xây engine: `budgets` / `budget_lines`, so sánh thực tế vs dự toán theo kỳ TT99                                                                                                |
| 2.4 | **Kết chuyển & BCTC tự động** | Nối `acc_*` (đã có) vào luồng cuối tháng: kết chuyển 911, sinh B01/B02/B03/B09                                                                                                                                           |
| 2.5 | **Nhân sự & bảng lương** 🆕 🔴 | Đầu vào thứ hai của BCTC hiện **đang thiếu hoàn toàn** — chi phí nhân công không bao giờ vào sổ cái. Xem **[spec 024](./024-khach-hang-nhan-su.md)**: 2.2 lõi dữ liệu (xóa `localStorage`) → 2.3 engine thuế đa phương pháp + màn hình cấu hình HRM → 2.4 bút toán lương → 2.5 E2E. *13–16 ngày (2 BE + 1 FE)* |
| 2.6 | **Đối soát & khấu trừ dòng tiền đối tác** 🆕 🔴 | **Tiền đang chảy qua đường sai ngay hôm nay.** 2.6a: nối bút toán vào luồng rút tiền thật (đang thiếu hoàn toàn) — **1 ngày, không bị chặn, làm được ngay sau 2.1**. 2.6b: khấu trừ tại nguồn **theo cấu hình 3 trạng thái** (`WITHHOLD`/`WARN`/`OFF`) theo loại đối tác — Anh đã chốt hướng "cấu hình riêng" thay vì chọn dừng chi hay chấp nhận rủi ro (chặn bởi 2.3). *3–4 ngày (2 BE + 1 FE)* |

> **Vì sao 2.5 nằm ngay sau 2.1:** TSCĐ và lương là **hai đầu vào duy nhất còn thiếu của BCTC**.
> Thiếu TSCĐ → sai khấu hao; thiếu lương → sai chi phí. Lùi xuống GĐ4 sẽ làm BCTC sai thêm 2 quý.
>
> ⭐ **Ngoại lệ — 2.6a có thể vượt lên trước 2.2.** Nó không cần lõi HR, không cần engine thuế,
> không cần migration: chỉ là nối một hàm đã có vào một luồng đang thiếu nó. Một ngày, sửa đúng
> chỗ tiền thật đang thoát khỏi sổ cái.
> Đồng thời đây là nhóm duy nhất VietERP có kiến trúc đúng và VComm không có gì — nhưng
> **hằng số của VietERP đã cũ (niên hạn 2024)**: giữ kiến trúc, **tự viết hằng số** (quyết định #3).

---

### GĐ3 — Tách rời & bảo vệ *(3–4 tuần)*

| #   | Việc                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | **Outbox pattern** trên Postgres (thay NATS — đủ dùng, tận dụng hạ tầng sẵn có)                                                                                     |
| 3.2 | **Tách coupling kế toán khỏi UI** — `Orders.tsx:1111`, `Settlement.tsx:107/135`, `VCommSupermarket.tsx:269` đang gọi thẳng `accountingService`. Chuyển sang sự kiện |
| 3.3 | Cache tập trung (thay cache in-memory 5 phút của `taxService` — **sai khi >1 instance**)                                                                            |
| 3.4 | Rate limit + security headers                                                                                                                                       |
| 3.5 | Chuẩn hóa audit trail (đang có 2 nơi: `admin_audit_logs` + `acc_audit_log`)                                                                                         |

---

### GĐ4 — Năng lực mở rộng *(3–4 tuần)*

| #   | Việc                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------ |
| 4.1 | **E-invoice thật** 🔴 — nối MISA/VNPT + đăng ký mẫu BC22 với CQT. **Lỗ hổng pháp lý lớn nhất còn lại** |
| 4.2 | Tìm kiếm toàn văn tiếng Việt (Supabase FTS + `unaccent`)                                               |
| 4.3 | Feature flag (dùng ngay để rollout TT99 bridge theo tenant)                                            |
| 4.4 | **Open-to-Buy cho VComm Hub** — module duy nhất đáng học từ `OTB` của VietERP                          |
| 4.5 | Quản lý dự án (hiện 2 file — hoặc bỏ hoặc làm tới)                                                     |
| 4.6 | **Nối lại CRM** 🆕 — `crmService` đang là mã mồ côi (chỉ `Orders.tsx` gọi); `Customers`/`CSKH` tự xài MOCK. `Sellers` không gọi `sellerKycService`. Xem [spec 024 §6](./024-khach-hang-nhan-su.md) |

---

### GĐ5 — Hiệu năng & tách module *(chỉ khi GĐ1–4 xong)*

- [ ] Tách `vendor-recharts` (442 kB) khỏi entry — chỉ module BI cần
- [ ] Chia chunk theo domain
- [ ] **Chỉ chuyển monorepo khi có app thứ 2** (iPOS SaaS hoặc app nhà bán)

---

## 6. Thứ tự ưu tiên

```
Cao giá trị
    │ ●1.1 CI/CD   ●1.3 health/metrics   ●1.4 logging
    │ ●2.6a Bút toán rút tiền thật (1 ngày, không bị chặn) ⭐
    │ ●2.1 TSCĐ & khấu hao   ●2.5 Nhân sự & lương   ●4.1 E-invoice
    │ ●2.6b Khấu trừ TNCN hoa hồng CTV
    │ ●3.3 Cache   ●3.4 Rate limit
    │ ◆3.1 Outbox        ◆4.2 Search   ◆4.4 Open-to-Buy
    │ ◆2.2 Bank recon   ◆2.3 Budget   ◆4.6 Nối CRM   ◆5.x Tách module
    │ ✕ MRP/BOM    ✕ 16 app    ✕ NATS    ✕ K8s 3 cloud
Thấp └────────────────────────────────────────────► Cao chi phí
      ● Làm ngay   ◆ Làm sau   ✕ Không làm
```

---

## 7. Quyết định đã chốt (02/09/2026) & câu hỏi còn mở

### 7.1 Sáu quyết định đã chốt ✅

1. **Thứ tự thực thi** — GĐ1–GĐ4 ước tính **11–15 tuần với 2 backend + 1 frontend**.
   Nếu 1 người: làm đúng thứ tự **GĐ1 → 2.1 → 4.1 → 3.3/3.4**, bỏ GĐ5.
   → *Bổ sung 2.5 (Nhân sự & lương) vào ngay sau 2.1: +14–15 ngày (2 BE + 1 FE),
   +24–30 ngày nếu 1 người.* Xem [spec 024 §7](./024-khach-hang-nhan-su.md).
2. **TSCĐ (2.1) làm trước GĐ3** ✅ — VComm Hub có thiết bị POS, kệ, cửa hàng;
   DeviceLeasing cho thuê thiết bị. Không có khấu hao → BCTC sai và **khấu trừ
   thuế TNDN sai**.
3. **Giữ chuẩn TT99** ✅ — không copy TT200. Mọi tham chiếu kế toán từ VietERP phải soi
   lại TT99. *(Đã được kiểm chứng: hằng số thuế/BHXH của VietERP lỗi thời 2 thế hệ —
   xem spec 024 §5.2.)*
4. **Không đuổi theo số app** ✅ — 16 app của họ = 15 app thật, 47% là MRP. VComm thêm
   app chỉ khi có ranh giới triển khai riêng (iPOS, app nhà bán).
5. **Sửa test treo trước CI** ✅ — `firestore.test.ts` phải xử lý xong mới bật CI (1.1).
6. **Bổ sung E2E** ✅ — 318 unit test tốt nhưng chưa có test luồng tiền end-to-end.
   E2E đầu tiên: chu kỳ lương (spec 024 §2.5).

### 7.1b Quyết định bổ sung (02/09/2026)

7. **HR là người cập nhật tham số luật, ngay trong module HRM** ✅ — hệ quả trực tiếp:
   tham số luật **không được nằm trong code** (HR không deploy). Bắt buộc phải có
   màn hình cấu hình trong HRM + vết thẩm tra theo TT99 Điều 28 + phân quyền
   `HR_MANAGER` sửa / `HR_STAFF` xem / không ai được xóa dòng quá khứ.
   Xem [spec 024 §4.8](./024-khach-hang-nhan-su.md).
8. **VComm dùng cộng tác viên thật** ✅ — đã đo được, không phải giả định. KOL/KOC &
   Affiliate là mục menu cấp 1, có luồng duyệt chi. → nhóm này rơi vào `FLAT_ON_GROSS`,
   thiết kế một biểu thuế duy nhất sẽ sai toàn bộ nhóm. Xem [spec 024 §2.5](./024-khach-hang-nhan-su.md).
9. **Khấu trừ tại nguồn = cấu hình, không phải code** ✅ — Anh không chọn "dừng chi ngay"
   cũng không chọn "chấp nhận rủi ro": chọn **"cấu hình riêng"**. Thiết kế thành bảng
   `hr_withholding_config` với **công tắc 3 trạng thái** `WITHHOLD` / `WARN` / `OFF`.
   Trạng thái `WARN` (seed cho CTV) là điểm then chốt: **tiền vẫn chảy nhưng nghĩa vụ
   được ghi nhận vào `hr_withholding_accruals`** → trả lời được câu hỏi
   "đang nợ bao nhiêu tiền thuế chưa khấu trừ?", điều hiện tại không ai biết.
10. **Tách `partnerType` ngay từ đầu, đưa vào cấu hình thuế** ✅ — 3 loại đối tác
   (`AGENT` / `PICKUP_HUB` / `SELLER`) thành 3 hàng cấu hình. **Không có nhánh
   `if (partnerType === 'seller')` nào trong code** — mọi phân biệt nằm trong dữ liệu,
   có vết thẩm tra.
11. **Cấu hình theo cả cá nhân / pháp nhân** ✅ — Anh không trả lời câu hỏi #10 mà
   **xóa nó đi**: không cần đoán bản chất khoản chi, chỉ cần biết **người nhận là ai**.
   Hóa ra đúng hơn câu hỏi gốc: **thuế TNCN chỉ đánh cá nhân**, khấu trừ của pháp nhân
   là sai bản chất thuế. Cấu hình thành **ma trận 3 loại đối tác × 3 loại hình**.

### 7.1c 🔴 Phát hiện mới — NĐ 252/2026/NĐ-CP (nghĩa vụ sàn TMĐT)

**VComm nhiều khả năng là "nền tảng TMĐT có chức năng thanh toán"** → theo
**Nghị định 252/2026/NĐ-CP** (ký 30/6/2026, **hiệu lực 01/7/2026** — thay thế NĐ 117/2025), sàn phải **khấu trừ và nộp thay
GTGT + TNCN** trên **từng giao dịch thành công** của hộ/cá nhân bán trên sàn.
> 🔴 **MÔ HÌNH TỶ LỆ ĐÃ ĐỔI (NĐ 252/2026 Điều 44):** Không còn ma trận cố định 1% / 0,5% như NĐ 117/2025. NĐ 252/2026 xác định số thuế khấu trừ theo **tỷ lệ % thuế suất của luật thuế GTGT / TNCN / TNDN áp dụng trên doanh thu** phát sinh tại VN cho từng giao dịch. Phải rà lại và seed từ luật thuế gốc — xem spec 025.

VComm có 6 dấu hiệu cùng lúc: Seller bên thứ ba · ví tiền · yêu cầu rút tiền ·
đối soát COD · settlements · ghi nhận doanh thu đơn hàng. Và hiện **không khấu trừ gì cả**.

> Nếu đúng, đây **không phải** lỗ hổng tương lai: nghĩa vụ đã hiệu lực **hơn 14 tháng**.
> Khác hoàn toàn Điều 50 (NĐ 253/2026 — 1 loại thuế, theo lần chi) — NĐ 252/2026 **Điều 44** là **2 loại thuế,
> theo từng giao dịch** (tính theo % thuế suất luật thuế GTGT/TNCN/TNDN, không còn cố định 1%/0,5%), nên phải nối vào `postOrderJournalEntries()`, không chỉ luồng rút tiền.

**Cần làm ngay (0,5 ngày, không chờ 2.6b):** báo cáo Seller đang hoạt động + loại hình
+ doanh thu từ 01/7/2025. Nếu phần lớn là cá nhân → đưa lên **trước cả 2.1 (TSCĐ)**.
Xem [spec 024 §4.10](./024-khach-hang-nhan-su.md).

### 7.2 Câu hỏi còn mở ❓

1. **3 câu hỏi treo chưa có đáp án:** nhân lực phát triển, số VComm Hub vật lý, team iPOS.
2. **Từ spec 024 §8 — 5 đã chốt, 9 còn mở.** Đã chốt: #6 (CTV có thật) · #7 (HR cập nhật
   trong HRM) · #8 (cấu hình riêng) · #9 (tách partnerType) · #10 (cá nhân/pháp nhân). Còn mở:
   - #0 ⚠️ **Tỷ lệ khấu trừ `FLAT_ON_GROSS`: 5% hay 10%?** Anh nêu 5%; NĐ 253/2026 Điều 50.2 ghi 10%.
     Engine để `flat_rate` là tham số → Anh chốt số nào cũng được. *Đây là chìa khóa để
     đổi `AGENT` từ `WARN` sang `WITHHOLD`*
   - #11 🔴 **VComm có thuộc diện "nền tảng TMĐT có chức năng thanh toán" (NĐ 252/2026) không?** *(spec 024 §4.10 đối chiếu Điều 3.5/3.6 kết luận VComm đạt 5/5 tiêu chí — cần Anh xác nhận)*
     *Quan trọng nhất hiện tại — quyết định thứ tự ưu tiên của cả GĐ2*
   - #12 ✅ **NĐ 117/2025 không bị sửa đổi/bổ sung — nó bị THAY THẾ toàn bộ bởi NĐ 252/2026** (ký 30/6/2026, hiệu lực 01/7/2026). Xem spec 024 §4.10.2 / spec 025.
   - #13 Bao nhiêu Seller là cá nhân / hộ KD / doanh nghiệp? (hiện không có trường `entity_type`)
   - #1 `EasyHRM.tsx` (2.076 dòng, 0 kết nối) có phải bản lặp của `HR.tsx`?
   - #2 `Sales.tsx` xây thật hay xóa khỏi menu?
   - #3 VComm đã có nhân sự hưởng lương thật chưa (bao nhiêu người)?
   - #4 Vùng lương tối thiểu (I/II/III/IV) của từng chi nhánh/VComm Hub?
   - #5 Có cần sinh tờ khai BHXH & quyết toán TNCN từ hệ thống không?

---

## 8. Kết luận

**VietERP không tối ưu hơn VComm.** Con số 16 app không chịu được kiểm chứng:  
15 app thật (HRM-AI trùng 99% HRM-unified), 47% code ở MRP sản xuất, và hai module  
quan trọng nhất với VComm — **Accounting (198 KB, 0 trang UI)** và  
**Ecommerce (106 KB, 0 trang UI)** — thực chất chỉ là thư viện chưa có giao diện.  
Repo có 0 star, là fork, và ngủ 5 tháng.

**Đáng copy đúng 3 thứ:** health/metrics endpoint, CI/CD, và ý tưởng Open-to-Buy  
cho VComm Hub.

**Không copy:** TT200 (đã hết hiệu lực), MRP/BOM, kiến trúc 16 app, NATS, K8s 3 cloud.

**Lỗ hổng thật của VComm không nằm ở số app mà nằm ở:**  
(a) **vận hành** — 0 CI/CD, 0 observability, 0 health check;  
(b) **nghiệp vụ kế toán** — thiếu TSCĐ & khấu hao, thiếu đối chiếu ngân hàng;  
(c) **pháp lý** — chưa có e-invoice thật.

Thứ tự đề xuất: **GĐ0 (chặn) → GĐ1 → GĐ2 → đánh giá → GĐ3 → GĐ4 → GĐ5**.
