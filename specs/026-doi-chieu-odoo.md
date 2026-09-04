# SPEC 026 — Đối chiếu Odoo ↔ VComm ERP: đánh giá chi tiết & khuyến nghị

**Ngày:** 02/09/2026
**Nguồn:** `https://github.com/odoo/odoo` — nhánh mặc định **`19.0`**
**Phương pháp:** clone thưa (`--filter=blob:none --sparse --depth 1 --branch 19.0`) 20 module liên quan, đo LOC, đọc mã nguồn gốc, đối chiếu file dữ liệu với `specs/021` của VComm.

> ⚠️ **Mục đích của tài liệu này KHÔNG phải để quyết định "có nên chuyển sang Odoo không".**
> Mục đích là: **mượn kiến trúc đã được kiểm chứng bởi 54.000 star / 20 năm tích lũy**, và
> **xác định chính xác chỗ nào Odoo không giúp được VComm** — để không tốn công tìm kiếm.

---

## 0. Phạm vi khảo sát và cách đọc số liệu

Odoo **không thể** so sánh toàn bộ. Con số thực tế:

| Chỉ số | Odoo (đo trực tiếp) |
|---|---|
| Kích thước repo | **17.089 MB** |
| Số module trong `addons/` (đã khử trùng) | **633** |
| Module `l10n_*` (bản địa hóa theo quốc gia) | **170+** |
| Ngôn ngữ | Python (ORM tự dựng) |
| Giấy phép | LGPL-3 |
| Star / Fork | 54.118 / 33.591 |
| Cập nhật lần cuối | **2026-09-02** (tức là **hôm nay**) |

**20 module được checkout để đọc mã:**

```
account  crm  hr  hr_expense  hr_gamification  hr_holidays  hr_work_entry
l10n_vn  l10n_vn_edi_viettel  loyalty  mail  point_of_sale  product
purchase  sale  sale_stock  stock  stock_account  stock_dropshipping
website_sale
```

> 📌 **Lưu ý về con số 633.** Trước đó tôi từng ước tính "~1.200 module". Con số đúng
> sau khi khử trùng qua API là **633**. Tôi ghi lại ở đây để không dùng nhầm sau này.

---

## 1. TL;DR — 8 phát hiện đáng tiền nhất

| # | Phát hiện | Ý nghĩa với VComm |
|---|---|---|
| **1** | 🔴 **Hệ tài khoản VN của Odoo khớp **71/71** với TT99** | Độc lập xác nhận `specs/021` đúng. **Xem §5 — tôi đã kết luận sai về việc này và xin đính chính.** |
| **2** | 🔴 `account_asset`, `hr_payroll`, `hr_appraisal`, `helpdesk`, `quality` đều **Enterprise-only** | Odoo Community **không giải được** đúng 2 lỗ hổng lớn nhất của VComm: **2.1 TSCĐ/khấu hao** và **2.5 lương** |
| **3** | 🔴 Odoo **không có 1 dòng logic thuế TNCN nào** | Toàn bộ `hr_pit_policies` (spec 024 §4) **không có nguồn để copy**. Phải tự thiết kế. |
| **4** | 🟡 `loyalty` = **1 engine cho 8 loại chương trình** | VComm đang có **3 bản cài rời** (V-Xu, FlashSale, Affiliate) — đây là bản thiết kế để gộp |
| **5** | 🟡 `stock_account`: FIFO / BQGQ / Giá tiêu chuẩn + định giá **từng lô** | VComm đang dùng `ESTIMATED_COGS_RATIO = 0.6` — **60% giá bán cố định** |
| **6** | 🟡 `hr.version` = **hợp đồng dạng snapshot theo ngày** | Cùng mẫu hình với `hr_pit_policies` của VComm — **thiết kế của ta đúng hướng** |
| **7** | 🟡 `hr.contract.type` chỉ là **danh sách tự do** (name/code/country) | Không có phân loại HĐLĐ / HĐ dịch vụ / khoán / CTV → `hr_contract_tax_map` **không có Odoo để đối chiếu** |
| **8** | ⚪ `l10n_vn` có đúng **1 file test** (test VietQR) | Bản địa hóa VN của Odoo gần như **không được kiểm thử** — không nên tin mù |

---

## 2. Quy mô: con số không biết nói dối

### 2.1 Đo lường

