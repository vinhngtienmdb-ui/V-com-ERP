# SPEC 027 — Đọc luật đợt 2 & ghi nhận quyết định #14 / #15 / #0

**Ngày:** 02/09/2026
**Nguồn:** văn bản gốc (hethongphapluat.com · baochinhphu.vn · luatvietnam.vn · thuvienphapluat.vn)

> ⚠️ **Tài liệu này chứa 3 ĐÍNH CHÍNH về những gì tôi đã viết ở spec 025.**
> Đọc §6 trước nếu anh chỉ có 5 phút — một trong số đó **giảm mức độ rủi ro** mà
> tôi từng cảnh báo là "lớn hơn cả thuế".

---

## 1. Ghi nhận 5 quyết định của anh

| # | Quyết định | Hệ quả thiết kế |
|---|---|---|
| **#14** | QR **động theo đơn hàng**; cho phép ví điện tử + thẻ tín dụng + thẻ ngân hàng; trang QL phương thức thanh toán đa đối tác; **mọi khoản thu về TK ngân hàng VComm trước**, rồi mới chi ngược cho Seller/POS. Ví Seller/POS có **2 trạng thái: Đã xác nhận / Chờ xác nhận**; **chỉ đề nghị rút khi Đã xác nhận** | Gốc pháp lý trích: §6, §7 |
| **#15** | **`WITHHOLD_ALWAYS`** | Bỏ hẳn logic theo dõi ngưỡng 500tr. Đơn giản hoá đáng kể 2.6c-2 |
| **#0** | **10%** cho CTV (AGENT) | Gạt AGENT từ `WARN` → **`WITHHOLD`** (xem §8) |
| **#10** | Xong — do `entity_type` | — |
| **#13b** | Trả lời sau, không blocking | Báo cáo 0,5 ngày, xếp cuối |

Vẫn treo: **#16** (TCT hóa đơn điện tử) · **#17** (Hub offline) · **#18** (gộp V-Xu/FlashSale/Affiliate) · 3 câu cũ (nguồn lực dev · số Hub vật lý · team iPOS).

---

## 2. Điều 44 ND 252/2026 — Thời điểm khấu trừ ⭐

> ### Điều 44. Thời điểm khấu trừ và căn cứ xác định số thuế phải khấu trừ
>
> **1. Thời điểm thực hiện khấu trừ:**
>
> a) Đối với tổ chức kinh doanh tại Việt Nam quy định tại khoản 3 Điều 43 Nghị định này là thời điểm thanh toán cho nhà cung cấp nước ngoài, cá nhân không cư trú;
>
> **b) Đối với chủ quản nền tảng thương mại điện tử là thời điểm xác nhận giao dịch thành công và chấp nhận thanh toán theo quy định của nền tảng.**
>
> **2. Xác định số thuế phải khấu trừ:**
>
> a) Số thuế giá trị gia tăng, thuế thu nhập doanh nghiệp, thuế thu nhập cá nhân phải khấu trừ được xác định theo tỷ lệ phần trăm (%) thuế suất trên doanh thu phát sinh tại Việt Nam. Trong đó:
>
> a.1) Tỷ lệ % thuế suất thực hiện theo quy định của pháp luật thuế giá trị gia tăng, thuế thu nhập doanh nghiệp, thuế thu nhập cá nhân đối với mỗi giao dịch bán hàng hóa, cung cấp dịch vụ;
>
> a.2) Doanh thu phát sinh tại Việt Nam là số tiền bán hàng hóa, cung cấp dịch vụ mà tổ chức nước ngoài, hộ kinh doanh, cá nhân kinh doanh được hưởng do tổ chức kinh doanh tại Việt Nam chi trả hoặc **chủ quản nền tảng thu hộ**;
>
> b) Trường hợp ... không xác định được giao dịch phát sinh doanh thu từ nền tảng thương mại điện tử là hàng hóa hay dịch vụ hoặc loại dịch vụ trên cơ sở dữ liệu và thông tin sẵn có thì việc xác định số thuế phải khấu trừ thực hiện theo **mức tỷ lệ % thuế suất cao nhất** ...

