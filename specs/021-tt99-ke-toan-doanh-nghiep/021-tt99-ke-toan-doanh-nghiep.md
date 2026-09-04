# SPEC 021 — Áp dụng Thông tư 99/2025/TT-BTC cho module Tài chính kế toán

**Ngày lập:** 01/09/2026
**Trạng thái:** Đang triển khai
**Thay thế:** SPEC 020 (TT88/2021 — đã lưu trữ tại `specs/_archived/020-tt88-compliance/`)

---

## 1. Căn cứ pháp lý

**Thông tư 99/2025/TT-BTC** — Ban hành 27/10/2025, **có hiệu lực 01/01/2026**, áp dụng cho
năm tài chính bắt đầu từ hoặc sau 01/01/2026. Hướng dẫn **Chế độ kế toán doanh nghiệp**.

- **Điều 31** — TT99 thay thế **TT200/2014/TT-BTC** (và các văn bản sửa đổi bổ sung: TT75/2015,
  TT53/2016, TT195/2012).
- **Điều 11** — Hệ thống tài khoản: **chỉ tài khoản cấp 1 là bắt buộc** (71 TK). Doanh nghiệp
  được **tự chủ hoàn toàn** cấp 2 / cấp 3: sửa đổi tên, số hiệu, kết cấu, nội dung phản ánh —
  **không cần xin phép Bộ Tài chính** — nhưng phải đảm bảo (a) phân loại đúng bản chất,
  (b) không trùng lặp đối tượng, (c) không ảnh hưởng chỉ tiêu trên BCTC, và (d) phải được quy
  định trong **Quy chế hạch toán kế toán** (Điều 9(2), 11(2), 12(2), 18(1)).
- **Điều 12** — Sổ kế toán: 42 mẫu sổ tham khảo tại Phụ lục III (giảm từ 45 mẫu của TT200).
  Doanh nghiệp được tự thiết kế sổ phù hợp.
- **Điều 13** — Mở sổ / ghi sổ / khóa sổ.
- **Điều 7** — Đơn vị trực thuộc: báo cáo của đơn vị trực thuộc phải được **hợp nhất** vào BCTC
  của đơn vị cấp trên, **loại bỏ toàn bộ giao dịch nội bộ**. TT99 **không còn** khái niệm
  "Báo cáo tài chính tổng hợp".
- **Điều 14–27** — Báo cáo tài chính.
- **Điều 28** — Phần mềm kế toán (áp dụng từ 01/01/2026): phải **lưu vết thay đổi** theo thời
  gian (audit trail), **ngăn chặn xoá/sửa trái phép**, **xuất dữ liệu kịp thời** cho cơ quan
  thuế, tích hợp hóa đơn điện tử / chữ ký số / ngân hàng.
- **Điều 3** — Quy chế quản trị nội bộ.
- **Điều 4–6** — Đơn vị tiền tệ kế toán (VND) và tỷ giá hối đoái.

**Luật Kế toán 2015 Điều 27** — Không được tẩy xoá. Sửa sai chỉ bằng 3 cách:
**ghi cải chính** (sai chưa ảnh hưởng sổ cái), **ghi số âm** (ghi lại bút toán ngược),
**ghi điều chỉnh** (bổ sung bút toán).

---

## 2. Quyết định của chủ dự án (01/09/2026)

Khi được hỏi phạm vi áp dụng:

| Câu hỏi | Trả lời |
|---|---|
| Phạm vi | **Chỉ TT99, gỡ TT88** |
| Ưu tiên 1 | **Lõi: tài khoản + sổ cái + BCTC** |
| Ưu tiên 2 | **Điều 28 — phần mềm kế toán** (lưu vết, chống xoá/sửa, xuất dữ liệu) |
| Ưu tiên 3 | **Hợp nhất đơn vị trực thuộc** (loại bỏ giao dịch nội bộ) |
| Ưu tiên 4 | **Doanh thu theo IFRS 15** (5 bước) |

### 2.1 Hệ quả quan trọng nhất

TT99 (kế toán **doanh nghiệp**) và TT88 (kế toán **hộ kinh doanh**) **không thay thế cho nhau**.
Chủ dự án chọn: **mọi chủ thể trong VComm ERP — kể cả hộ kinh doanh, cá nhân kinh doanh trên sàn —
đều hạch toán theo chế độ kế toán doanh nghiệp (TT99)**.