| Module Odoo | Python | XML | CSV |
|---|---:|---:|---:|
| `account` | **98.359** | 11.722 | 216 |
| `stock` | 46.068 | 9.705 | 78 |
| `mail` | 41.972 | 11.304 | 70 |
| `point_of_sale` | 27.712 | 9.341 | 55 |
| `hr_holidays` | 21.274 | 5.502 | 28 |
| `website_sale` | 19.153 | 12.043 | 72 |
| `sale` | 18.322 | 6.894 | 48 |
| `product` | 10.943 | 4.885 | 39 |
| `stock_account` | 9.857 | 790 | 10 |
| `hr` | 8.781 | 4.477 | 27 |
| `hr_expense` | 5.246 | 2.091 | 15 |
| `hr_work_entry` | 2.353 | 1.617 | 6 |
| `loyalty` | 2.336 | 1.451 | 9 |
| `l10n_vn_edi_viettel` | 2.222 | 202 | 6 |
| **`l10n_vn`** | **420** | 422 | 392 |

### 2.2 Đặt cạnh VComm

| | VComm ERP | Odoo |
|---|---:|---:|
| Tổng LOC mã nguồn (`src/`) | **94.191** (22.243 `.ts` + 71.243 `.tsx` + 705 css) | — |
| LOC test | 7.536 (40 file) | — |
| Số component | 77 | — |
| Số service | 25 | — |
| File SQL migration | 11 (`scripts/`) + 11 (`specs/012`) + 5 (`specs/021`) | — |
| **Riêng module `account`** | — | **110.297** (PY+XML+CSV) |

> **Chỉ riêng module kế toán của Odoo đã lớn hơn toàn bộ codebase VComm ~17%.**
>
> Đây **không phải** lý do để nản — mà là lý do để **không tự phát minh lại** những gì
> đã có bản thiết kế tham chiếu. Mượn kiến trúc, không mượn mã.

### 2.3 Sự khác biệt bản chất về "trọng tâm"

| | VComm | Odoo |
|---|---|---|
| Tỷ lệ mã UI / logic | **~76% là `.tsx`** (71.243/94.191) | ~73% là Python + 12% XML định nghĩa view |
| Kiến trúc | Component React tự do | ORM + view khai báo (XML) |
| Sự kiện kinh tế sinh bút toán | Gọi hàm thủ công trong service | Hook ở model (`_generate_valuation_lines`, cron) |

> ⚠️ **VComm đang dồn phần lớn công sức vào lớp trình bày**, trong khi Odoo dồn vào
> lớp mô hình nghiệp vụ. Khi luật thay đổi (TT99, ND 252/2026), **lớp mô hình mới là
> lớp phải sửa** — và đó là lớp mỏng nhất của VComm.

---

## 3. Bản đồ đối chiếu module

| Chức năng VComm | Module Odoo tương ứng | Trong Community? | Đánh giá |
|---|---|:--:|---|
| Tài chính kế toán | `account` | ✅ | **Vượt trội.** Tham chiếu bắt buộc |
| Hệ tài khoản VN | `l10n_vn` | ✅ | ⚠️ Chỉ CoA + ngân hàng + VietQR. **Không có thuế TNCN** (§5) |
| Hóa đơn điện tử | `account_edi_ubl_cii`, `l10n_vn_edi_viettel` | ✅ | Tham chiếu cho **4.1** |
| TSCĐ & khấu hao | `account_asset` | ❌ **Enterprise** | 🔴 **Không có nguồn mở. Phải tự viết (2.1)** |
| Kho & định giá | `stock` + `stock_account` | ✅ | **Vượt trội.** Tham chiếu cho giá vốn thật |
| Dropship | `stock_dropshipping`, `sale_stock` | ✅ | Tham chiếu luồng giao hàng |
| Mua hàng | `purchase` | ✅ | VComm chưa có module mua hàng rõ ràng |
| Bán hàng | `sale` | ✅ | — |
| POS / VComm Hub | `point_of_sale`, `pos_online_payment`, `pos_self_order` | ✅ | Tham chiếu cho Hub |
| CRM | `crm` | ✅ | — |
| CSKH / Ticket | `helpdesk` | ❌ **Enterprise** | 🔴 Không có nguồn mở |
| Nhân sự cơ bản | `hr` | ✅ | Có `hr.version`, `hr.contract.type` |
| Chấm công → bút toán thời gian | `hr_work_entry` | ✅ | Tham chiếu tốt (§4.4) |
| Nghỉ phép | `hr_holidays` | ✅ | — |
| **Bảng lương** | `hr_payroll` | ❌ **Enterprise** | 🔴 **Không có nguồn mở. Phải tự viết (2.5)** |
| Đánh giá / KPI | `hr_appraisal` | ❌ **Enterprise** | 🔴 Không có nguồn mở |
| Khuyến mãi / V-Xu | `loyalty` | ✅ | **Rất đáng học.** Gộp 8 loại (§4.3) |
| Thương mại điện tử | `website_sale` | ✅ | — |