### ⭐ Điều 44.1.b khớp chính xác với thiết kế #14 của anh

Luật ghi: thời điểm khấu trừ là

> *"thời điểm xác nhận giao dịch thành công và chấp nhận thanh toán **theo quy định của nền tảng**"*

Tức là: **chính quy định của VComm định nghĩa thời điểm khấu trừ.** Trạng thái **"Đã xác nhận"** anh vừa thiết kế **chính là điểm kích hoạt khấu trừ theo luật.** Không cần bấm giờ riêng, không cần đoán.

→ **Việc cần làm:** trong code, sự kiện `wallet_entry.status → CONFIRMED` phải **đồng thời** sinh bút toán khấu trừ. Đây là một trong số ít chỗ luật và thiết kế sản phẩm trùng nhau tự nhiên.

### ⚠️ Hai cạm bẫy

| Cạm bẫy | Chi tiết | Cách tránh |
|---|---|---|
| **Thuế suất cao nhất (44.2.b)** | Không phân biệt được hàng hóa hay dịch vụ → **áp mức cao nhất** | Trường `product_category` trên mỗi `wallet_entry` là **bắt buộc**, không cho để trống |
| **Mốc doanh thu khác mốc khấu trừ** | Điều 5.3 ND 68/2026: doanh thu tính từ **lúc chuyển giao quyền sở hữu**. Điều 44.1.b ND 252: khấu trừ lúc **nền tảng xác nhận**. Hai mốc có thể lệch | Định nghĩa "Đã xác nhận" **gần thời điểm giao hàng nhất có thể**. Nếu để sau cửa sổ đổi trả quá lâu → khấu trừ trễ |

---

## 3. Điều 45 ND 252/2026 — Đăng ký, kê khai, nộp thay

> ### Điều 45. Đăng ký thuế, cách thức kê khai và nộp thay số thuế đã khấu trừ
>
> **1. Đăng ký giao dịch thuế điện tử và đăng ký thuế:**
>
> a) Chủ quản nền tảng thương mại điện tử ở trong nước ... thực hiện đăng ký thuế và **được cấp mã số thuế riêng cho việc khai và nộp thay số thuế đã khấu trừ** theo hướng dẫn của Bộ trưởng Bộ Tài chính và được sử dụng tài khoản giao dịch thuế điện tử đã được cấp để thực hiện giao dịch thuế điện tử;
>
> b) *(chủ quản nền tảng ở nước ngoài — không áp dụng VComm)*
>
> **2. Chủ quản nền tảng thương mại điện tử thực hiện khai số thuế đã khấu trừ theo tháng.**
>
> Đối với giao dịch bị hủy hoặc trả lại hàng thì chủ quản nền tảng thương mại điện tử thực hiện **bù trừ** số thuế đã khấu trừ, nộp thay của giao dịch bị hủy hoặc trả lại hàng với số thuế phải khấu trừ, nộp thay của các giao dịch bán hàng hóa, cung cấp dịch vụ.
>
> Số thuế nộp thay ... được xác định bằng tổng số thuế của các giao dịch ... sau khi bù trừ với tổng số thuế các giao dịch bị hủy hoặc trả lại hàng ...
>
> **3. Tổ chức kinh doanh tại Việt Nam thực hiện khai số thuế đã khấu trừ theo từng lần phát sinh. Trường hợp phát sinh nhiều lần trong tháng thì được khai theo tháng.**
>
> **4. Thời hạn nộp hồ sơ khai ... theo quy định tại Điều 10 Nghị định này.**
>
> **5. Hồ sơ kê khai ... thực hiện theo hướng dẫn của Bộ trưởng Bộ Tài chính.**

### Rút ra cho VComm

| Yêu cầu | Hành động |
|---|---|
| **MST riêng** (45.1.a) | Đăng ký MST riêng cho hoạt động khấu trừ — **việc hành chính, không phải code** |
| **Kê khai theo tháng** (45.2) | Job tổng hợp tháng + xuất tờ khai. Ghi chú: **VComm vừa là chủ quản nền tảng (tháng) vừa có thể là tổ chức kinh doanh tại VN (từng lần / tháng — 45.3)** → hai luồng kê khai khác nhau, đừng gộp |
| **Bù trừ huỷ/trả hàng** (45.2) | `hr_withholding_accruals` cần cột `reversed_by` / `reversal_of`. Số nộp = tổng khấu trừ − tổng hoàn huỷ |
| **Thời hạn** (45.4 → Điều 10) | ⚠️ **Chưa đọc Điều 10 ND 252/2026** — cần đọc trước khi viết job |