Hệ quả kỹ thuật:
- Chỉ có **một** hệ thống tài khoản, **một** chuẩn ghi nhận doanh thu, **một** bộ BCTC.
- 7 sổ S1–S7-HKD của TT88 **không** được dùng.
- Biểu thuế TT40/2021 (1,5% / 3% / 4,5% / 7%) **không bị mất** — nó là nghĩa vụ **thuế**, được
  chuyển sang module Thuế (`taxService.ts`), tách khỏi module Kế toán.

### 2.2 Khoảng trống thực tế đang có

Module Tài chính hiện tại (spec 009, `journal_entries`, `accountingService.ts`) đang dùng hệ
tài khoản **TT200/2014** — văn bản đã **hết hiệu lực 01/01/2026**:

```
131   Phải thu của khách hàng   → TT99 giữ nguyên ✅
5111  Doanh thu bán hàng        → TT99: 511 (cấp 1) ✅
33311 Thuế GTGT đầu ra          → TT99: 3331 ✅
632   Giá vốn hàng bán          → TT99 giữ nguyên ✅
156   Hàng hóa                  → TT99 giữ nguyên ✅
641   Chi phí bán hàng          → TT99 giữ nguyên ✅
3388  Phải trả, phải nộp khác   → TT99 giữ nguyên ✅
1121  Tiền gửi ngân hàng        → ⚠️ TT99: 112 đổi tên thành "Tiền gửi không kỳ hạn"
```

Các tài khoản dùng hiện tại **đều còn tồn tại trong TT99** (trừ cần đổi tên 112). Vì vậy đây
không phải "viết lại từ đầu", mà là: **(a) chuẩn hóa hệ tài khoản thành dữ liệu**,
**(b) bổ sung các cấu trúc TT99 bắt buộc mà hiện chưa có** (kỳ kế toán khóa được, lưu vết,
đơn vị trực thuộc, IFRS 15), **(c) đổi tên BCTC**.

---

## 3. Thiết kế

### 3.1 Nguyên tắc nền tảng

| # | Nguyên tắc | Lý do |
|---|---|---|
| N1 | **Hệ tài khoản là DỮ LIỆU, không phải code** | Điều 11 cho phép DN tự mở/sửa TK cấp 2–3. Hardcode trong code sẽ phải sửa code mỗi lần đổi TK. Seed 71 TK cấp 1 vào bảng `acc_accounts`. |
| N2 | **Cân bằng Nợ/Có được kiểm tra ở DB** | Trigger `SUM(debit) = SUM(credit)` trên mỗi chứng từ. Không tin tưởng tầng ứng dụng. |
| N3 | **Chứng từ đã ghi sổ không được sửa, không được xoá** | Điều 28 + Luật KT Điều 27. Sửa sai = tạo bút toán đảo (`reversal_of`). |
| N4 | **Số dư luôn tính, không lưu** | Nhất quán với quyết định ở spec 020. Tránh lệch giữa số dư lưu và tổng phát sinh. |
| N5 | **Lưu vết chuỗi băm (hash chain)** | Điều 28 yêu cầu phát hiện can thiệp. Mỗi bản ghi lưu vết chứa `prev_hash`; sửa một bản ghi cũ sẽ làm gãy chuỗi → cảnh báo can thiệp. |
| N6 | **Giao dịch nội bộ bị gắn cờ ngay khi ghi** | Điều 7 yêu cầu loại bỏ khi hợp nhất. Gắn cờ sau rất khó truy vết. |

### 3.2 Danh sách bảng

| # | Bảng | Mục đích | Điều |
|---|---|---|---|
| 1 | `acc_accounts` | 71 TK cấp 1 TT99 + TK chi tiết do DN tự mở | 11 |
| 2 | `acc_currencies` | Danh mục ngoại tệ | 4–6 |
| 3 | `acc_fx_rates` | Tỷ giá ghi nhận, cảnh báo lệch >1% | 4–6 |
| 4 | `acc_periods` | Kỳ kế toán, khóa bất biến | 13 |
| 5 | `acc_vouchers` | Chứng từ kế toán | 12 |
| 6 | `acc_voucher_lines` | Bút toán kép (Nợ/Có) | 12 |
| 7 | `acc_audit_log` | Lưu vết thay đổi — chuỗi băm | 28 |
| 8 | `acc_units` | Đơn vị trực thuộc | 7 |
| 9 | `acc_internal_txn` | Giao dịch nội bộ chờ loại bỏ | 7 |
| 10 | `acc_eliminations` | Bút toán loại bỏ khi hợp nhất | 7 |
| 11 | `rev_contracts` | Hợp đồng với khách hàng (IFRS 15 bước 1) | — |
| 12 | `rev_performance_obligations` | Nghĩa vụ thực hiện (bước 2) | — |
| 13 | `rev_price_allocations` | Phân bổ giá giao dịch (bước 3–4) | — |
| 14 | `rev_recognition` | Ghi nhận doanh thu (bước 5) | — |
| 15 | `fs_reports` | Báo cáo tài chính (B01/B02/B03/B09-DN) | 14–27 |
| 16 | `fs_report_lines` | Chỉ tiêu BCTC (mã số, kỳ này, kỳ trước) | 14–27 |
| 17 | `fs_account_mappings` | Map tài khoản → mã chỉ tiêu BCTC | 14–27 |

