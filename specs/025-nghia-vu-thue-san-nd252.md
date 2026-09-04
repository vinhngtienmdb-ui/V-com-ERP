# 025 — Nghĩa vụ thuế sàn TMĐT: ND 117/2025 đã bị thay thế bởi ND 252/2026

> Lập: 02/09/2026 · Trả lời câu hỏi #11, #12, #13
> **Tình trạng: đã đối chiếu bản gốc** (Chinhphu.vn / Công báo / Hethongphapluat / ThuVienPhapLuat).
> Các số liệu trước đây trong MEMORY.md và spec 024 viện dẫn ND 117/2025 — **đã lỗi thời từ 01/7/2026**.

---

## 1. Câu trả lời #11: VComm CÓ thuộc diện — và phương án QR/VNPay/MoMo không thoát được

### 1.1 Căn cứ hiện hành

**Điều 43.1 Nghị định 252/2026/NĐ-CP** (30/6/2026, hiệu lực **01/7/2026**):

> Chủ quản nền tảng thương mại điện tử **có chức năng đặt hàng trực tuyến và chức năng thanh toán**
> (trong nước và ngoài nước) ... có trách nhiệm thực hiện **khấu trừ, khai thay và nộp thay**
> số thuế đã khấu trừ đối với hoạt động kinh doanh trên nền tảng thương mại điện tử của
> **hộ kinh doanh, cá nhân kinh doanh**:
> - a) Thuế **GTGT** — mỗi giao dịch phát sinh doanh thu **ở trong nước**
> - b) Thuế **TNCN** — mỗi giao dịch: cá nhân **cư trú** (doanh thu trong + ngoài nước);
>   cá nhân **không cư trú** (doanh thu trong nước)

### 1.2 Định nghĩa "có chức năng thanh toán" — Điều 3.5 ND 252/2026

Nền tảng có **đặt hàng trực tuyến + thanh toán** = nền tảng số **đồng thời** đáp ứng:

| | Tiêu chí | VComm |
|---|---|---|
| **a** | Cho phép người mua lựa chọn hàng hóa, dịch vụ và **xác lập giao dịch mua bán với người bán** thông qua môi trường điện tử do nền tảng cung cấp | ✅ CÓ |
| **b** | **Trực tiếp hoặc gián tiếp tham gia vào quá trình thanh toán** giữa người mua và người bán và **có khả năng kiểm soát, đối soát hoặc xác nhận giao dịch thanh toán**, bao gồm:<br>• thực hiện việc thu tiền từ người mua và chuyển cho người bán;<br>• **phối hợp với tổ chức, cá nhân khác** để thực hiện việc thu, chuyển tiền thanh toán **và có khả năng kiểm soát, đối soát hoặc xác nhận**;<br>• **tổ chức cơ chế thanh toán mà việc hoàn tất giao dịch mua bán gắn với việc xác nhận thanh toán trên nền tảng** | ✅ CÓ |
| **c** | Việc xác định nền tảng có chức năng thanh toán được căn cứ vào **vai trò thực tế** của nền tảng trong việc **tổ chức, kiểm soát hoặc tham gia** vào quá trình thanh toán, **KHÔNG phụ thuộc vào hình thức kỹ thuật hoặc phương thức thanh toán cụ thể** | ✅ bị khép |

**Điều 3.5 đoạn cuối — đường ra duy nhất:**
> Trường hợp nền tảng **chỉ cung cấp dịch vụ đăng tải thông tin, quảng cáo, kết nối giao dịch
> mà không tham gia vào quá trình thanh toán** thì không thuộc phạm vi quy định tại khoản này.

**Điều 3.6** — "nền tảng có chức năng thanh toán" (không kèm đặt hàng) = chỉ cần đạt tiêu chí **b + c**.

### 1.3 Vì sao QR / VNPay / ZaloPay / MoMo **không** làm VComm thoát diện

1. **Điểm c đóng thẳng luận điểm "thuê bên thứ ba".** Luật viết rõ *không phụ thuộc vào hình thức
   kỹ thuật hoặc phương thức thanh toán cụ thể*. Tự xây ví hay thuê VNPay là **cùng một kết quả**.
2. **Điểm b, gạch đầu dòng 2** mô tả chính xác việc tích hợp cổng thanh toán: *"phối hợp với tổ chức,
   cá nhân khác để thực hiện việc thu, chuyển tiền thanh toán và có khả năng kiểm soát, đối soát
   hoặc xác nhận giao dịch thanh toán"*. VNPay/MoMo/ZaloPay **là** "tổ chức, cá nhân khác" đó.