---

## 4. Thông tư 18/2026/TT-BTC — và phát hiện nó đã bị thay thế một phần

**Thông tin:** số 18/2026/TT-BTC · ngày 05/03/2026 · có hiệu lực từ ngày ký.
**Thay thế:** TT 40/2021/TT-BTC và TT 100/2021/TT-BTC.
**Phạm vi:** chỉ quy định **hồ sơ, thủ tục** quản lý thuế (thông báo doanh thu, kê khai, nộp, hoàn thuế, địa điểm KD, tạm ngừng, chấm dứt) cho hộ KD / cá nhân KD. **Không quy định chính sách thuế** — cái đó nằm ở ND 68/2026.

### Điều 4.2.a — hồ sơ cho trường hợp VComm

> **a) Đối với tổ chức khai thuế thay, nộp thuế thay cho cá nhân hợp tác kinh doanh với tổ chức** là Tờ khai theo **Mẫu số 01/TCKT** và Phụ lục Bảng kê chi tiết hộ kinh doanh, cá nhân kinh doanh theo **Mẫu số 01/BK-KTHTKD**

→ **Đây là mẫu VComm sẽ dùng cho khấu trừ hoa hồng CTV/Affiliate.**

### ⚠️ ĐÍNH CHÍNH — TT 18/2026 đã bị thay thế một phần

Theo văn bản hợp nhất, nhiều mẫu đã bị thay thế:

| Mẫu | Thay thế bởi |
|---|---|
| 01/TCKT · 01/BK-KTHTKD **(mẫu của VComm)** | **TT 89/2026/TT-BTC** Phụ lục I (khoản 5 Điều 99) |
| 01/TKN-CNKD · 01/CNKD | **TT 50/2026/TT-BTC** Điều 3 → sau đó 01/TKN-CNKD bị thay tiếp bởi **TT 89/2026/TT-BTC** |
| 02/CNKD-TNCN-QTT | **TT 89/2026/TT-BTC** Phụ lục I |
| 02/BK-KTBĐS · 01/BĐS | **TT 50/2026/TT-BTC** Điều 3 |

> 🔴 **Hệ quả:** đừng thiết kế theo Mẫu 01/TCKT bản gốc của TT 18/2026 — **mẫu hiện hành là bản tại Phụ lục I TT 89/2026/TT-BTC.**
> ⚠️ **Chưa đọc:** TT 89/2026/TT-BTC · TT 50/2026/TT-BTC.

### Phân loại 6 nhóm doanh thu nền tảng (Mẫu 01/TKN-CNKD mục 2)

```
2.1  Phân phối, cung cấp hàng hóa                                    [09a]
2.2  Dịch vụ, xây dựng không bao thầu nguyên vật liệu                [09b]
2.3  Hoạt động cho thuê tài sản trừ bất động sản                     [09c]
2.4  Sản xuất, vận tải, dịch vụ gắn với hàng hóa,
       xây dựng có bao thầu nguyên vật liệu                          [09d]
2.5  SP nội dung thông tin số (giải trí, game, phim, ảnh, nhạc,
       quảng cáo số)                                                 [09e]
2.6  Hoạt động kinh doanh khác                                       [09g]
```

> 📌 **Chi tiết hơn bảng 4 nhóm tôi có ở spec 025 §4.2.** Thêm **2.3 cho thuê tài sản** và
> **2.5 nội dung số**. Bảng thuế suất cần cập nhật theo 6 nhóm này.

### Điểm bất lợi bật lên từ Mẫu 01/CNKD

Tờ khai có ô checkbox:

> *"□ Hộ kinh doanh, cá nhân kinh doanh **chỉ** có hoạt động kinh doanh trên nền tảng thương mại điện tử, nền tảng số khác **không có chức năng đặt hàng trực tuyến và chức năng thanh toán**"*

