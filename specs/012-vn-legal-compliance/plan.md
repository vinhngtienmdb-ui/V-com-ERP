# Feature Spec: Vietnam Legal Compliance Upgrade (Phase 12)

**Status**: In Progress | **Author**: opencode | **Started**: 2026-08-31

## Overview
Nâng cấp VComm ERP để đáp ứng các quy chuẩn pháp luật Việt Nam cho sàn TMĐT:
NĐ 52/2013 + 85/2021 (sàn TMĐT), Luật 36/2024/QH15 (bảo vệ NTD), TT 78/2021/TT-BTC
(hóa đơn điện tử), TT 99/2025/TT-BTC (kế toán), NĐ 117/2025 (thuế seller),
Luật 86/2025/QH15 (dữ liệu cá nhân), TT 13/2023/TT-BCT (thông tin sản phẩm).

## Progress

### GĐ 0 — Nền tảng (blocker)
- [x] 0.1 Spec tracking file (this file)
- [x] 0.2 Tách demo/prod bằng env: `VITE_DEMO_MODE=false` tắt mọi mock bypass
  - `StoreContext.tsx`: offline fallback SEED_STORES chỉ còn trong demo mode
  - `supabase.ts`: prod thiếu credentials → throw thay vì im lặng dùng fallback chết
- [x] 0.3 Xóa mock fallback luồng tiền
  - `Settlement.tsx`: thay 3× `confirm()`/`alert()` bằng modal phê duyệt chi tiết (số tiền, bank, bút toán kế toán sẽ ghi)
  - `Wallet.tsx` escrow: đọc từ `escrowService.listEscrows()` thật, mock chỉ fallback demo
- [x] 0.4 Khôi phục Supabase project mới + RLS theo `security_spec.md`
  - Project mới: `<PROJECT-REF>` (region Tokyo ap-northeast-1, pooler aws-0-ap-northeast-1:5432)
  - `.env`: VITE_SUPABASE_URL/ANON_KEY + DATABASE_URL (postgres pooler)
  - Deploy `deploy_full_schema.ts`: 16 script gốc + 9 migration mới (001-009)
  - **51 bảng public** — đủ: relational core, accounting double-entry, escrow, KYC, consent/DSAR, tax, zalo CRM, BI indices, audit/tenants
  - Fix compat: sellers FK TEXT (013), products.status/seller_id (002), cột đầy đủ toRelationalPayload (006/007), admin_audit_logs.data JSONB (008/009)
  - Fix code: `toRelationalPayload/fromRelationalRow` map `image_urls` (gallery PIM)
  - **Test suite 182/182 PASS** (trước đó 176/182 — 6 test DB-dependent đã sống lại)

### GĐ 2 — Escrow & bảo vệ NTD (Luật 36/2024) — LÀM TRƯỚC vì gấp pháp lý
- [x] 2.1 Escrow engine thật: `src/services/escrowService.ts`
  - State machine: locked → delivered → released/refunded, +disputed
  - `createEscrow` (thanh toán xong), `markEscrowDelivered` (giao hàng xong)
  - `releaseEscrow`: đủ điều kiện mới giải ngân + double-entry + partner ledger, idempotent
  - `refundEscrow`: hoàn NTD khi khiếu nại hợp lệ/giao hàng fail, idempotent
  - `openDispute`: phong tỏa giải ngân tự động
  - `processDueEscrows`: cron — release khi hết retention 7 ngày, refund khi locked 14 ngày không giao (Điều 28)
- [x] 2.2 Migration SQL: `specs/012-vn-legal-compliance/migrations/001_escrows.sql`
  - Bảng escrows + CHECK constraint trạng thái, unique(order_id)
  - Index cho cron job, RLS authenticated, audit trigger ghi log mọi chuyển trạng thái
- [x] 2.3 Wallet UI nối escrow thật, hiển thị thêm trạng thái Khiếu nại/Đã hoàn tiền
- [x] 2.4 Test: `src/__tests__/escrow_engine.test.ts` — 9/9 pass
  - Bao phủ: disputed chặn giải ngân, idempotent (không bút toán kép), cron release/refund hàng loạt