Tổng: **17 bảng**, chia 5 file migration:

```
migrations/001_coa.sql                     → 1, 2, 3
migrations/002_ledger.sql                  → 4, 5, 6, 7
migrations/003_consolidation.sql           → 8, 9, 10
migrations/004_ifrs15.sql                  → 11, 12, 13, 14
migrations/005_financial_statements.sql    → 15, 16, 17
```

---

## 4. Hệ thống tài khoản TT99 — 71 tài khoản cấp 1

Nguồn: **Phần A Phụ lục II TT99/2025/TT-BTC**.

### 4.1 Loại TÀI SẢN (33 TK)

| STT | TK | Tên |
|---|---|---|
| 1 | 111 | Tiền mặt |
| 2 | 112 | Tiền gửi **không kỳ hạn** *(đổi tên, TT200: "Tiền gửi ngân hàng")* |
| 3 | 113 | Tiền đang chuyển |
| 4 | 121 | Chứng khoán kinh doanh |
| 5 | 128 | Đầu tư nắm giữ đến ngày đáo hạn |
| 6 | 131 | Phải thu của khách hàng |
| 7 | 133 | Thuế GTGT được khấu trừ |
| 8 | 136 | Phải thu nội bộ |
| 9 | 138 | Phải thu khác |
| 10 | 141 | Tạm ứng |
| 11 | 151 | Hàng mua đang đi đường |
| 12 | 152 | Nguyên liệu, vật liệu |
| 13 | 153 | Công cụ, dụng cụ |
| 14 | 154 | Chi phí sản xuất, kinh doanh dở dang *(gộp TK 631 bị bãi bỏ)* |
| 15 | 155 | **Sản phẩm** *(đổi tên, TT200: "Thành phẩm")* |
| 16 | 156 | Hàng hóa |
| 17 | 157 | Hàng gửi đi bán |
| 18 | 158 | Nguyên liệu, vật tư tại kho bảo thuế |
| 19 | 171 | Giao dịch mua, bán lại trái phiếu chính phủ |
| 20 | 211 | TSCĐ hữu hình |
| 21 | 212 | TSCĐ thuê tài chính |
| 22 | 213 | TSCĐ vô hình |
| 23 | 214 | Hao mòn TSCĐ |
| 24 | **215** | **Tài sản sinh học** *(MỚI)* |
| 25 | 217 | Bất động sản đầu tư |
| 26 | 221 | Đầu tư vào công ty con |
| 27 | 222 | Đầu tư vào công ty liên doanh, liên kết |
| 28 | 228 | Đầu tư khác |
| 29 | 229 | Dự phòng tổn thất tài sản |
| 30 | 241 | XDCB dở dang |
| 31 | 242 | **Chi phí chờ phân bổ** *(đổi tên, TT200: "Chi phí trả trước")* |
| 32 | 243 | Tài sản thuế TN hoãn lại |
| 33 | 244 | Ký quỹ, ký cược |

### 4.2 Loại NỢ PHẢI TRẢ (16 TK)

