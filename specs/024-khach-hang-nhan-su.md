# 024 — Đối chiếu & nâng cấp nhóm module "Khách hàng & Nhân sự"

> **Phạm vi:** Sellers, Customers (CRM), CustomerService (CSKH), Sales, HR, EasyHRM, OrgStructure, Performance (KPI), EmployeeDetailModal
> **Ngày:** 02/09/2026  ·  **Trạng thái:** Chờ duyệt
> **Bổ sung cho:** [023 — Đối chiếu module & kế hoạch tổng thể](./023-doi-chieu-module-ke-hoach-tong-the.md)
> **Ràng buộc đã chốt (quyết định 1–6 của Anh, spec 023 §7):**
> làm theo thứ tự GĐ1 → 2.1 → 4.1 → 3.3/3.4 · TSCĐ làm trước GĐ3 · **chuẩn TT99 giữ nguyên, mọi tham chiếu kế toán từ VietERP phải kiểm tra lại** · không đuổi theo số app · sửa test treo trước khi bật CI · bổ sung E2E luồng tiền

---

## 1. TL;DR — 10 phát hiện quyết định

| # | Phát hiện | Mức độ |
|---|---|---|
| **1** | **62% mã nguồn nhóm này không có nguồn chân lý trên server.** 5.013 dòng (EasyHRM, EmployeeDetailModal, OrgStructure, Performance, Sales) không ghi bất kỳ đâu; thêm 3.636 dòng HR lưu vào `localStorage['erp_employees']` | 🔴 Chặn |
| **2** | **Công thức lương hiện tại sai luật.** `HR.tsx:346`: `pitAmount = gross * 0.05` (thuế suất phẳng trên tổng thu nhập) và `insuranceAmount = baseSalary * 0.1` (thực tế 10,5%). Không có giảm trừ gia cảnh, không có người phụ thuộc, không có biểu lũy tiến | 🔴 Rủi ro pháp lý |
| **3** | **Chi phí nhân công hoàn toàn vô hình với kế toán.** Không có bút toán lương nào vào `journal_entries`. TT99 seed có `334` nhưng **thiếu `3382`, `3383`, `3384`, `3386`** | 🔴 Sai BCTC |
| **4** | **VietERP có engine lương VN thật** (`sprint3_payroll_vn_engine`, `lib/compliance/tax`, `lib/compliance/insurance`, sinh mẫu D02/D03/C12) — đây là nhóm duy nhất họ thắng VComm rõ ràng | 🟡 Cơ hội |
| **5** | **Nhưng hằng số của VietERP đã lỗi thời 2 thế hệ** (niên hạn 2024, trong repo cập nhật 01/2026): biểu thuế 7 bậc cũ thay vì 5 bậc 2026; giảm trừ 11tr/4,4tr thay vì 15,5tr/6,2tr; trần BHXH 36tr thay vì 50,6tr. **Nếu copy nguyên → sai thuế** | 🟡 Bẫy |
| **6** | **Thuế TNCN có 3 phương pháp theo loại hợp đồng**, không phải một công thức. HĐLĐ ≥3 tháng → biểu lũy tiến. Dịch vụ/khoán/CTV/HĐLĐ <3 tháng → tỷ lệ phẳng trên tổng thu nhập (ngưỡng 5tr/lần). Không cư trú → tỷ lệ phẳng. Mọi tham số **cấu hình theo thời gian + theo luật** | 🟡 Yêu cầu thiết kế |
| **7** | **VComm dùng cộng tác viên thật — và đang chi trả hoa hồng không khấu trừ thuế.** `Settlement.tsx:104` duyệt chi hoa hồng CTV/KOL → `postWithdrawalJournalEntries()` chỉ ghi **Nợ 3388 / Có 1121**, **không có dòng Có 3335**. Toàn bộ file 832 dòng có **0** từ khóa `thuế/TNCN/khấu trừ`. TK `3335` có trong seed COA nhưng **không một dòng code nào dùng đến** | 🔴 **Đang sai, tiền đang chạy** |
| **8** | **Luồng rút tiền thật thì không ghi sổ, luồng MOCK thì có.** `approveWithdrawal` → `confirmPendingApproval(kind='withdrawal')` (`Settlement.tsx:354`) chỉ `updateDoc(status='processed')` + ghi sổ phụ — **không sinh bút toán nào**. Ngược lại, 2 luồng MOCK (`approveAffiliateSettlement`, `approvePickupSettlement`) lại có bút toán | 🔴 **Sai BCTC** |
| **9** | ✅ **VComm thuộc diện "nền tảng có chức năng thanh toán" — 5/5 tiêu chí, đối chiếu nguyên văn Điều 3.1.** Anh trả lời #11 là "dùng QR/VNPay/ZaloPay/MoMo, không cần thiết lập chức năng thanh toán mới" — nhưng chính những thứ Anh liệt kê **được văn bản nêu tên**: ví điện tử · thẻ ngân hàng · chuyển khoản · hệ thống chuyển khoản tích hợp · **COD**. Dùng cổng bên thứ ba **không đưa VComm ra khỏi phạm vi**. Nghĩa vụ: khấu trừ **GTGT 1% + TNCN 0,5%** trên từng giao dịch, **đã hiệu lực 01/7/2025**, và VComm **không khấu trừ gì** | 🔴 **Đang vi phạm 14 tháng** |
| **10** | **Ba chế độ khấu trừ khác nhau, từng bị gộp nhầm thành một.** Điều 50.2 (CTV/KOL/khoán: 1 loại thuế, theo lần chi) · **NĐ 252/2026** (hộ/cá nhân bán trên sàn: **2 loại thuế, theo từng giao dịch**) · TT40/2021 (hộ KD ngoài sàn). Nối vào **hai nơi khác nhau**: luồng rút tiền vs `postOrderJournalEntries()`. Thêm bẫy **Điều 5.2.c**: không phân loại được hàng hóa/dịch vụ → áp **mức cao nhất** (GTGT 5%, TNCN 2%), **không phải mức thấp nhất** | 🔴 Bẫy thiết kế |

> **Kết luận:** Đây là nhóm module duy nhất trong toàn bộ đối chiếu mà VietERP có kiến trúc đúng và VComm **không có gì**. Cũng là nhóm duy nhất mà việc "học theo VietERP" cần **giữ kiến trúc, vứt hằng số**.
>
> ⚠️ **Phát hiện 7 & 8 thay đổi tính chất của kế hoạch này.** Không còn là "xây module HR cho tương lai" —
> **tiền đang chảy qua đường sai ngay hôm nay.** Phần 2.6 vì vậy được tách ra khỏi 2.2–2.5
> thành một hạng mục độc lập, và nửa đầu của nó (bút toán rút tiền) **không bị chặn bởi lõi HR**,
> có thể làm ngay sau 2.1. Xem §2.5 và §6.2.
>
> **Sửa đổi thiết kế (theo góp ý của Anh, 02/09/2026):** engine thuế phải là
> **đa phương pháp + đa phiên bản luật**, không phải một bảng tham số duy nhất.
> Lương cơ sở và lương tối thiểu vùng là **hai đầu vào cơ sở** — mọi trần và ngưỡng
> khác **dẫn xuất** từ chúng. Xem §4.1 và §4.6.
>
> **Sửa đổi lần 2 (chiều 02/09/2026):** khấu trừ tại nguồn **không phải quyết định code**.
> Anh chốt câu hỏi #8 là "cấu hình riêng" và #9 là "bổ sung vào cấu hình thuế" →
> thiết kế thành bảng thứ 5 (`hr_withholding_config`) với **công tắc 3 trạng thái**
> `WITHHOLD` / `WARN` / `OFF` theo loại đối tác. Trạng thái `WARN` là điểm then chốt:
> **tiền vẫn chảy nhưng nghĩa vụ được ghi nhận**, nên Anh không phải chọn giữa
> "dừng chi ngay" và "chấp nhận rủi ro". Xem §4.6 ⑤ và §4.9.
>
> **Sửa đổi lần 3 (02/09/2026):** Anh chốt #10 là **"cấu hình theo cả cá nhân / pháp nhân"**.
> Trục này hóa ra đúng hơn tôi nghĩ: nó không chỉ giải quyết Điểm nhận, mà còn là
> **trục quyết định của chính nghĩa vụ sàn TMĐT** — vì thuế TNCN chỉ đánh vào **cá nhân**.
> Cấu hình vì vậy thêm chiều `entity_type`, và phát hiện ra **NĐ 252/2026/NĐ-CP**
> khiến hàng `SELLER` có thể **không được phép để `OFF`**. Xem §4.9.6 và §4.10.
>
> **Sửa đổi lần 4 (02/09/2026) — đã đối chiếu nguyên văn:** Anh trả lời #11 · #12 · #13.
> - **#11** → **CÓ**, và lập luận "chỉ dùng cổng bên thứ ba" **sẽ không đứng được**:
>   Điều 3.1 liệt kê chính xác QR/ví/thẻ/COD là *chức năng thanh toán*. §4.10.1
> - **#12** → **NĐ 117/2025 đã bị thay thế bởi NĐ 252/2026** (ký 30/6/2026, hiệu lực 01/7/2026).
>   Phân tích dưới đây lấy từ NĐ 117/2025 — phải rà lại số Điều và tỷ lệ theo NĐ 252/2026 trước khi seed. §4.10
> - **#13** → Anh chốt: `entity_type` sẽ được **duyệt khi vận hành** → trở thành điều kiện
>   tiên quyết của luồng duyệt Seller, không phải nhập sau. §4.10.4
>
> ⚠️ **Hệ quả lớn nhất:** nghĩa vụ này **không nằm trong luồng rút tiền** mà nằm ở
> **từng giao dịch** → 2.6 không thể ôm hết. Cần tách riêng **2.7 Nghĩa vụ sàn TMĐT**
> (ước lượng 5–8 ngày, chưa gồm 3 mẫu tờ khai). Và nó có thể phải làm **trước cả TSCĐ**.

---

## 2. Đo hiện trạng VComm — bằng chứng

### 2.1 Kích thước và mức độ kết nối dữ liệu

| Module | KB | Dòng | Nguồn dữ liệu | Đánh giá |
|---|---:|---:|---|---|
| **Customers** (CRM) | 112 | 2.175 | 27 lệnh Supabase · bảng `customers` đã đăng ký | ✅ Tốt nhất nhóm |
| **CustomerService** (CSKH) | 84 | 1.690 | 3 Supabase + 2 mảng MOCK | ⚠️ Bảng `support_tickets` đã đăng ký nhưng UI tự xài MOCK |
| **Sellers** | 60 | 1.337 | 2 `getDocs` + 1 MOCK + 1 Supabase | ⚠️ `sellers` đã đăng ký — nhưng **không gọi `sellerKycService`** |
| **HR** | 172 | 3.636 | **`localStorage['erp_employees']`** + `MOCK_EMPLOYEES` | ❌ Không có server |
| **EasyHRM** | 124 | 2.076 | **0 kết nối** | ❌ |
| **EmployeeDetailModal** | 96 | 1.733 | **0 kết nối** | ❌ |
| **OrgStructure** | 28 | 487 | **0 kết nối** | ❌ |
| **Performance** (KPI) | 16 | 306 | **0 kết nối** + `MOCK_EMPLOYEES` | ❌ |
| **Sales** | 20 | 411 | **0 kết nối, 0 service import** | ❌ Demo toàn phần |
| **TỔNG** | **712** | **13.851** | | |

- **5.013 dòng (36%)** không ghi vào đâu cả
- **8.649 dòng (62%)** không có nguồn chân lý trên server (tính cả HR-localStorage)
- Chỉ **Customers** (2.175 dòng, 16%) là có persistence thật

### 2.2 Sơ đồ nhóm

```
                    ┌───────────────── KHÁCH HÀNG ─────────────────┐
                    │                                              │
  Sellers ──┐      │  Customers ────► crmService (ORPHAN!)         │
  (sellers) │      │  (customers)     ├ calculateRfmScores          │
            │      │       │          ├ addLoyaltyPoints            │
  sellerKyc │      │       │          └ createSupportTicket         │
  Service   │      │       │                 ▲                      │
            │      │       │                 │ chỉ Orders.tsx gọi   │
            │      │  CustomerService        │                      │
            │      │  (support_tickets)      │                      │
            │      │       ▲ znsService      │                      │
            │      │       └─────────────────┘                      │
            │      │  Sales ──── ✂ KHÔNG CÓ GÌ ✂                    │
            │      └──────────────────────────────────────────────┘
            │
            └──► PIM.tsx (nơi duy nhất sellerKycService được dùng thật)
                                     │
                    ┌───────────── NHÂN SỰ ─────────────┐
                    │                                    │
  HR ──► localStorage['erp_employees'] ──► MOCK_EMPLOYEES│
   │         │                                          │
   │         └─ syncToSupabaseEmployees()  ← CHỈ 5 FIELD│
   │              upsert employees (bảng CHƯA đăng ký)  │
   │              department_id = 'Marketing' (string!) │
   │              lỗi chỉ console.error, không throw    │
   │                                                    │
   ├─ EasyHRM ───────── ✂ 0 kết nối ✂                   │
   ├─ EmployeeDetailModal ── ✂ 0 kết nối ✂              │
   ├─ OrgStructure ──────── ✂ 0 kết nối ✂               │
   └─ Performance (KPI) ─── ✂ 0 kết nối ✂               │
                                                        │
   ✂ KHÔNG CÓ BÚT TOÁN LƯƠNG NÀO VÀO SỔ CÁI ✂           │
                    └──────────────────────────────────┘
```

### 2.3 `crmService.ts` là mã mồ côi

`crmService.ts` (157 dòng) xuất 3 hàm nghiệp vụ: `calculateRfmScores`, `addLoyaltyPoints`, `createSupportTicket`.
Nhưng **`Customers.tsx` và `CustomerService.tsx` đều không import nó.** Nơi gọi duy nhất trong production code là `Orders.tsx:1120` qua dynamic import.

→ Hệ quả: RFM, điểm thành viên, SLA ticket chạy ở một chỗ (Orders) nhưng **không hiển thị ở chỗ người dùng tìm nó** (Customers, CSKH).

### 2.4 `Sales.tsx` là màn hình demo

411 dòng, **không import service nào, không đụng DB**. Pipeline bán hàng, cơ hội, hạn ngạch — tất cả là dữ liệu tĩnh viết tay trong file.

---

### 2.5 Kênh cộng tác viên / khoán việc — **CÓ**, và đây là nhóm `FLAT_ON_GROSS`

> Trả lời câu hỏi #6 của Anh: *"VComm có dùng cộng tác viên/khoán việc không? (rất có thể có)"*
> → **CÓ. Không phải khả năng — là một kênh kinh doanh đã có UI, có dữ liệu, có luồng chi trả.**

**Bằng chứng đo được** (`grep -rn "cộng tác viên\|CTV\|KOL\|khoán" src/ -i` → 66 dòng khớp):

| Vết tích | Ý nghĩa |
|---|---|
| `constants.ts:77` — `{ label: 'KOL/KOC & Affiliate', path: '/affiliate', description: 'Mạng lưới cộng tác viên và tiếp thị liên kết' }` | CTV là **mục menu cấp 1**, không phải tính năng phụ |
| `Affiliate.tsx` — `type: 'kol'`, `commissionEarned: 125.000.000 / 850.000.000 / 350.000.000` | Có đối tượng, có số tiền quy mô thật |
| `FlashSale.tsx:140` — `const [kolCommission, setKolCommission] = useState(5)` | Hoa hồng KOL là **biến số đầu vào của giá** (`netRevenue` trừ % khoán KOL) |
| `AnalyticsBI.tsx:825–830` — `Hiệu Quả Kênh CTV / Sellers`, `Tổng GMV CTV` | Kênh CTV được **đo lường riêng trong BI** |
| `Customers.tsx:989` — tag `#KOL / INFLUENCER` trên bản ghi khách hàng | CTV được quản lý như một **loại đối tượng** |
| `EmployeeDetailModal.tsx:464` — `<option value="contract">Cộng tác viên (Contractor)</option>` | Khái niệm "khoán việc" **đã có sẵn trong từ vựng UI** |
| `Settlement.tsx:105` — `confirm('Duyệt chi trả hoa hồng cho CTV này?')` | **Đang có luồng duyệt chi tiền thật** |

**Kết luận phân loại thuế:** CTV / KOL / Publisher / Đại lý / khoán việc → không ký HĐLĐ hoặc ký HĐ dịch vụ
→ rơi vào **`FLAT_ON_GROSS`** (NĐ 253/2026 Điều 50.2). Đây chính là nhóm mà thiết kế "một biểu thuế
cho tất cả" của bản nháp đầu sẽ tính **sai toàn bộ**.

#### 2.5.1 Lỗ hổng A — chi hoa hồng **không khấu trừ đồng nào**

`grep -cn "thuế\|TNCN\|khấu trừ\|3335\|pitAmount\|withhold" src/components/Settlement.tsx` → **`0`**.
832 dòng xử lý đối soát và chi tiền, **không có một chữ nào về thuế**.

Bút toán thực tế đang sinh ra (`accountingService.ts` → `postWithdrawalJournalEntries`):

```ts
const items: any[] = [
  { accountId: TT99_ACCOUNTS.OTHER_PAYABLE, debit: amount, credit: 0, partnerId: withdrawal.userId },  // Nợ 3388
  { accountId: TT99_ACCOUNTS.CASH_IN_BANK,  debit: 0, credit: amount }                                 // Có 1121
];
```

**Hai dòng. Không có `Có 3335` (thuế TNCN).** CTV nhận nguyên tổng tiền.

Và đây là điểm đắt giá nhất:

```
grep -rn "3335" src/ specs/ -i
  → CHỈ có specs/021-tt99-ke-toan-doanh-nghiep/migrations/001_coa.sql:272
    ('tenant-vcomm-prod-01','3335','Thuế thu nhập cá nhân',2,'333','liability','credit',...)
  → KHÔNG CÓ MỘT DÒNG NÀO TRONG src/
```

**Tài khoản thuế TNCN đã được định nghĩa trong hệ thống tài khoản TT99, nhưng là một tài khoản mồ côi —
chưa từng được ghi một đồng nào.** Nghĩa là: hạ tầng đã sẵn, chỉ thiếu bước nối.

#### 2.5.2 Lỗ hổng B — luồng tiền **thật** không ghi sổ, luồng MOCK thì có

Ba luồng duyệt chi trong `Settlement.tsx`, và chúng **không đối xứng**:

| Luồng | Dữ liệu | Có bút toán? |
|---|---|---|
| `approveAffiliateSettlement` (:104) chi hoa hồng CTV | `MOCK_AFFILIATE_SETTLEMENTS` (:40) | ✅ Có — nhưng thiếu khấu trừ |
| `approvePickupSettlement` (:130) chi phí Điểm nhận | `MOCK_PICKUP_SETTLEMENTS` (:63) | ✅ Có — nhưng thiếu khấu trừ |
| `approveWithdrawal` (:320) → `confirmPendingApproval(kind='withdrawal')` (:354) rút tiền thật | **Supabase `withdrawals`** (:184) | ❌ **Không có bút toán nào** |

Luồng thứ ba — luồng **thật**, đọc từ Supabase, nơi tiền thực sự rời khỏi công ty — chỉ làm 2 việc:

```ts
await updateDoc(mockDocRef, { status: 'processed' });          // đổi trạng thái
await recordPartnerLedgerEntry({ ... debit: withdrawal.amount }); // ghi sổ PHỤ (partner ledger)
```

**Không gọi `postWithdrawalJournalEntries()`. Không đụng vào `journal_entries`.**
Sổ phụ (partner ledger) ghi được, sổ cái (general ledger) thì không → hai sổ lệch nhau, và
Báo cáo tài chính không thấy dòng tiền này tồn tại.

> Lỗ hổng B **không phụ thuộc** vào lõi dữ liệu nhân sự (2.2) hay engine thuế (2.3).
> Nó là một thiếu sót độc lập, sửa được trong ~1 ngày. Vì vậy nó được xếp là **2.6a**
> và có thể làm ngay sau 2.1 — không cần chờ 2.2→2.3→2.4.

---

## 3. Soi pháp lý: công thức lương hiện tại sai chỗ nào

`src/components/HR.tsx:340–354` (và logic lặp lại ở các handler form, dòng 2415–2560):

```ts
// HIỆN TẠI — SAI
const bonus     = (overtimeHours * 100000) + kpiBonus;   // hằng số cứng
const deduction = lateCount * 500000;                    // hằng số cứng

return {
  baseSalary,
  allowance: 2_000_000,                                  // mọi NV nhận như nhau
  bonus, deduction,
  pitAmount:        (baseSalary + 2_000_000 + bonus - deduction) * 0.05,  // ❌ 5% phẳng trên GROSS
  insuranceAmount:  baseSalary * 0.1,                                     // ❌ 10%, thực tế 10,5%
  netSalary:        /* ... */
};
```

### 3.1 Tám lỗi

| # | Lỗi | Thực tế phải là |
|---|---|---|
| 1 | Thuế TNCN = **5% phẳng** trên tổng thu nhập | **Biểu lũy tiến từng phần** trên *thu nhập tính thuế* |
| 2 | Không trừ **giảm trừ gia cảnh** | 15.500.000 đ/tháng (bản thân) |
| 3 | Không có **người phụ thuộc** | 6.200.000 đ/người/tháng |
| 4 | Không trừ **bảo hiểm** trước khi tính thuế | Thu nhập tính thuế = thu nhập chịu thuế − BH bắt buộc − giảm trừ |
| 5 | BHXH = **10%** | **10,5%** (8% BHXH + 1,5% BHYT + 1% BHTN) |
| 6 | Không có **trần đóng BHXH** | 20 × lương cơ sở = **50.600.000 đ/tháng** (từ 01/7/2026) |
| 7 | Phụ cấp cố định 2tr · thưởng KPI "được ăn cả ngã về không" 2tr · phạt muộn 500k/lần | Tham số hóa theo chính sách; phạt phải trong **trần khấu trừ luật định** |
| 8 | **Một công thức cho mọi loại hợp đồng.** `pitAmount = gross * 0.05` áp dụng cả cho HĐLĐ dài hạn lẫn cộng tác viên. Nhân sự không có trường `contract_type` | **3 phương pháp theo loại hợp đồng** (§4.1): `PROGRESSIVE` · `FLAT_ON_GROSS` · `NON_RESIDENT`. Thêm `hr_employees.contract_type` |

> **Đọc lại lỗi #8:** con số 5% trong code hiện tại **không hẳn là sai** — nó đúng *nếu*
> nhân viên là cộng tác viên/hợp đồng dịch vụ. Cái sai là **áp dụng một công thức cho tất cả**,
> và **không có dữ liệu để phân biệt**. VComm dùng KOL, shipper, cộng tác viên bán hàng →
> đây là nhóm đông nhất và đang bị tính sai hoàn toàn.

**Nghịch lý nội bộ:** giao diện tab Bảo hiểm (`HR.tsx:1554`) lại hiển thị đúng chữ `"10.5% - 21.5%"`. Tức là **UI biết số đúng còn hàm tính thì không**. Người dùng nhìn thấy 10,5% nhưng phiếu lương khấu trừ 10%.

### 3.2 Mức độ sai lệch — ví dụ thực tế

Nhân viên lương cơ bản **30.000.000 đ**, không người phụ thuộc, không OT/KPI:

| | Hiện tại (sai) | Đúng luật 2026 |
|---|---:|---:|
| Thu nhập chịu thuế | 32.000.000 | 32.000.000 |
| BH bắt buộc (10,5%) | 3.000.000 | 3.150.000 |
| Giảm trừ bản thân | — | 15.500.000 |
| **Thu nhập tính thuế** | *32.000.000* | **13.350.000** |
| **Thuế TNCN** | **1.600.000** | **835.000** |
| Chênh lệch | | **thu thiếu 765.000 đ/tháng** |

Gộp với sai BHXH (0,5% × 30tr = 150.000 đ), mỗi tháng sai lệch **~915.000 đ/nhân viên**. Khi quyết toán năm, doanh nghiệp truy thu + phạt chậm nộp.

---

## 4. Bảng tham số chuẩn 2026 (nguồn chân lý cho code)

> Đây là bảng **phải dùng** khi viết engine. Không lấy từ VietERP.

### 4.1 Thuế TNCN — **nhiều phương pháp theo loại hợp đồng**

> ⚠️ **Đây là điểm sửa quan trọng nhất so với bản nháp đầu.**
> Thuế TNCN **không phải một công thức**. Luật chia theo **loại hợp đồng**, mỗi loại
> một phương pháp tính khác nhau. Thiết kế engine bắt buộc phải theo mô hình này.

**Ba phương pháp:**

| Mã | Áp dụng cho | Cách tính |
|---|---|---|
| `PROGRESSIVE` | Cá nhân cư trú ký **HĐLĐ từ 03 tháng trở lên** — kể cả ký ≥3 tháng tại nhiều nơi | Biểu lũy tiến từng phần trên **thu nhập tính thuế** (đã trừ bảo hiểm + giảm trừ gia cảnh) |
| `FLAT_ON_GROSS` | Không ký HĐLĐ · HĐLĐ **dưới 03 tháng** · **hợp đồng dịch vụ** · **hợp đồng khoán** · **cộng tác viên** · người đã chấm dứt HĐLĐ | Tỷ lệ cố định trên **thu nhập trước khi trả**, khi mức chi trả ≥ ngưỡng. **Không được giảm trừ gia cảnh** |
| `NON_RESIDENT` | Cá nhân **không cư trú** · người nước ngoài làm việc tại VN **dưới 183 ngày/năm tính thuế** | Tỷ lệ cố định trên tổng thu nhập |

Căn cứ: **Luật 109/2025/QH15** (10/12/2025, hiệu lực 01/7/2026, áp dụng từ kỳ tính thuế
2026) và **Nghị định 253/2026/NĐ-CP** (quy định chi tiết, Điều 50 — khấu trừ thuế).

---

**① `PROGRESSIVE` — HĐLĐ từ 3 tháng trở lên**

Biểu thuế lũy tiến 5 bậc (thay biểu 7 bậc cũ):

| Bậc | Thu nhập tính thuế / tháng | Thuế suất | Tính nhanh |
|---|---|---:|---|
| 1 | Đến 10 triệu | **5%** | `5% × TNTT` |
| 2 | Trên 10 – 30 triệu | **10%** | `10% × TNTT − 0,5 tr` |
| 3 | Trên 30 – 60 triệu | **20%** | `20% × TNTT − 3,5 tr` |
| 4 | Trên 60 – 100 triệu | **30%** | `30% × TNTT − 9,5 tr` |
| 5 | Trên 100 triệu | **35%** | `35% × TNTT − 14,5 tr` |

*(Bậc năm tương đương: đến 120tr / trên 120–360tr / trên 360–720tr / trên 720tr–1,2 tỷ / trên 1,2 tỷ)*

**Giảm trừ gia cảnh:**

| Khoản | Cũ (NQ 954/2020) | **2026 (NQ 110/2025)** |
|---|---:|---:|
| Bản thân | 11.000.000 đ/tháng | **15.500.000 đ/tháng** |
| Mỗi người phụ thuộc | 4.400.000 đ/tháng | **6.200.000 đ/tháng** |

> Người phụ thuộc phải **đăng ký và có mã số thuế** mới được giảm trừ.

**Công thức:**

```
Thu nhập chịu thuế   = Tổng lương + phụ cấp chịu thuế − các khoản miễn thuế
Các khoản được trừ   = BH bắt buộc (10,5%) + quỹ hưu trí tự nguyện (trong hạn mức) + từ thiện
Thu nhập tính thuế   = Thu nhập chịu thuế − Các khoản được trừ − [15.500.000 + 6.200.000 × N]
Thuế TNCN            = Áp dụng biểu 5 bậc trên Thu nhập tính thuế (≤ 0 thì không phải nộp)
```

> ⚠️ **Lưu ý chuyển tiếp:** vì Luật 109 chỉ có hiệu lực 01/7/2026, nhiều DN vẫn tạm khấu trừ theo biểu cũ trong tháng 1–6/2026. Khi quyết toán 2026 (đầu 2027) sẽ **tính lại cả năm** theo chuẩn mới và bù trừ/hoàn. → Engine phải có **`effectiveFrom` trên từng bộ tham số** để chạy lại được lịch sử, chứ không được hardcode một bảng.

---

**② `FLAT_ON_GROSS` — dịch vụ / khoán / cộng tác viên / HĐLĐ < 3 tháng**

Theo **Nghị định 253/2026/NĐ-CP, Điều 50, khoản 2** (trích nguyên văn):

> *"Tổ chức, cá nhân trả tiền lương, tiền công, tiền thù lao, tiền chi khác cho cá nhân cư trú*
> *không ký hợp đồng hoặc ký hợp đồng lao động dưới 03 tháng (bao gồm cả trường hợp trả tiền*
> *lương, thu nhập khác cho người lao động đã chấm dứt hợp đồng lao động) mà mức chi trả thu*
> *nhập từ **05 triệu đồng/lần** trở lên thì phải khấu trừ thuế ... theo tỷ lệ **10%** trên thu nhập*
> *trước khi trả thu nhập cho cá nhân. Trường hợp mức chi trả thu nhập dưới 05 triệu đồng/lần*
> *thì tổ chức, cá nhân trả thu nhập được khấu trừ thuế theo tỷ lệ 10% khi cá nhân có yêu cầu."*

| Tham số | Giá trị |
|---|---|
| Tỷ lệ khấu trừ | **10%** trên thu nhập **trước khi trả** |
| Ngưỡng bắt buộc khấu trừ | **5.000.000 đ/lần chi trả** *(trước đây là 2.000.000 — TT 111/2013)* |
| Dưới ngưỡng | Chỉ khấu trừ **khi cá nhân có yêu cầu** |
| Giảm trừ gia cảnh | ❌ **Không áp dụng** |
| Miễn khấu trừ | Cá nhân **làm cam kết** (theo mẫu) nếu ước tính tổng thu nhập sau giảm trừ chưa đến mức phải nộp → tạm thời **chưa khấu trừ**. Cuối năm tổ chức trả thu nhập **vẫn phải tổng hợp danh sách nộp CQT** |

> 🔎 **Cần Anh xác nhận:** Anh nêu tỷ lệ **5%**. Văn bản Chính phủ tôi tìm được
> (**ND 253/2026/NĐ-CP**, đăng 03/7/2026) ghi **10%** — ngưỡng 5 triệu thì **khớp với Anh**.
> Có thể Anh đang nhớ bản dự thảo, hoặc quy định nội bộ VComm. Vì vậy **tỷ lệ phải là tham số
> cấu hình** (xem §4.5) — Anh đặt 5% hay 10% đều được, engine không hardcode. Mặc định
> tôi để **10%** theo văn bản hiện hành.

**Trường hợp đặc biệt cũng khấu trừ 10%** (cùng Điều 50):
- Cổ phiếu thưởng / **ESOP** (khấu trừ khi chuyển nhượng, công ty chứng khoán thực hiện)
- Phí **bảo hiểm nhân thọ** do người sử dụng lao động mua có tích lũy (khấu trừ khi đáo hạn)

---

**③ `NON_RESIDENT` — cá nhân không cư trú**

| Trường hợp | Cách tính |
|---|---|
| Người nước ngoài làm việc tại VN **từ 183 ngày trở lên** | **Biểu lũy tiến** như cá nhân cư trú |
| Người nước ngoài **dưới 183 ngày** | Theo **Điều 64 ND 253/2026** — tỷ lệ cố định |

> ⚠️ **Chưa xác minh:** tôi chưa đọc trực tiếp Điều 64. Tỷ lệ thông thường cho cá nhân không
> cư trú là **20%**, nhưng **cần kiểm tra văn bản gốc trước khi đưa vào code**. Đánh dấu
> `TODO` trong engine — không đoán.

---

### 4.2 Lương cơ sở & lương tối thiểu vùng — hai đầu vào cơ sở

> Yêu cầu của Anh: *"Nhập lương tối thiểu vùng, lương cơ sở để làm cơ sở tính toán các loại khác."*
> → Hai giá trị này là **dữ liệu đầu vào**, mọi thứ khác **dẫn xuất** từ chúng.

**Nghị định 293/2025/NĐ-CP** (ban hành **10/11/2025**, hiệu lực **01/01/2026**,
thay thế Nghị định 74/2024/NĐ-CP):

| Vùng | Mức tháng | Mức giờ |
|---|---:|---:|
| **Vùng I** | **5.310.000** | 25.500 |
| **Vùng II** | **4.730.000** | 22.700 |
| **Vùng III** | **4.140.000** | 20.000 |
| **Vùng IV** | **3.700.000** | 17.800 |

**Lương cơ sở (dùng cho trần BHXH/BHYT):**

| Từ ngày | Lương cơ sở |
|---|---:|
| 01/7/2023 | 1.800.000 |
| 01/7/2024 | 2.340.000 |
| **01/7/2026** | **2.530.000** |

> Cả hai bảng trên **thay đổi hàng năm** → lưu DB có `effective_from` / `effective_to`,
> **không** viết vào code. VietERP hardcode `BASE_SALARY_2024 = 1_800_000` — đúng lúc viết,
> sai 40% khi sang 2026. Đây chính là bài học §5.2.

### 4.3 Các giá trị dẫn xuất từ hai đầu vào trên

| Giá trị dẫn xuất | Công thức | Ví dụ 2026 |
|---|---|---:|
| Trần đóng BHXH + BHYT | `hệ số × lương cơ sở` | 20 × 2.530.000 = **50.600.000** |
| Trần đóng BHTN | `hệ số × lương tối thiểu vùng` | Vùng I: 20 × 5.310.000 = **106.200.000** |
| Sàn lương tối thiểu tháng | `lương tối thiểu vùng` | Vùng I: **5.310.000** |
| Sàn lương giờ | `lương tối thiểu giờ vùng` | Vùng I: **25.500** |
| Sàn làm thêm giờ (ngày thường) | ≥ `150% × lương giờ thực tế` | Vùng I: ≥ 38.250/giờ |
| Sàn làm thêm giờ (ngày nghỉ hằng tuần) | ≥ `200%` | |
| Sàn làm thêm giờ (lễ, tết; ngày nghỉ hưởng lương) | ≥ `300%` | |
| Sàn làm việc ban đêm | ≥ `150%` + thêm `30%` | |

> ⚠️ Phần trăm làm thêm giờ nhân vào **lương giờ thực tế** của người lao động,
> không nhân vào lương tối thiểu. Lương tối thiểu chỉ là **sàn** để cảnh báo vi phạm.

### 4.4 Bảo hiểm bắt buộc

| Loại | NLĐ | DN | Tổng |
|---|---:|---:|---:|
| BHXH | 8% | 17,5% | 25,5% |
| BHYT | 1,5% | 3% | 4,5% |
| BHTN | 1% | 1% | 2% |
| **Tổng** | **10,5%** | **21,5%** | **32%** |

**Trần đóng** — xem §4.3. Cả hai trần đều **dẫn xuất từ lương cơ sở / lương tối thiểu vùng**,
không phải hằng số:
- Trần BHXH + BHYT = `hệ số × lương cơ sở`
- Trần BHTN = `hệ số × lương tối thiểu vùng` (khác nhau I–IV)