→ Đây là ô **loại trừ**: chỉ nền tảng **không có cả 2 chức năng** thì người bán mới được đánh dấu.
VComm có cả 2 → **không được tick**. Xác nhận lại lần nữa VComm thuộc diện khấu trừ.

### Điều 4.1.d — nghĩa vụ liên quan trực tiếp đến #14

Hộ KD / cá nhân KD phải gửi **Thông báo số tài khoản / số hiệu ví điện tử** theo **Mẫu 01/BK-STK**:
- Đang hoạt động (điểm b khoản 4 Điều 17 ND 68/2026): **chậm nhất 20/4/2026**
- Đang hoạt động (điểm a khoản 4 Điều 17): kèm tờ khai đầu tiên năm 2026
- Mới ra kinh doanh: kèm thông báo doanh thu / tờ khai đầu tiên
- **Đổi tài khoản → phải thông báo lại**

→ **Form onboarding Seller phải thu `bank_account` + `wallet_id`, và có luồng "đổi tài khoản".**

---

## 5. Điều 5, 6 ND 68/2026 — Doanh thu tính thuế & chi phí được trừ

### Điều 5 — Doanh thu để xác định TNCN (trích điểm chính)

> **1.** Doanh thu là toàn bộ tiền bán hàng, tiền gia công, tiền cung ứng dịch vụ kể cả trợ giá, phụ thu, phụ trội mà hộ kinh doanh, cá nhân kinh doanh được hưởng, **không phân biệt đã thu được tiền hay chưa thu được tiền**; bao gồm cả các khoản thưởng được nhận, **khoản được nhận từ hỗ trợ đạt doanh số, khuyến mại, chiết khấu thanh toán**, khoản hỗ trợ được nhận bằng tiền hoặc không bằng tiền, các khoản bồi thường vi phạm hợp đồng, bồi thường khác liên quan đến hoạt động kinh doanh, doanh thu khác ...
> **không bao gồm chiết khấu thương mại, giảm giá hàng bán và giá trị hàng bán bị trả lại.**

> **3. Thời điểm xác định doanh thu:**
> a) Đối với hoạt động bán hàng hóa là **thời điểm chuyển giao quyền sở hữu, quyền sử dụng hàng hóa** cho người mua;
> b) Đối với hoạt động cung ứng dịch vụ là thời điểm hoàn thành việc cung ứng dịch vụ hoặc hoàn thành từng phần việc cung ứng dịch vụ cho người mua ...

**Ba hệ quả cho VComm:**

1. 🔴 **"khoản được nhận từ hỗ trợ đạt doanh số, khuyến mại" LÀ DOANH THU.** Tiền VComm trợ giá FlashSale, thưởng doanh số, V-Xu quy đổi thành tiền cho Seller → **tính vào doanh thu chịu thuế của Seller**, không phải quà tặng.
2. ✅ **"giá trị hàng bán bị trả lại" KHÔNG tính** → đối xứng hoàn hảo với cơ chế **bù trừ** ở Điều 45.2 ND 252/2026.
3. ⚠️ **Hai mốc thời gian khác nhau** (chuyển giao quyền sở hữu vs. nền tảng xác nhận) — xem bảng cạm bẫy §2.

### Điều 6 — Chi phí được trừ (điểm đáng chú ý)

> **1.** Các khoản chi được trừ là các khoản chi phí thực tế phát sinh liên quan đến hoạt động SXKD, **có đủ hóa đơn, chứng từ** ..., và **chứng từ thanh toán không dùng tiền mặt đối với các khoản thanh toán từng lần có giá trị từ 05 triệu đồng trở lên** ...

> **1.c)** Chi phí **khấu hao tài sản cố định** phục vụ cho hoạt động SXKD ... *(củng cố quyết định làm 2.1 TSCĐ trước GĐ3 — đúng như anh đã quyết định)*

> **2.c)** Khoản tiền lương, tiền công ... của **cá nhân kinh doanh, nhóm cá nhân kinh doanh, các thành viên trong hộ kinh doanh** ... **không được trừ**

**Hệ quả:**