### GĐ 1 — Minh bạch sàn & KYC (NĐ 52/85, TT 13/2023)
- [x] 1.2 KYC state machine: `src/services/sellerKycService.ts`
  - unverified → documents_submitted → under_review → approved/rejected (nộp lại được)
  - `approveKyc` BẮT BUỘC hợp đồng khung đã ký + MST (NĐ 52 Điều 17)
  - `assertSellerCanPublish` gate cho toàn bộ publish sản phẩm
  - Migration `002_seller_kyc.sql`: bảng seller_kyc + **DB trigger chặn publish khi chưa KYC** (bảo vệ cả từ phía server, không chỉ client)
- [x] 1.4 Test `seller_kyc.test.ts` — 9/9 pass (state machine, chặn nhảy cóc, chặn approve thiếu MST/hợp đồng, gate publish)
- [x] 1.1 Trang công khai Điều 21: `src/components/PublicLegalInfo.tsx` + route `/legal-info`
  - Hiển thị: tên sàn, pháp nhân, MST, GPKD, địa chỉ trụ sở, đại diện pháp luật, hotline, email
  - Danh sách chính sách bắt buộc: điều khoản, bảo mật (86/2025), khiếu nại (36/2024), hoàn tiền, onboarding
  - Cam kết tuân thủ: NĐ 52/85, Luật 36, Luật 86, TT 78, NĐ 117/2025
  - Route public (không cần đăng nhập) theo pattern /supplier-portal
  - LƯU Ý: dữ liệu pháp nhân đang là placeholder — cần cập nhật MST/GPKD thật trước go-live
- [ ] 1.3 PIM liên thông databank BCT + truy xuất nguồn gốc QR (cần API BCT)

### GĐ 2 — Escrow & bảo vệ NTD (Luật 36/2024)
- [ ] 2.1 Escrow engine thật (thay MOCK_ESCROWS): hold → release khi giao thành công
- [ ] 2.2 Auto-refund khi hết hạn khiếu nại
- [ ] 2.3 Khiếu nại liên đới: ngưng bán SKU hàng giả trong SLA
- [ ] 2.4 Return/refund wizard thay `confirm()`, timeline + audit

### GĐ 3 — E-invoice & thuế (TT 78, NĐ 117/2025)
- [x] 3.2 Bảng thuế suất cấu hình: `src/services/taxService.ts`
  - `tax_rate_rules` theo thời gian: 8% (NĐ 72/2025, đến 31/12/2026) → 10% tự động từ 2027
  - `computeOrderTax`: VAT từng dòng theo category, cache 5 phút, fallback an toàn
  - Thay TOÀN BỘ hardcode 8%: `QuickPrintModal.tsx` (bill in), `VCommSupermarket.tsx` (POS siêu thị)
  - Migration `004_tax_engine.sql`: bảng rules + seed + thêm cột vat_rate/vat_amount vào orders
- [x] 3.3 Báo cáo thuế seller (NĐ 117/2025): `generateSellerTaxReport`
  - Sàn KHÔNG khấu trừ thuế thay (từ 1/4/2025) — chỉ cung cấp báo cáo doanh thu/VAT theo kỳ
  - Ghi chú đối chiếu chuẩn kế toán TT 99/2025 trong report
- [x] Test `tax_engine.test.ts` — 7/7 pass (8%/10% theo thời kỳ, VAT từng dòng, report NĐ 117)
- [ ] 3.1 Tích hợp e-invoice provider được CQT cấp phép (MISA/VNPT/FPT) — cần chọn nhà cung cấp + đăng ký mẫu BC22 với CQT

### GĐ 4 — Dữ liệu cá nhân (Luật 86/2025, hiệu lực 1/1/2026)
- [x] 4.1 Consent center: `src/services/consentService.ts`
  - Ghi consent theo TỪNG purpose + version chính sách + evidence
  - `order_processing` là mandatory (theo hợp đồng) — không thể rút trực tiếp
  - Opt-out 1 click cho marketing/profiling/third_party
