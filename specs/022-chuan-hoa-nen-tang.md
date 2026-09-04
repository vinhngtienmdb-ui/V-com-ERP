# Spec 022 — Nâng cấp chuẩn nền tảng ERP (đối chiếu VietERP)

**Ngày:** 02/09/2026
**Đầu vào:** `https://github.com/tannhdev/viet-erp`
**Câu hỏi cần trả lời:** Hệ thống hiện tại đứng ở đâu so với một ERP "điển hình phù hợp
với Việt Nam", và cần nâng cấp những gì để đáp ứng chuẩn?

---

## 1. Tóm tắt điều hành

**Kết luận chính: KHÔNG nên lấy VietERP làm đích đến. Nên mượn đúng 30%.**

VietERP mạnh ở **kỹ thuật nền tảng** (event bus, quan sát, tìm kiếm, IaC) — những thứ
VComm đang **hoàn toàn trống**. Nhưng VietERP yếu ở hai điểm quyết định:

1. **Kế toán TT200 — đã hết hiệu lực từ 01/01/2026.** VComm vừa chuyển xong sang
   TT99/2025/TT-BTC. Hôm nay (02/09/2026), TT200 không còn là chuẩn nữa.
   **Nếu "học theo" VietERP ở điểm này thì là đi lùi.**
2. **Không có nghiệp vụ sàn TMĐT.** Escrow (Luật 36/2024), KYC (NĐ 52/85), thuế sàn
   (NĐ 252/2026), bảo vệ dữ liệu cá nhân (Luật 86/2025), O2O, V-Xu, Dropship, F2B2B —
   VietERP không có, VComm có.

Ngược lại, VComm đang trắng tay ở lớp vận hành: **không CI/CD, không observability,
không cache, không search, không rate limit, không Dockerfile**. Đây là khoảng cách
thật cần lấp.

> ⚠️ **Đọc vị trung thực về con số của VietERP.** README tự nhận 100% hoàn thành,
> 1.431.780 LOC, 16 app, 980 model Prisma, 1.322 API route. Nhưng: repo chỉ có
> **28 commit**, commit đầu 28/03/2026, commit cuối 01/04/2026 — tức ~5 ngày cho
> 1,4 triệu dòng, tương đương ~51.000 dòng/commit. README cũng tự mâu thuẫn
> (980 vs 971 model; 16 vs 15 vs 14 app; 157 vs 154 E2E spec), và Quick Start lại
> trỏ sang repo khác (`nclamvn/Viet-ERP.git`).
> **Đánh giá: đây là repo được sinh ra (AI-generated), không phải sản phẩm tích lũy.**
> Dùng làm **danh mục kiểm tra tính năng** thì được; dùng làm **mốc quy mô** thì vô nghĩa.

---

## 2. Số liệu đối chiếu (đo thực tế)

| Hạng mục | VietERP (tự công bố) | VComm (đo 02/09/2026) | Nhận xét |
|---|---|---|---|
| LOC TS/TSX | 1.058.429 | **93.486** | 1:11 — bình thường, họ là 16 app |
| File TS/TSX | 6.250 | 173 | |
| Số app | 16 | 1 (SPA) | |
| Module/route | 1.322 API route | **51 route** (7 nhóm nav) | |
| Service | — | 25 | |
| Test | 723 file (157 E2E) | 40 file / **318 test case** | Không có E2E |
| Migration SQL | 43 | **35** | Tương đương |
| Package chia sẻ | 27 | 0 | |
| **CI/CD** | 7 job GitHub Actions | **0 (`.github` rỗng)** | 🔴 Khoảng cách |
| **Observability** | Prometheus+Grafana+Loki | **0** | 🔴 Khoảng cách |
| **Event bus** | NATS JetStream | **0** | 🔴 Khoảng cách |
| **Cache** | Redis 7 | **0** (cache in-memory) | 🔴 Khoảng cách |
| **Search** | Meilisearch | **0** | 🔴 Khoảng cách |
| **Rate limit** | Redis sliding window | **0** | 🔴 Khoảng cách |
| **Feature flag** | có | **0** | 🟡 Cần cho rollout TT99 |
| **Docker / K8s / IaC** | 17 Dockerfile, Helm, Terraform | **0** (chỉ `vercel.json`) | 🟡 Chỉ cần khi bán on-premise |
| Auth | Keycloak SSO + RBAC | Supabase Auth + RLS | 🟡 Đủ hiện tại |
| Song ngữ | Vi-En (`@vierp/i18n`) | Chỉ VN + `Intl` format | 🟡 |

### Tuân thủ Việt Nam — VComm không hề thua