| Quy định | Việc phải làm |
|---|---|
| **≥ 5 triệu phải có chứng từ thanh toán không dùng tiền mặt** (6.1) | Chi hoa hồng / payout cho Seller **≥ 5tr bắt buộc chuyển khoản + lưu chứng từ**. Thiết kế #14 (chuyển khoản từ TK VComm) đã đáp ứng — nhưng **phải lưu chứng từ**, không chỉ trạng thái |
| Khấu hao TSCĐ được trừ (6.1.c) | Củng cố ưu tiên **2.1** |
| Lương của chủ hộ KD không được trừ (6.2.c) | Ảnh hưởng Seller là hộ KD — không ảnh hưởng VComm |

---

## 6. ⚠️ ĐÍNH CHÍNH — đánh giá lại rủi ro NHNN theo thiết kế #14

**Đây là phần quan trọng nhất của tài liệu này.** Tôi đã viết ở spec 025 §1.4:

> "rủi ro lớn hơn: giấy phép trung gian thanh toán NHNN (Điều 15 ND 101/2012: giấy phép + **vốn điều lệ tối thiểu 50 tỷ**; TT 39/2014: 'dịch vụ hỗ trợ thu hộ, chi hộ')"

**Hai trong ba căn cứ đó giờ không còn đúng, và lập luận của tôi quá đà.**

### 6.1 Đính chính 1 — ND 101/2012 đã hết hiệu lực

| | spec 025 đã viết | Thực tế |
|---|---|---|
| Căn cứ | **ND 101/2012/NĐ-CP** Điều 15 | ❌ Hết hiệu lực **01/7/2024** |
| Thay thế bởi | — | ✅ **ND 52/2024/NĐ-CP** (15/5/2024, hiệu lực **01/7/2024**) |

### 6.2 Đính chính 2 — TT 39/2014 cũng đã hết hiệu lực

| | spec 025 đã viết | Thực tế |
|---|---|---|
| Căn cứ | **TT 39/2014/TT-NHNN** | ❌ Hết hiệu lực **01/10/2024** |
| Thay thế bởi | — | ✅ **TT 40/2024/TT-NHNN** (30/8/2024, hiệu lực **01/10/2024**); trước đó sửa bởi TT 23/2019 |

### 6.3 Đính chính 3 — lập luận "thu hộ, chi hộ" của tôi quá đà ⭐

Tôi trích dẫn "dịch vụ hỗ trợ thu hộ, chi hộ" như thể **bất kỳ** việc thu tiền rồi chia lại đều rơi vào đó. **Định nghĩa gốc chật hơn nhiều.**

**TT 39/2014 Điều 3.4** (đã hết hiệu lực, nhưng cho thấy cách hiểu gốc):

> *"**Dịch vụ hỗ trợ thu hộ, chi hộ** là dịch vụ **hỗ trợ các ngân hàng** thực hiện dịch vụ thu hộ, chi hộ cho khách hàng có tài khoản thanh toán, thẻ ngân hàng tại ngân hàng thông qua việc nhận, xử lý, gửi thông điệp dữ liệu điện tử và tính toán kết quả thu hộ, chi hộ; hủy việc thu hộ, chi hộ để quyết toán cho các bên có liên quan."*

🔑 **Chữ then chốt: "hỗ trợ các ngân hàng".** Đây là **dịch vụ hạ tầng B2B cung cấp cho ngân hàng**, không phải bản thân việc thu tiền rồi chia lại. VComm không làm dịch vụ cho ngân hàng.

> ⚠️ **Tuy nhiên, chưa chắc chắn hoàn toàn:** ND 52/2024 liệt kê "dịch vụ hỗ trợ thu hộ, chi hộ" như một dịch vụ độc lập, **không kèm cụm "hỗ trợ các ngân hàng" trong văn bản Nghị định**. Cụm đó nằm ở TT 39/2014 — đã bị thay thế.
> → **Cần đọc TT 40/2024/TT-NHNN để xác nhận định nghĩa hiện hành. Đây là lỗ hổng thật sự, tôi chưa đọc.**