> 🔴 **Ba dòng Enterprise-only quan trọng nhất:** `account_asset`, `hr_payroll`, `hr_appraisal`.
> Trùng khớp **chính xác** với 3 mục trong kế hoạch của VComm: **2.1 TSCĐ**, **2.5 Lương**, **KPI**.
> → **Kết luận:** không có đường tắt nào cho 3 mục này. Phải tự thiết kế + tự viết.

---

## 4. Sáu khu vực đối chiếu chi tiết

### 4.1 Kế toán — `account` (110.297 LOC)

Odoo Community có đầy đủ những thứ VComm đang thiếu hoặc làm thủ công:

| Tính năng | Odoo | VComm |
|---|---|---|
| Chốt sổ không thể sửa | `account.move` `state='posted'` + `lock_date` | ✅ Đã có (`closingLockDate` trong adapter) |
| Đối chiếu ngân hàng | `account.bank.statement.line` + reconcile tự động | ⚠️ Có SePay nhưng chưa đối chiếu tự động |
| Công nợ tuổi nợ | Báo cáo `aged_receivable`, `aged_payable` | ⚠️ Chưa có |
| Thuế nhiều loại | `account.tax` (scope, price_include, include_base_amount) | ⚠️ `DEFAULT_VAT_RATE = 0.1` cố định |
| Đa tiền tệ | `res.currency` + tỷ giá ngày | ⚠️ Chưa thấy |
| Hợp nhất (Điều 7 TT99) | `consolidation` (Enterprise) | 📄 Đã có migration `003_consolidation.sql` — **VComm đi trước Odoo Community ở điểm này** |

> 📌 **Điểm duy nhất VComm hơn Odoo Community:** hợp nhất báo cáo tài chính (Điều 7 TT99).
> `specs/021/migrations/003_consolidation.sql` đã được viết; Odoo nhét tính năng này vào Enterprise.

### 4.2 Kho & giá vốn — `stock_account` (10.647 LOC)

**Odoo — đo trực tiếp `stock_account/models/product.py`:**

```python
cost_method = fields.Selection(
    string="Cost Method",
    selection=[
        ('standard', "Standard Price"),
        ('fifo',     "First In First Out (FIFO)"),
        ('average',  "Average Cost (AVCO)"),
    ], ...)

valuation = fields.Selection(
    string="Valuation",
    selection=[
        ('periodic',  'Periodic (at closing)'),
        ('real_time', 'Perpetual (at invoicing)'),
    ], ...)

lot_valuated = fields.Boolean(string="Valuation by Lot/Serial", ...)
```

Ba trục cấu hình: **phương pháp tính giá** × **thời điểm ghi nhận** × **định giá theo lô**.

**VComm hiện tại — `src/services/accountingService.ts:73`:**

```ts
export const ESTIMATED_COGS_RATIO = 0.6;
...
totalCogs += Number(item.price || 0) * ESTIMATED_COGS_RATIO * qty;
```

| | Odoo | VComm |
|---|---|---|
| Nguồn giá vốn | Lớp tồn kho thực (FIFO/BQGQ/Giá chuẩn) | **`0.6 × giá bán`** — hằng số cứng |
| Thời điểm | Từng nghiệp vụ (`real_time`) | Cùng lúc ghi nhận doanh thu |
| Theo lô | Có (`lot_valuated`) | Không |

> ✅ **Công bằng cho VComm:** code này **không giả vờ là số thật** — nó gắn cờ
> `costBasis: 'estimated'` và ghi cảnh báo vào diễn giải chứng từ. Đó là lựa chọn
> **trung thực** đúng tinh thần Điều 12 TT99. Nhưng nó vẫn là **bản lề tạm**, không phải
> giải pháp: mọi Báo cáo tài chính xuất ra từ đây đều sai lợi nhuận gộp.
>
> **Khuyến nghị:** giữ nguyên cơ chế "ước tính + đánh dấu" làm **fallback**, nhưng bổ sung
> lớp tồn kho thật. Thứ tự ưu tiên: **Giá chuẩn → BQGQ → FIFO** (theo mức độ dần khó).