- [x] 4.2 DSAR: `exportSubjectData` (xuất JSON toàn bộ dữ liệu), `requestAccountDeletion`
  (xóa qua review pháp lý — giữ hóa đơn/chứng từ theo TT 99 lưu 10 năm)
- [x] 4.3 DPIA tự đánh giá: `assessDpia` — flag bắt buộc khi có quyết định tự động
  (seller credit scoring), dữ liệu nhạy cảm, dữ liệu trẻ em, quy mô lớn, chuyển xuyên biên giới
- [x] Migration `003_consent_dsar.sql`: data_consents + dsar_requests (due 30 ngày theo luật)
- [x] Test `consent_center.test.ts` — 10/10 pass

### GĐ 3.1 / 1.3 / GĐ 5 → Integration Config Layer (add-key-sau) ✅
3 phần còn lại đã chuyển thành **cấu hình API động** — hệ thống đọc config từ DB,
chưa add key thì degrade an toàn với thông báo hướng dẫn, add key vào là chạy:

**Cơ sở hạ tầng:**
- Migration 010: bảng `integration_configs` (unique tenant+provider, test status, audit mọi thay đổi)
- Migration 011: `user_roles` RBAC + seed super_admin cho admin thật
- `src/services/integrationConfigService.ts`: CRUD + `PROVIDER_SCHEMAS` (form tự render)
  + `testIntegrationConnection` + `requireReadyProvider` gate + `maskConfigForDisplay` (che key)
- Server proxy `server.ts`: `/api/integrations/test` + 8 endpoint gọi provider — **key chỉ nằm server**

**3 Adapter:**
- `einvoiceService.ts` (TT 78/2021): `buildEInvoiceDraft` chuẩn TT78, `issueEInvoice`
  qua MISA/VNPT/FPT theo config, `cancelEInvoice` Điều 19, lưu kết quả vào orders schema hiện có
- `databankService.ts` (TT 13/2023): `publishProductToDatabank`, `verifyProductOrigin`,
  `generateTraceQrPayload` (QR truy xuất nguồn gốc)
- `cqReportingService.ts` (NĐ 52/85): `notifyMarketplaceOperation` (thông báo BCT),
  `submitPeriodicReport` (trình báo 6 tháng), `signWithHsm` (thay mock HSM)

**Test:** `integration_config.test.ts` 10/10 — schema validate, missing-key throw,
masked display, draft TT78 chuẩn, issue flow + fallback not-configured

**Cách add key sau:** Settings → Integrations (UI) hoặc Supabase → integration_configs.
Test ngay: nút "Test kết nối" ping health endpoint provider.

### Admin User thật Supabase Auth ✅
- Email: **vinh.ngtienmdb@gmail.com** / pass: **admin@1234** (đã verify login thành công)
- `user_roles`: super_admin + permissions all; `users` + `staff` table gán super_admin
- Lưu ý: `admin@v-erp.com` insert trực tiếp bị GoTrue từ chối (chỉ nhận user tạo qua API)
  — dùng Gmail là chuẩn. AuthContext chấp nhận cả 2 đường: user_roles (chuẩn) + whitelist bootstrap

**Test suite tổng: 198/198 PASS** (34 files)

---

## Workflow Liên thông Toàn Diện (fix ①-⑨) ✅ 2026-09-01

Audit toàn hệ thống phát hiện 9 điểm gãy liên thông module → đã sửa toàn bộ:

| # | Vấn đề | Fix |
|---|---|---|
| ① | DB trigger paid không ghi payments row | Migration 012: trigger INSERT payments (idempotent, transaction_id từ đơn) |
| ② | Escrow service mồ côi — không ai gọi | useSepayListener: `createEscrow` khi matched (idempotent); Orders/Logistics delivered: `markEscrowDelivered` |
| ③ | Trừ kho kép (DB trigger + client) | Orders.tsx: client chỉ trừ đơn COD chưa qua 'paid' — DB trigger là nguồn sự thật |
| ④ | settlementStatus không ai set → Settlement rỗng | Orders delivered/completed: set `settlement_status='pending'`; + Logistics confirmDelivery |
| ⑤ | processDueEscrows không có scheduler | Migration 012: `fn_process_due_escrows()` SQL server-side + pg_cron `0 * * * *` |
| ⑥ | Logistics mock — delivered không sync orders | Nút "Xác nhận đã giao" → orders.status='delivered' + escrow + settlement |
| ⑦ | PIM không gọi KYC gate | approveProduct: `assertSellerCanPublish` + status='published' (trigger DB chặn server-side) |
| ⑧ | Supermarket POS không hạch toán | handleCheckoutAndPrint: `postOrderJournalEntries` (Nợ 1111/1121 - Có 5111) |
| ⑨ | E-invoice XML giả lập | handleSignHsm → `issueEInvoice` qua Integration Config (chưa key → hướng dẫn) |