### 6.4 Căn cứ hiện hành — ND 52/2024/NĐ-CP (đo trực tiếp từ baochinhphu.vn)

**Dịch vụ trung gian thanh toán gồm 6 loại:**
```
1. Dịch vụ chuyển mạch tài chính
2. Dịch vụ chuyển mạch tài chính quốc tế
3. Dịch vụ bù trừ điện tử
4. Dịch vụ ví điện tử            ← liên quan trực tiếp
5. Dịch vụ hỗ trợ thu hộ, chi hộ  ← liên quan trực tiếp
6. Dịch vụ cổng thanh toán điện tử
```

**Vốn điều lệ thực góp tối thiểu:**
```
50 tỷ đồng  ← ví điện tử, hỗ trợ thu hộ/chi hộ, cổng thanh toán điện tử
300 tỷ đồng ← chuyển mạch tài chính, chuyển mạch tài chính quốc tế, bù trừ điện tử
```

✅ **Con số 50 tỷ tôi đưa ra vẫn đúng** — nhưng tình cờ đúng, vì căn cứ pháp lý đã đổi.

**Định nghĩa then chốt (ND 52/2024):**

> **Khoản 12 Điều 3 — Tiền điện tử:** giá trị đồng Việt Nam được lưu trữ trên phương tiện điện tử, được cung cấp trên cơ sở **tương ứng với số tiền khách hàng trả trước** cho ngân hàng ... và tổ chức cung ứng dịch vụ trung gian thanh toán cung ứng dịch vụ ví điện tử.
>
> **Khoản 16 Điều 3 — Dịch vụ ví điện tử:** dịch vụ ... cung ứng cho khách hàng để **nạp tiền vào ví điện tử, rút tiền từ ví điện tử và thực hiện giao dịch thanh toán**.
>
> **Điều 6:** ví điện tử là phương tiện lưu trữ tiền điện tử; tổ chức TGTT phải bảo đảm **tổng số dư tài khoản đảm bảo thanh toán ≥ tổng số dư tất cả ví đã phát hành**; **chỉ được dùng cho ví liên kết với chính tài khoản thanh toán/thẻ ghi nợ của khách hàng**.

### 6.5 Đánh giá lại thiết kế #14 của anh

| Tiêu chí | Thiết kế #14 của anh | Rơi vào "ví điện tử"? |
|---|:--:|:--:|
| Tiền người mua vào **tài khoản đảm bảo thanh toán** 1:1? | ❌ Vào **TK ngân hàng của VComm** | ✅ **Không** |
| Phát hành **tiền điện tử** đối ứng số tiền trả trước? | ❌ Số dư là **khoản phải trả** của VComm | ✅ **Không** |
| Có **nạp tiền vào ví**? | ❌ Không — chỉ ghi nhận từ đơn hàng | ✅ **Không** |
| Dùng số dư để **thanh toán bên thứ ba**? | ❌ Chỉ **đề nghị rút** về TK của Seller | ✅ **Không** |
| VComm có làm dịch vụ **cho ngân hàng**? | ❌ | ✅ **Không** |

> ✅ **Kết luận: thiết kế anh chọn (QR động → về TK VComm → chi ngược lại) KHÔNG cấu thành
> "dịch vụ ví điện tử" theo ND 52/2024**, và lập luận "thu hộ chi hộ" của tôi ở spec 025 **quá đà**
> vì bỏ qua cụm "hỗ trợ các ngân hàng".
>
> **Yếu tố quyết định không phải luồng tiền kỹ thuật, mà là CẤU TRÚC HỢP ĐỒNG:**
> nếu VComm đứng tên bán cho người mua (bên bán là VComm, chịu rủi ro), thì tiền thu vào là
> **doanh thu của VComm**, và chi cho Seller là **thanh toán nợ mua hàng** → không phải thu hộ/chi hộ.
> Nếu VComm chỉ làm trung gian và Seller mới là người bán trên giấy tờ → rủi ro quay lại.

### 6.6 Năm việc rẻ tiền để khoá chặt vị thế này