### 4.5 Tài khoản kế toán (TT99) — đang thiếu

| Mã | Tên | Trong seed 001_coa.sql? |
|---|---|:---:|
| `334` | Phải trả người lao động | ✅ Có |
| `622` | Chi phí nhân công trực tiếp | ✅ Có |
| `627` | Chi phí sản xuất chung | ✅ Có |
| `641` | Chi phí bán hàng | ✅ Có |
| `642` | Chi phí quản lý doanh nghiệp | ✅ Có |
| `3382` | Kinh phí công đoàn | ❌ **THIẾU** |
| `3383` | Bảo hiểm xã hội | ❌ **THIẾU** |
| `3384` | Bảo hiểm y tế | ❌ **THIẾU** |
| `3386` | Bảo hiểm thất nghiệp | ❌ **THIẾU** |

> TT99 Điều 11 chỉ bắt buộc 71 tài khoản cấp 1; `338` đã có (cấp 1) nên việc thêm `3382/3383/3384/3386` là **VComm tự định nghĩa cấp 2** — hợp lệ, nhưng phải ghi vào **Quy chế hạch toán** giống như `33881` đã làm (xem quy chế trong header `accountingService.ts`).

---

### 4.6 Mô hình cấu hình — luật đổi thì đổi dữ liệu, không đổi code

> Yêu cầu của Anh: *"Do luật thay đổi liên tục nên cho phép cấu hình nhiều loại thuế TNCN
> (theo thời gian, theo luật)."*

**Nguyên tắc:** code chỉ chứa **thuật toán**. Mọi con số luật nằm trong bảng, có
`effective_from` / `effective_to` / `legal_basis`. **Luật đổi → thêm một dòng, không sửa code.**

**Năm bảng cấu hình:**

**① `hr_salary_baselines`** — lương cơ sở & lương tối thiểu vùng (đầu vào cơ sở)

| Cột | Ý nghĩa |
|---|---|
| `effective_from` / `effective_to` | Niên hạn áp dụng |
| `base_salary` | Lương cơ sở |
| `region_1..4_monthly` | Lương tối thiểu tháng theo vùng |
| `region_1..4_hourly` | Lương tối thiểu giờ theo vùng |
| `legal_basis` | `ND 293/2025/NĐ-CP` |

**② `hr_insurance_config`** — tỷ lệ bảo hiểm & hệ số trần

| Cột | Ý nghĩa |
|---|---|
| `effective_from` / `effective_to` · `legal_basis` | Niên hạn + căn cứ |
| `social_employee` / `social_employer` | 8% / 17,5% |
| `health_employee` / `health_employer` | 1,5% / 3% |
| `unemployment_employee` / `unemployment_employer` | 1% / 1% |
| `social_health_cap_multiplier` | **20** — nhân với lương cơ sở |
| `unemployment_cap_multiplier` | **20** — nhân với lương tối thiểu vùng |
| `union_fund_rate` | 2% KPCĐ (phần DN) |

**③ `hr_pit_policies`** — bộ chính sách thuế TNCN, **mỗi dòng một phương pháp**

| Cột | Ý nghĩa |
|---|---|
| `code` | `PROGRESSIVE` · `FLAT_ON_GROSS` · `NON_RESIDENT` |
| `effective_from` / `effective_to` | Niên hạn |
| `legal_basis` | `Luật 109/2025/QH15` · `ND 253/2026/NĐ-CP` · `TT 111/2013` |
| `brackets` | JSONB `[{upTo, rate, quickDeduction}]` — chỉ `PROGRESSIVE` |
| `self_deduction` / `dependent_deduction` | 15.500.000 / 6.200.000 |
| `flat_rate` | Tỷ lệ phẳng — **`FLAT_ON_GROSS` / `NON_RESIDENT`** |
| `flat_threshold` | Ngưỡng/lần (5.000.000) |
| `allows_deduction` | `false` cho `FLAT_ON_GROSS` (không giảm trừ gia cảnh) |

**④ `hr_contract_tax_map`** — ánh xạ loại hợp đồng → phương pháp thuế

| `contract_type` | `pit_method` | Ghi chú |
|---|---|---|
| `LABOR_3M_PLUS` | `PROGRESSIVE` | HĐLĐ từ 3 tháng trở lên |
| `LABOR_UNDER_3M` | `FLAT_ON_GROSS` | HĐLĐ dưới 3 tháng |
| `SERVICE` | `FLAT_ON_GROSS` | Hợp đồng dịch vụ |
| `PIECEWORK` | `FLAT_ON_GROSS` | Hợp đồng khoán |
| `COLLABORATOR` | `FLAT_ON_GROSS` | Cộng tác viên |
| `NONE` | `FLAT_ON_GROSS` | Không ký hợp đồng |
| `FOREIGN_OVER_183D` | `PROGRESSIVE` | Người NN ≥183 ngày |
| `FOREIGN_UNDER_183D` | `NON_RESIDENT` | Người NN <183 ngày |

> Bảng ④ cũng có `effective_from` — vì **cách ánh xạ hợp đồng → phương pháp cũng có thể đổi theo luật**.