| Hạng mục | VietERP | VComm |
|---|---|---|
| Chuẩn kế toán | **TT200 (hết hiệu lực 1/1/2026)** | **TT99/2025 (hiệu lực 1/1/2026)** ✅ |
| Hóa đơn điện tử | NĐ123, VNPT/Viettel/FPT/BKAV | MISA/eInvoice — **chưa tích hợp thật** (spec 012 GĐ3.1 đang chờ) |
| Thuế GTGT | 0/5/8/10% (NĐ 44/2023) | `taxService.ts` 8%→10% theo thời kỳ (NĐ 174/2025 — giảm 2% GTGT) ✅ |
| Thuế TNCN | 7 bậc 5–35% | Có (6 file) |
| BHXH/BHYT/BHTN | 8%+17,5% / 1,5%+3% / 1%+1% | Có (4 file, trong HRM) |
| VietQR / NAPAS | có | Có (12 file) |
| Cổng thanh toán | VNPay, MoMo, ZaloPay | Có (6 file) + **SePay webhook** |
| Vận chuyển | GHN, GHTK, Viettel Post | Có (8 file) |
| **Escrow (Luật 36/2024)** | không nêu | ✅ `escrowService.ts` + state machine + cron |
| **KYC sàn (NĐ 52/85)** | không nêu | ✅ `sellerKycService.ts` + DB trigger chặn publish |
| **Thuế sàn (NĐ 252/2026)** | không nêu | ✅ `generateSellerTaxReport` |
| **Dữ liệu cá nhân (Luật 86/2025)** | không nêu | ✅ `consentService.ts` |
| **Hợp nhất đơn vị trực thuộc** | không nêu | ✅ `acc_eliminations` (Điều 7 TT99) |
| **IFRS 15** | không nêu | ✅ `rev_*` (spec 021) |

---

## 3. Phân loại khoảng cách

### 🟢 Nhóm A — VComm đang thắng, giữ nguyên không đụng

1. **TT99/2025** — lợi thế cạnh tranh thực sự, đối thủ đang dùng chuẩn đã chết.
2. **Bộ tuân thủ pháp lý sàn TMĐT** (Luật 36, NĐ 52/85, NĐ 117, Luật 86) — VietERP
   không có; đây là rào cản gia nhập thị trường cao.
3. **Độ sâu nghiệp vụ 7 trụ cột** — Dropship, Group Buy, F2B2B, O2O Hub, V-Xu,
   Affiliate, Loyalty. Không ai có.
4. **Multi-tenant từ đầu** (`tenant_id` + RLS).
5. **318 test unit** bao phủ cả luật pháp (escrow, KYC, thuế, TT99).

### 🔴 Nhóm B — Khoảng cách thật, phải làm

| # | Hạng mục | Vì sao gấp | Chi phí |
|---|---|---|---|
| B1 | **CI/CD** | Chưa có `.github`. Mọi thứ đang tin tưởng vào tay người build. `npm run lint` chỉ chạy `tsc`, ESLint có config nhưng **không được nối vào script nào**; cũng **không có script `test`** | Thấp |
| B2 | **Observability** | 0 metric, 0 alert. Có **258 lệnh `console.*`** rải rác không cấu trúc (34 log / 55 warn / 168 error) và **10 khối `catch {}`** nuốt lỗi hoàn toàn. Sự cố production chỉ biết qua người dùng phàn nàn | Trung bình |
| B3 | **Cache tập trung** | `taxService` cache in-memory 5 phút — **sai ngay khi chạy >1 instance** | Trung bình |
| B4 | **Rate limit + security headers** | 0. API công khai (`/legal-info`, `/supplier-portal`) không có chống brute-force | Thấp |
| B5 | **Event bus / tách rời module** | 25 service gọi chéo trực tiếp; thêm module mới là sửa module cũ | Cao |
| B6 | **Tìm kiếm toàn văn tiếng Việt** | 51 route, PIM/đơn hàng không có search — chỉ filter cơ bản | Trung bình |
| B7 | **Feature flag** | Cần để bật `TT99_BRIDGE_ENABLED` mà không deploy lại | Thấp |
| B8 | **Health check + graceful shutdown** | `server.ts` chưa có | Thấp |

### ⚫ Nhóm C — KHÔNG đuổi theo

- **1,4 triệu LOC / 16 app / 980 model** — quá khổ với một doanh nghiệp. Quy mô không
  phải chất lượng; và con số này không đáng tin (xem §1).
- **Keycloak SSO** — Supabase Auth + RLS đang đủ. Chỉ đổi khi có khách enterprise
  đòi SAML.
- **NATS JetStream** — quá nặng. **Outbox pattern trên Postgres** giải quyết được 90%
  nhu cầu với 10% chi phí, và tận dụng hạ tầng Supabase sẵn có.