| # | Việc | Chi phí |
|---|---|---|
| 1 | Hợp đồng + điều khoản: VComm là **bên bán đối với người mua**; tránh mọi từ "thu hộ", "giữ hộ" trong hợp đồng và UI | 0 (đổi văn bản) |
| 2 | **Đổi tên sản phẩm**: "Ví Seller" → **"Số dư phải trả" / "Tài khoản công nợ"**. Cách gọi có giá trị khi cơ quan quản lý xem xét | ~0 |
| 3 | **Không** mở "tài khoản đảm bảo thanh toán" tách biệt tỷ lệ 1:1 | 0 |
| 4 | Số dư **không được dùng** để thanh toán bên thứ ba — chỉ rút về TK Seller | đã đúng trong thiết kế |
| 5 | Mọi khoản chi **≥ 5 triệu** phải chuyển khoản + **lưu chứng từ** (Điều 6.1 ND 68/2026) | nhỏ |

---

## 7. Tác động thiết kế: luồng thanh toán & ví Seller

```
Người mua
   │  QR động theo đơn (VNPay / MoMo / ZaloPay / thẻ / QR ngân hàng)
   ▼
┌──────────────────────────────────────┐
│ TRANG QL PHƯƠNG THỨC THANH TOÁN      │  đa đối tác, cấu hình runtime
│ (payment_methods / payment_providers)│
└──────────────────────────────────────┘
   ▼
TK NGÂN HÀNG VComm   ← tiền về đây (doanh thu của VComm)
   ▼
Ghi nhận số dư Seller/POS:
   ┌────────────────┬────────────────┐
   │ CHỜ XÁC NHẬN   │  ĐÃ XÁC NHẬN   │
   │ chưa khấu trừ  │  ⚡ KHẤU TRỪ   │  ← Điều 44.1.b ND 252/2026
   │ chưa rút được  │  ĐƯỢC RÚT      │
   └────────────────┴────────────────┘
   ▼
Đề nghị rút → chuyển khoản + chứng từ (≥5tr bắt buộc, Điều 6.1 ND 68/2026)
```

**Bảng dữ liệu cần có:**

| Bảng | Trường bắt buộc | Lý do |
|---|---|---|
| `wallet_entries` | `status` (`PENDING`/`CONFIRMED`), `confirmed_at`, `product_category` | Điều 44.1.b + tránh bẫy thuế suất cao nhất (44.2.b) |
| `wallet_entries` | `source_order_id`, `reversal_of` | Bù trừ huỷ/trả hàng (Điều 45.2) |
| `withholding_accruals` | `entity_type`, `partner_type`, `rate`, `period` | Kê khai tháng (Điều 45.2) |
| `seller_payout_methods` | `bank_account`, `wallet_id`, `changed_at` | Mẫu 01/BK-STK (TT 18 Điều 4.1.d) |
| `payouts` | `amount`, `non_cash_proof_ref` | Điều 6.1 ND 68/2026 (≥5tr) |

---

## 8. Cập nhật ma trận khấu trừ (áp #15 = WITHHOLD_ALWAYS, #0 = 10%)