| STT | TK | Tên |
|---|---|---|
| 34 | 331 | Phải trả cho người bán |
| 35 | **332** | **Phải trả cổ tức, lợi nhuận** *(MỚI — tách khỏi 3388)* |
| 36 | 333 | Thuế và các khoản phải nộp Nhà nước |
| 37 | 334 | Phải trả người lao động |
| 38 | 335 | Chi phí phải trả |
| 39 | 336 | Phải trả nội bộ |
| 40 | 337 | Thanh toán theo tiến độ hợp đồng xây dựng |
| 41 | 338 | Phải trả, phải nộp khác |
| 42 | 341 | Vay và nợ thuê tài chính |
| 43 | 343 | Trái phiếu phát hành |
| 44 | 344 | Nhận ký quỹ, ký cược |
| 45 | 347 | Thuế thu nhập hoãn lại phải trả |
| 46 | 352 | Dự phòng phải trả |
| 47 | 353 | Quỹ khen thưởng, phúc lợi |
| 48 | 356 | Quỹ phát triển khoa học và công nghệ |
| 49 | 357 | Quỹ bình ổn giá |

### 4.3 Loại VỐN CHỦ SỞ HỮU (7 TK)

| STT | TK | Tên |
|---|---|---|
| 50 | 411 | Vốn đầu tư của chủ sở hữu *(nhận chức năng TK 461 bị bãi bỏ)* |
| 51 | 412 | Chênh lệch đánh giá lại tài sản |
| 52 | 413 | Chênh lệch tỷ giá hối đoái |
| 53 | 414 | Quỹ đầu tư phát triển |
| 54 | 418 | Các quỹ khác thuộc vốn chủ sở hữu |
| 55 | 419 | **Cổ phiếu mua lại của chính mình** *(đổi tên, TT200: "Cổ phiếu quỹ")* |
| 56 | 421 | Lợi nhuận sau thuế chưa phân phối |

### 4.4 Loại DOANH THU (3 TK)

| STT | TK | Tên |
|---|---|---|
| 57 | 511 | Doanh thu bán hàng và cung cấp dịch vụ |
| 58 | 515 | Doanh thu hoạt động tài chính |
| 59 | 521 | Các khoản giảm trừ doanh thu |

### 4.5 Loại CHI PHÍ SẢN XUẤT KINH DOANH (8 TK)

| STT | TK | Tên |
|---|---|---|
| 60 | 621 | Chi phí nguyên liệu, vật liệu trực tiếp |
| 61 | 622 | Chi phí nhân công trực tiếp |
| 62 | 623 | Chi phí sử dụng máy thi công |
| 63 | 627 | Chi phí sản xuất chung |
| 64 | 632 | Giá vốn hàng bán |
| 65 | 635 | Chi phí tài chính |
| 66 | 641 | Chi phí bán hàng |
| 67 | 642 | Chi phí quản lý doanh nghiệp |

### 4.6 Loại KHÁC (4 TK)

| STT | TK | Tên | Loại |
|---|---|---|---|
| 68 | 711 | Thu nhập khác | Thu nhập khác |
| 69 | 811 | Chi phí khác | Chi phí khác |
| 70 | 821 | Chi phí thuế TNDN | Chi phí khác |
| 71 | 911 | Xác định kết quả kinh doanh | Xác định KQKD |

**Tổng: 33 + 16 + 7 + 3 + 8 + 4 = 71** ✅

### 4.7 Thay đổi so với TT200

**Bãi bỏ 7 TK cấp 1:**
`161` Chi sự nghiệp · `417` Quỹ hỗ trợ sắp xếp doanh nghiệp · `441` Nguồn vốn đầu tư XDCB ·
`461` Nguồn kinh phí sự nghiệp · `466` Nguồn kinh phí đã hình thành TSCĐ · `611` Mua hàng ·
`631` Giá thành sản xuất

**Thêm mới 2:** `215` Tài sản sinh học · `332` Phải trả cổ tức, lợi nhuận

**Đổi tên:** `112` · `155` · `158` · `242` · `244` · `337` · `419` · `4112` (Thặng dư vốn) ·
`4211` · `6415` → "Thuế, phí, lệ phí" · `3387` → "Doanh thu chờ phân bổ"

**Thay đổi TK cấp 2:** `+1383` (Thuế TTĐB hàng nhập khẩu) · `−1385` · `+2295` (Dự phòng tổn thất
tài sản sinh học) · `+2414` (Nâng cấp, cải tạo TSCĐ) · `−3385` · `−3524` · `+3525` (Dự phòng
phải trả khác) · `+6275` (Thuế, phí, lệ phí) · `+82111` / `+82112` (thuế TNDN hiện hành /
thuế bổ sung theo thuế tối thiểu toàn cầu)

---

## 5. Điều 28 — Phần mềm kế toán

Bốn yêu cầu và cách đáp ứng:

