# Lược đồ cơ sở dữ liệu

> Thực thể, trường, kiểu dữ liệu, khóa chính, khóa ngoại, quan hệ, ràng buộc, chỉ mục, trạng thái, lịch sử thay đổi, chính sách xóa dữ liệu.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Mô hình đa doanh nghiệp (multi-tenant)

Hệ thống dùng **multi-tenant logic** (cùng một Supabase project, cách ly bằng cột `tenant_id`), không phải multi-tenant vật lý (mỗi tenant một schema/db). Giá trị mặc định khi thiếu: `tenant-vcomm-prod-01` (`src/services/dbService.ts:150`, `:1915`, `:1939`, `:2117`, `:2158`, `:2677`).

**Rủi ro:** nếu một truy vấn nào đó quên lọc `tenant_id`, dữ liệu các doanh nghiệp sẽ lẫn nhau. RLS (Row Level Security) là lớp phòng vệ thứ hai, nhưng **chưa đầy đủ** (xem mục 4).

## 2. Danh sách bảng quan hệ (RELATIONAL_TABLES)

`src/services/dbService.ts:15` khai báo 19 bảng được ánh xạ camel↔snake:

```
products, customers, orders, warehouse_stock, sellers, settlements, payments,
product_price_history, partner_ledgers, loyalty_points_ledger, support_tickets,
combos, combo_items, group_buy_sessions, group_buy_participants,
f2b2b_sources, f2b2b_pool_orders, f2b2b_pool_participants, (và tiếp)
```

Các bảng này lưu theo cột (relational); các bảng còn lại lưu theo cột `data` (JSON) kiểu Firestore.

## 3. Hai sổ kế toán song song (dual ledger)

Hệ thống có **hai kiểu lưu trữ kế toán chưa thống nhất**:

| Sổ | Bảng | Vị trí mã | Chuẩn |
|---|---|---|---|
| Sổ kế toán cũ (Firestore-style) | `journal_entries`, `journal_items` | `src/components/Finance.tsx`, `src/services/dbService.ts` | Thông tư 200 (legacy) |
| Sổ kế toán mới (TT99) | `acc_*` (ví dụ `acc_accounts`, `acc_entries`) | `src/services/tt99Service.ts`, `accountingService.ts`, `src/types/erp.ts` | Thông tư 99/2025 |

Cả hai đều được tham chiếu trong mã (`grep "journal_entries"` trả về 11 tệp; `grep "acc_"` trả về 9 tệp). **Chưa rõ quy tắc nào là nguồn xác thực duy nhất** — cần thiết kế to-be giải quyết.

## 4. Row Level Security (RLS) — phân mảnh, phủ rộng nhưng một số policy quá lỏng

**Hệ thống migration thực tế** nằm trong `specs/*/migrations/` (39 tệp SQL, trong đó **29 tệp định nghĩa RLS / policy**), không chỉ ở các script `scripts/setup_*.sql`. Khảo sát lần đầu chỉ quét `scripts/` nên bỏ sót hệ thống migration này — **cần tự hiệu chỉnh**.

Chính sách RLS rải rác cả ở `scripts/setup_*.sql` (ít nhất 6 script) và `specs/*/migrations/`:

- `accounts`, `journal_entries`, `journal_items` → `scripts/setup_accounting.sql:53`, `:58`, `:63`
- `employees` → `scripts/setup_cross_module_triggers.sql:161`
- `ipos_staff`, `pos_products`, `user_bank_accounts`, ... → `scripts/setup_unified_tables.sql`
- `user_keypairs`, `document_signatures` → `scripts/setup_digital_signatures.sql`
- `domain_events` → `specs/022-chuan-hoa-nen-tang/migrations/002_outbox_domain_events.sql:109` (ENABLE) và `:112-115` (policy `domain_events_tenant_isolation`)