| partner_type | entity_type | spec 024 cũ | **Sau #15/#0** |
|---|:--:|:--:|:--:|
| `SELLER` | `INDIVIDUAL` | `WARN` | 🔴 **`WITHHOLD`** |
| `SELLER` | `HOUSEHOLD_BUSINESS` | `WARN` | 🔴 **`WITHHOLD`** |
| `SELLER` | `LEGAL_ENTITY` | `OFF` | `OFF` (pháp nhân tự kê khai) |
| `AGENT` (CTV) | `INDIVIDUAL` | `WARN` | 🔴 **`WITHHOLD` @ 10%** |
| `AGENT` | `LEGAL_ENTITY` | `OFF` | `OFF` |
| `PICKUP_HUB` | `INDIVIDUAL` | `WARN` | 🔴 **`WITHHOLD`** |
| `PICKUP_HUB` | `LEGAL_ENTITY` | — | `OFF` (quyết định #10) |

```sql
-- Seed cập nhật
('SELLER',    'INDIVIDUAL',        'WITHHOLD', 'PLATFORM'),
('SELLER',    'HOUSEHOLD_BUSINESS','WITHHOLD', 'PLATFORM'),
('SELLER',    'LEGAL_ENTITY',      'OFF',      NULL),
('AGENT',     'INDIVIDUAL',        'WITHHOLD', 'PIT_FLAT'),   -- flat_rate = 0.10 (#0)
('AGENT',     'LEGAL_ENTITY',      'OFF',      NULL),
('PICKUP_HUB','INDIVIDUAL',        'WITHHOLD', 'PIT_FLAT'),
('PICKUP_HUB','LEGAL_ENTITY',      'OFF',      NULL);
```

**`WITHHOLD_ALWAYS` giúp đơn giản hoá:** bỏ toàn bộ logic theo dõi ngưỡng 500tr/năm.
Ước lượng 2.6c-2 **giảm** khoảng 1 ngày.

---

## 9. Cập nhật kế hoạch

**Thứ tự GĐ2 — không đổi:** `2.1 → 2.6a (1d) → 2.6c-0 (0,5d) → 2.6c-1 (0,5d) → 2.5 → 2.6b → 2.6c-2 → 4.1 → 3.3/3.4`

**Việc mới phát sinh từ đợt đọc luật này:**

| # | Việc | Chi phí | Xếp vào |
|---|---|---:|---|
| 1 | Sửa 3 căn cứ pháp lý trong spec 025 §1.4 (ND 101→52, TT 39→40) | 0 | ngay |
| 2 | Đổi tên "Ví Seller" → "Số dư phải trả" + rà từ "thu hộ/chi hộ" trong UI | 0,5 ngày | 2.6c-2 |
| 3 | Thêm `product_category` bắt buộc vào `wallet_entries` | đã nằm trong 2.6c-2 | — |
| 4 | Đăng ký **MST riêng** cho hoạt động khấu trừ (Điều 45.1.a) | hành chính | song song 2.6b |
| 5 | Cập nhật bảng thuế suất từ **4 nhóm → 6 nhóm** (TT 18 Mẫu 01/TKN-CNKD) | 0,5 ngày | 2.6c-2 |

**Ước lượng:** 2.6c-2 tăng ~1 ngày (thêm việc 2 và 5) nhưng giảm ~1 ngày (bỏ ngưỡng 500tr) → **hoà vốn**.

---

## 10. ⚠️ Chưa đọc — xếp theo mức độ chặn

| Văn bản | Mức độ | Tại sao cần |
|---|:--:|---|
| **TT 40/2024/TT-NHNN** | 🔴 **Cao** | Định nghĩa hiện hành của "hỗ trợ thu hộ, chi hộ" và "ví điện tử". Quyết định mức độ phơi nhiễm thật sự |
| **Điều 10 ND 252/2026** | 🔴 Cao | Thời hạn nộp hồ sơ khai — cần trước khi viết job kê khai tháng |
| **TT 89/2026/TT-BTC** | 🟡 TB | Mẫu **01/TCKT + 01/BK-KTHTKD hiện hành** (TT 18 đã bị thay) |
| **TT 50/2026/TT-BTC** | 🟡 TB | Thay thế một số mẫu của TT 18 |
| **Điều 43 ND 252/2026** | 🟡 TB | Đọc nguyên văn để chắc danh sách đối tượng khấu trừ |
| **Điều 64 ND 253/2026** | 🟡 TB | Thuế suất cá nhân không cư trú — cần trước khi cài `NON_RESIDENT` |
| TT 18/2026 các Điều còn lại | ⚪ Thấp | Đã nắm phần quan trọng (Điều 1–4) |

---

## 11. Tóm tắt một câu

> **Điều 44.1.b ND 252/2026 quy định thời điểm khấu trừ là "khi nền tảng xác nhận giao dịch" — trùng khớp tự nhiên với trạng thái "Đã xác nhận" anh vừa thiết kế ở #14; và sau khi đối chiếu lại căn cứ gốc, thiết kế QR động → về TK VComm → chi ngược lại KHÔNG cấu thành "ví điện tử" theo ND 52/2024, đồng thời rủi ro giấy phép NHNN mà tôi từng cảnh báo ở spec 025 đã bị tôi đánh giá quá đà vì bỏ qua cụm "hỗ trợ các ngân hàng".**