| Yêu cầu Điều 28 | Cách đáp ứng |
|---|---|
| **Lưu vết thay đổi theo thời gian** | `acc_audit_log` append-only, chuỗi băm `prev_hash` → `hash`. Trigger `BEFORE INSERT` lấy hash của bản ghi trước; trigger `BEFORE UPDATE/DELETE` `RAISE EXCEPTION` trên bảng lưu vết. |
| **Ngăn chặn xoá/sửa trái phép** | Trigger trên `acc_vouchers`: chứng từ `posted` **không thể** `UPDATE` (trừ `status`) và **không thể** `DELETE`. Sửa sai = tạo chứng từ mới với `reversal_of` trỏ về chứng từ gốc (Luật KT Điều 27 — ghi số âm / ghi điều chỉnh). |
| **Xuất dữ liệu kịp thời cho cơ quan thuế** | Hàm `acc_export_for_tax_authority(p_period_id)` trả JSON sẵn sàng xuất; bảng `acc_periods` ghi `exported_at`, `exported_by`, `export_format`. |
| **Tích hợp HĐĐT / chữ ký số / ngân hàng** | `acc_vouchers.source_type` (`einvoice` / `bank` / `order` / `manual` …) + `source_id`. Chữ ký số qua `digital_signatures` (đã có từ spec 011). |

**Cảnh báo can thiệp:** hàm `acc_verify_audit_chain(p_tenant_id, p_from, p_to)` duyệt chuỗi băm,
trả về danh sách bản ghi bị gãy. UI hiện banner đỏ khi có gãy.

> **Lưu ý trung thực:** chuỗi băm ở tầng DB ngăn được sửa qua ứng dụng, **không** ngăn được
> người có quyền `superuser` trên Postgres. Để chống can thiệp thực sự cần append-only storage
> bên ngoài DB (WORM bucket / ledger service) — ghi nhận là nợ kỹ thuật.

---

## 6. Điều 7 — Hợp nhất đơn vị trực thuộc

TT99 **bỏ** khái niệm "BCTC tổng hợp". Đơn vị trực thuộc phải được hợp nhất, **loại bỏ toàn bộ
giao dịch nội bộ**.

Cơ chế:
1. `acc_units` — cây đơn vị trực thuộc (self-referencing `parent_id`), có đúng 1 `is_head_office`.
2. Mỗi dòng bút toán mang `unit_id`. Khi cả hai bên của một nghiệp vụ đều thuộc cùng một cây đơn
   vị, hệ thống tự ghi `acc_internal_txn` (trạng thái `unmatched`).
3. Khi hợp nhất: sinh `acc_eliminations` — bút toán loại bỏ doanh thu/chi phí nội bộ,
   công nợ nội bộ (136/336), lãi chưa thực hiện trong hàng tồn kho.
4. BCTC hợp nhất = tổng các đơn vị **trừ** các bút toán loại bỏ.

---

## 7. Doanh thu theo IFRS 15 — 5 bước

TT99 chuyển sang mô hình gần IFRS 15, **thay thế** tiêu thức "chuyển giao rủi ro và lợi ích".

| Bước | Bảng | Dữ liệu |
|---|---|---|
| 1. Xác định hợp đồng | `rev_contracts` | customer_id, signed_date, status, total_value |
| 2. Xác định nghĩa vụ thực hiện | `rev_performance_obligations` | tên, loại (`point_in_time` / `over_time`), standalone_selling_price |
| 3. Xác định giá giao dịch | `rev_contracts` | fixed_amount, variable_amount (chiết khấu, hoàn tiền), constraint trên biến động |
| 4. Phân bổ giá | `rev_price_allocations` | allocate theo tỷ lệ standalone selling price |
| 5. Ghi nhận khi thỏa mãn NVTH | `rev_recognition` | method (`point_in_time` / `over_time_pct`), progress_pct, recognized_amount, posted_voucher_id |

**Ý nghĩa thực tế với VComm:** đây là thay đổi lớn nhất về kế toán. Đơn hàng bán hàng trên sàn
thường có **nhiều nghĩa vụ vụ thực hiện**:
- (a) giao hàng hoá,
- (b) điểm V-Xu (material right — quyền lựa chọn có giá trị),
- (c) bảo hành / đổi trả.

→ Giá giao dịch phải **phân bổ** cho 3 nghĩa vụ; doanh thu V-Xu **không ghi nhận ngay** mà ghi
nhận khi khách đổi điểm hoặc khi điểm hết hạn. Đây chính là lý do `rev_price_allocations` tồn tại.