- **K8s + Terraform 3 cloud** — Vercel đang phù hợp. Chỉ cần khi bán bản on-premise.
- **27 package chia sẻ** — chỉ tách khi thực sự có app thứ 2. Hiện tại 1 SPA →
  chia sẻ = overhead.

---

## 4. Kế hoạch nâng cấp

### ⛔ Việc chặn phải xử lý trước tiên (ngoài roadmap)

- [ ] **Chạy 5 migration TT99 lên Supabase.** Đã validate trong transaction rollback,
      **chưa apply**. Chưa xong thì mọi thứ ở GĐ bên dưới về kế toán đều vô nghĩa.
- [ ] Bật `TT99_BRIDGE_ENABLED = true` **sau khi** migration chạy xong.
- [ ] Trả lời 3 câu hỏi còn treo: nhân lực dev · VComm Hub vật lý · team iPOS.

---

### GĐ1 — Nền tảng vận hành (mục tiêu: 2–3 tuần)

> Tiêu chí: **có thể phát hiện sự cố trước khi khách hàng phát hiện.**

| # | Việc | Chi tiết |
|---|---|---|
| 1.1 | **CI/CD GitHub Actions** | Tạo `.github/workflows/ci.yml`: install → `tsc --noEmit` → ESLint → `vitest run` (từng file, tránh treo) → `npm run build`. Chạy trên mọi PR |
| 1.2 | **Nối lint/test vào npm script** | Thêm `"test": "vitest run"`, `"lint:eslint": "eslint ."`, sửa `"lint"` thành chạy cả 2. ESLint có config rồi nhưng chưa ai gọi |
| 1.3 | **Structured logging** | Thêm `pino`. Hiện có **258 lệnh `console.*`** không cấu trúc. Quy tắc mới: **không dùng `console.*` trong `src/services/`** — mọi log nghiệp vụ đi qua logger có `tenantId`, `requestId`, `module`. Giới hạn phạm vi: chỉ chuyển 258 chỗ này, không refactor logic |
| 1.4 | **Health check** | `server.ts`: thêm `GET /health` (DB ping + version + uptime) và `GET /ready`. Graceful shutdown đóng connection pool |
| 1.5 | **Error tracking** | Xử lý **10 khối `catch {}`** đang nuốt lỗi hoàn toàn — đổi thành log có ngữ cảnh (module, tenantId, input). Chưa cần Sentry |
| 1.6 | **Dockerfile** | Một Dockerfile multi-stage build `dist/server.cjs`. Mở đường cho on-premise về sau |

**Định nghĩa xong:** PR nào cũng chạy CI xanh; có endpoint `/health` trả 200 kèm trạng
thái DB; lỗi service được log có `tenantId`.

---

### GĐ2 — Tách rời & bảo vệ (mục tiêu: 3–4 tuần)

> Tiêu chí: **thêm nghiệp vụ mới không phải sửa nghiệp vụ cũ; API chịu được tải.**

| # | Việc | Chi tiết |
|---|---|---|
| 2.1 | **Outbox pattern** | Bảng `domain_events` (Postgres). Service ghi sự kiện **cùng transaction** với nghiệp vụ. Worker poll → dispatch. Bắt đầu với 3 sự kiện: `order.completed`, `escrow.released`, `withdrawal.approved` — hiện đang gọi chéo trực tiếp |
| 2.2 | **Tách coupling kế toán** | 3 nơi đang `await import('../services/accountingService')` rồi ghi sổ ngay trong luồng UI: `Orders.tsx:1111`, `Settlement.tsx:107` và `:135`, `VCommSupermarket.tsx:269`. Chuyển sang phát sự kiện; worker ghi sổ. Lợi ích: **ghi sổ lỗi không làm kẹt hoàn tất đơn / duyệt chi** |
| 2.3 | **Cache tập trung** | Bảng `cache_entries` trên Postgres hoặc Upstash Redis. Thay cache in-memory của `taxService` — hiện **sai khi >1 instance** |
| 2.4 | **Rate limit** | Middleware Express: chống brute-force cho `/api/auth`, giới hạn webhook SePay, giới hạn endpoint public. Sliding window |
| 2.5 | **Security headers** | Helmet: CSP, HSTS, X-Frame-Options, CORS chặt. **Rà soát CSP vì hiện dùng `@google/genai` và AWS S3 từ client** |
| 2.6 | **Audit trail chuẩn hóa** | VComm có `admin_audit_logs` + `acc_audit_log` (chuỗi băm TT99). Gộp về một writer và một định dạng, tránh 2 nơi |

**Định nghĩa xong:** ghi sổ kế toán đi qua event; 2 instance chạy song song cho cùng
kết quả; endpoint public bị giới hạn tần suất.