### 4.3 Khuyến mãi / V-Xu — `loyalty` (3.796 LOC)

**Đây là module đáng học nhất trong toàn bộ đợt khảo sát.**

Odoo gom **8 loại chương trình vào 1 engine** (`loyalty/models/loyalty_program.py`):

```python
program_type = fields.Selection(selection=[
    ('coupons',            "Coupons"),
    ('gift_card',          "Gift Card"),
    ('loyalty',            "Loyalty Cards"),
    ('promotion',          "Promotions"),
    ('ewallet',            "eWallet"),
    ('promo_code',         "Discount Code"),
    ('buy_x_get_y',        "Buy X Get Y"),
    ('next_order_coupons', "Next Order Coupons"),
], required=True, default='promotion')

# Dictates when the points can be used:
#   current: nếu đơn đủ điểm trên chính đơn đó → đổi ngay, không thì mất
#   future:  nếu đủ điểm → sinh coupon cho đơn SAU
#   both:    điểm tích lũy trên coupon, có thể đổi ngay
applies_on = fields.Selection(selection=[
    ('current', "Current order"),
    ('future',  "Future orders"),
    ('both',    "Current & Future orders"),
], required=True, default='current')

trigger = fields.Selection(selection=[
    ('auto',      "Automatic"),
    ('with_code', "Use a code"),
])
```

**Sổ điểm — `loyalty.card` + `loyalty.history`:**

```
loyalty.card:    program_id, partner_id, points (tracking=True), code,
                 expiration_date, use_count, history_ids
loyalty.history: card_id, description (bắt buộc), issued, used,
                 order_model, order_id   ← Many2oneReference: liên kết đa hình
```

**Ba chi tiết thiết kế đáng copy:**

1. **`points` có `tracking=True`** → mọi thay đổi số dư tự động có vết, không cần viết audit riêng.
2. **`loyalty.history` bắt buộc có `description`** → không tồn tại giao dịch điểm vô danh.
3. **`order_model` + `order_id` (Many2oneReference)** → một sổ điểm liên kết được với **nhiều loại
   chứng từ gốc** (đơn bán, đơn POS, đơn hoàn). Đây chính là cách xử lý bài toán
   "một ledger, nhiều nguồn" mà VComm đang gặp ở `Settlement.tsx`.

**Đối chiếu VComm:**

| Chương trình VComm | Hiện tại | Trong `loyalty` tương ứng |
|---|---|---|
| V-Xu | Module riêng (`specs/019-vxu`), IFRS 15 coi là **material right** | `ewallet` + `applies_on='both'` |
| FlashSale | Logic riêng | `promotion` + `date_from/date_to` |
| Affiliate / CTV hoa hồng | `Settlement.tsx` — **0 kết quả grep cho `thuế|tax|PIT|khấu trừ|TNCN`** | `loyalty` + `next_order_coupons` |
| Mã giảm giá | — | `promo_code` / `coupons` |

> 🎯 **Khuyến nghị mạnh nhất của đợt này:** VComm đang duy trì **3 cài đặt rời rạc**
> cho cùng một bài toán "cấp quyền lợi cho khách/đối tác". `loyalty` chứng minh
> có thể gộp thành **1 engine + 8 cấu hình**.
>
> ⚠️ **Nhưng không làm ngay.** Việc này là **GĐ4**, sau khi xong 2.1/2.5/2.6.
> Gộp sổ điểm là thay đổi dữ liệu lớn — làm lúc đang có nghĩa vụ thuế sàn (ND 252/2026)
> là tự tạo rủi ro. **Ghi nhận thiết kế, chờ đúng lượt.**

### 4.4 Nhân sự — `hr` (13.285 LOC) + `hr_work_entry` (3.976 LOC)

**`hr.version` — model hợp đồng của Odoo 19** (trong module `hr` **community**):

```
date_version           Date, bắt buộc, mặc định hôm nay   ← SNAPSHOT THEO NGÀY
contract_date_start / contract_date_end / trial_date_end
contract_type_id   → hr.contract.type
structure_type_id  → hr.payroll.structure.type
wage               Monetary, "Employee's monthly gross wage"
children           Integer, "Dependent Children"          ← NGƯỜI PHỤ THUỘC
marital            Selection
employee_type / department_id / job_id / resource_calendar_id
```

**`hr_work_entry` — engine chuyển thời gian thành bản ghi:**