---

## 8. Báo cáo tài chính (Điều 14–27)

| Mã | Tên theo TT99 | Tên TT200 cũ |
|---|---|---|
| **B01-DN** | **Báo cáo tình hình tài chính** | ~~Bảng cân đối kế toán~~ |
| **B02-DN** | Báo cáo kết quả hoạt động kinh doanh | Báo cáo kết quả HĐKD |
| **B03-DN** | Báo cáo lưu chuyển tiền tệ | (giữ nguyên) |
| **B09-DN** | Thuyết minh báo cáo tài chính | (giữ nguyên) |

**⚠️ Đổi tên bắt buộc:** "Bảng cân đối kế toán" → **"Báo cáo tình hình tài chính"**.

Các quy định khác:
- BCTC **năm** là bắt buộc; BCTC **giữa niên độ không bắt buộc** (Điều 14–27).
- Doanh nghiệp chỉ được **thêm** chỉ tiêu, **không được sửa/xoá** chỉ tiêu ban hành kèm.
- **Không được đánh lại số thứ tự** "Mã số".

### 8.1 Lỗi đã sửa

`src/components/Finance.tsx` từng dùng **`B01-HKD` / `B02-HKD`** (9 chỗ). Hậu tố `-HKD` là của chế
độ **hộ kinh doanh**, không tồn tại trong TT99.
→ **ĐÃ SỬA** thành **`B01-DN` / `B02-DN`** (5 × B01-DN, 4 × B02-DN).

---

## 9. Phạm vi

### ĐÃ LÀM
- [x] Gỡ hoàn toàn module TT88 (spec 020 → `_archived`)
- [x] Hiệu đính spec 015 Mục 3.2
- [x] Xác thực 71 tài khoản cấp 1 từ Phụ lục II TT99
- [x] Thiết kế 18 bảng / 5 file migration
- [x] Migration `001_coa.sql` — hệ tài khoản + ngoại tệ + tỷ giá
- [x] Migration `002_ledger.sql` — kỳ, chứng từ, bút toán kép, lưu vết
- [x] Migration `003_consolidation.sql` — đơn vị trực thuộc, giao dịch nội bộ
- [x] Migration `004_ifrs15.sql` — hợp đồng doanh thu 5 bước
- [x] Migration `005_financial_statements.sql` — BCTC
- [x] **Kiểm chứng SQL** bằng `scripts/validate-sql-dryrun.cjs` — 5/5 file chạy trong
      transaction rồi ROLLBACK, DB không đổi
- [x] Types TS + mapping `dbService` (18 bảng × 2 mapper)
- [x] `src/services/tt99Service.ts` — nghiệp vụ: kỳ kế toán, chứng từ kép, lưu vết,
      hợp nhất, IFRS 15 5 bước, sinh BCTC
- [x] UI `src/components/TT99Accounting.tsx` — 8 tab
- [x] Route `/ke-toan-tt99` + nav "Kế toán TT99/2025"
- [x] Test `src/__tests__/tt99.test.ts` — **50 test pass**
- [x] Sửa `B01-HKD` → `B01-DN` trong `Finance.tsx`
- [x] **Chuyển `accountingService.ts` sang TT99** (xem mục 9.1 bên dưới)
- [x] Sửa tên TK 112 trong `Settings.tsx` theo TT99 ("Tiền gửi không kỳ hạn")
- [x] Test `src/__tests__/accounting_tt99.test.ts` — **18 test pass**

### ĐANG LÀM
_(không có)_

### CHƯA LÀM
- [ ] Áp dụng 5 migration vào Supabase production (mới chỉ validate, chưa chạy thật)
- [ ] Chuyển đổi số dư đầu kỳ từ hệ TT200 sang TT99 cho dữ liệu lịch sử
- [ ] Bật `TT99_BRIDGE_ENABLED = true` trong `accountingService.ts` **sau khi**
      đã chạy xong 5 migration ở trên

### 9.1 Chuyển `accountingService.ts` sang TT99 — đã làm gì

Rà soát tất cả mã tài khoản đang dùng và **đối chiếu từng mã** với Phụ lục II TT99.