---

### GĐ3 — Mở rộng năng lực (mục tiêu: 3–4 tuần)

| # | Việc | Chi tiết |
|---|---|---|
| 3.1 | **Tìm kiếm toàn văn tiếng Việt** | Supabase full-text `to_tsvector('simple')` + `unaccent` (bỏ dấu). Phủ PIM, Orders, Customers, Sellers. Chỉ dùng Meilisearch nếu FTS không đủ |
| 3.2 | **Feature flag** | Bảng `feature_flags` theo tenant + hook `useFeatureFlag`. Dùng ngay để rollout `TT99_BRIDGE_ENABLED` theo từng tenant thay vì đổi code |
| 3.3 | **E-invoice thật** | Nối spec 012 GĐ3.1. Chọn 1 nhà cung cấp (MISA hoặc VNPT) + đăng ký mẫu BC22 với CQT. **Đây là lỗ hổng pháp lý lớn nhất còn lại** |
| 3.4 | **Logging/metrics dashboard** | Prometheus metrics từ outbox worker + HTTP. Grafana hoặc Vercel observability tùy hạ tầng |
| 3.5 | **i18n thật (nếu có khách nước ngoài)** | Hiện UI thuần Việt, 47 file dùng `Intl` chỉ để format. Chỉ làm khi có yêu cầu thật |

---

### GĐ4 — Tách module (chỉ khi GĐ1–3 xong)

Bundle hiện tại: `index-wLuYxr-Z.js` **701 kB** (gzip 179 kB), `vendor-recharts`
442 kB, `vendor-icons` 105 kB. 51 route đã lazy nhưng chunk nền vẫn nặng.

- Tách `vendor-recharts` ra khỏi entry (chỉ module BI cần)
- Chia nhóm route theo domain thành các chunk riêng
- **Chỉ chuyển sang monorepo khi có app thứ 2** (iPOS SaaS hoặc app nhà bán)

---

## 5. Thứ tự ưu tiên theo giá trị/rủi ro

```
Cao giá trị
    │  B1 CI/CD ●        B2 Observability ●
    │  B4 Rate limit ●   B3 Cache ●
    │        B7 Feature flag ●
    │  B5 Event bus ◆          B6 Search ◆
    │                    GĐ4 Tách module ◆
    │  Keycloak ◆   K8s/Terraform ◆   1.4M LOC ✕
Thấp └────────────────────────────────────────► Cao chi phí
        ● Làm ngay   ◆ Làm sau   ✕ Không làm
```

---

## 6. Rủi ro & câu hỏi mở

1. **Kế hoạch này chưa thể chốt thời lượng.** Ba câu hỏi treo từ nhiều buổi trước
   vẫn chưa có đáp án — **nhân lực dev**, **số lượng VComm Hub vật lý**, **team iPOS**.
   GĐ1–GĐ3 ước tính 8–11 tuần với **2 backend + 1 frontend**. Nếu chỉ 1 người,
   ưu tiên đúng B1 → B2 → B4 → B3, bỏ GĐ3.
2. **Đừng copy TT200.** Bất kỳ code/thiết kế kế toán nào tham chiếu từ VietERP phải
   được soi lại theo TT99 trước khi đưa vào.
3. **E-invoice (GĐ3.3) là lỗ hổng pháp lý.** NĐ 252/2026 + TT 78 yêu cầu sàn xuất
   hóa đơn điện tử; hiện mới chỉ có báo cáo thuế, chưa có hóa đơn. Cần chốt nhà
   cung cấp sớm vì khâu đăng ký mẫu BC22 với CQT mất thời gian.
4. **Outbox (B5) là thay đổi kiến trúc lớn nhất.** Nên làm sau cùng trong GĐ2, và
   làm theo từng sự kiện một, không big-bang.
5. **Test suite chạy hết bị treo.** Cần xử lý trước khi đưa vào CI (B1.1) —
   nghi do `src/__tests__/firestore.test.ts`.

---

## 7. Kết luận

VietERP hữu dụng với VComm ở đúng **một** vai trò: **danh mục kiểm tra hạ tầng bị thiếu**.
Nó cho thấy VComm đang trống CI/CD, observability, cache, search, event bus — năm thứ
mà một hệ thống chạy tiền thật không thể thiếu.

Nhưng nó **không** phải mốc để đuổi theo về quy mô, và **đặc biệt không được học theo**
ở mảng kế toán — chuẩn TT200 của họ đã hết hiệu lực ngày 01/01/2026, trong khi VComm
đã xong TT99.

Thứ tự đề xuất: **chặn (migration TT99) → GĐ1 → GĐ2 → đánh giá lại → GĐ3 → GĐ4**.