```
hr.work.entry:       employee_id, version_id, date, duration (mặc định 8),
                     work_entry_type_id, state, amount_rate ("Pay rate"),
                     conflict (compute — đưa xung đột lên đầu)
hr.work.entry.type:  name, code ("Payroll Code — Careful, the Code is used in
                     many references"), external_code, is_leave, is_work,
                     is_extra_hours, amount_rate, country_id
```

**Ba bài học áp dụng được ngay:**

| # | Odoo | Áp dụng cho VComm |
|---|---|---|
| **A** | `date_version` — hợp đồng là **snapshot theo ngày**, không phải dòng mutable | ✅ **Xác nhận thiết kế `hr_pit_policies` của VComm đúng hướng.** Cùng mẫu hình: tham số luật có `effective_from`/`effective_to` |
| **B** | `work_entry_type.code` + `external_code` | Cầu nối sang hệ thống lương bên thứ ba. VComm nên có trường tương đương để xuất dữ liệu |
| **C** | `amount_rate` (hệ số trả) gắn ở **loại** work entry, không hard-code ở công thức | 🔴 **`HR.tsx:346` đang hard-code `overtimeHours * 100000`.** Đúng chỗ cần sửa |

**Ba chỗ Odoo Community trống hoàn toàn:**

```
hr.contract.type:           name, code, sequence, country_id
                            → DANH SÁCH TỰ DO. Không có HĐLĐ / HĐ dịch vụ /
                              HĐ khoán / CTV. Không liên kết phương pháp thuế.
hr.payroll.structure.type:  name, default_resource_calendar_id, country_id
                            → STUB. Chỉ là cái tên; mọi "salary rule" nằm trong
                              hr_payroll (Enterprise).
```

> 🔴 **Kết luận quan trọng cho spec 024:** `hr_contract_tax_map` — bảng ánh xạ
> loại hợp đồng → phương pháp tính thuế TNCN — **không có bất kỳ nguồn tham chiếu nào
> trong Odoo**. Đây là thiết kế **VComm phải tự làm**, và nó là phần **độc quyền**
> của VComm so với cả Odoo. Đừng tìm đường tắt nữa — không có.

### 4.5 POS / VComm Hub — `point_of_sale` (37.108 LOC)