**⑤ `hr_withholding_config`** — **khấu trừ tại nguồn theo loại đối tác** *(mới, quyết định #8 & #9 của Anh)*

Bảng này tách **đối tác nhận tiền ngoài bảng lương** (CTV/KOL, Điểm nhận, Seller) ra khỏi
`hr_contract_tax_map` — vì họ **không phải nhân viên**, không có `contract_type`,
nhưng vẫn là đối tượng khấu trừ.

> ⚠️ **Khóa của bảng này là `(partner_type, entity_type)`** — hai trục, theo quyết định #10
> của Anh ("cấu hình theo cả cá nhân / pháp nhân"). Xem §4.9.6 và §4.10.

| Cột | Ý nghĩa |
|---|---|
| `partner_type` | `AGENT` (CTV/KOL/Publisher/khoán) · `PICKUP_HUB` (Điểm nhận) · `SELLER` (người bán trên sàn) |
| `entity_type` | **`INDIVIDUAL`** (cá nhân) · **`HOUSEHOLD_BUSINESS`** (hộ KD) · **`LEGAL_ENTITY`** (pháp nhân) |
| `mode` | **`WITHHOLD`** (khấu trừ thật) · **`WARN`** (chi nguyên gốc nhưng ghi nhận nghĩa vụ) · **`OFF`** (không làm gì) |
| `regime` | **`NONE`** · **`PIT_FLAT`** (ND 253 Điều 50 — 1 loại thuế, theo lần chi) · **`PLATFORM`** (NĐ 252/2026 — 2 loại thuế, theo giao dịch) |
| `pit_method` | Chỉ dùng khi `regime = PIT_FLAT`: `FLAT_ON_GROSS` / `NON_RESIDENT` |
| `flat_rate_override` | `NULL` = dùng tỷ lệ từ policy; điền số = ghi đè riêng |
| `threshold_override` | Tương tự, cho ngưỡng (hiện 5.000.000/lần) |
| `effective_from` / `effective_to` | Niên hạn |
| `legal_basis` | Căn cứ văn bản |
| `note` | Ghi chú nghiệp vụ — hiện trên màn hình duyệt chi khi `mode = WARN` |

**Seed ban đầu (9 dòng = 3 loại đối tác × 3 loại hình):**

```sql
-- CTV/KOL/khoán
('AGENT','INDIVIDUAL',        'WARN', 'PIT_FLAT',  'FLAT_ON_GROSS', NULL,NULL,'2026-01-01',NULL,
 'ND 253/2026/NĐ-CP (Điều 50.2)', 'Tạm cảnh báo. Bật WITHHOLD sau khi chốt tỷ lệ (câu hỏi #0)'),
('AGENT','HOUSEHOLD_BUSINESS','OFF',  'NONE',       NULL,            NULL,NULL,'2026-01-01',NULL, NULL,'Hộ KD tự kê khai'),
('AGENT','LEGAL_ENTITY',      'OFF',  'NONE',       NULL,            NULL,NULL,'2026-01-01',NULL, NULL,'Pháp nhân tự kê khai, xuất HĐ'),

-- Điểm nhận (VComm Hub) — quyết định #10: phân theo loại hình, không đoán bản chất khoản chi
('PICKUP_HUB','INDIVIDUAL',        'WARN', 'PIT_FLAT', 'FLAT_ON_GROSS', NULL,NULL,'2026-01-01',NULL,
 'ND 253/2026/NĐ-CP (Điều 50.2)', 'Cá nhân nhận khoán → thuộc diện khấu trừ'),
('PICKUP_HUB','HOUSEHOLD_BUSINESS','OFF',  'NONE',     NULL,            NULL,NULL,'2026-01-01',NULL, NULL,'Tự kê khai'),
('PICKUP_HUB','LEGAL_ENTITY',      'OFF',  'NONE',     NULL,            NULL,NULL,'2026-01-01',NULL, NULL,'Phí vận hành trả DN, tự kê khai'),

-- Seller trên sàn — NĐ 252/2026 (§4.10). Pháp nhân KHÔNG bị khấu trừ.
('SELLER','INDIVIDUAL',        'WARN', 'PLATFORM',   NULL,            NULL,NULL,'2025-07-01',NULL,
 'NĐ 252/2026/NĐ-CP (Điều 44 — CẦN RÀ LẠI)', '🔴 Cần xác nhận VComm thuộc diện sàn có chức năng thanh toán'),
('SELLER','HOUSEHOLD_BUSINESS','WARN', 'PLATFORM',   NULL,            NULL,NULL,'2025-07-01',NULL,
 'NĐ 252/2026/NĐ-CP (Điều 44 — CẦN RÀ LẠI)', '🔴 Như trên'),
('SELLER','LEGAL_ENTITY',      'OFF',  'NONE',       NULL,            NULL,NULL,'2025-07-01',NULL, NULL,'Tự kê khai thuế TNDN'),
```

> **Vì sao `SELLER + INDIVIDUAL` giờ là `WARN` chứ không phải `OFF`:**
> tôi đã viết `SELLER = OFF` trong bản trước với lý do "chế độ riêng, chờ hướng dẫn".
> Lý do đó **sai** — chế độ nghĩa vụ sàn TMĐT **đã tồn tại từ 01/7/2025** (NĐ 117/2025) và tiếp tục
> dưới **NĐ 252/2026** từ 01/7/2026. Xem §4.10.

> **Vì sao seed `AGENT` là `WARN` chứ không phải `WITHHOLD`:**
> Anh trả lời câu hỏi #8 là **"cấu hình riêng"** — tức không chọn "dừng ngay" cũng không chọn
> "chấp nhận rủi ro". `WARN` là trạng thái ở giữa: **tiền vẫn chảy, nhưng hệ thống bắt đầu
> ghi nhận từng đồng lẽ ra phải khấu trừ**. Khi Anh chốt tỷ lệ (câu hỏi #0), đổi một ô
> `WARN` → `WITHHOLD` là xong — và đã có sẵn sổ nghĩa vụ để truy thu bù trừ.

**Luồng giải quyết:**

```
nhân viên (contract_type, region_code, dependents_count)
        │
        ├─► hr_contract_tax_map  → pit_method          (theo atDate)
        ├─► hr_pit_policies      → bộ tham số          (theo atDate + method)
        ├─► hr_salary_baselines  → lương cơ sở, min vùng (theo atDate)
        └─► hr_insurance_config  → tỷ lệ + hệ số trần  (theo atDate)
                    │
                    ▼
        trần BHXH/BHYT = multiplier × base_salary
        trần BHTN      = multiplier × region_min_wage
                    ▼
        computeInsurance() → computePit(theo method) → computePayslip()
```

**Luồng giải quyết — chi tiền đối tác** *(khác với lương, không đi qua `hr_contract_tax_map`)*:

```
khoản chi đối tác (partner_type, entity_type, amount, atDate)
        │
        └─► hr_withholding_config  → regime + mode     (theo atDate + 2 trục)
                    │
        ┌───────────┼───────────────┐
        ▼           ▼               ▼
   regime=NONE  regime=PIT_FLAT  regime=PLATFORM
   (thường là   (ND 253 Đ.50)    (NĐ 252/2026)
    pháp nhân)       │                │
        │            │                ├─► hr_platform_tax_rates
        │            │                │   → vat_rate + pit_rate
        │            │                │   (theo category + residency)
        │            │                │
        │       hr_pit_policies       └──► 2 loại thuế: GTGT + TNCN
        │       → flat_rate +             (khấu trừ TỪNG GIAO DỊCH)
        │         threshold
        │            │
        └────────────┴────────────┐
                                  ▼
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
                mode=OFF     mode=WARN     mode=WITHHOLD
                    │             │             │
               bút toán      bút toán      bút toán có
                2 chân       2 chân        dòng thuế
               (như cũ)   + ghi accrual   (3+ chân)
```

**Seed ban đầu (2 dòng cho `FLAT_ON_GROSS` — giữ cả cũ để chạy lại lịch sử):**

```sql
-- cũ: TT 111/2013 — tỷ lệ 10%, ngưỡng 2.000.000
('FLAT_ON_GROSS','2013-10-01','2025-12-31','TT 111/2013/TT-BTC',
 NULL, NULL, NULL, 0.10, 2000000, FALSE),

-- mới: ND 253/2026 — tỷ lệ 10%, ngưỡng 5.000.000
('FLAT_ON_GROSS','2026-01-01',NULL,'ND 253/2026/NĐ-CP (Điều 50.2)',
 NULL, NULL, NULL, 0.10, 5000000, FALSE),
```

> ⚠️ **Tỷ lệ vẫn là tham số.** Anh nếu chốt 5% thì đổi một ô `flat_rate` trong bảng này —
> **không đụng vào code**. Đây là lý do yêu cầu "cấu hình theo thời gian, theo luật" của Anh
> là quyết định đúng: nó biến một tranh luận về con số thành **một bản ghi dữ liệu**.

**UI cấu hình** (thêm vào `Settings.tsx`):
- Màn hình **"Tham số lương & thuế"**: nhập lương cơ sở + 4 vùng (tháng/giờ), kèm ngày hiệu lực
- Màn hình **"Chính sách thuế TNCN"**: CRUD `hr_pit_policies`, xem theo niên hạn, clone bộ cũ để tạo bộ mới
- Màn hình **"Khấu trừ đối tác"**: CRUD `hr_withholding_config` — 3 hàng (CTV / Điểm nhận / Seller),
  mỗi hàng một công tắc 3 trạng thái + tỷ lệ + ngưỡng (xem §4.9)
- Cảnh báo khi **không có policy nào còn hiệu lực** cho kỳ lương sắp chạy

### 4.7 Chống trôi tham số — cảnh báo tự động

Vì luật đổi hàng năm, thêm **test + job cảnh báo**:

- Test: `hr_salary_baselines` phải có bản ghi còn hiệu lực cho `CURRENT_DATE + 90 ngày`
- Test: `hr_pit_policies` phải có đủ 3 method còn hiệu lực
- Chạy trong CI → build đỏ khi tham số sắp hết hạn, **trước** khi đến ngày áp dụng

> VietERP không có cơ chế này → `BASE_SALARY_2024` nằm im trong repo, đúng lúc viết và
> sai 40% hai năm sau. Đây là lỗi cụ thể cần **không lặp lại**.

---

### 4.8 Ai cập nhật tham số luật hàng năm — **HR, ngay trong module HRM**

> Trả lời câu hỏi #7 của Anh: *"Ai là người cập nhật tham số luật hàng năm?"*
> → **"HR cập nhật vào HRM."**

Đây là một quyết định thiết kế có hệ quả lớn, và nó **khẳng định lại** mô hình 5 bảng ở §4.6:
nếu HR là người cập nhật, thì tham số luật **không được phép nằm trong code** — vì HR không deploy code.

**Hệ quả ràng buộc (tất cả là bắt buộc, không phải tùy chọn):**

| # | Ràng buộc | Lý do |
|---|---|---|
| 1 | **Cập nhật luật = đổi dữ liệu, không đổi code, không deploy.** HR sửa dòng trong `hr_salary_baselines`, kỳ lương sau áp dụng ngay | Anh đã chốt: HR là người cập nhật. HR không có quyền deploy |
| 2 | **Phải có màn hình cấu hình trong HRM** cho cả 5 bảng: lương cơ sở & lương tối thiểu vùng · tỷ lệ & trần BH · chính sách thuế TNCN · ánh xạ hợp đồng → phương pháp thuế · **khấu trừ theo loại đối tác** | Không có màn hình thì HR phải nhờ dev → ràng buộc #1 bị phá vỡ |
| 3 | **Chỉnh sửa phải có vết thẩm tra** theo **TT99 Điều 28** (hash-chained audit trail): ai sửa, sửa trường nào, giá trị cũ → mới, lúc nào, căn cứ văn bản nào (`legal_basis`) | Tham số luật là chứng từ kế toán. Sửa sai một tỷ lệ = sai toàn bộ BCTC và tờ khai thuế |
| 4 | **Không bao giờ sửa dòng quá khứ — luôn thêm dòng mới** với `effective_from`. Dòng cũ giữ nguyên để tính lại kỳ đã chốt | Engine có `atDate`; nếu ghi đè thì không tính lại được kỳ cũ |
| 5 | **Quyền theo vai trò:** `HR_MANAGER` được sửa; `HR_STAFF` chỉ xem; `ACCOUNTANT` xem + xuất báo cáo; **không ai được xóa** | Tách biệt người cấu hình và người kiểm tra — như tách biệt duyệt chi và hạch toán |
| 6 | **Xem trước tác động trước khi lưu.** Màn hình phải cho chạy thử: "đổi lương cơ sở 2,34tr → 2,53tr thì trần BHXH đổi 46,8tr → 50,6tr, và 12/12 nhân viên bị ảnh hưởng" | Tránh sửa mù. HR không tự hình dung được hệ quả của một con số |
| 7 | **Cảnh báo tự động** (§4.7) phải hiển thị ngay trong HRM, không chỉ trong CI | CI báo cho dev; HR cần thấy trong màn hình mình dùng |

**Màn hình cần có (ước lượng gộp vào 2.3):**

```
HRM ▸ Cấu hình luật
 ├─ Lương cơ sở & Lương tối thiểu vùng   → hr_salary_baselines    [+ Thêm niên hạn]
 ├─ Bảo hiểm bắt buộc                    → hr_insurance_config    [+ Thêm niên hạn]
 ├─ Chính sách thuế TNCN                 → hr_pit_policies        [+ Thêm niên hạn]
 │    └─ từng policy: biểu lũy tiến (bảng bậc) HOẶC tỷ lệ phẳng + ngưỡng
 └─ Ánh xạ hợp đồng → phương pháp thuế   → hr_contract_tax_map
```

**Lưu ý về ràng buộc #4:** đây là lý do §4.6 seed **giữ cả hai phiên bản lịch sử**
(`FLAT_ON_GROSS` bản 2013 hiệu lực đến 31/12/2025, bản 2026 hiệu lực từ 01/01/2026)
thay vì ghi đè. Màn hình HRM phải hiển thị lịch sử này dạng timeline,
và **không cho phép xóa dòng đã qua thời hạn**.

---

### 4.9 Cấu hình khấu trừ theo loại đối tác — **ba trạng thái**

> Quyết định #8 của Anh: *"cấu hình riêng"* — không chọn "dừng ngay", không chọn "chấp nhận rủi ro".
> Quyết định #9 của Anh: *"đồng ý [tách partnerType], bổ sung vào cấu hình thuế"*.

Hai câu trả lời này gộp lại thành **một thiết kế**: khấu trừ không phải là hành vi cứng trong code,
mà là **một bản ghi cấu hình theo loại đối tác**, có ba trạng thái.

#### 4.9.1 Tại sao cần trạng thái thứ ba

Câu hỏi #8 đặt ra hai lựa chọn, và cả hai đều có giá phải trả:

| Lựa chọn | Giá phải trả |
|---|---|
| **Dừng chi nguyên gốc ngay** | Thay đổi đột ngột số tiền CTV thực nhận → chấn động quan hệ đối tác, có khi vi phạm thỏa thuận hoa hồng đã ký |
| **Chấp nhận rủi ro đến 2.6b** | Nghĩa vụ thuế tiếp tục tích lũy **không được ghi nhận ở đâu cả** — đến lúc bị truy thu thì không có số liệu để làm việc |

Trạng thái **`WARN`** giải quyết đúng chỗ này: **tiền vẫn chảy như cũ, nhưng từng đồng lẽ ra
phải khấu trừ đều được ghi nhận.** Nghĩa vụ được đo đếm thay vì bị lãng quên.

#### 4.9.2 Ba trạng thái

| `mode` | Bút toán | Ghi nhận nghĩa vụ | Dùng khi |
|---|---|---|---|
| **`WITHHOLD`** | 3 chân: `Nợ 3388` · `Có 3335` · `Có 1121` | Đã nộp thay | Đã chốt tỷ lệ & thông báo trước cho đối tác |
| **`WARN`** ⭐ | 2 chân như hiện tại: `Nợ 3388` · `Có 1121` | **Có** — ghi sổ nghĩa vụ chưa nộp | Đang chuyển tiếp: biết là phải khấu trừ, chưa chốt xong tỷ lệ/thông báo |
| **`OFF`** | 2 chân như hiện tại | Không | Loại đối tác **không** thuộc diện khấu trừ (Seller) |

**Sổ nghĩa vụ ở `WARN`** — đây là phần khiến `WARN` khác với "không làm gì cả":

```
Bảng hr_withholding_accruals
  id · tenant_id · partner_type · partner_id · ref_type · ref_id
  payout_amount        = số tiền đã chi (gross)
  pit_should_withhold  = số tiền lẽ ra phải khấu trừ
  pit_method           = phương pháp đã dùng để tính
  legal_basis          = căn cứ tại thời điểm chi
  paid_at              = ngày chi
  settled_at           = NULL cho đến khi bù trừ xong
```

→ Bất kỳ lúc nào cũng trả lời được: **"tính đến hôm nay VComm đang nợ bao nhiêu tiền thuế
TNCN chưa khấu trừ của CTV?"** Đó là con số để Anh ra quyết định — và là con số
cơ quan thuế sẽ hỏi.

#### 4.9.3 Ma trận áp dụng *(đã cập nhật theo quyết định #10 — xem §4.9.6)*

| Loại đối tác | Cá nhân | Hộ kinh doanh | Pháp nhân |
|---|---|---|---|
| **`AGENT`** (CTV/KOL/khoán) | **`WARN`** ⭐ · ND 253 Điều 50 | `OFF` · tự kê khai | `OFF` · xuất HĐ, tự kê khai |
| **`PICKUP_HUB`** (Điểm nhận) | **`WARN`** ⭐ · ND 253 Điều 50 | `OFF` · tự kê khai | `OFF` |
| **`SELLER`** (người bán trên sàn) | 🔴 **NĐ 252/2026** — xem §4.10 | 🔴 **NĐ 252/2026** — xem §4.10 | `OFF` · tự kê khai thuế TNDN |

> 🔑 **Quyết định #9 được mã hóa thành ràng buộc kỹ thuật:** 2.6b chỉ đọc cấu hình,
> **không có nhánh `if (partnerType === 'seller')` nào trong code**.
> Muốn khấu trừ Seller thì phải đổi dữ liệu trong `hr_withholding_config` —
> một hành động có chủ đích, có người thực hiện, có vết thẩm tra.

#### 4.9.4 Hành vi trên màn hình duyệt chi

| `mode` | Khi bấm "Duyệt chi" |
|---|---|
| `WITHHOLD` | Hiện bảng kê: `Gross 20.000.000 · TNCN 10% = 2.000.000 · Thực nhận 18.000.000` → xác nhận |
| `WARN` | Hiện cảnh báo vàng: `⚠️ Khoản này chưa khấu trừ TNCN. Nghĩa vụ ước tính 2.000.000 đ sẽ được ghi nhận.` → vẫn cho chi |
| `OFF` | Không hiện gì (mặc định cho Seller/Điểm nhận) |

#### 4.9.5 Engine

```ts
export type WithholdingMode   = 'WITHHOLD' | 'WARN' | 'OFF';
export type PartnerType       = 'AGENT' | 'PICKUP_HUB' | 'SELLER';

export interface WithholdingRule {
  partnerType: PartnerType;
  mode: WithholdingMode;
  pitMethod: PitMethod | null;
  flatRate: number | null;        // đã resolve override → policy
  threshold: number | null;
  legalBasis: string | null;
  note: string | null;
}

export interface WithholdingResult {
  mode: WithholdingMode;
  gross: number;
  withheld: number;               // = 0 nếu WARN hoặc OFF
  netPaid: number;                // = gross - withheld
  shouldHaveWithheld: number;     // > 0 và cần accrue nếu WARN
  belowThreshold: boolean;
  legalBasis: string | null;
}

// async: đọc cấu hình
export async function resolveWithholdingRule(
  partnerType: PartnerType, atDate: string, tenantId?: string
): Promise<WithholdingRule>

// PURE: không async, dễ test
export function computeWithholding(rule: WithholdingRule, gross: number): WithholdingResult
```

**Quy tắc (cùng kỷ luật với engine lương, §2.3):**
- Mọi hàm nhận `atDate` — **không** dùng `new Date()` ngầm
- `mode = OFF` → `withheld = 0`, **không** ghi accrual, **không** cảnh báo
- `mode = WARN` → `withheld = 0` nhưng `shouldHaveWithheld` được tính đầy đủ và **phải** ghi accrual
- `mode = WITHHOLD` và không có policy hiệu lực → **ném lỗi**, không âm thầm chi nguyên gốc
- `flatRate` không được hardcode: luôn `override ?? policy.flat_rate`
- Làm tròn ở **một chỗ** (`roundVnd()`)

**Test (~12, nằm trong 2.6b):**
```
- AGENT, mode=WARN, 20tr, rate 10%   → netPaid = 20tr, shouldHaveWithheld = 2tr, accrual được ghi
- AGENT, mode=WITHHOLD, 20tr, 10%    → netPaid = 18tr, bút toán 3 chân, cân bằng
- AGENT, mode=OFF, 20tr              → netPaid = 20tr, KHÔNG có accrual
- SELLER (mode=OFF mặc định) 20tr    → netPaid = 20tr, không khấu trừ, không accrual
- gross 4,5tr dưới ngưỡng 5tr        → shouldHaveWithheld = 0, belowThreshold = TRUE
- đổi mode WARN → WITHHOLD trong DB   → cùng khoản chi cho kết quả khác nhau, KHÔNG sửa code
- override flatRate 0.05 đè policy 0.10 → kết quả dùng 0.05
- không có rule cho partnerType       → NÉM LỖI (không mặc định ngầm thành OFF)
```

> ⚠️ **Không bao giờ mặc định ngầm thành `OFF`.** Nếu thiếu cấu hình cho một loại đối tác,
> hệ thống phải **từ chối chi**, không phải lặng lẽ chi nguyên gốc. Đây là bài học trực tiếp
> từ §2.5.1: chính việc "không có gì thì cứ chi" đã tạo ra lỗ hổng hiện tại.

#### 4.9.6 Trục thứ hai — **cá nhân hay pháp nhân** *(quyết định #10 của Anh)*

> Anh chốt #10: *"cấu hình theo cả cá nhân / pháp nhân"*.

Câu hỏi #10 ban đầu của tôi hỏi: *"Phí Điểm nhận là phí vận hành hay thù lao cá nhân?"*
Anh trả lời bằng cách **xóa câu hỏi đó đi** — không cần đoán bản chất khoản chi,
chỉ cần biết **người nhận là ai**.

**Đây là câu trả lời đúng hơn cả câu hỏi.** Vì:

> **Thuế TNCN là thuế thu nhập *cá nhân*. Pháp nhân không chịu thuế TNCN** — họ chịu
> thuế TNDN và tự kê khai. Khấu trừ thuế TNCN từ một công ty là **sai bản chất thuế**.

Nghĩa là `entity_type` không chỉ giải quyết Điểm nhận — nó là **trục lọc đầu tiên**
cho mọi loại đối tác, kể cả CTV. Một KOL ký hợp đồng **qua công ty** (pháp nhân)
thì VComm **không** khấu trừ; cùng KOL đó nhận **với tư cách cá nhân** thì khấu trừ.

**Hệ quả thiết kế:** `hr_withholding_config` đổi khóa từ
`(partner_type)` → **`(partner_type, entity_type)`**.

```sql
entity_type TEXT NOT NULL
  CHECK (entity_type IN ('INDIVIDUAL','HOUSEHOLD_BUSINESS','LEGAL_ENTITY'))
```

| `entity_type` | Ý nghĩa | Chịu khấu trừ TNCN? |
|---|---|---|
| `INDIVIDUAL` | Cá nhân (có MST cá nhân / số CCCD) | ✅ **Có** |
| `HOUSEHOLD_BUSINESS` | Hộ kinh doanh (có MST hộ) | ⚠️ Tùy chế độ — NĐ 252/2026 với Seller (§4.10) |
| `LEGAL_ENTITY` | Doanh nghiệp / pháp nhân (có MST DN) | ❌ Không — tự kê khai, xuất hóa đơn |

**Bắt buộc kèm theo:**
- Mọi bản ghi đối tác (CTV, Điểm nhận, Seller) phải có `entity_type` — **không được NULL**
- Với `INDIVIDUAL` phải có **MST cá nhân hoặc số định danh** (NĐ 252/2026 — xem Điều 44/45; rà lại số Điều)
  → `tax_code` trở thành trường bắt buộc có điều kiện
- `sellerKycService` hiện đã tồn tại nhưng **chỉ `PIM.tsx` dùng** (spec 024 §4.2/4.3) —
  đây là nơi tự nhiên để xác thực `entity_type` + MST, cần nối vào `Sellers.tsx`

> 💡 **Lợi ích phụ:** chính vì VComm chưa phân biệt cá nhân/pháp nhân, đến nay không ai
> trả lời được "VComm đang có bao nhiêu Seller là cá nhân, bao nhiêu là doanh nghiệp?" —
> mà đó là **số liệu quyết định mức độ rủi ro thuế**. Bổ sung trường này là có ngay câu trả lời.

---

### 4.10 Nghĩa vụ khấu trừ của sàn TMĐT — **NĐ 252/2026/NĐ-CP** 🔴 *(thay thế NĐ 117/2025)*

> ⚠️⚠️ **CẬP NHẬT 02/09/2026 — VĂN BẢN ĐÃ THAY ĐỔI:** Nghĩa vụ sàn TMĐT hiện được điều chỉnh bởi
> **Nghị định 252/2026/NĐ-CP** (ký 30/6/2026, **hiệu lực 01/7/2026**), thay thế NĐ 117/2025.
> Toàn bộ phân tích dưới đây được đối chiếu nguyên văn **từ NĐ 117/2025** (Công báo CB 769+770,
> docid 213883) — văn bản đó vẫn là mô tả đúng nghĩa vụ cho giai đoạn 01/7/2025 → 30/6/2026,
> nhưng **không còn là văn bản thi hành từ 01/7/2026**. Trước khi seed `hr_platform_tax_rates`
> hoặc viết code, PHẢI rà lại hai điểm sau:
>
> 1. **Số Điều bị đánh số lại.** Dưới NĐ 252/2026 các quy định tương ứng nằm ở:
>    - Định nghĩa "nền tảng TMĐT **có chức năng thanh toán**" → **Điều 3.5 / 3.6** (NĐ 117/2025 là Điều 3.1)
>    - Thời điểm & căn cứ xác định số thuế phải khấu trừ → **Điều 44** (NĐ 117/2025 là Điều 4, 5, 5.2)
>    - Đăng ký thuế, kê khai, nộp thay, bù trừ, MST riêng → **Điều 45** (NĐ 117/2025 là Điều 6, 7)
>    - Các Điều 8, 10, 11 của NĐ 117/2025 cũng được sắp xếp lại trong NĐ 252/2026.
> 2. 🔴 **MÔ HÌNH TỶ LỆ THUẾ ĐÃ ĐỔI.** NĐ 252/2026 Điều 44 xác định số thuế khấu trừ theo
>    **tỷ lệ % thuế suất của luật thuế GTGT / TNCN / TNDN áp dụng trên doanh thu phát sinh tại VN
>    cho từng giao dịch** — KHÔNG còn là ma trận cố định 1% / 0,5% (hàng hóa) như NĐ 117/2025 Điều 5.2.
>    → Bảng `hr_platform_tax_rates` (seed 6 dòng tỷ lệ cố định ở dưới) và bảng tỷ lệ §4.10
>    **PHẢI TÍNH LẠI** theo luật thuế GTGT/TNCN/TNDN 2026, **không được seed nguyên bảng cũ**.
>    Quy tắc "không xác định được hàng hóa/dịch vụ → áp mức cao nhất" vẫn giữ nguyên (Điều 44).

**Văn bản hiện hành:** **Nghị định 252/2026/NĐ-CP** — *Quy định chi tiết một số điều và biện pháp
để tổ chức, hướng dẫn thi hành Luật Quản lý thuế 2025; trong đó có quản lý thuế đối với hoạt động
kinh doanh trên nền tảng thương mại điện tử, **nền tảng số** của hộ, cá nhân* ·
ký 30/6/2026 · **hiệu lực 01/7/2026** · thay thế NĐ 117/2025.

> ⚠️ Lưu ý chữ **"nền tảng số"** trong tên văn bản — phạm vi **rộng hơn** sàn TMĐT truyền thống.

**Điều 44 (NĐ 252/2026) — Ai phải khấu trừ** *(tương đương Điều 4 NĐ 117/2025)*: tổ chức quản lý nền tảng TMĐT (trong và ngoài nước)
**thuộc đối tượng khấu trừ, nộp thuế thay**, hoặc **nền tảng số có chức năng thanh toán**
→ khấu trừ và nộp thay thuế **GTGT & TNCN** cho từng giao dịch của **hộ, cá nhân**.

**Điều 44 (NĐ 252/2026) — Thời điểm & căn cứ xác định số thuế** *(tương đương Điều 5 NĐ 117/2025)*: khấu trừ **ngay khi giao dịch thành công và chấp nhận thanh toán**.

| Loại thuế / Đối tượng | Hàng hóa | Dịch vụ | Vận tải, DV gắn với hàng hóa |
|---|---|---|---|
| **Thuế GTGT** | **1%** | **5%** | **3%** |
| **Thuế TNCN** — cá nhân cư trú | **0,5%** | **2%** | **1,5%** |
| **Thuế TNCN** — cá nhân không cư trú | **1%** | **5%** | **2%** |

**Điều 8:** hộ/cá nhân trên sàn **không có chức năng thanh toán** → tự kê khai (Mẫu 02/CNKD-TĐMT).
**Điều 11:** hộ/cá nhân phải cung cấp MST hoặc số định danh cho sàn.

#### Vì sao VComm nhiều khả năng thuộc diện này

VComm **không phải** một website giới thiệu — có đủ dấu hiệu của "nền tảng có chức năng thanh toán":

| Dấu hiệu | Bằng chứng trong code |
|---|---|
| Người bán bên thứ ba | `Sellers.tsx`, `sellerKycService` |
| Ví tiền người bán | `updateWalletBalance()` (`dbService.ts`), gọi từ `Settlement.tsx:341` |
| Yêu cầu rút tiền | `withdrawals` đọc từ Supabase (`Settlement.tsx:184`) |
| Đối soát dòng tiền COD | `codReconciliationService.ts` |
| Đối soát & quyết toán theo kỳ | `settlements` (`Settlement.tsx:441`) |
| Giao dịch thành công ghi nhận doanh thu | `postOrderJournalEntries()` |
| Cổng thanh toán đang bật | `Settings.tsx:168–171` — `visa` ✅ · `mastercard` ✅ · `momo` ✅ · `zalopay` ⚙️ · `vnpay` ⚙️ |
| Tích hợp ngân hàng **thật** | `sepayService.ts:5` `https://api.sepay.vn/v1` · OAuth (`:151`) · **tài khoản ảo** (`:98`) · VietQR (`:141`) · `useSepayListener.ts` |

→ **Tám dấu hiệu cùng lúc**, trong đó Sepay là tích hợp **thật** (gọi API ngoài, có OAuth),
không phải mock. Đối chiếu nguyên văn Điều 3.5/3.6 (NĐ 252/2026; tương đương Điều 3.1 NĐ 117/2025) ở §4.10.1: VComm đạt **5/5 tiêu chí**.

#### Và VComm đang làm gì: **không khấu trừ gì cả**

- `Settlement.tsx` có **0** từ khóa thuế (§2.5.1)
- `postOrderJournalEntries()` ghi doanh thu đơn hàng — **không có bút toán khấu trừ thay**
- Không có bảng nào lưu `entity_type` của Seller → **không biết Seller nào là cá nhân**

> 🔴 **Nếu VComm thuộc diện (NĐ 252/2026 Điều 44 — tương đương Điều 4 NĐ 117/2025), đây không phải lỗ hổng tương lai —
> là nghĩa vụ đã có từ 01/7/2025 (NĐ 117/2025) và tiếp tục dưới NĐ 252/2026 từ 01/7/2026 — tức VComm đã thấm nhuần rủi ro hơn 14 tháng và ĐANG tiếp tục vi phạm.**

#### Ba điều cần phân biệt — **đừng gộp chung**

Đây là ba chế độ **khác nhau hoàn toàn**, đang bị tôi gộp vào một "khấu trừ" trong bản nháp đầu:

| | **Điều 50.2 ND 253/2026** | **NĐ 252/2026** | **TT40/2021** |
|---|---|---|---|
| Áp dụng cho | CTV/KOL/khoán/dịch vụ | **Hộ, cá nhân bán trên sàn** | Hộ kinh doanh **ngoài sàn** |
| Loại thuế | Chỉ TNCN | **GTGT + TNCN** | GTGT + TNCN (khoán) |
| Tỷ lệ | 10% trên tổng (hoặc 5% theo Anh) | **Theo % thuế suất luật thuế GTGT/TNCN trên doanh thu từng giao dịch** (KHÔNG còn ma trận cố định 1%/0,5% như NĐ 117/2025 — xem §4.10.3 / Điều 44) | 1,5% / 4,5% / 3% / 7% |
| Thời điểm | **Theo lần chi trả** | **Từng giao dịch thành công** | Theo năm/tháng |
| Ngưỡng | 5.000.000/lần | *(cần đọc kỹ Điều 6–7)* | 100 triệu/năm |

→ Cấu hình phải có **ba `regime` riêng**, không phải một tỷ lệ cho tất cả.

#### Bảng cấu hình thứ 6: `hr_platform_tax_rates`

Vì NĐ 117/2025 áp dụng **ma trận 3×3** (3 loại hàng hóa × 3 loại thuế) — **NHƯNG NĐ 252/2026 Điều 44 đã BỎ mô hình này**, thay bằng *"tỷ lệ % thuế suất theo luật thuế GTGT/TNCN/TNDN áp dụng trên doanh thu từng giao dịch"*. Do đó bảng dưới **không còn ma trận cố định**; thay vào đó lấy tỷ lệ từ biểu thuế 2026 (xem banner §4.10). Tỷ lệ dưới đây là **tham khảo sơ bộ** — *(CẦN RÀ LẠI bằng cách đọc nguyên văn Điều 44 + biểu thuế GTGT/TNCN/TNDN 2026 trước khi seed)*:

```sql
CREATE TABLE hr_platform_tax_rates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     text NOT NULL,
  category      text NOT NULL,   -- GOODS | SERVICE | TRANSPORT
  residency     text NOT NULL,   -- RESIDENT | NON_RESIDENT
  vat_rate      numeric(5,4) NOT NULL,
  pit_rate      numeric(5,4) NOT NULL,
  effective_from date NOT NULL,
  effective_to   date,
  legal_basis   text NOT NULL
);
```

> ⚠️ **NĐ 252/2026 Điều 44 — căn cứ tính (nguyên văn):** *"Số thuế... được xác định theo tỷ lệ phần trăm (%) thuế suất trên doanh thu phát sinh tại Việt Nam... theo quy định của pháp luật thuế giá trị gia tăng, thuế thu nhập doanh nghiệp, thuế thu nhập cá nhân đối với mỗi giao dịch."* → **KHÔNG seed ma trận 1%/0,5% cũ**. Không xác định được hàng hóa/dịch vụ → áp **mức tỷ lệ cao nhất** (Khoản 2b Điều 44).
>
> 📌 **Biểu thuế 2026 tham khảo** (chưa phải số chính thức để seed): GTGT 0%/5%/8%/10%; TNCN biểu 5 bậc 5–35% (Luật 109/2025) nhưng khấu trừ tại nguồn trên doanh thu thường áp khoán 1% (hàng hóa)/5% (dịch vụ); TNDN 20%. "Mức cao nhất" tham khảo: GTGT **10%** · TNCN **5%** (dịch vụ) · TNDN **20%**.
Seed tham khảo (CHƯA CHÍNH THỨC — CẦN RÀ LẠI theo Điều 44 + biểu thuế 2026):

```sql
('GOODS',    'RESIDENT',     0.10, 0.01,  '2026-07-01', NULL, 'NĐ 252/2026 Điều 44 + biểu thuế 2026 — THAM KHẢO, CẦN RÀ LẠI'),
('SERVICE',  'RESIDENT',     0.10, 0.05,  '2026-07-01', NULL, 'NĐ 252/2026 Điều 44 + biểu thuế 2026 — THAM KHẢO, CẦN RÀ LẠI'),
('TRANSPORT','RESIDENT',     0.10, 0.03,  '2026-07-01', NULL, 'NĐ 252/2026 Điều 44 + biểu thuế 2026 — THAM KHẢO, CẦN RÀ LẠI'),
('GOODS',    'NON_RESIDENT', 0.10, 0.01,  '2026-07-01', NULL, 'NĐ 252/2026 Điều 44 + biểu thuế 2026 — THAM KHẢO, CẦN RÀ LẠI'),
('SERVICE',  'NON_RESIDENT', 0.10, 0.05,  '2026-07-01', NULL, 'NĐ 252/2026 Điều 44 + biểu thuế 2026 — THAM KHẢO, CẦN RÀ LẠI'),
('TRANSPORT','NON_RESIDENT', 0.10, 0.03,  '2026-07-01', NULL, 'NĐ 252/2026 Điều 44 + biểu thuế 2026 — THAM KHẢO, CẦN RÀ LẠI'),
```

Và `hr_withholding_config` đổi `pit_method` thành `regime`:

```sql
regime TEXT NOT NULL
  CHECK (regime IN ('NONE','PIT_FLAT','PLATFORM'))
```

| `regime` | Nghĩa | Đọc tỷ lệ từ |
|---|---|---|
| `NONE` | Không khấu trừ | — |
| `PIT_FLAT` | ND 253/2026 Điều 50.2 — một loại thuế, theo lần chi | `hr_pit_policies` (`FLAT_ON_GROSS`) |
| `PLATFORM` | NĐ 252/2026 — hai loại thuế, theo giao dịch | `hr_platform_tax_rates` |

#### 4.10.1 ✅ Câu hỏi #11 đã có đáp án — **CÓ, gần như chắc chắn**

Anh trả lời: *"sử dụng QR Code / VNPay / ZaloPay / MoMo, không cần thiết lập chức năng thanh toán mới."*

Câu trả lời này **đúng về mặt vận hành** (không cần xây gì thêm) nhưng **không đưa VComm
ra khỏi phạm vi** — vì theo chính văn bản, những gì Anh mô tả **chính là** chức năng thanh toán.

**Điều 3.5 / 3.6 (NĐ 252/2026) — định nghĩa "có chức năng thanh toán"** *(tương đương Điều 3.1 NĐ 117/2025)*, trích nguyên văn:

> Tổ chức là nhà quản lý sàn giao dịch thương mại điện tử, tổ chức là nhà quản lý nền tảng số
> có chức năng thanh toán là nhà quản lý nền tảng được thiết lập để người mua thanh toán trực tiếp
> thông qua các phương tiện thanh toán như **ví điện tử, thẻ ngân hàng hoặc thanh toán, chuyển
> khoản qua tài khoản thanh toán, hệ thống chuyển khoản tích hợp, thanh toán tiền mặt khi nhận
> hàng (giao hàng thu tiền hộ - Cash On Delivery)** và các phương tiện thanh toán khác theo
> quy định của pháp luật.

**Đối chiếu 5/5 — VComm đạt cả năm tiêu chí** (theo Điều 3.5/3.6 NĐ 252/2026; tương đương Điều 3.1 NĐ 117/2025):

| Pháp luật liệt kê | VComm | Bằng chứng đo được |
|---|:---:|---|
| **Ví điện tử** | ✅ | `Settings.tsx:170` `momo · active: true`; `zalopay` (171), `vnpay` (172) đã có cấu hình |
| **Thẻ ngân hàng** | ✅ | `Settings.tsx:168–169` `visa`, `mastercard` — cả hai `active: true` |
| **Chuyển khoản qua tài khoản thanh toán** | ✅ | `sepayService.ts:141` tạo VietQR `img.vietqr.io/...`; `:98` tạo **tài khoản ảo** |
| **Hệ thống chuyển khoản tích hợp** | ✅ | `sepayService.ts:5` `https://api.sepay.vn/v1` + OAuth (`:151`) + lắng nghe GD ngân hàng (`useSepayListener.ts`) |
| **COD** | ✅ | `codReconciliationService.ts`; tab "Đối soát COD" (`Settlement.tsx:444`) |

**Và tiêu chí then chốt — "thu hộ" (Điều 5.2.d):**

> *"Doanh thu của mỗi giao dịch bán hàng hóa, cung cấp dịch vụ là số tiền bán hàng hóa, dịch vụ
> của hộ, cá nhân được hưởng mà tổ chức quản lý nền tảng thương mại điện tử **thu hộ**."*

VComm thu hộ: ví nội bộ (`updateWalletBalance`) · `settlements` · `withdrawals` ·
`payment_gateway: 'sepay'` ghi trong DB (`dbService.ts:2034`). → **Thỏa mãn.**

> 🔑 **Kết luận #11:** VComm **có** chức năng thanh toán theo đúng định nghĩa của NĐ 252/2026.
> Việc dùng cổng bên thứ ba (VNPay/ZaloPay/MoMo/Sepay) **không phải** là lý do để loại trừ —
> ngược lại, đó chính là cách gần như mọi sàn tại VN thực hiện chức năng thanh toán.
> Luật không đòi tự xây hạ tầng thanh toán; nó chỉ hỏi **người mua có thanh toán qua nền tảng không**.
>
> ⚠️ Vẫn cần tư vấn thuế xác nhận chính thức (đây là phân tích từ văn bản, không phải ý kiến pháp lý),
> nhưng **lập luận "chúng tôi chỉ dùng cổng bên thứ ba" sẽ không đứng được**.

#### 4.10.2 🔴 Câu hỏi #12 — **NĐ 117/2025 đã bị thay thế bởi NĐ 252/2026**

| Kiểm tra | Kết quả |
|---|---|
| **Công báo Chính phủ** (`congbao.chinhphu.vn`, CB số 769+770 ngày 23/6/2025) | Ban hành 09/6/2025 · Hiệu lực **01/7/2025** · **không liệt kê văn bản sửa đổi/thay thế** |
| **vanban.chinhphu.vn** (docid 213883) | Người ký Phó Thủ tướng **Hồ Đức Phớc** · PDF gốc `117-ndcp.signed.pdf` |
| **Bản hợp nhất LuatVietnam** | Không có văn bản sửa đổi nào được hợp nhất |

> 🔴 **Cập nhật:** Bảng trên rà Công báo với NĐ 117/2025 (thời điểm 02/09/2026, trước khi NĐ 252/2026 phổ biến). NĐ 252/2026 (ký 30/6/2026, HL 01/7/2026) đã thay thế NĐ 117/2025 — mọi tham chiếu Điều và tỷ lệ phải rà lại (xem banner §4.10).

→ **NĐ 117/2025 (đã đối chiếu ở trên) đã bị thay thế bởi NĐ 252/2026 từ 01/7/2026** — không còn là văn bản thi hành. Tên đầy đủ của văn bản cũ (NĐ 117/2025):
*"Quy định quản lý thuế đối với hoạt động kinh doanh trên nền tảng thương mại điện tử,
**nền tảng số** của hộ, cá nhân"* — lưu ý chữ **"nền tảng số"** mở rộng phạm vi
ra ngoài sàn TMĐT truyền thống.

⚠️ *Mức tin cậy: cao nhưng không phải chứng nhận pháp lý chính thức. Kiểm tra lần cuối 02/09/2026.*

#### 4.10.3 Các điều khoản khác đã đọc (bổ sung cho thiết kế) *(số Điều dưới đây trích từ NĐ 117/2025 — rà lại Điều 44/45 NĐ 252/2026)*

| Điều | Nội dung | Hệ quả thiết kế |
|---|---|---|
| **5.2.c** ⚠️ | Không xác định được là hàng hóa hay dịch vụ → áp **mức cao nhất**: GTGT **5%**, TNCN cư trú **2%** / không cư trú **5%** | Engine phải **mặc định mức cao**, không phải mức thấp. Đây là bẫy: code hay mặc định về số nhỏ nhất |
| **5.2.d** | Doanh thu = số tiền hộ/cá nhân được hưởng mà sàn **thu hộ** | Không tính trên tổng giá trị đơn hàng nếu có phần không thu hộ |
| **6.1** | Kê khai **theo tháng**; **bù trừ** giao dịch bị hủy/trả lại; sàn được cấp **MST 10 chữ số riêng** | Cần bảng kỳ khấu trừ theo tháng + cơ chế bù trừ (đơn hoàn/hủy) |
| **6.2** | Mẫu **01/CNKD-TMĐT** + bảng kê **01-1/BK-CNKD-TMĐT**; mẫu **01/BKNT-TMĐT** sau khi nộp tiền | 3 mẫu tờ khai phải sinh được |
| **7.2** | Cấp **chứng từ khấu trừ** mẫu **01/CTKT-TMĐT** **theo năm**, điện tử, cho hộ/cá nhân | Thiếu cái này = vi phạm riêng, độc lập với việc có khấu trừ đúng hay không |
| **7.4** | Đã kê khai theo ND 117 → **không phải** cung cấp thông tin theo ND 91/2022 nữa | Giảm việc, nhưng chỉ khi kê khai đúng |
| **10** | Hộ/cá nhân có doanh thu cả năm thuộc diện không chịu thuế → được **hoàn** phần đã khấu trừ | Cần luồng hoàn thuế |

> ⚠️ **Điều 6.1 lưu ý kỹ:** *"Đối với giao dịch bị hủy hoặc trả lại hàng thì... thực hiện **bù trừ**
> số thuế đã khấu trừ, nộp thay của giao dịch bị hủy... với số thuế phải khấu trừ của các giao dịch
> bán hàng hóa."* → Engine khấu trừ phải có **nhánh hoàn/hủy**, không chỉ chiều thuận.

#### 4.10.4 ✅ Câu hỏi #13 — Anh chốt: duyệt khi vận hành

Anh trả lời: *"sẽ được duyệt khi vận hành (tính năng duyệt Seller)"*

→ `entity_type` trở thành **trường bắt buộc trong luồng duyệt Seller**, không phải nhập sau.

**Hệ quả:**
- `entity_type` + MST/định danh là **điều kiện tiên quyết để Seller được duyệt** (Điều 11 cũng yêu cầu)
- Nối `sellerKycService` (hiện **chỉ `PIM.tsx` dùng**) vào `Sellers.tsx` — việc này đã nằm
  trong 4.3 của kế hoạch, giờ **tăng mức ưu tiên** vì nó là cổng dữ liệu của cả nghĩa vụ thuế này
- Seller chưa có `entity_type` → **chưa được duyệt** → không phát sinh nghĩa vụ (và cũng không được bán)
- Dữ liệu lịch sử (Seller đã duyệt trước đây): cần **rà soát bổ sung `entity_type` một lần**

> **Đề xuất xử lý ngay (0,5 ngày, không chờ 2.6b):**
> *"liệt kê các Seller đang hoạt động, kèm loại hình (cá nhân/hộ/DN), doanh thu từ 01/7/2025 (NĐ 117/2025) và tiếp tục từ 01/7/2026 (NĐ 252/2026)."*
> Nếu phần lớn là cá nhân → đây là việc phải đưa lên đầu GĐ2, có thể **trước cả TSCĐ (2.1)**.

---

## 5. Đối chiếu VietERP — bằng chứng đo được

### 5.1 VietERP có gì (vượt VComm)

Trích từ GitHub API tree (`tannhdev/viet-erp`, 13.070 entries, `truncated: false`):

```
apps/HRM-AI/prisma/migrations/20260122165801_sprint3_payroll_vn_engine/migration.sql
apps/HRM-AI/src/lib/compliance/tax/calculator.ts
apps/HRM-AI/src/lib/compliance/tax/constants.ts
apps/HRM-AI/src/lib/compliance/insurance/calculator.ts
apps/HRM-AI/src/lib/compliance/insurance/constants.ts
apps/HRM-AI/src/lib/compliance/insurance/reports/d02-generator.ts
apps/HRM-AI/src/lib/compliance/insurance/reports/d03-generator.ts
apps/HRM-AI/src/lib/compliance/insurance/reports/c12-generator.ts
apps/HRM-AI/src/app/api/compliance/tax/dependents/route.ts     ← người phụ thuộc
apps/HRM-AI/src/app/api/compliance/tax/settlements/route.ts     ← quyết toán thuế
apps/HRM-AI/src/app/api/compliance/insurance/reports/route.ts
apps/HRM-AI/src/app/(dashboard)/payroll/{periods,components,config,calculation,adjustments,payments,payslips}/
apps/HRM-AI/src/app/(dashboard)/attendance/{shifts,overtime}/ , analytics/attendance/, admin/import/attendance/
apps/HRM-AI/src/app/(dashboard)/ess/leave/ , leave-admin/
apps/HRM-AI/e2e/tests/attendance/ , lacviet-hr-testing/tests/e2e/{payroll,leave,recruitment}/
```

Đây là một **engine lương Việt Nam hoàn chỉnh về mặt cấu trúc**: chấm công → ca/OT → lương → bảo hiểm → thuế → quyết toán → sinh tờ khai BHXH. VComm **không có bất kỳ phần nào trong số này**.

### 5.2 Nhưng hằng số của VietERP đã cũ — bằng chứng

Đọc trực tiếp `apps/HRM-AI/src/lib/compliance/tax/constants.ts`:

```ts
// Based on Law No. 04/2007/QH12 and subsequent amendments
export const TAX_BRACKETS = [ /* 7 bậc: 5/10/18/32/52/80 triệu, thuế suất 5→35% */ ]
// As of 2024 (Resolution 954/2020/UBTVQH14)
export const TAX_DEDUCTIONS = { /* 11tr / 4,4tr */ }
```

Và `insurance/constants.ts`:

```ts
// INSURANCE RATES (2024)
export const INSURANCE_SALARY_CAP = {
  BASE_SALARY_2024: 1_800_000,   // ❌ lương cơ sở niên hạn 2023
  MULTIPLIER: 20,
  MAX_SALARY_2024: 36_000_000,   // ❌ thực tế 2026 = 50.600.000
}
export const UNEMPLOYMENT_SALARY_CAP = { /* Vùng I 4.680.000, niên hạn 2024 */ }
```

| Tham số | VietERP | **Chuẩn 2026** | Lệch |
|---|---:|---:|---|
| Biểu thuế | 7 bậc (Luật 04/2007) | **5 bậc** (Luật 109/2025) | ❌ Sai luật |
| Giảm trừ bản thân | 11.000.000 | **15.500.000** | ❌ Thiếu 41% |
| Giảm trừ NPT | 4.400.000 | **6.200.000** | ❌ Thiếu 41% |
| Trần BHXH | 36.000.000 | **50.600.000** | ❌ Thiếu 40% |
| Tỷ lệ NLĐ | 10,5% | 10,5% | ✅ Đúng |
| Tỷ lệ DN | 21,5% | 21,5% | ✅ Đúng |

> **Điều này minh chứng trực tiếp quyết định #3 của Anh:** kiến trúc của VietERP đáng học, nhưng **mọi hằng số luật phải kiểm tra lại**. Nếu copy nguyên file `constants.ts` này vào VComm, chúng ta đổi từ "sai vì không tính" sang "sai vì tính sai" — mà cái sau còn nguy hiểm hơn vì **có vẻ đáng tin**.

### 5.3 Cập nhật lại 5 trục đối chiếu của spec 023

| Trục | 023 (toàn hệ thống) | **024 (chỉ nhóm KH & NS)** | Ghi chú |
|---|---|---|---|
| Nghiệp vụ sàn VComm | VComm 9–1 | **VComm 8–2** | Sellers/KYC của VComm bám sàn thật |
| **Tuân thủ VN** | VComm 8–4 | **VietERP 7–3** | 🔄 Đảo ngược — lương/thuế là điểm yếu nhất của VComm |
| Kiến trúc | VietERP 5–7 | VietERP 3–7 | Họ tách `lib/`, có API route, có Prisma migration |
| Hiệu năng | VietERP 5–6 | Hòa 5–5 | Chưa có dữ liệu tải thực |
| Vận hành | VietERP 2–8 | VietERP 2–8 | Họ có 157 E2E spec |

---

## 6. Kế hoạch nâng cấp

### 6.1 Nguyên tắc

1. **Nguồn chân lý lên server trước, làm đẹp UI sau.** 5.013 dòng không lưu được thì không có giá trị gì.
2. **Engine luật tách khỏi UI.** Hằng số và công thức nằm trong `src/services/`, có `effectiveFrom`, có test riêng — không nằm rải rác trong component như hiện tại.
3. **Tham số luật = dữ liệu, không = code.** Lương cơ sở, trần, giảm trừ thay đổi hàng năm → lưu bảng, không hardcode.
4. **Lương phải thành bút toán.** Mọi kỳ lương phát sinh bút toán Nợ 622/627/641/642 · Có 334/3383/3384/3386/3382.
5. **Giữ TT99, học kiến trúc VietERP nhưng tự viết hằng số** (quyết định #3).
6. **Mọi khoản chi cho cá nhân đều xét khấu trừ tại nguồn trước khi ghi sổ.** Lương (334), hoa hồng CTV (3388), phí Điểm nhận — đều là thu nhập chịu thuế TNCN. Bút toán chi tiền **không được phép** có ít hơn 3 dòng khi có đối tượng chịu thuế. Đây là nguyên tắc sửa lỗ hổng A (§2.5.1).
7. **Chi tiền thật thì phải vào sổ cái — chi tiền MOCK thì không cần.** Hiện đang ngược (§2.5.2). Sổ phụ (partner ledger) là đối chiếu, **không phải** nguồn chân lý kế toán.

### 6.2 Vị trí trong thứ tự đã duyệt

Anh đã chốt: **GĐ1 → 2.1 (TSCĐ) → 4.1 → 3.3/3.4**, bỏ GĐ5. Đề xuất chèn nhóm KH & NS như sau:

```
GĐ1  Nền tảng vận hành        (CI/CD, health/metrics, pino, Dockerfile)   ← đang làm
 ├─ 1.0  SỬA TEST TREO (firestore.test.ts) — chặn CI                     ← quyết định #5
 └─ 1.1  Thêm E2E luồng tiền                                             ← quyết định #6
GĐ2  Lỗ hổng kế toán
 ├─ 2.1  TSCĐ & khấu hao                                    ← Anh duyệt "OK"
 ├─ 2.2  LÕI DỮ LIỆU NHÂN SỰ (mới)  👈 chặn mọi thứ HR
 ├─ 2.3  ENGINE THUẾ TNCN + BHXH 2026 + MÀN HÌNH CẤU HÌNH HRM (mới)
 ├─ 2.4  BÚT TOÁN LƯƠNG VÀO SỔ CÁI TT99 (mới)
 ├─ 2.5  Bảng lương & phiếu lương E2E (mới)
 └─ 2.6  ĐỐI SOÁT & KHẤU TRỪ DÒNG TIỀN ĐỐI TÁC (mới, 🔴 tiền đang chạy sai)
       ├─ 2.6a Bút toán rút tiền thật          ← ĐỘC LẬP, làm được ngay sau 2.1
       └─ 2.6b Khấu trừ TNCN hoa hồng CTV/KOL  ← chặn bởi 2.3
GĐ3  Tách rời & đồng bộ      (3.3 / 3.4)
GĐ4  Hóa đơn điện tử, FTS, feature flag, OTB
 ├─ 4.1  (theo thứ tự đã duyệt)
 ├─ 4.2  Nối lại crmService vào Customers/CSKH (mới)
 └─ 4.3  Sellers — gắn sellerKycService, chấm dứt MOCK (mới)
KHÔNG LÀM: Sales.tsx pipeline, EasyHRM (sát nhập), GĐ5 hiệu năng
```

**Lý do xếp 2.2–2.5 ngay sau 2.1:** TSCĐ và lương là **hai đầu vào duy nhất còn thiếu của Báo cáo tài chính**. Thiếu TSCĐ → sai khấu hao; thiếu lương → sai chi phí. Làm xong cả hai thì BCTC mới có nghĩa. Lùi HR xuống GĐ4 sẽ khiến BCTC sai thêm 2 quý.

---

### 2.2 — Lõi dữ liệu nhân sự *(chặn)* · **3–4 ngày** · 1 backend + 1 frontend

**Mục tiêu:** Xóa `localStorage` khỏi HR. Đưa nhân sự lên Postgres.

**Schema mới** (migration `006_hr_core.sql`):

| Bảng | Mục đích | Cột chính |
|---|---|---|
| `hr_departments` | Phòng ban | id, tenant_id, code, name, parent_id, manager_id |
| `hr_positions` | Chức danh | id, tenant_id, code, name, grade |
| `hr_employees` | Nhân viên | id, tenant_id, code, full_name, email, phone, department_id, position_id, status, join_date, **contract_type** ← *(bắt buộc, quyết định phương pháp thuế)*, **insurance_salary**, **region_code** (I–IV), **dependents_count**, **tax_code**, **is_resident**, leave_balance |
| `hr_contracts` | Hợp đồng | id, employee_id, **type** (`LABOR_3M_PLUS`/`LABOR_UNDER_3M`/`SERVICE`/`PIECEWORK`/`COLLABORATOR`), **duration_months**, sign_date, expiry_date |
| `hr_salary_baselines` | **Lương cơ sở + lương tối thiểu vùng** | id, tenant_id, **effective_from**, effective_to, base_salary, region_1..4_monthly, region_1..4_hourly, legal_basis |
| `hr_insurance_config` | Tỷ lệ BH + hệ số trần | id, tenant_id, **effective_from**, effective_to, social/health/unemployment (employee+employer), social_health_cap_multiplier, unemployment_cap_multiplier, union_fund_rate, legal_basis |
| `hr_pit_policies` | **Chính sách thuế TNCN** | id, tenant_id, **code** (`PROGRESSIVE`/`FLAT_ON_GROSS`/`NON_RESIDENT`), **effective_from**, effective_to, legal_basis, brackets (JSONB), self_deduction, dependent_deduction, flat_rate, flat_threshold, allows_deduction |
| `hr_contract_tax_map` | Ánh xạ hợp đồng → phương pháp | id, tenant_id, contract_type, **pit_method**, effective_from, effective_to |
| `hr_attendance` | Chấm công | id, employee_id, work_date, shift_id, check_in, check_out, overtime_hours, late_minutes |
| `hr_leave_requests` | Nghỉ phép | id, employee_id, type, from, to, days, status |
| `hr_payroll_periods` | Kỳ lương | id, tenant_id, year, month, status (`draft`/`locked`/`paid`) |
| `hr_payslips` | Phiếu lương | id, period_id, employee_id, gross, insurance_base, pit, net, **journal_entry_id** |
| `hr_payroll_components` | Thành phần lương | id, payslip_id, code, amount, taxable (`bool`) |

**Bắt buộc:**
- Tất cả có `tenant_id` + RLS (theo chuẩn `journal_entries`)
- Đăng ký vào `RELATIONAL_TABLES` trong `dbService.ts`
- **Giữ khóa ngoại thật** — không lặp lại lỗi `department_id = 'Marketing'` (string) đang có ở `HR.tsx:521`

**Gỡ bỏ:**
- `MOCK_EMPLOYEES`, `MOCK_ATTENDANCE`, `MOCK_PAYROLL`, `MOCK_TEAMS` (`HR.tsx:113/164/231/434`)
- `localStorage['erp_employees']` (`HR.tsx:467–481`)
- `syncToSupabaseEmployees()` (`HR.tsx:520+`) — thay bằng `hrService.upsertEmployee()`

**Quyết định cần Anh chốt:** `EasyHRM.tsx` (2.076 dòng, 0 kết nối) có phải bản lặp của `HR.tsx` không?
→ Nếu đúng: **xóa EasyHRM**, giữ một HR. Tiết kiệm ~2.100 dòng cần bảo trì.

---

### 2.3 — Engine thuế **đa phương pháp** + BHXH + cấu hình luật · **5–6 ngày** · 1 backend + 1 frontend

**Tạo `src/services/vnPayrollService.ts`.**
Thiết kế theo **đa phương pháp thuế + tham số hóa theo thời gian** (§4.1, §4.6).
**Không có hằng số luật nào nằm trong file code này** — mọi thứ đọc từ 5 bảng cấu hình.

```ts
// ── Kiểu ────────────────────────────────────────────────────────────
export type PitMethod  = 'PROGRESSIVE' | 'FLAT_ON_GROSS' | 'NON_RESIDENT';
export type RegionCode = 'I' | 'II' | 'III' | 'IV';
export type ContractType =
  | 'LABOR_3M_PLUS' | 'LABOR_UNDER_3M' | 'SERVICE' | 'PIECEWORK'
  | 'COLLABORATOR'  | 'NONE'
  | 'FOREIGN_OVER_183D' | 'FOREIGN_UNDER_183D';

export interface PitBracket { upTo: number; rate: number; quickDeduction: number }

export interface PitPolicy {
  code: PitMethod; legalBasis: string;
  brackets: PitBracket[] | null;      // PROGRESSIVE
  selfDeduction: number | null;
  dependentDeduction: number | null;
  flatRate: number | null;            // FLAT_ON_GROSS / NON_RESIDENT
  flatThreshold: number | null;       // 5.000.000 đ/lần
  allowsDeduction: boolean;
}

export interface PitResult {
  method: PitMethod;
  taxableIncome: number;   // PROGRESSIVE: sau giảm trừ · FLAT: bằng gross
  pit: number;
  bracketApplied: number | null;
  appliedRate: number;
  belowThreshold: boolean; // < ngưỡng → chỉ khấu trừ khi NLĐ yêu cầu
  legalBasis: string;
}
```

**Hàm công khai:**

```ts
// 1. Giải quyết cấu hình — mọi hàm đều nhận atDate, KHÔNG dùng new Date() ngầm
export async function resolveSalaryBaseline(atDate: string, tenantId?: string): Promise<SalaryBaseline>
export async function resolveInsuranceConfig(atDate: string, tenantId?: string): Promise<InsuranceConfig>
export async function resolvePitMethod(
  contractType: ContractType, atDate: string, tenantId?: string): Promise<PitMethod>
export async function resolvePitPolicy(
  method: PitMethod, atDate: string, tenantId?: string): Promise<PitPolicy>

// 2. Tính — THUẦN, không async, dễ test
export function computeInsurance(p: {
  insuranceSalary: number; regionCode: RegionCode;
  config: InsuranceConfig; baseline: SalaryBaseline;
}): { employee: {social;health;unemployment;total};
      employer: {social;health;unemployment;union;total};
      caps: { socialHealthCap; unemploymentCap } }

export function computePit(p: {
  method: PitMethod;
  grossIncome: number;          // thu nhập trước khi trả
  employeeInsurance?: number;   // chỉ PROGRESSIVE mới trừ
  dependentsCount?: number;
  otherDeductions?: number;     // từ thiện, quỹ hưu trí tự nguyện
  perPayment?: number;          // mức chi trả/lần → so ngưỡng 5tr
  policy: PitPolicy;
}): PitResult

export async function computePayslip(p: {
  employee: HrEmployee; period: HrPayrollPeriod;
  attendance: HrAttendance[]; components: HrPayrollComponent[];
  atDate: string;
}): Promise<PayslipBreakdown>
```

**Quy tắc bắt buộc:**

1. **Mọi hàm nhận `atDate`** — không dùng `new Date()` ngầm. Để chạy lại lịch sử khi luật đổi.
2. **Ba nhánh tính phải tách rành mạch.** `computePit` switch theo `method`:
   - `PROGRESSIVE`: `TNTT = gross − BH − tự nguyện − [self + dependent × N]` → áp bậc
   - `FLAT_ON_GROSS`: `thuế = gross × flatRate` · **không trừ gì cả** ·
     nếu `perPayment < flatThreshold` → `belowThreshold = true` (chỉ khấu trừ khi NLĐ yêu cầu)
   - `NON_RESIDENT`: `thuế = gross × flatRate`
3. **`FLAT_ON_GROSS` không được phép nhận giảm trừ** — nếu truyền `dependentsCount > 0`
   vào nhánh này → **ném lỗi**, không âm thầm bỏ qua.
4. **Ném lỗi khi thiếu dữ liệu bắt buộc:** `insuranceSalary` vượt trần mà không có `regionCode`
   (trần BHTN phụ thuộc vùng).
5. **Làm tròn tiền tệ nhất quán một kiểu** — đề xuất `Math.round` đến đồng, áp dụng ở
   **một chỗ duy nhất** (`roundVnd()`), không rải rác.
6. **Không có policy còn hiệu lực → ném lỗi**, không fallback về hằng số cứng. Thà dừng
   kỳ lương còn hơn phát hành phiếu lương sai.

**Test bắt buộc** (`src/__tests__/vn_payroll.test.ts`, **~40 test**):

*Biểu lũy tiến (`PROGRESSIVE`)*
- Đúng tại **biên** mỗi bậc: 10tr, 30tr, 60tr, 100tr — ranh giới `>`/`≥`
- Giảm trừ 0 / 1 / 3 người phụ thuộc
- `TNTT ≤ 0` → thuế = 0
- `atDate` 2025-12-31 → bộ 7 bậc cũ · 2026-01-01 → bộ 5 bậc mới
- Ví dụ §3.2 (30tr, 0 NPT) → kỳ vọng **835.000**

*Tỷ lệ phẳng (`FLAT_ON_GROSS`)*
- 10tr/lần → khấu trừ 10% (≥ ngưỡng 5tr)
- 4,9tr/lần → `belowThreshold = true`
- **Không được giảm trừ** — truyền `dependentsCount` vào → ném lỗi
- `atDate` 2025-12-31 → ngưỡng 2tr · 2026-01-01 → ngưỡng 5tr
- Đổi `flatRate` thành 0.05 trong config → kết quả đổi theo (**chứng minh không hardcode**)

*Không cư trú (`NON_RESIDENT`)* — đánh dấu `TODO` đến khi đọc xong Điều 64 ND 253/2026

*Trần & đầu vào cơ sở*
- Trần BHXH: 50tr (dưới) · 50,6tr (đúng) · 60tr (bị chặn)
- Trần BHTN: đúng từng vùng I–IV
- Đổi lương cơ sở 2,34tr → 2,53tr thì trần đổi 46,8tr → 50,6tr

*Chống trôi tham số*
- Cảnh báo khi không có baseline/policy còn hiệu lực cho `+90 ngày`
- Ném lỗi khi không có policy cho `atDate`

---

### 2.4 — Bút toán lương vào sổ cái TT99 · **2 ngày** · 1 backend

**Bổ sung COA** (`001_coa.sql` hoặc migration riêng):

```sql
('tenant-vcomm-prod-01','3382','Kinh phí công đoàn',2,'338','liability','credit',FALSE,TRUE,TRUE,TRUE,FALSE,'QC-TT99-001',NULL),
('tenant-vcomm-prod-01','3383','Bảo hiểm xã hội',2,'338','liability','credit',FALSE,TRUE,TRUE,TRUE,FALSE,'QC-TT99-001',NULL),
('tenant-vcomm-prod-01','3384','Bảo hiểm y tế',2,'338','liability','credit',FALSE,TRUE,TRUE,TRUE,FALSE,'QC-TT99-001',NULL),
('tenant-vcomm-prod-01','3386','Bảo hiểm thất nghiệp',2,'338','liability','credit',FALSE,TRUE,TRUE,TRUE,FALSE,'QC-TT99-001',NULL),
```

**Tạo `src/services/payrollAccountingService.ts`:**

```
Mỗi kỳ lương, mỗi nhân viên:
  Nợ  622/627/641/642   = tổng chi phí nhân công (gross + phần DN đóng)
    Có 334              = net phải trả NLĐ
    Có 3383             = BHXH (NLĐ + DN)
    Có 3384             = BHYT (NLĐ + DN)
    Có 3386             = BHTN (NLĐ + DN)
    Có 3382             = KPCĐ (2% DN)
    Có 3335             = thuế TNCN khấu trừ
```

**Yêu cầu:**
- Tổng Nợ = tổng Có (dùng lại `assertBalanced()` đã viết trong `accountingService.ts`)
- **ID bút toán cố định** = `je-payroll-${periodId}-${employeeId}` → idempotent theo cơ chế DELETE+INSERT của adapter (xem `dbService.ts` ~1798)
- Ghi `journal_entry_id` ngược lại `hr_payslips` → truy xuất 2 chiều
- Chặn sửa kỳ lương đã `locked` (cùng cơ chế `closingLockDate`)
- Bridge sang luưu vết Điều 28 qua `bridgeToTt99()` (hiện `TT99_BRIDGE_ENABLED = false` — tự động có hiệu lực khi bật)

---

### 2.5 — Bảng lương & E2E · **2 ngày** · 1 frontend + 1 backend

- UI bảng lương đọc `hr_payslips` thật (thay `MOCK_PAYROLL`)
- Phiếu lương từng nhân viên, in/export PDF
- Khóa kỳ lương → sinh bút toán (2.4)
- **E2E đầu tiên của luồng tiền nhân sự:** tạo NV → chấm công → tính lương → khóa kỳ → kiểm tra bút toán cân bằng trong `journal_entries`

---

### 2.6 — Đối soát & khấu trừ dòng tiền đối tác · **2–3 ngày** · 1 backend (+1 frontend cho 2.6b)

> 🔴 **Hạng mục này không phải "xây mới" — là sửa cái đang sai.** Hoa hồng CTV đang được
> chi nguyên gốc không khấu trừ (§2.5.1), và rút tiền thật đang không vào sổ cái (§2.5.2).

#### 2.6a — Bút toán rút tiền thật · **1 ngày** · **độc lập, không bị chặn bởi 2.2/2.3**

**Hiện trạng:** `confirmPendingApproval(kind='withdrawal')` (`Settlement.tsx:354`) đổi trạng thái
và ghi sổ phụ, **không sinh bút toán**.

**Làm:**
- Gọi `postWithdrawalJournalEntries()` trong nhánh `'withdrawal'` (hiện chỉ 2 luồng MOCK gọi)
- Bổ sung tương tự cho nhánh `'settlement'` (`Settlement.tsx:332`) — hiện cũng chỉ đổi ví + trạng thái
- Giữ **ID bút toán cố định** `je-withdrawal-${id}` → idempotent nhờ cơ chế DELETE+INSERT của adapter
- **Thứ tự bắt buộc:** ghi bút toán **trước**, đổi trạng thái sau; nếu bút toán lỗi → không đổi trạng thái
  (hiện đang làm ngược: đổi trạng thái xong mới alert lỗi, tiền "đã xử lý" mà sổ không có)

**Test:**
```
- rút tiền 10tr → journal_entries có 1 bút toán, Nợ 3388 = Có 1121 = 10tr
- gọi 2 lần → vẫn đúng 1 bút toán (idempotent), không nhân đôi
- bút toán lỗi (vượt closingLockDate) → status vẫn 'pending', không thành 'processed'
```

#### 2.6b — Khấu trừ tại nguồn **theo cấu hình loại đối tác** · **2–3 ngày** · chặn bởi 2.3

> ⚙️ **Thiết kế đã thay đổi theo quyết định #8 & #9 của Anh.** Không còn là
> "có khấu trừ hay không" — mà là **đọc cấu hình**. Xem §4.9.

**Hiện trạng:** `postWithdrawalJournalEntries()` sinh 2 dòng, không có `3335`.
TK `3335` tồn tại trong COA nhưng **chưa từng được ghi**. Ba loại đối tác
(CTV / Điểm nhận / Seller) đang **dùng chung một hàm** dù bản chất pháp lý khác nhau.

**Làm — 4 bước:**

| Bước | Việc |
|---|---|
| 0 | 🔴 **Báo cáo rủi ro trước** (0,5 ngày, làm ngay không cần chờ): liệt kê Seller đang hoạt động + loại hình + doanh thu từ 01/7/2025. Xem §4.10 |
| 1 | Thêm `entity_type` vào đối tác (bắt buộc, không NULL) + 3 bảng `hr_withholding_config` (§4.6 ⑤) · `hr_withholding_accruals` (§4.9.2) · `hr_platform_tax_rates` (§4.10), kèm RLS. Migration `007_withholding.sql` |
| 2 | Thêm `resolveWithholdingRule(partnerType, entityType, atDate)` + `computeWithholding(rule, gross, ctx)` vào `vnPayrollService.ts` (§4.9.5) |
| 3 | Sửa `postWithdrawalJournalEntries()` nhận thêm `partnerType` + `entityType` → **đọc cấu hình**, sinh bút toán theo `regime` + `mode` |
| 4 | Màn hình **"Khấu trừ đối tác"** trong HRM: ma trận 3×3 × công tắc 3 trạng thái; cảnh báo trên `Settlement.tsx` khi `mode = WARN` |

**Bút toán theo `mode`:**

```
mode = WITHHOLD                      mode = WARN / OFF
  Nợ  3388  = gross                    Nợ  3388  = gross
    Có 3335 = thuế khấu trừ              Có 1121  = gross
    Có 1121 = gross − thuế           (WARN: + ghi hr_withholding_accruals
                                      để theo dõi nghĩa vụ chưa nộp)
```

**Bắt buộc:**
- Tỷ lệ & ngưỡng đọc từ `hr_pit_policies` (qua `hr_withholding_config`) — **không** từ hằng số.
  Câu hỏi #0 (5% hay 10%) vì vậy trở thành **một ô dữ liệu**
- **Tách `partnerType` ngay từ đầu** (quyết định #9): `AGENT` · `PICKUP_HUB` · `SELLER`
- **Không có nhánh `if (partnerType === 'seller')` nào trong code.** Mọi phân biệt nằm trong dữ liệu.
  Muốn đổi hành vi Seller → đổi bảng, có vết thẩm tra, không phải đổi code
- **Thiếu cấu hình cho một loại đối tác → NÉM LỖI, từ chối chi.** Không mặc định ngầm thành `OFF`
  (§4.9.5) — chính "không có gì thì cứ chi" đã tạo ra lỗ hổng §2.5.1
- Seed khởi tạo: `AGENT = WARN` · `PICKUP_HUB = OFF` · `SELLER = OFF` (§4.6 ⑤)

**Test (~12, thêm vào bộ 2.6b):**
```
- AGENT mode=WARN      20tr → netPaid 20tr · shouldHaveWithheld 2tr · accrual ĐƯỢC ghi
- AGENT mode=WITHHOLD  20tr → Nợ 3388 20tr · Có 3335 2tr · Có 1121 18tr · cân bằng
- SELLER (mode=OFF)    20tr → netPaid 20tr · không khấu trừ · KHÔNG có accrual
- gross 4,5tr < ngưỡng 5tr  → shouldHaveWithheld = 0 · belowThreshold = TRUE
- đổi mode WARN → WITHHOLD trong DB → cùng khoản chi ra kết quả khác · KHÔNG sửa code
- override flatRate 0.05 đè policy 0.10 → dùng 0.05
- thiếu rule cho partnerType → NÉM LỖI · không chi
- đổi flat_rate 0.10 → 0.05 trong config → kết quả đổi theo
```

> 💡 **Bước 1 + 2 (~1 ngày) có thể tách ra làm trước.** Chỉ là migration và hàm thuần —
> **không cần UI, không đợi engine lương 2.3 hoàn chỉnh**. Làm xong là hệ thống đã bắt đầu
> **ghi nhận nghĩa vụ** ở mọi lần chi CTV, dù bút toán vẫn 2 chân. Đây là cách rẻ nhất để Anh
> có câu trả lời cho câu hỏi: *"đang nợ bao nhiêu tiền thuế chưa khấu trừ?"*

---

### 4.2 / 4.3 — CRM (sau GĐ4.1) · **4 ngày**

| Việc | Hiện trạng | Làm |
|---|---|---|
| **Nối `crmService`** | Orphan, chỉ `Orders.tsx` gọi | `Customers.tsx` gọi `calculateRfmScores` + `addLoyaltyPoints`; `CustomerService.tsx` gọi `createSupportTicket` → xóa 2 mảng MOCK |
| **Sellers KYC** | `sellerKycService` chỉ `PIM.tsx` dùng | Gắn vào luồng duyệt seller trong `Sellers.tsx` — KYC là điều kiện tiên quyết để bán |
| **`Sales.tsx`** | 0 kết nối, 0 service | **Quyết định:** hoặc xây pipeline thật (`hr_pipeline`, `hr_opportunities`), hoặc **xóa khỏi menu**. Không giữ màn hình demo trong ERP |
| **CSKH SLA** | `support_tickets` có bảng nhưng UI dùng MOCK | Chuyển sang đọc/ghi bảng thật |

---

### Không làm (ghi rõ để không lặp lại)

- ❌ **EasyHRM.tsx** — đề xuất sát nhập/xóa (chờ Anh chốt)
- ❌ **GĐ5 hiệu năng** — đã loại theo quyết định #1
- ❌ **HRM-AI / AI chấm điểm nhân viên** — VietERP có, nhưng 0 sao/0 fork/ngừng commit từ 01/4/2026; không có giá trị tham chiếu thực tế
- ❌ **Tuyển dụng ATS, đào tạo** — chưa có nhu cầu nghiệp vụ VComm

---

## 7. Ước lượng & thứ tự

| Hạng mục | Ngày (2 BE + 1 FE) | Ngày (1 người) |
|---|---:|---:|
| 2.2 Lõi dữ liệu nhân sự | 3–4 | 6–8 |
| 2.3 Engine thuế **đa phương pháp** + BHXH + **màn hình cấu hình HRM** (§4.8) | **6–8** | **11–14** |
| 2.4 Bút toán lương | 2 | 3–4 |
| 2.5 Bảng lương + E2E | 2 | 3–4 |
| **2.6 Đối soát & khấu trừ dòng tiền đối tác** 🔴 | **4–6** | **7–9** |
| 4.2 + 4.3 CRM | 4 | 7–8 |
| **TỔNG** | **21–26** | **37–47** |

**Chặn:** 2.2 → 2.3 → 2.4 → 2.5 (tuần tự, không song song được) · 2.3 → 2.6b
**Độc lập:** **2.6a không bị chặn bởi gì cả** — có thể làm ngay sau 2.1, hoặc kéo lên trước 2.2

**Với 1 người theo quyết định #1**, nhóm này cộng thêm **37–47 ngày** vào lộ trình 11–15 tuần của spec 023.

> **2.6 tăng 2–3 → 4–6 ngày**, qua hai lần điều chỉnh:
>
> 1. **#8 "cấu hình riêng"** (2–3 → 3–4): thêm 2 bảng + công tắc 3 trạng thái + màn hình cấu hình.
>    Mua lại được: không phải chọn giữa "dừng chi ngay" và "chấp nhận rủi ro";
>    và **biết chính xác đang nợ bao nhiêu tiền thuế chưa khấu trừ**.
> 2. **#10 "cá nhân / pháp nhân"** (3–4 → 4–6): thêm trục `entity_type` (ma trận 3×9 dòng seed),
>    bảng thứ 6 `hr_platform_tax_rates`, và **bước 0 báo cáo rủi ro NĐ 252/2026**.
>
> ⚠️ **2.6 có thể phình to hơn nữa** nếu câu hỏi #11 trả lời là "có":
> nghĩa vụ sàn TMĐT là **khấu trừ theo từng giao dịch**, không phải theo lần chi —
> tức phải nối vào `postOrderJournalEntries()`, không chỉ luồng rút tiền.
> Khi đó nên tách thành **2.7 Nghĩa vụ sàn TMĐT** độc lập, ước lượng riêng.

> ⭐ **Nếu Anh chỉ chọn một việc trong toàn bộ spec này: hãy làm 2.6a trước (1 ngày).**
> Nó không cần HR core, không cần engine thuế, không cần migration — chỉ là nối một
> lời gọi hàm đã tồn tại vào một luồng đang thiếu nó. Và nó sửa đúng chỗ tiền thật đang thoát khỏi sổ cái.

> **2.3 tăng từ 3 → 5–6 ngày** so với bản nháp đầu, vì đổi từ "một bảng tham số" sang
> **đa phương pháp + 5 bảng cấu hình + màn hình cấu hình**. Phần tăng này là chi phí trực tiếp
> của yêu cầu "luật thay đổi liên tục" — trả một lần, không phải trả lại mỗi năm.

---

## 8. Câu hỏi — 5 đã chốt, 9 còn mở

### 8.1 ✅ Đã trả lời (02/09/2026)

| # | Câu hỏi | Trả lời | Hệ quả |
|---|---|---|---|
| **6** | VComm có dùng **cộng tác viên / khoán việc** không? | **CÓ — đã xác nhận bằng đo lường.** KOL/KOC & Affiliate là mục menu cấp 1 (`constants.ts:77`), có dữ liệu đối tượng, có hoa hồng quy mô trăm triệu (`Affiliate.tsx`), được đo riêng trong BI (`AnalyticsBI.tsx:825`), đã có luồng duyệt chi (`Settlement.tsx:105`) | CTV/KOL/Publisher/Đại lý → **`FLAT_ON_GROSS`**. Thiết kế một biểu thuế duy nhất sẽ **sai toàn bộ nhóm này**. Chi tiết §2.5 |
| **7** | Ai cập nhật **tham số luật** hàng năm? | **HR cập nhật trực tiếp trong module HRM** | Tham số luật **không được nằm trong code** (HR không deploy). Bắt buộc có màn hình cấu hình + vết thẩm tra TT99 Điều 28 + phân quyền `HR_MANAGER`. Chi tiết §4.8 · 2.3 tăng 5–6 → **6–8 ngày** |
| **8** 🔴 | Hoa hồng CTV đang chi nguyên gốc — dừng lại để khấu trừ ngay, hay chấp nhận rủi ro đến 2.6b? | **"Cấu hình riêng"** — không chọn cả hai. Biến nó thành **dữ liệu**, không phải quyết định code | Thêm bảng `hr_withholding_config` với **công tắc 3 trạng thái**: `WITHHOLD` · `WARN` · `OFF`. Seed `AGENT = WARN` → **tiền vẫn chảy nhưng bắt đầu ghi nhận nghĩa vụ**, kèm sổ `hr_withholding_accruals` để biết chính xác đang nợ bao nhiêu. Chi tiết §4.9 · 2.6b tăng 1–2 → **2–3 ngày** |
| **9** | Phí Điểm nhận & Seller payout có chịu khấu trừ TNCN không? | **Đồng ý tách `partnerType` ngay từ đầu, và bổ sung vào cấu hình thuế** | Tách `AGENT` / `PICKUP_HUB` / `SELLER` thành 3 hàng cấu hình, **không có nhánh `if (partnerType === 'seller')` nào trong code**. Chi tiết §4.6 ⑤ và §4.9.3 — *⚠️ seed sau đó đã sửa, xem §4.10* |
| **10** | Phí Điểm nhận là phí vận hành hay thù lao cá nhân? | **"Cấu hình theo cả cá nhân / pháp nhân"** — Anh không trả lời câu hỏi mà **xóa nó đi**: không cần đoán bản chất khoản chi, chỉ cần biết **người nhận là ai** | Thêm trục `entity_type` (`INDIVIDUAL` / `HOUSEHOLD_BUSINESS` / `LEGAL_ENTITY`) → ma trận **3×3** thay vì 3 hàng. Hóa ra đúng hơn câu hỏi gốc: **thuế TNCN chỉ đánh cá nhân — khấu trừ của pháp nhân là sai bản chất thuế**. Chi tiết §4.9.6 |

### 8.2 ❓ Còn mở

> **📌 Câu hỏi #0 là gì?** *(Anh hỏi "đây là gì" — giải thích lại từ đầu)*
>
> Đây là câu hỏi về **một con số**: khi VComm trả thù lao cho người **không ký hợp đồng
> lao động** (CTV, KOL, khoán việc, dịch vụ), thì **khấu trừ bao nhiêu phần trăm**?
>
> | | Tỷ lệ | Nguồn |
> |---|---|---|
> | Anh nói | **5%** | Trải nghiệm thực tế |
> | Văn bản tôi đọc được | **10%** | **ND 253/2026/NĐ-CP Điều 50.2** (đăng Chinhphu.vn 03/7/2026), ngưỡng 5 triệu/lần |
>
> Chỉ vậy thôi — **một con số**. Nhưng nó là chìa khóa vì: công tắc `AGENT` đang ở `WARN`
> (chi nguyên gốc, chỉ ghi nhận nghĩa vụ). Muốn gạt sang `WITHHOLD` (khấu trừ thật)
> thì phải biết khấu trừ bao nhiêu. **Chọn sai số = khấu trừ sai của từng CTV.**
>
> Điểm đáng chú ý: **Anh và văn bản chỉ đồng thuận ở ngưỡng 5 triệu, không đồng thuận ở tỷ lệ.**
> Có thể Anh đang nhớ công thức cũ (TT 111/2013 có mức 5% cho một số trường hợp),
> hoặc nhớ quy định nội bộ. Không rõ — và **không cần tranh luận**, vì engine để
> `flat_rate` là một ô dữ liệu: Anh chốt số nào, HR điền số đó.
>
> **Việc cần Anh làm: chọn 5 hoặc 10** (hoặc chỉ đạo kế toán/tư vấn thuế xác nhận).

| # | Câu hỏi | Đề xuất |
|---|---|---|
| **0** ⚠️ | **Tỷ lệ khấu trừ `FLAT_ON_GROSS`: 5% hay 10%?** Anh nêu 5%; **ND 253/2026/NĐ-CP Điều 50.2** (đăng trên Chinhphu.vn 03/7/2026) ghi **10%**, ngưỡng 5 triệu/lần (khớp với Anh) | Engine để `flat_rate` là **tham số cấu hình** — Anh chốt số nào cũng được. Mặc định tạm **10%** theo văn bản hiện hành |
| **1** | `EasyHRM.tsx` (2.076 dòng, 0 kết nối) có phải bản lặp của `HR.tsx`? | Nếu đúng → xóa, giữ 1 module HR |
| **2** | `Sales.tsx` (411 dòng, 0 kết nối) — xây thật hay xóa khỏi menu? | Xóa khỏi menu nếu chưa có quy trình bán hàng B2B |
| **3** | VComm có nhân sự hưởng lương thật chưa (bao nhiêu người)? Nếu đang <10 người và tính tay qua Excel → 2.2–2.5 có thể lùi xuống GĐ4 | Cần biết để xếp ưu tiên |
| **4** | Vùng lương tối thiểu (I/II/III/IV) của từng chi nhánh/VComm Hub? | Cần cho trần BHTN và cảnh báo sàn lương |
| **5** | Có cần sinh tờ khai BHXH (D02-TS, D03-TS) và quyết toán TNCN từ hệ thống không? | Nếu có nhân sự thật → nên có, nhưng để GĐ4 |
| **11** | 🔴 **VComm có thuộc diện "nền tảng TMĐT có chức năng thanh toán" (NĐ 252/2026 Điều 3.5/3.6) không?** Nếu có → nghĩa vụ khấu trừ thay (GTGT + TNCN) trên từng giao dịch của Seller cá nhân/hộ KD. Nghĩa vụ có từ 01/7/2025 (NĐ 117/2025) và **tiếp tục dưới NĐ 252/2026 từ 01/7/2026**; 🔴 tỷ lệ cố định 1%/0,5% của NĐ 117/2025 có thể đã đổi sang tính theo % luật thuế GTGT/TNCN (Điều 44 NĐ 252/2026) — CẦN RÀ LẠI | 6 dấu hiệu trong code (ví tiền, rút tiền, đối soát COD, settlements...) cho thấy là **có**. Cần tư vấn thuế xác nhận → nếu đúng, đây là việc **trước cả TSCĐ**. Xem §4.10 |
| **12** | 🔴 **NĐ 117/2025 đã bị thay thế bởi NĐ 252/2026 (HL 01/7/2026) — phải rà lại toàn bộ.** Các số Điều (3.1/4/5/6/7/8/11) và ma trận tỷ lệ cố định 1%/0,5% được trích từ NĐ 117/2025; dưới NĐ 252/2026 tương ứng ở Điều 3.5/3.6, 44, 45 và tỷ lệ tính theo luật thuế GTGT/TNCN/TNDN | Đọc nguyên văn NĐ 252/2026 trên Chinhphu.vn trước khi seed `hr_platform_tax_rates` — **KHÔNG seed bảng tỷ lệ cố định cũ** |
| **13** | **Các Seller hiện tại của VComm: bao nhiêu cá nhân, bao nhiêu hộ KD, bao nhiêu doanh nghiệp?** Hiện không có trường `entity_type` nên không ai biết | Báo cáo bước 0 của 2.6b (~0,5 ngày). Quyết định mức độ rủi ro của câu hỏi #11 |

---

## 9. Rủi ro & điều kiện tiên quyết

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| **Luật 109/2025 có hiệu lực 01/7/2026 nhưng áp dụng cho cả năm 2026** — Q1–Q2/2026 có thể đã khấu trừ theo biểu cũ | 🟡 | Engine có `effectiveFrom` → tính lại được; quyết toán 2026 sẽ bù trừ |
| **Lương cơ sở / trần / lương tối thiểu vùng thay đổi hàng năm** | 🟡 | Tham số lưu bảng + `effectiveFrom`; có test cảnh báo khi bộ tham số sắp hết hạn |
| **Hoa hồng CTV đã chi nguyên gốc, chưa khấu trừ TNCN** — số tiền càng lớn, truy thu + phạt chậm nộp càng cao | 🔴 | **Đang diễn ra.** Quyết định #8: seed `AGENT = WARN` → vẫn chi nhưng **ghi nhận nghĩa vụ** qua `hr_withholding_accruals`, trả lời được "đang nợ bao nhiêu". Chuyển sang `WITHHOLD` = đổi một ô dữ liệu |
| **Luồng rút tiền thật không sinh bút toán** → sổ cái thiếu dòng tiền, lệch với sổ phụ đối tác | 🔴 | **Đang diễn ra.** 2.6a sửa trong 1 ngày, không bị chặn |
| Ba luồng chi khác nhau (CTV / Seller / Điểm nhận) dùng chung một hàm hạch toán → bản chất pháp lý khác nhau nhưng xử lý như nhau | 🟡 | **Đã giải quyết theo quyết định #9:** tách thành 3 hàng trong `hr_withholding_config`, không có nhánh `if` nào trong code. Seed `SELLER = OFF`, `PICKUP_HUB = OFF` |
| **`WARN` có thể bị hiểu nhầm là "đã xử lý"** — nghĩa vụ được ghi nhưng tiền chưa nộp, dễ thành cảm giác an toàn giả | 🟡 | Sổ accruals phải có cột `settled_at` và **dashboard hiển thị số dư nợ thuế chưa nộp**, không chỉ số đã ghi nhận. Cảnh báo nhắc lại khi vượt ngưỡng thời gian |
| **Thiếu cấu hình thì ném lỗi** → nếu seed không đủ tổ hợp, mọi lần chi đều bị chặn | 🟡 | Migration `007_withholding.sql` **phải** seed đủ **9 dòng** (3 đối tác × 3 loại hình) + test kiểm tra seed tồn tại. Đây là hành vi chủ đích (không mặc định ngầm thành `OFF`), nhưng cần seed đầy đủ |
| 🔴 **Nghĩa vụ sàn TMĐT (NĐ 252/2026, hiệu lực 01/7/2026, thay thế NĐ 117/2025) có thể đang bị vi phạm** — khấu trừ thay (GTGT + TNCN) trên từng giao dịch của Seller cá nhân/hộ KD. Nghĩa vụ có từ 01/7/2025 (NĐ 117/2025); 🔴 tỷ lệ cố định 1%/0,5% có thể đã đổi sang % luật thuế (Điều 44 NĐ 252/2026) — CẦN RÀ LẠI. Lâu hơn lỗ hổng CTV vì **đã hiệu lực hơn 14 tháng** | 🔴 | **Làm ngay bước 0 của 2.6b** (0,5 ngày): báo cáo Seller + loại hình + doanh thu từ 01/7/2025 (và tiếp tục từ 01/7/2026). Nếu phần lớn là cá nhân → đưa lên **trước 2.1**. Cần tư vấn thuế xác nhận (câu hỏi #11) |
| 🔴 **NĐ 252/2026 thay thế NĐ 117/2025 (HL 01/7/2026) — CHƯA đối chiếu nguyên văn.** Các số Điều và ma trận tỷ lệ cố định dưới đây lấy từ NĐ 117/2025, chưa rà lại theo NĐ 252/2026 (Điều 3.5/3.6, 44, 45; tỷ lệ tính theo luật thuế GTGT/TNCN/TNDN) | 🔴 | Đọc nguyên văn NĐ 252/2026 trên Chinhphu.vn trước khi seed `hr_platform_tax_rates` (câu hỏi #12). **Không viết code dựa trên nguồn thứ cấp** |
| **Không có `entity_type` trên đối tác** → không biết Seller nào là cá nhân, không ước lượng được mức độ rủi ro | 🟡 | Trường bắt buộc trong migration 2.6b; nối `sellerKycService` (hiện chỉ `PIM.tsx` dùng) để xác thực loại hình + MST |
| Thiếu mã TK `3382/3383/3384/3386` → bút toán lương không ghi được | 🔴 | Làm trong 2.4, trước khi sinh bút toán |
| `hr_employees` chưa có RLS → lộ dữ liệu lương chéo tenant | 🔴 | Migration 2.2 phải kèm RLS, copy pattern từ `journal_entries` |
| Hiện tại không có dữ liệu lương nào để migrate | 🟢 | Không có → 2.2 là "xây mới", không có rủi ro di chuyển |
| Số liệu trong mục 3.2 ước tính trên 1 nhân viên | 🟢 | Chỉ dùng để minh họa mức độ; test mới là nguồn chân lý |

---

## 10. Tài liệu tham chiếu

| Nguồn | Dùng cho |
|---|---|
| **Luật 109/2025/QH15** (10/12/2025, hiệu lực 01/7/2026, áp dụng từ kỳ tính thuế 2026) | Biểu thuế 5 bậc |
| **Nghị định 253/2026/NĐ-CP** (Điều 50 — khấu trừ thuế) | **Đa phương pháp thuế**: HĐLĐ ≥3 tháng → lũy tiến; không HĐ/HĐ <3 tháng → **10%**, ngưỡng **5tr/lần**; không cư trú → Điều 64 |
| **Nghị quyết 110/2025/UBTVQH15** (17/10/2025, hiệu lực 01/01/2026) | Giảm trừ 15,5tr / 6,2tr |
| **Nghị định 293/2025/NĐ-CP** (10/11/2025, hiệu lực 01/01/2026, thay ND 74/2024) | Lương tối thiểu vùng: I **5,31tr** · II **4,73tr** · III **4,14tr** · IV **3,70tr** (giờ: 25.500 / 22.700 / 20.000 / 17.800) |
| Mức lương cơ sở **2.530.000 đ** từ 01/7/2026 | Trần BHXH 20× = 50.600.000 |
| 🔴 **Nghị định 252/2026/NĐ-CP** (ký 30/6/2026, hiệu lực **01/7/2026**, thay thế NĐ 117/2025) | **Nghĩa vụ sàn TMĐT.** 🔴 Điều 44: chủ quản nền tảng có chức năng thanh toán phải **khấu trừ + nộp thay GTGT & TNCN (& TNDN với tổ chức NN)** cho hộ/cá nhân, thời điểm = giao dịch thành công. Số thuế xác định theo **% thuế suất luật thuế GTGT/TNCN/TNDN trên doanh thu VN từng giao dịch** (KHÔNG còn ma trận cố định 1%/0,5% của NĐ 117/2025). Điều 45: đăng ký thuế, MST riêng, kê khai tháng, bù trừ hủy/trả hàng. Định nghĩa "có chức năng thanh toán" → Điều 3.5/3.6. *(Các số Điều 4/5/6/7/8/11 và tỷ lệ cố định dưới đây lấy từ NĐ 117/2025 — rà lại theo NĐ 252/2026 trước khi seed.)* |
| ⚠️ **Điều 44, 45 (và Điều 3.5/3.6) NĐ 252/2026** | Tương ứng với Điều 6/7/8/11/3.1 NĐ 117/2025 — ngưỡng miễn · định nghĩa "giao dịch thành công" · trách nhiệm sàn chỉ cung cấp hạ tầng · thu hộ — **CẦN ĐỌC NGUYÊN VĂN trước khi seed `hr_platform_tax_rates`** |
| ⚠️ **Điều 64 ND 253/2026** | Tỷ lệ cá nhân **không cư trú** — **CHƯA ĐỌC**, đánh dấu TODO trong engine |
| `specs/021-tt99-ke-toan-doanh-nghiep/migrations/001_coa.sql` | Kiểm tra mã TK 334/3382/3383/3384/3386 |
| `specs/023-doi-chieu-module-ke-hoach-tong-the.md` | Kế hoạch tổng thể GĐ1–GĐ4 |
| GitHub `tannhdev/viet-erp` tree (13.070 entries, `truncated: false`) | Đo đối thủ |
| `apps/HRM-AI/src/lib/compliance/{tax,insurance}/constants.ts` | **Tham chiếu kiến trúc — không dùng hằng số** |

---

## 11. Nhật ký đo lường (có thể kiểm chứng lại)

```
# Kích thước 9 module
du -k + wc -l trên src/components/{Sellers,Customers,CustomerService,Sales,HR,EasyHRM,OrgStructure,Performance,EmployeeDetailModal}.tsx

# Kết nối dữ liệu
grep -c "supabase" <file>            → Customers 27 · CustomerService 3 · Sellers 1 · EasyHRM 0 · Performance 0 · OrgStructure 0 · Sales 0
grep -c "localStorage" <file>        → HR 6 · Customers 6 · CustomerService 2
grep -E "const [A-Z_]*(MOCK|DEMO)_"  → HR 4 · CustomerService 2 · Sellers 1 · Performance 2 · Sales 1

# Bảng đã đăng ký
grep -A2 RELATIONAL_TABLES src/services/dbService.ts   → chỉ có 'customers', 'sellers', 'support_tickets'
                                                          KHÔNG có employees/payroll/departments/kpi

# Mã TK trong seed
grep -E "^'tenant-vcomm-prod-01','33[0-9]*'" specs/.../001_coa.sql
                                                          → 334 CÓ · 338 CÓ · 3382/3383/3384/3386 KHÔNG

# Đối thủ
curl api.github.com/repos/tannhdev/viet-erp/git/trees/main?recursive=1   → 13.070 entries, truncated:false
curl raw.githubusercontent.com/.../tax/constants.ts                      → 7 bậc, NQ 954/2020
curl raw.githubusercontent.com/.../insurance/constants.ts                → BASE_SALARY_2024 = 1.800.000

# ── Đợt 3: kênh CTV & lỗ hổng khấu trừ (02/09/2026) ──────────────────

# Kênh cộng tác viên có thật không?
grep -rn "cộng tác viên|CTV|khoán việc|KOL" src/ -i   → 66 dòng khớp
  constants.ts:77          'KOL/KOC & Affiliate', path:'/affiliate', "Mạng lưới cộng tác viên và tiếp thị liên kết"
  Affiliate.tsx:27-64      type:'kol', commissionEarned 125tr / 850tr / 350tr
  FlashSale.tsx:140         kolCommission = 5 (%)   ← đầu vào của giá
  AnalyticsBI.tsx:825-830   "Hiệu Quả Kênh CTV / Sellers" · "Tổng GMV CTV"
  Customers.tsx:989         tag "#KOL / INFLUENCER"
  EmployeeDetailModal.tsx:464  <option value="contract">Cộng tác viên (Contractor)</option>
  Settlement.tsx:105        confirm('Duyệt chi trả hoa hồng cho CTV này?')

# Lỗ hổng A: không khấu trừ
grep -cn "thuế|TNCN|khấu trừ|3335|pitAmount|withhold" src/components/Settlement.tsx   → 0   (832 dòng)
grep -rn "3335" src/ specs/ -i
  → CHỈ specs/021-tt99-.../001_coa.sql:272 có định nghĩa; src/ KHÔNG có → TK mồ côi

# Lỗ hổng B: luồng thật không ghi sổ
grep -rn "postWithdrawalJournalEntries" src/
  → Settlement.tsx:107 (approveAffiliateSettlement, MOCK) · :135 (approvePickupSettlement, MOCK)
  → KHÔNG có trong confirmPendingApproval(kind='withdrawal') :354 (luồng Supabase thật)
sed -n '354,369p' src/components/Settlement.tsx
  → chỉ updateDoc(status) + recordPartnerLedgerEntry()  ·  KHÔNG có journal entry
```