**Liên thông dữ liệu mới:**
- orders: +cột `transaction_id`, `delivered_at` (migration 013)
- dbService toRelationalPayload orders: map transaction_id, delivered_at
- Product type: +sellerId, status mở rộng ('draft','published','rejected','archived')

**Luồng chuẩn giờ chạy (target đạt):**
```
SePay paid → [trigger] payments row + trừ kho + JE 1121/5111 + escrow created
  → Orders delivered → settlement_status=pending + escrow delivered
  → pg_cron giờ → escrow release (ví seller + ledger) / refund stale 14 ngày
  → Settlement thấy đơn → duyệt → chiết tính
  → PIM publish qua KYC gate → Supermarket POS vào sổ → E-invoice qua provider
```

**Test workflow:** `workflow_integration.test.ts` 6/6 — escrow idempotent, retention,
VAT draft, chống trừ kép, KYC contract

---

## Dọn nợ kỹ thuật cuối (2026-09-01, vòng 2) ✅

**Mock dọn sạch (nhóm 2):**
- Logistics: vận đơn đọc orders realtime (onSnapshot) — bỏ mockLogistics, đơn có carrier tự thành vận đơn
- Finance: HSM thật qua cqReportingService (fallback local + cảnh báo rõ)
- PIM/RequestHub/RequestDetail: /api/mock/* → /api/gemini/* (endpoint thật, truyền hồ sơ)

**Nợ kỹ thuật (nhóm 3):**
- Backfill escrow script: `scripts/backfill_escrows.ts` (chạy khi cần — DB mới hiện sạch)
- `.env.production.example`: checklist go-live đầy đủ (DEMO_MODE off, đổi pass, BC22, BCT, DPO)

**Vòng 2 — nợ sâu hơn:**
- **legalEntityService**: Single Source of Truth thông tin pháp nhân (tenant_settings key `legal_entity`,
  validate MST 10/13 số) → PublicLegalInfo đọc DB + cảnh báo khi dùng default;
  Orders e-invoice dùng getEInvoiceLegalInfo() — không còn MST hardcode
- **Settings UI**: form "Thông tin Pháp nhân" trong Tích hợp Pháp lý — sửa 1 nơi dùng mọi nơi
- **xlsx → exceljs**: thay SheetJS (2 GHSA no-fix) bằng exceljs, giữ nguyên API exportToExcel/CSV
- **npm audit 17 → 2** (chỉ còn uuid-in-exceljs moderate, không dùng buf API — chấp nhận)
- **Seed vận hành**: `scripts/seed_marketplace_data.ts` — seller demo KYC approved + hợp đồng
  khung + 2 sản phẩm published + tồn kho WH-MAIN-01
- **Xóa script chết**: seed_demo_data (import firebase đã gỡ), seed_sellers (lỗi type)
- **TS 0 lỗi lần đầu**: fix Product.image_urls, Product.status test, Affiliate.vneidVerified,
  Compliance ColumnDef (4 bảng sang object format chuẩn)

**Final: 198/198 test pass, tsc 0 error, 0 /api/mock sót.**

## Environment Handling
- Demo mode: `VITE_DEMO_MODE` != 'false' (mặc định, dữ liệu mock)
- Prod mode: `VITE_DEMO_MODE=false` + `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` thật
- Luồng tiền/đơn hàng phải chỉ phụ thuộc DB, mock chỉ hiển thị UI khi demo