3. **Điểm b, gạch đầu dòng 3** là lưới thứ hai: chỉ cần **hoàn tất đơn hàng gắn với xác nhận thanh
   toán trên nền tảng** là đủ — bất kể tiền đi qua tài khoản ai. VComm xác nhận thanh toán để
   đẩy đơn cho Seller ⇒ đủ điều kiện.
4. VComm đã có sẵn 6 dấu hiệu: Seller bên thứ ba · `updateWalletBalance()` · `withdrawals` ·
   `codReconciliationService` · `settlements` · `postOrderJournalEntries()`.

> ⚠️ **Kết luận quan trọng nhất của đợt này:**
> **Nghĩa vụ thuế sàn là BẤT BIẾN đối với quyết định hạ tầng thanh toán.**
> Hai việc này **ĐỘC LẬP**. Không được xếp tuần tự — đừng chờ chốt phương án thanh toán rồi mới làm thuế.

### 1.4 Về giấy phép NHNN — ⚠️ ĐÃ ĐÁNH GIÁ LẠI, XEM `specs/027` §6

> 🔴 **Đoạn dưới đây đã bị thay thế bởi phân tích lại ở `specs/027-doc-luat-va-quyet-dinh-14-15-0.md` §6.**
> Nguyên bản viết rằng thiết kế ví nội bộ của VComm "đúng bản chất là thu hộ / chi hộ" và
> do đó đối diện rủi ro giấy phép NHNN. **Kết luận đó quá đà**, vì hai lỗi:
> 1. **Căn cứ pháp lý đã hết hiệu lực:** ND 101/2012 hết hiệu lực **01/7/2024** (thay bởi **ND 52/2024/NĐ-CP**);
>    TT 39/2014 hết hiệu lực **01/10/2024** (thay bởi **TT 40/2024/TT-NHNN**).
> 2. **Bỏ qua cụm từ then chốt:** định nghĩa gốc của "dịch vụ hỗ trợ thu hộ, chi hộ" có cụm
>    **"hỗ trợ các ngân hàng"** — đây là dịch vụ hạ tầng B2B cung cấp cho ngân hàng,
>    không phải bản thân việc thu tiền rồi chia lại.

**Căn cứ hiện hành (ND 52/2024/NĐ-CP, hiệu lực 01/7/2024):**

| Dịch vụ trung gian thanh toán | Vốn điều lệ thực góp tối thiểu |
|---|---:|
| Dịch vụ ví điện tử · **hỗ trợ thu hộ, chi hộ** · cổng thanh toán điện tử | **50 tỷ đồng** |
| Chuyển mạch tài chính · chuyển mạch tài chính quốc tế · bù trừ điện tử | 300 tỷ đồng |

Con số 50 tỷ đúng, nhưng tình cờ — căn cứ đã đổi.