**Hiệu chỉnh phát hiện (quan trọng):** Khảo sát trước ghi `domain_events` "không có RLS" là **SAI** — thực tế bảng này **đã bật RLS** (`:109`) và có policy (`:112-115`). Tuy nhiên policy này **quá lỏng (over-permissive)**:

```sql
CREATE POLICY domain_events_tenant_isolation ON public.domain_events
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01'
  );
```

Cụm `OR tenant_id = 'tenant-vcomm-prod-01'` (`:114`) khiến **mọi caller đã xác thực** (bất kể tenant thực của họ) đều có thể đọc/ghi nhật ký kiểm toán của tenant mặc định. Vậy rủi ro không phải là "không có RLS" mà là "RLS bị mở van mặc định". Rủi ro đa doanh nghiệp nghiêm trọng thực sự nằm ở **mặt API `/api/seller/*` không có guard + lỗ hổng IDOR** (xem `19_Bao_mat.md` §3.1 / mục M1 trong `Checklist_cong_viec.md`).

**Đã xử lý (M2, commit `4b9cd56`, `006_harden_domain_events_rls.sql`):** policy được thay bằng `tenant_id = (auth.jwt() ->> 'tenant_id') OR (tenant_id = 'tenant-vcomm-prod-01' AND auth.uid() IS NOT NULL)` — chặn anon chưa đăng nhập đọc/ghi tenant mặc định, giữ worker outbox trình duyệt (đã login) hoạt động. Follow-up M2.1: JWT Supabase không mang claim `tenant_id` → cần phát hành claim hoặc chạy worker bằng service-role để bỏ hẳn `OR` mặc định.

## 5. Không có transaction (ghi không nguyên tử)

`src/services/dbService.ts` không chứa `beginTransaction`, `rpc(`, `withTransaction`, hay `.transaction(` (xác nhận bằng tìm kiếm: 0 kết quả). Các thao tác ghi nhiều bảng (ví dụ `setDoc` → `handleOrderPaymentTrigger` → `saveJournalEntry`) thực hiện tuần tự, không rollback khi giữa chừng lỗi. Đây là nguyên nhân của pattern #74 (nuốt lỗi) và các rủi ro ghi hụt (pattern #90).

## 6. Lịch sử thay đổi / Chính sách xóa

- Migration phân mảnh qua nhiều script `setup_*.sql` và `deploy_*.ts` tại gốc repo (không có runner migration tập trung duy nhất).
- Chưa thấy chính sách xóa mềm / xóa cứng (soft/hard delete) thống nhất — `dbService.ts` dùng `upsert`/`update`, một số nơi có thể `delete` trực tiếp.

## Bằng chứng (evidence)

- Tenant mặc định: `src/services/dbService.ts:150` (và các dòng nhân bản).
- `RELATIONAL_TABLES`: `src/services/dbService.ts:15`.
- Dual ledger: `grep` `journal_entries` (11 tệp) và `acc_` (9 tệp).
- RLS: hệ thống `specs/*/migrations/` (39 tệp, 29 tệp có policy). `domain_events` có RLS (`002_outbox_domain_events.sql:109,112`) nhưng policy quá lỏng (`:114` `OR tenant_id = 'tenant-vcomm-prod-01'`).
- Thiếu transaction: tìm kiếm `beginTransaction|rpc(|withTransaction|.transaction(` trong `dbService.ts` = 0 kết quả.

## Chưa xác minh được

- Danh sách chính xác TẤT CẢ bảng và cột (chỉ có `RELATIONAL_TABLES` liệt kê một phần; các bảng `data` JSON không rõ schema).
- Trạng thái chạy thực tế của từng `setup_*.sql` trên Production.
- Quy tắc khóa ngoại (foreign key) giữa các bảng — cần đọc DDL đầy đủ.
- Chính sách backup / point-in-time recovery của Supabase project.
- JWT do Supabase cấp có thực sự mang claim `tenant_id` (`auth.jwt() ->> 'tenant_id'`) hay không — cần xác nhận để sửa policy `domain_events` (bỏ `OR` mặc định) có hiệu lực.