| Mã   | Ý nghĩa                        | Kết quả đối chiếu                          |
|------|--------------------------------|--------------------------------------------|
| 131  | Phải thu của khách hàng        | ✅ Cấp 1 bắt buộc, giữ nguyên               |
| 5111 | Doanh thu bán hàng hóa         | ✅ Cấp 2 tự xây dựng — đã có trong seed     |
| 33311| Thuế GTGT đầu ra               | ✅ Cấp 3 tự xây dựng — đã có trong seed     |
| 632  | Giá vốn hàng bán               | ✅ Cấp 1 bắt buộc, giữ nguyên               |
| 156  | Hàng hóa                       | ✅ Cấp 1 bắt buộc, giữ nguyên               |
| 642  | Chi phí quản lý doanh nghiệp   | ✅ Cấp 1 bắt buộc, giữ nguyên               |
| 3388 | Phải trả, phải nộp khác        | ✅ Cấp 2 tự xây dựng — đã có trong seed     |
| 1121 | Tiền gửi không kỳ hạn — VND    | ✅ Cấp 2 — **112 được TT99 đổi tên**        |

**Không có mã nào bị bãi bỏ** (161/417/441/461/466/611/631) nên không phải đổi mã.
Vấn đề thực sự nằm ở chỗ khác — 5 lỗi đã sửa:

1. **Ghi trùng bút toán.** ID chứng từ có kèm `Date.now()`
   (`je-order-complete-{id}-{timestamp}`) nên mỗi lần gọi lại sinh ra một chứng
   từ MỚI cho cùng một nghiệp vụ. → Bỏ timestamp, ID cố định theo mã đơn.
   `SupabaseAdapter.saveJournalEntry` xóa rồi chèn lại `journal_items` theo
   `entry_id`, nên lần gọi lặp giờ **thay thế** thay vì cộng dồn — idempotent
   mà không cần đọc trước.

2. **Thuế GTGT hard-code 10%** bằng phép chia `total / 1.1`. Trên sàn có cả
   hàng 0%, 5%. → Thành `DEFAULT_VAT_RATE` + tham số `opts.vatRate`.

3. **Giá vốn bịa số.** Khi PIM thiếu giá vốn, code tự lấy 60% giá bán rồi ghi
   như số liệu thật — vi phạm Điều 12 (chứng từ phải phản ánh đúng nội dung
   kinh tế). → Giữ việc ước lượng (bỏ thì lệch báo cáo) nhưng **bắt buộc công
   khai**: tỷ lệ thành hằng số có tên `ESTIMATED_COGS_RATIO`, và ghi thẳng vào
   diễn giải chứng từ `...[Lưu ý: Giá vốn ước tính 60% giá bán...]`.
   Ghi vào diễn giải thay vì trường riêng vì adapter chỉ lưu
   `id / tenant_id / date / ref / description`, mọi trường khác bị bỏ qua.

4. **Không kiểm tra cân bằng Nợ/Có ở tầng service.** → Thêm `assertBalanced()`
   ném ngay trước khi ghi, kèm số tiền lệch và dẫn Điều 12.

5. **Không có đường vào lưu vết Điều 28.** → Thêm `bridgeToTt99()`: khi bật
   `TT99_BRIDGE_ENABLED`, mỗi bút toán tự động sinh chứng từ `PKT` trong
   `acc_vouchers` / `acc_voucher_lines` và được đưa vào chuỗi băm
   `acc_audit_log`. **Mặc định TẮT**, vì 5 migration chưa được áp dụng lên
   Supabase — nếu bật sớm, mọi lần ghi sẽ lỗi. Fail-soft: lỗi cầu nối không
   được phép làm kẹt hoàn tất đơn / duyệt chi.

Đồng thời bổ sung **bản trích Quy chế hạch toán kế toán** vào đầu file, liệt
kê 8 tài khoản cấp 2/3 VComm tự xây dựng kèm cơ sở pháp lý — Điều 11(2)(d)
cho phép tự xây dựng nhưng bắt buộc phải quy định rõ để giải trình khi thanh tra.

### NGOÀI PHẠM VI (nợ kỹ thuật đã ghi nhận)
- [ ] Chống can thiệp thực sự (append-only storage ngoài DB)
- [ ] Ký số tờ khai trong trình duyệt (cần service phía server)
- [ ] Đối chiếu mẫu BCTC với XSD chính thức của Tổng cục Thuế (chưa có file XSD gốc)
- [ ] Chuyển đổi số dư đầu kỳ từ hệ TT200 sang TT99 cho dữ liệu lịch sử