**Kết luận sau khi đánh giá lại (thiết kế #14 đã chốt 02/09/2026):**

Thiết kế *QR động theo đơn → tiền về TK ngân hàng VComm → ghi nhận số dư → chi ngược cho Seller*
**KHÔNG cấu thành "dịch vụ ví điện tử"** theo ND 52/2024, vì hội tụ đủ 5 điều kiện loại trừ:
không có tài khoản đảm bảo thanh toán 1:1 · không phát hành tiền điện tử · không có chức năng nạp tiền ·
số dư không dùng để thanh toán bên thứ ba · VComm không làm dịch vụ cho ngân hàng.

→ **Yếu tố quyết định là cấu trúc hợp đồng, không phải luồng tiền kỹ thuật:**
VComm phải là **bên bán đối với người mua** (chịu rủi ro), khi đó tiền thu vào là doanh thu của VComm
và chi cho Seller là thanh toán nợ mua hàng.

**5 việc khoá chặt vị thế (chi tiết ở spec 027 §6.6):** tránh từ "thu hộ/chi hộ" trong hợp đồng & UI ·
đổi tên "Ví Seller" → "Số dư phải trả" · không mở tài khoản đảm bảo thanh toán 1:1 · số dư không dùng
thanh toán bên thứ ba · mọi khoản chi ≥ 5 triệu phải chuyển khoản + lưu chứng từ (Điều 6.1 ND 68/2026).

⚠️ **Lỗ hổng thật sự:** ND 52/2024 liệt kê "dịch vụ hỗ trợ thu hộ, chi hộ" **không kèm** cụm
"hỗ trợ các ngân hàng" (cụm đó nằm ở TT 39/2014, đã bị thay thế). **Cần đọc TT 40/2024/TT-NHNN
để xác nhận định nghĩa hiện hành. Chưa đọc.**

---

## 2. Câu trả lời #12: ND 117/2025 **không bị sửa đổi — nó bị thay thế toàn bộ**

### 2.1 Dòng thời gian

| Mốc | Sự kiện |
|---|---|
| 09/6/2025 | Ban hành ND **117/2025/NĐ-CP** |
| **01/7/2025** | ND 117/2025 có hiệu lực |
| 10/12/2025 | Luật Thuế TNCN **109/2025/QH15** · Luật Thuế GTGT sửa đổi **149/2025/QH15** |
| **01/01/2026** | Ngưỡng **500 triệu/năm** có hiệu lực · **bỏ thuế khoán** (NQ 198/2025/QH15) |
| 05/3/2026 | ND **68/2026/NĐ-CP** (hiệu lực từ ngày ký, áp dụng cho năm thuế 2026 từ 01/01/2026) |
| 30/6/2026 | Ban hành ND **252/2026/NĐ-CP** |
| **01/7/2026** | ND 252/2026 có hiệu lực — **thay thế ND 117/2025** |

### 2.2 ND 252/2026 thay thế những gì

Theo khoản 3 Điều ... (quy định chuyển tiếp) ND 252/2026 thay thế:
ND **126/2020** · ND **91/2022** · ND **49/2025** · ND **117/2025** · ND **373/2025**.
ND 125/2020 (xử phạt) tiếp tục có hiệu lực đến khi có văn bản thay thế.

### 2.3 Khác biệt nội dung (quan trọng)

| | ND 117/2025 | ND 252/2026 |
|---|---|---|
| Định nghĩa | Điều 3.1: *"được thiết lập để người mua thanh toán trực tiếp thông qua ví điện tử, thẻ ngân hàng, chuyển khoản, COD..."* — **thiên về hình thức** | Điều 3.5: 3 tiêu chí a/b/c, **xét vai trò thực tế, không phụ thuộc hình thức kỹ thuật** — **rộng hơn và khó lách hơn** |
| Điều kiện áp dụng | chỉ cần chức năng thanh toán | **đặt hàng trực tuyến VÀ thanh toán** (Điều 43.1) |
| Tỷ lệ | ghi cứng Điều 5.2 | **viện dẫn** Luật Thuế GTGT 48/2024 (sửa đổi bởi 149/2025) + Luật Thuế TNCN 109/2025 |
| Ngưỡng | không có | **500 triệu/năm** (ND 68/2026 Điều 3, Điều 4) |
| Kê khai | theo tháng (Điều 6) | theo tháng (Điều 45) — giữ nguyên |

### 2.4 Lưu ý viện dẫn chéo

**ND 68/2026 Điều 11.1** vẫn viết platform khấu trừ *"theo quy định tại Nghị định 117/2025"*.
Do ND 252/2026 quy định *"trường hợp các văn bản được viện dẫn ... được thay thế thì thực hiện
theo văn bản thay thế"* ⇒ đọc là **Điều 43 ND 252/2026**.

### 2.5 Mức độ tin cậy

- Đã đối chiếu: Chinhphu.vn (toàn văn), Công báo, Hethongphapluat (Điều 3, Điều 43 nguyên văn),
  ThuVienPhapLuat.
- **Chưa tìm thấy văn bản nào "sửa đổi, bổ sung" ND 117/2025** trong khoảng 07/2025–06/2026.
- ⚠️ Nếu anh cần dùng lập luận này trong hồ sơ chính thức → kiểm tra lại trên Công báo
  (`congbao.chinhphu.vn`) trước khi nộp.

---

## 3. Câu trả lời #13: Không cần biết SỐ LƯỢNG, nhưng bắt buộc phải có `entity_type` TRƯỚC giao dịch đầu tiên

### 3.1 Sai lầm trong cách đặt câu hỏi

"Sẽ được duyệt khi vận hành" — đúng với **số lượng**, sai với **dữ liệu**.
Khấu trừ diễn ra **theo từng giao dịch** (Điều 43.1), không phải lúc duyệt Seller.
→ Không có `entity_type` tại thời điểm giao dịch ⇒ **không tính được thuế ⇒ theo quyết định
#9/#10 của anh, phải NÉM LỖI và từ chối giao dịch** (fail-closed).

### 3.2 Tách #13 thành hai việc

| | Cần khi nào | Nội dung |
|---|---|---|
| **#13a** | **NGAY — blocking** | Form onboarding Seller bắt buộc khai `entity_type` + MST/CCCD + `residency`. Không có ⇒ không cho bán. |
| **#13b** | Bước 0 của 2.6c (0,5 ngày) | Báo cáo số lượng Seller theo `entity_type` — chỉ để **ước lượng truy thu**, không blocking |

### 3.3 Tại sao chỉ cần 3 giá trị + residency

Điều 43.1 chỉ áp dụng cho **hộ kinh doanh, cá nhân kinh doanh**. Pháp nhân tự kê khai TNDN —
khấu trừ TNCN từ công ty là **sai bản chất thuế** (đã chốt ở quyết định #10).

| entity_type | Có khấu trừ? | Cơ sở |
|---|---|---|
| `LEGAL_ENTITY` | ❌ KHÔNG | tự kê khai TNDN |
| `HOUSEHOLD_BUSINESS` | ✅ GTGT + TNCN | Điều 43.1 ND 252/2026 |
| `INDIVIDUAL` | ✅ GTGT + TNCN | Điều 43.1 ND 252/2026 |

→ Ma trận seed hiện tại (`SELLER × {INDIVIDUAL, HOUSEHOLD_BUSINESS} = PLATFORM`,
`SELLER × LEGAL_ENTITY = OFF`) **vẫn đúng**. Cần **thêm trục `residency`** vì tỷ lệ TNCN khác nhau.

---

## 4. Tỷ lệ & ngưỡng hiện hành (áp dụng từ 01/01/2026)

### 4.1 Ngưỡng doanh thu

| Doanh thu năm | GTGT | TNCN |
|---|---|---|
| **≤ 500 triệu** | **không chịu thuế** | **không phải nộp** |
| > 500 triệu – 3 tỷ | tỷ lệ % × doanh thu | chọn: tỷ lệ % × (doanh thu − 500tr) **hoặc** 15% × thu nhập |
| > 3 tỷ – 50 tỷ | tỷ lệ % × doanh thu | 17% × thu nhập (bắt buộc phương pháp thu nhập) |
| > 50 tỷ | tỷ lệ % × doanh thu | 20% × thu nhập |

Căn cứ: Luật Thuế GTGT 48/2024 (sửa đổi bởi **149/2025/QH15**, ngưỡng 500tr từ **01/01/2026**) ·
Luật Thuế TNCN **109/2025/QH15** Điều 7 · **ND 68/2026/NĐ-CP** Điều 3, Điều 4, Điều 11, Điều 12.

### 4.2 Bảng tỷ lệ % theo ngành (phương pháp tỷ lệ trên doanh thu)

| Hoạt động | GTGT | TNCN |
|---|---|---|
| Phân phối, cung cấp hàng hóa | **1%** | **0,5%** |
| Dịch vụ, xây dựng không bao thầu NVL | **5%** | **2%** |
| Sản xuất, vận tải, dịch vụ gắn với hàng hóa; xây dựng có bao thầu NVL | **3%** | **1,5%** |
| Hoạt động kinh doanh khác | **2%** | **1%** |

Riêng: cho thuê tài sản, đại lý bảo hiểm, đại lý bán hàng đa cấp → TNCN **5%**.
**Không xác định được loại** → áp **mức cao nhất** (5% GTGT / 2% hoặc 5% TNCN).

> ⚠️ Bảng này **chi tiết hơn ND 117/2025** (vốn chỉ có 3 loại: hàng hóa / dịch vụ / vận tải).
> ND 68/2026 viện dẫn theo **từng ngành, nghề** ⇒ `hr_platform_tax_rates` phải đổi
> từ khoá 3 loại sang **khoá theo ngành nghề** (có `effective_from` + `legal_basis`).

### 4.3 Nghĩa vụ khác của sàn (Điều 45 ND 252/2026)

- Đăng ký thuế, được cấp **MST riêng 10 chữ số** để khai/nộp thay
- **Khai theo tháng**; giao dịch hủy/trả hàng được **bù trừ**
- Cấp **chứng từ khấu trừ điện tử** cho hộ/cá nhân (theo năm)
- Hoàn/bù trừ phần đã khấu trừ nếu doanh thu năm thực tế **≤ 500 triệu** (Điều 12 ND 68/2026)

### 4.4 Vấn đề ngưỡng 500 triệu — quyết định thiết kế

Sàn **chỉ thấy doanh thu trên sàn của mình**, không thấy doanh thu ngoài sàn của Seller.
⇒ **Không thể an toàn kết luận một Seller dưới 500 triệu.**

Ba chế độ (cấu hình, không hardcode):

| mode | Hành vi | Rủi ro |
|---|---|---|
| `WITHHOLD_ALWAYS` ⭐ | khấu trừ mọi giao dịch ngay từ đồng đầu tiên | an toàn cho VComm; Seller tự quyết toán/hoàn |
| `WITHHOLD_AFTER_THRESHOLD` | theo dõi lũy kế năm theo MST, chỉ khấu trừ khi vượt 500tr | thân thiện Seller; **VComm gánh rủi ro truy thu** nếu Seller có doanh thu ngoài sàn |
| `WARN` | ghi nhận nghĩa vụ, không khấu trừ | như đã thiết kế ở spec 024 |

**Khuyến nghị seed: `WITHHOLD_ALWAYS`** (đây cũng là cách ND 117/2025 từng áp dụng: không có
ngưỡng, khấu trừ từ giao dịch đầu tiên) cho đến khi có hướng dẫn chính thức.

---

## 5. Ước lượng phơi nhiễm truy thu

| Giai đoạn | Căn cứ | Ngưỡng | Phơi nhiễm |
|---|---|---|---|
| 01/7/2025 – 31/12/2025 | ND 117/2025 | 100 triệu/năm (cũ) | Seller vượt 100tr trong 6 tháng cuối 2025 |
| 01/01/2026 – 30/6/2026 | ND 117/2025 + ngưỡng 500tr | 500 triệu/năm | Seller vượt 500tr/năm |
| 01/7/2026 – nay | ND 252/2026 | 500 triệu/năm | Seller vượt 500tr/năm |

→ **Bước 0 của 2.6c (0,5 ngày): chạy báo cáo 3 cột này.** Nếu tổng nhỏ, đây là việc "làm cho đúng";
nếu lớn, đây là việc phải xử lý trước khi cơ quan thuế hỏi.

---

## 6. Khuyến nghị thứ tự GĐ2 (sửa)

```
2.1  TSCĐ & khấu hao                                      (đang làm)
  ↓
2.6a Nối bút toán vào luồng tiền THẬT       1 ngày         ← giữ nguyên, không bị chặn
  ↓
2.6c-0 Báo cáo Seller: entity_type + doanh thu   0,5 ngày  ← MỚI · biết đang nợ bao nhiêu
  ↓
2.6c-1 entity_type là trường BẮT BUỘC khi onboarding 0,5 ngày ← MỚI · fail-closed (#13a)
  ↓
2.5  Nhân sự & lương (lõi + màn hình cấu hình HRM)
  ↓
2.6b Khấu trừ TNCN hoa hồng CTV (gạt WARN → WITHHOLD)
  ↓
2.6c-2 Khấu trừ sàn THẬT + kê khai tháng + chứng từ (gạt WARN → WITHHOLD)
  ↓
4.1 → 3.3/3.4
```

**Ba việc làm ngay, tổng ~2 ngày, trước 2.5:** 2.6a · 2.6c-0 · 2.6c-1

**Quyết định hạ tầng thanh toán (QR/VNPay/ZaloPay/MoMo): KHÔNG nằm trên đường găng của thuế.**
Chốt lúc nào cũng được. Nhưng **nên chốt trước khi viết 2.6c-2**, vì nó quyết định *nơi thực thi
khấu trừ* (khấu trừ lúc đối soán vs. truy thu riêng) — một chi tiết nhỏ, không phải kiến trúc.

### Cập nhật ước lượng

- 2.6: 4–6 → **7–10 ngày** (2 BE + 1 FE) / 7–9 → **12–16 ngày** (1 người)
  - 2.6a: 1 ngày · 2.6b: 3–4/5–6 · **2.6c: 3–5/6–9 (mới)** · 2.6c-0/2.6c-1: 1 ngày
  - 2.6c đắt hơn 2.6b vì: 2 loại thuế · theo từng giao dịch · theo MST từng Seller ·
    kê khai tháng · chứng từ khấu trừ điện tử · bù trừ đơn hủy/trả hàng
- Tổng nhóm: 21–26 → **24–30 ngày** (2 BE + 1 FE); 37–47 → **43–52 ngày** (1 người)

---

## 7. Câu hỏi còn mở — ✅ TẤT CẢ ĐÃ ĐƯỢC TRẢ LỜI (02/09/2026)

> Toàn bộ 5 câu hỏi trong mục này đã được Anh trả lời, và 5 văn bản trong "Chưa đọc" đã được
> đọc nguyên văn. **Kết quả nằm ở `specs/027-doc-luat-va-quyet-dinh-14-15-0.md`.**

| # | Câu hỏi | ✅ Trả lời |
|---|---|---|
| **#14** | Hạ tầng thanh toán | **QR động theo đơn hàng**, cho phép ví điện tử + thẻ TD + thẻ NH; trang QL phương thức thanh toán đa đối tác; **mọi khoản thu về TK NH VComm trước**, rồi chi ngược cho Seller/POS. Ví Seller/POS **2 trạng thái: Đã xác nhận / Chờ xác nhận**, chỉ rút khi Đã xác nhận |
| **#15** | Chế độ ngưỡng 500tr | **`WITHHOLD_ALWAYS`** |
| **#0** | 5% hay 10% cho CTV | **10%** → gạt `AGENT` từ `WARN` → **`WITHHOLD`** |
| **#10** | Pickup-hub: cá nhân hay pháp nhân | Xong — do `entity_type` |
| **#13b** | Báo cáo số lượng Seller | Trả lời sau, không blocking |

### ✅ Đã đọc nguyên văn (02/09/2026)

| Văn bản | Kết quả chính |
|---|---|
| **Điều 44 ND 252/2026** | ⭐ Thời điểm khấu trừ = *"thời điểm xác nhận giao dịch thành công và chấp nhận thanh toán **theo quy định của nền tảng**"* → **trùng khớp tự nhiên với trạng thái "Đã xác nhận" của #14** |
| **Điều 45 ND 252/2026** | Đăng ký **MST riêng**; kê khai **theo tháng**; **bù trừ** giao dịch huỷ/trả hàng; thời hạn theo Điều 10 |
| **TT 18/2026/TT-BTC** | Chỉ quy định hồ sơ/thủ tục. Mẫu cho VComm: **01/TCKT + 01/BK-KTHTKD**. ⚠️ **Đã bị thay thế một phần** bởi TT 50/2026 và TT 89/2026 |
| **Điều 5 ND 68/2026** | Doanh thu gồm cả *"khoản được nhận từ hỗ trợ đạt doanh số, khuyến mại"*; trừ *"giá trị hàng bán bị trả lại"*; thời điểm = **chuyển giao quyền sở hữu** |
| **Điều 6 ND 68/2026** | Chi **≥ 5 triệu phải có chứng từ thanh toán không dùng tiền mặt**; khấu hao TSCĐ được trừ |
| **ND 101/2012 Điều 15** | ❌ **Hết hiệu lực 01/7/2024** → thay bởi **ND 52/2024/NĐ-CP** (vốn 50 tỷ cho ví điện tử / thu hộ chi hộ / cổng TTĐT) |
| **TT 39/2014 Điều 4** | ❌ **Hết hiệu lực 01/10/2024** → thay bởi **TT 40/2024/TT-NHNN**. ⭐ Định nghĩa gốc có cụm **"hỗ trợ các ngân hàng"** → rủi ro NHNN của spec 025 §1.4 đã bị **đánh giá quá đà** |

### ⚠️ Chưa đọc (xếp theo mức độ chặn)

| Văn bản | Mức độ | Tại sao cần |
|---|:--:|---|
| **TT 40/2024/TT-NHNN** | 🔴 Cao | Định nghĩa **hiện hành** của "hỗ trợ thu hộ, chi hộ" và "ví điện tử" — quyết định mức độ phơi nhiễm thật sự |
| **Điều 10 ND 252/2026** | 🔴 Cao | Thời hạn nộp hồ sơ khai — cần trước khi viết job kê khai tháng |
| **TT 89/2026/TT-BTC** | 🟡 TB | Mẫu **01/TCKT + 01/BK-KTHTKD hiện hành** (bản của TT 18 đã bị thay) |
| **TT 50/2026/TT-BTC** | 🟡 TB | Thay thế một số mẫu của TT 18 |
| **Điều 64 ND 253/2026** | 🟡 TB | Thuế suất cá nhân không cư trú — cần trước khi cài `NON_RESIDENT` |