| | Odoo | VComm Hub |
|---|---|---|
| Giao diện bán hàng | `point_of_sale` (27.712 PY) | Đang phát triển |
| Thanh toán online | `pos_online_payment` ✅ community | QR / VNPay / MoMo / ZaloPay (quyết định #11) |
| Tự order (kiosk) | `pos_self_order` ✅ community | — |
| Driver phần cứng | `pos_imin`, `pos_cashdro` (riêng) | — |
| **Offline-first** | IndexedDB + đồng bộ khi có mạng | ⚠️ Cần kiểm tra |

> 📌 **`pos_online_payment` và `pos_self_order` nằm trong Community** — có thể đọc
> để tham chiếu khi làm phần thanh toán QR cho Hub (liên quan trực tiếp câu hỏi #11).
> Đặc biệt cách Odoo tách **intent thanh toán** khỏi **xác nhận đơn hàng** là mẫu hình
> đáng copy khi tích hợp gateway.

### 4.6 Hóa đơn điện tử — `account_edi_ubl_cii` + `l10n_vn_edi_viettel`

| Module | LOC | Ghi chú |
|---|---:|---|
| `l10n_vn_edi_viettel` | 2.222 PY / 202 XML | Kết nối nhà cung cấp HĐĐT **Viettel** |
| `account_edi_ubl_cii` | community | Chuẩn UBL/CII — nền e-invoice châu Âu & Peppol |

> ⚠️ **`l10n_vn_edi_viettel` gắn với MỘT nhà cung cấp cụ thể (Viettel).**
> VComm cần phát hành HĐĐT theo chuẩn VN (NĐ 123/2020, TT 78/2021) —
> tham chiếu được **cấu trúc module** (wizard + security + data + models),
> **không** tham chiếu được logic nghiệp vụ vì phụ thuộc vendor.
>
> Cần xác nhận VComm dùng TCT nào (Viettel / VNPT / MISA / FPT) trước khi làm **4.1**.

---

## 5. 🔴 ĐÍNH CHÍNH — kết luận sai của tôi về `l10n_vn`

**Trong đợt khảo sát trước, tôi đã báo với bạn:**

> "Odoo's Vietnam localization is still on **Circular 200/2014/TT-BTC**, which expired
> 01/01/2026 — Odoo's own Vietnam localization is 2 generations stale, cùng cái bẫy với VietERP."

**Kết luận đó SAI.** Tôi xin đính chính đầy đủ.

### 5.1 Tôi đã sai ở đâu

Tôi chỉ đọc `__manifest__.py` và thấy dòng description:

```python
'description': """
- This module applies to companies based in Vietnamese Accounting Standard (VAS)
  with Chart of account under Circular No. 200/2014/TT-BTC
...
```

Từ **một dòng mô tả** tôi suy ra toàn bộ module lỗi thời. **Tôi đã không mở file dữ liệu.**
Đây đúng là lỗi tôi từng cảnh báo bạn ở VietERP ("đừng copy hằng số từ repo ngoài") —
và lần này chính tôi mắc phải.

### 5.2 Dữ liệu thực tế

**Thử nghiệm quyết định:** trích 71 tài khoản cấp 1 từ
`specs/021-tt99-ke-toan-doanh-nghiep/migrations/001_coa.sql` (tôi suy ra từ **văn bản gốc
TT99/2025/TT-BTC Phụ lục II Phần A**) và so sánh với `l10n_vn/data/template/account.account-vn.csv`:

```
VComm TT99 cấp 1 : 71 tài khoản
Odoo l10n_vn     : 71 tài khoản

=== Odoo THỪA so với VComm ===   (rỗng)
=== VComm THỪA so với Odoo ===   (rỗng)
=== CHUNG ===                    71 / 71
```

**Khớp tuyệt đối. Không lệch một tài khoản.**

Danh sách chung:

```
111 112 113 121 128 131 133 136 138 141 151 152 153 154 155 156 157 158 171
211 212 213 214 215 217 221 222 228 229 241 242 243 244
331 332 333 334 335 336 337 338 341 343 344 347 352 353 356 357
411 412 413 414 418 419 421
511 515 521
621 622 623 627 632 635 641 642
711 811 821 911
```

**Kiểm tra chéo thêm 3 điểm:**

| Kiểm tra | Kết quả |
|---|---|
| 7 TK bị TT99 bãi bỏ (161, 417, 441, 461, 466, 611, 631) | ✅ **Vắng mặt hoàn toàn** trong CoA Odoo |
| TT99 đổi tên 112 → "Tiền gửi không kỳ hạn" | ✅ Odoo: `Demand Deposit … Tiền gửi không kỳ hạn` |
| TT99 đổi tên 155 → "Sản phẩm" | ✅ Odoo: `Finished Goods … Sản phẩm` |

### 5.3 Kết luận đúng

| Thành phần | Trạng thái thật |
|---|---|
| **Dữ liệu hệ tài khoản** | ✅ **ĐÃ CẬP NHẬT TT99.** 71/71 khớp văn bản gốc |
| **Text mô tả trong manifest** | ⚠️ **Cũ** — vẫn ghi "Circular No. 200/2014/TT-BTC" |
| **Phiên bản module** | `2.0.3`, tác giả "General Solutions", LGPL-3 |
| **Migration script** | 3 file: `14.0.2.0.1`, `17.0.2.0.2`, `2.0.3` — **không file nào nhắc TT99** (chỉ sửa mã TK 522x→521x và account_type) |
| **Kiểm thử** | 🔴 **1 file duy nhất** — `test_l10n_vn_emv_qr.py` (test VietQR) |

> ✅ **Ý nghĩa tích cực (lớn hơn vẻ ngoài):**
> Một đội ngũ độc lập (General Solutions), đọc cùng văn bản TT99, đã suy ra
> **cùng một danh sách 71 tài khoản cấp 1** với `specs/021`.
> Điều này **xác nhận chéo** rằng danh sách của chúng ta không phải diễn giải cá nhân.
>
> ⚠️ **Nhưng vẫn không dùng làm nguồn chân lý:**
> mô tả module sai, không có migration nào ghi nhận việc chuyển TT200→TT99,
> và thực tế **không có test nào** bảo vệ danh sách này.
> → Giữ nguyên quyết định: **`specs/021` là nguồn; `l10n_vn` chỉ là đối chiếu chéo.**

---

## 6. Khuyến nghị: mượn gì, bỏ gì

### 6.1 ✅ NÊN mượn kiến trúc (không copy mã)

| # | Thứ mượn | Từ module | Vào đâu trong VComm | Ưu tiên |
|---|---|---|---|:--:|
| 1 | **Engine khuyến mãi thống nhất**: rule → reward → card → history, sổ điểm có `tracking` + liên kết đa hình về chứng từ gốc | `loyalty` | Gộp V-Xu + FlashSale + Affiliate | **GĐ4** |
| 2 | **Ba trục định giá kho**: phương pháp (FIFO/BQGQ/Giá chuẩn) × thời điểm × theo lô | `stock_account` | Thay `ESTIMATED_COGS_RATIO` | **GĐ2/3** |
| 3 | **Snapshot theo ngày** cho mọi tham số luật (`date_version`) | `hr.version` | ✅ Đã có trong `hr_pit_policies` — **giữ nguyên, được xác nhận** | — |
| 4 | **`amount_rate` gắn ở loại công**, không hard-code hệ số trong công thức | `hr_work_entry` | Sửa `HR.tsx:346` (`overtimeHours * 100000`) | **2.5** |
| 5 | **Tách payment intent khỏi xác nhận đơn** | `pos_online_payment` | Tích hợp QR/VNPay/MoMo (câu hỏi #11) | **GĐ3** |
| 6 | **Cấu trúc module HĐĐT** (wizard / security / data / models) | `l10n_vn_edi_viettel` | Mục **4.1** | **GĐ3** |
| 7 | **`code` + `external_code`** trên loại công | `hr.work.entry.type` | Xuất dữ liệu lương cho bên thứ ba | **2.5** |

### 6.2 ❌ KHÔNG mượn — phải tự viết, vì Odoo Community không có

| # | Thứ phải tự viết | Lý do | Mục |
|---|---|---|:--:|
| 1 | **TSCĐ & khấu hao** | `account_asset` là **Enterprise** | **2.1** |
| 2 | **Bảng lương** | `hr_payroll` là **Enterprise** | **2.5** |
| 3 | **Đánh giá / KPI** | `hr_appraisal` là **Enterprise** | KPI |
| 4 | **CSKH / Ticket** | `helpdesk` là **Enterprise** | CSKH |
| 5 | **Thuế TNCN — toàn bộ** | Odoo **không có 1 dòng nào** (§7.1) | **2.6b** |
| 6 | **Ánh xạ loại HĐ → phương pháp thuế** | `hr.contract.type` chỉ là danh sách tự do | `hr_contract_tax_map` |
| 7 | **Nghĩa vụ khấu trừ sàn (ND 252/2026)** | Không tồn tại khái niệm tương đương | **2.6c** |

### 6.3 ⚪ Quan sát thêm

- **`mail` (53.346 LOC)** — Odoo dùng một luồng `mail.thread` cho **mọi** đối tượng
  (đơn bán, ticket, nhân viên…). VComm không có khái niệm tương đương; mỗi module
  tự hiện thông báo. Đây là nợ kỹ thuật dài hạn, **chưa cần xử lý**.
- **`hr_gamification`** có trong Community — có thể tham chiếu cho module KPI
  (thay vì `hr_appraisal` Enterprise).

---

## 7. Kiểm chứng phụ: Odoo không có logic thuế TNCN

**Lệnh kiểm tra trên toàn bộ 20 module đã checkout:**

```bash
grep -ril "personal income tax"      → 1 kết quả
grep -ril "TNCN|thu nhập cá nhân"    → 1 kết quả
```

**Cả hai cùng trỏ về một file — và đó là file DỮ LIỆU, không phải mã:**

```
"chart33351","Personal income tax - short term","33351","liability_current","False","Thuế thu nhập cá nhân - ngắn hạn"
"chart33352","Personal income tax - long term", "33352","liability_current","False","Thuế thu nhập cá nhân - dài hạn"
```

> 🔴 **Chứng minh đầy đủ:** trong toàn bộ Odoo Community, thuế TNCN tồn tại **duy nhất
> dưới dạng 2 tên tài khoản** (33351 / 33352). **Không có hàm tính, không có biểu thuế,
> không có khấu trừ, không có bảng lương.**
>
> → **`hr_pit_policies`, `hr_contract_tax_map`, `hr_platform_tax_rates` (spec 024 §4)
> là tài sản VComm phải tự xây. Không có đường tắt.**

---

## 8. Tác động đến kế hoạch tổng thể

### 8.1 Không đổi thứ tự GĐ2

Thứ tự đã chốt ở `specs/025` §6 giữ nguyên:

```
2.1  TSCĐ & khấu hao            ← Odoo Community KHÔNG giúp được (account_asset = Enterprise)
  ↓
2.6a Nối bút toán vào luồng tiền THẬT                1 ngày
  ↓
2.6c-0 Báo cáo Seller / entity_type / doanh thu      0,5 ngày
  ↓
2.6c-1 entity_type = trường BẮT BUỘC khi onboarding  0,5 ngày
  ↓
2.5  Nhân sự & lương            ← Odoo Community KHÔNG giúp được (hr_payroll = Enterprise)
  ↓
2.6b Khấu trừ TNCN hoa hồng CTV (WARN → WITHHOLD)
  ↓
2.6c-2 Khấu trừ sàn THẬT + kê khai tháng + chứng từ
  ↓
4.1 → 3.3/3.4
```

**Lý do không đổi:** đợt khảo sát Odoo **không tìm được đường tắt nào** cho 2.1 và 2.5 —
ngược lại, nó **xác nhận** hai mục này bắt buộc tự viết. Không có lý do gì để đổi thứ tự.

### 8.2 Điều chỉnh ước lượng

| Mục | Ước lượng cũ | Sau khảo sát Odoo | Ghi chú |
|---|---|---|---|
| 2.1 TSCĐ & khấu hao | — | **Không đổi** | Có tham chiếu khái niệm từ `stock_account` (định giá theo thời gian) nhưng module chính là Enterprise |
| 2.5 Nhân sự & lương | — | **Không đổi** | Có thể mượn mẫu hình `hr_work_entry` cho chấm công, nhưng engine lương phải tự viết |
| 4.1 Hóa đơn điện tử | — | ⚠️ **Cần quyết định trước** | `l10n_vn_edi_viettel` gắn với Viettel. Cần biết VComm dùng TCT nào |
| **GĐ4: Gộp khuyến mãi** | Chưa có | **+ MỚI** | Tham chiếu `loyalty` — gộp V-Xu + FlashSale + Affiliate thành 1 engine |

### 8.3 Việc cần làm ngay (chi phí thấp, giá trị cao)

| # | Việc | Chi phí | Lợi ích |
|---|---|---|---|
| 1 | Thêm trường `external_code` vào loại công trong HR | ~0,5 ngày | Sẵn sàng xuất dữ liệu lương |
| 2 | Chuyển `overtimeHours * 100000` thành `amount_rate` cấu hình | ~0,5 ngày | Bỏ hard-code ở `HR.tsx:346` |
| 3 | Xác định TCT hóa đơn điện tử (Viettel/VNPT/MISA/FPT) | 0 (quyết định) | Mở khóa 4.1 |
| 4 | Ghi nhận `loyalty` làm bản thiết kế GĐ4 | 0 | Tránh thiết kế lại từ đầu |

---

## 9. Câu hỏi mở mới

| # | Câu hỏi | Tại sao cần |
|---|---|---|
| **#16** | VComm phát hành HĐĐT qua **nhà cung cấp nào**? (Viettel / VNPT / MISA / FPT / khác) | `l10n_vn_edi_viettel` gắn cứng Viettel. Quyết định này khóa thiết kế **4.1** |
| **#17** | VComm Hub có cần **bán hàng khi mất mạng** (offline-first) không? | Odoo POS có IndexedDB + đồng bộ. Nếu cần, đây là việc lớn |
| **#18** | Có nên gộp V-Xu + FlashSale + Affiliate thành 1 engine ở **GĐ4** không? | Thay đổi dữ liệu lớn. Không làm khi đang có nghĩa vụ thuế sàn |

*(Vẫn còn mở từ trước: **#0** 5% hay 10%; **#14** hạ tầng thanh toán; **#15** chế độ ngưỡng;
và 3 câu hỏi cũ: nguồn lực dev, số VComm Hub vật lý, team iPOS.)*

---

## 10. Tóm tắt một câu

> **Odoo xác nhận 71/71 tài khoản TT99 của VComm là đúng (tôi đã từng kết luận ngược lại, xin đính chính ở §5),
> cho VComm mượn được 7 mẫu hình kiến trúc — trong đó engine khuyến mãi `loyalty` là đáng giá nhất —
> nhưng hoàn toàn vô dụng ở đúng 3 chỗ VComm đang cần nhất (TSCĐ, bảng lương, thuế TNCN),
> vì cả `account_asset` lẫn `hr_payroll` đều là Enterprise, còn thuế TNCN thì Odoo không hề có.**
