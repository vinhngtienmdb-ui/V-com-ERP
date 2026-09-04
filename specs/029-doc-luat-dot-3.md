# 029 — Đọc luật đợt 3: rà soát toàn diện & phát hiện 5 văn bản mới

**Ngày:** 02/09/2026 · **Trạng thái:** hoàn thành đọc · **Kế tiếp:** `specs/030` (sửa code theo §10)

> Mục đích: đọc nốt các văn bản chưa đọc, **và rà soát lại toàn bộ căn cứ pháp lý đang viện dẫn
> trong code**, vì phát hiện có văn bản mới ban hành 30/6/2026 mà dự án chưa hề biết.

---

## 0. Tóm tắt điều hành — đọc 5 dòng này trước

| # | Phát hiện | Mức độ |
|---|---|---|
| 1 | **NĐ 254/2026/NĐ-CP (30/6/2026, hiệu lực 01/7/2026) thay thế NĐ 123/2020** — toàn bộ khung HĐĐT đổi nền | 🔴 |
| 2 | **TT 91/2026/TT-BTC (30/6/2026, hiệu lực 01/7/2026) thay thế TT 32/2025** — tức kế hoạch S1 tuần trước (sửa 10 chỗ TT 78 → TT 32) **đã lỗi thời trước khi làm** | 🔴 |
| 3 | **TT 89/2026/TT-BTC (30/6/2026, hiệu lực 01/7/2026)** thay thế TT 80/2021 + bãi bỏ 9 thông tư; **Điều 22 bỏ khai thuế TNCN theo tháng → khai theo QUÝ** (ảnh hưởng module lương) | 🔴 |
| 4 | **`NĐ 72/2025` trong code là SAI văn bản** — NĐ 72/2025 là nghị định về **giá bán lẻ điện**. Giảm thuế GTGT 2% phải viện dẫn **NĐ 174/2025/NĐ-CP** (hiệu lực 1/7/2025 – 31/12/2026) | 🔴 |
| 5 | **Kết luận "VComm không phải ví điện tử" đã được chốt bằng luật viện dẫn nguyên văn** (NĐ 52/2024 Điều 3.16 + Điều 6 + Điều 3.2) — nâng từ lập luận tương tự lên **bộ 3 tiêu chí định nghĩa** | 🟢 |

**Điều đáng nói nhất:** đây là lần thứ **5** dự án phát hiện mình đang viện dẫn văn bản đã hết
hiệu lực. Lần 1: TT200/2014 · Lần 2: TT88/2021 · Lần 3: NĐ 101/2012 + TT 39/2014 ·
Lần 4: TT 78/2021 · **Lần 5: TT 32/2025 (chưa kịp sửa đã hết hiệu lực) và NĐ 72/2025 (sai văn bản).**
Gốc rễ không phải là lười cập nhật — mà là **không có cơ chế kiểm tra**. Xem §11 (S0).

---

## 1. Cây pháp lý hiện hành (cập nhật 02/09/2026)

### 1.1 Hóa đơn điện tử — nền đã đổi

```
Luật Quản lý thuế 108/2025/QH15
└── NĐ 254/2026/NĐ-CP (30/6/2026 · HL 01/7/2026)   ← THAY THẾ NĐ 123/2020
    └── TT 91/2026/TT-BTC (30/6/2026 · HL 01/7/2026) ← THAY THẾ TT 32/2025
        ├── Phụ lục I  : ký hiệu mẫu + ký hiệu hóa đơn
        ├── Phụ lục III: mẫu biểu (01/ĐKTĐ-HĐĐT, 04/SS-HĐĐT, 01/BK-ĐCTT …)
        └── Phụ lục V  : mẫu hiển thị tham khảo

ĐÃ HẾT HIỆU LỰC: NĐ 70/2025 (sửa NĐ 123) · TT 32/2025 · TT 78/2021
```

### 1.2 Quản lý thuế — nền đã đổi

```
Luật Quản lý thuế 108/2025/QH15
├── NĐ 252/2026/NĐ-CP (30/6/2026 · HL 01/7/2026)  ← thay NĐ 126/2020, 91/2022,
│                                                    49/2025, 117/2025, 373/2025
│   └── TT 89/2026/TT-BTC (30/6/2026 · HL 01/7/2026) ← thay TT 80/2021 (+94/2025, +21/2026)
├── NĐ 253/2026/NĐ-CP — TNCN
├── NĐ 254/2026/NĐ-CP — HĐĐT
└── NĐ 255/2026/NĐ-CP — giao dịch liên kết
```

### 1.3 Hộ kinh doanh / cá nhân kinh doanh

```
TT 40/2021/TT-BTC → TT 18/2026/TT-BTC → (TT 50/2026/TT-BTC sửa đổi 13/5/2026)
                                      → TT 89/2026/TT-BTC Điều 99.5 thay thế mẫu biểu
Mẫu hiện hành: 01/TKN-CNKD · 01/CNKD · 01/BĐS · 02/BK-KTBĐS  (Phụ lục I TT 89/2026)
```

---

## 2. NĐ 254/2026/NĐ-CP — đọc nguyên văn (HĐĐT)

Nguồn: toàn văn trên `xaydungchinhsach.chinhphu.vn` + `thuvienphapluat.vn`.
PDF chính thức (55 trang) là **file scan không có text layer** — không trích được, phải dùng bản web.

### 2.1 Điều 4 — 7 nguyên tắc (trích nguyên văn các khoản liên quan VComm)

> **1.** Khi bán hàng hóa, cung cấp dịch vụ, người bán phải lập hóa đơn điện tử để giao cho người mua
> (bao gồm cả các trường hợp hàng hóa, dịch vụ dùng để khuyến mại, quảng cáo, hàng mẫu; hàng hóa, dịch
> vụ dùng để cho, biếu, tặng, trao đổi, **trả thay lương cho người lao động** và tiêu dùng nội bộ; xuất
> hàng hóa dưới các hình thức cho vay, cho mượn)…

> **5.** Người bán hàng hóa, cung cấp dịch vụ **được ủy nhiệm cho bên thứ ba lập hóa đơn điện tử**
> cho hoạt động bán hàng hóa, cung cấp dịch vụ. Bộ trưởng Bộ Tài chính hướng dẫn cụ thể nội dung này.

> **7.** Trường hợp tổ chức thu thuế, phí, lệ phí và người cung cấp dịch vụ cùng thực hiện thu thuế,
> phí, lệ phí và tiền bán hàng hóa, cung cấp dịch vụ của một khách hàng thì được tích hợp biên lai
> thu thuế, phí, lệ phí và hóa đơn trên cùng một định dạng điện tử…

**Ba điểm chú ý cho VComm:**
- **Khoản 1 xác nhận ở cấp Nghị định: hàng khuyến mại / biếu tặng / trả thay lương VẪN PHẢI xuất hóa đơn.**
  Nghĩa vụ này cũng kéo theo module V-Xu + FlashSale + Affiliate (quyết định #18): mọi khoản
  chiết khấu, hoa hồng KOL, quà tặng đều nằm trong phạm vi phải lập HĐ.
- **Khoản 5: ủy nhiệm lập HĐĐT được hiến định ở cấp Nghị định, không kèm điều kiện "liên kết".**
  → Câu hỏi #20 (VComm có xuất HĐ thay Seller không) **khả thi về mặt pháp lý**.
- **Khoản 7 + TT 91 mẫu số 8/9**: HĐ tích hợp biên lai (dùng cho sàn thu hộ phí).

### 2.2 Điều 10 — nội dung hóa đơn (bắt buộc, có 2 mục MỚI)

Ngoài các nội dung cũ (tên/ký hiệu/mẫu số, số HĐ, tên-địa chỉ-MST người bán/mua, hàng hóa,
thuế suất, chữ ký, thời điểm lập, thời điểm ký số, mã CQT), ND 254 bổ sung:

> **k)** Phí, lệ phí thuộc ngân sách nhà nước, **chiết khấu thương mại, khuyến mại (nếu có)** và các
> nội dung khác liên quan (nếu có).

Theo hướng dẫn chi tiết (Phụ lục + bài phân tích luật), còn bắt buộc thêm:

- **Tên, mã, địa chỉ địa điểm kinh doanh** (mới). Với xăng dầu: mã + địa chỉ từng địa điểm do cơ quan
  có thẩm quyền cấp.
- **Nếu người mua là cá nhân không cung cấp tên/địa chỉ/ĐDCN → không được để trống**, phải ghi
  **"Bán cho người tiêu dùng"**. *(Trả lời trực tiếp câu hỏi thắc mắc trước đó:
  HĐ từ máy tính tiền **vẫn phải ghi "Bán cho người tiêu dùng"** khi người mua không cung cấp thông tin.)*

⚠️ **Tác động code:** `buildEInvoiceDraft()` hiện ghi `buyerName` trống cho khách lẻ.
Phải đổi thành chuỗi `"Bán cho người tiêu dùng"`. Và phải có field `businessLocationCode`.

### 2.3 Điều 7 — 8 trường hợp KHÔNG phải dùng HĐĐT (mới)

1. Hộ/cá nhân KD dùng bảng kê mua hàng (trừ đã ĐK dùng HĐĐT)
2. Hộ/cá nhân KD có nguồn thu đặc thù (cho thuê BĐS; cung cấp nội dung số/game/quảng cáo cho tổ chức, cá nhân nước ngoài)
3. **Đại lý bị khấu trừ thuế** (xổ số, bảo hiểm, bán hàng đa cấp)
4. Hoạt động tài chính/bảo hiểm đặc thù (tái bảo hiểm, tiền gửi, bán nợ, ngoại hối, phái sinh, phát hành chứng chỉ/chứng khoán — bán ngoại hối phải có bảng kê tháng)
5. Góp vốn bằng tài sản
6. Điều chuyển tài sản nội bộ / tổ chức lại (công ty mẹ–đơn vị phụ thuộc; chia, tách, sáp nhập, chuyển đổi)
7. Mượn tài sản để gia công (máy móc cho mượn không chuyển quyền sở hữu)
8. **Tiêu dùng nội bộ và các khoản thu không phải bán hàng** (điều chuyển nội bộ, TSCĐ tự xây,
   bồi thường, tiền thưởng, thu hộ chi hộ bảo hiểm/bên thứ ba, **thu hộ**)

⚠️ Điểm 8 có đoạn "thu hộ" — **cần đối chiếu với thiết kế ví VComm (#14)**: khoản VComm thu hộ
cho bên thứ ba có rơi vào diện miễn lập HĐ hay không. Đây là việc cần xác nhận, không phải kết luận.

### 2.4 Điều 9 — thời điểm lập hóa đơn (thay đổi lớn)

> **Khoản 2 (dịch vụ):** thời điểm lập HĐ là **thời điểm hoàn thành việc cung cấp dịch vụ**,
> không phụ thuộc việc đã thu tiền hay chưa. Nếu thu tiền trước/trong khi cung cấp → thời điểm thu tiền.
> **Ngoại lệ MỚI:** *"không bao gồm trường hợp thu tiền đặt cọc theo quy định Bộ luật Dân sự để đảm
> bảo thực hiện hợp đồng cung cấp dịch vụ"* — trước đây (NĐ 70/2025) ngoại lệ này chỉ áp dụng cho
> 7 nhóm dịch vụ cụ thể (kế toán, kiểm toán, tư vấn tài chính/thuế, thẩm định giá, khảo sát thiết kế
> kỹ thuật, tư vấn giám sát, lập dự án đầu tư); **nay áp dụng cho MỌI hợp đồng dịch vụ.**

> **Khoản 4 — dịch vụ cần đối soát sau 7 ngày:** gồm 8 nhóm, trong đó có
> **công nghệ số, nền tảng số** và **dịch vụ trung gian thanh toán**.

⚠️ **Khoản 4 này có thể áp dụng trực tiếp cho VComm** (nền tảng số). Nếu rơi vào nhóm này,
thời điểm lập HĐ là **sau khi đối soát**, không phải lúc chốt đơn. **Cần xác nhận #22.**

### 2.5 Điều 6 — đối tượng bắt buộc dùng HĐĐT

Liệt kê theo ngành: điện, xăng dầu, bưu chính, viễn thông, nước sạch, tài chính–ngân hàng, chứng khoán,
**tài sản mã hóa**, **sàn giao dịch các-bon**, bảo hiểm, y tế, siêu thị, thương mại, vận tải,
**kinh doanh thương mại điện tử**.

→ **VComm (sàn TMĐT) thuộc diện bắt buộc.** Không có ngoại lệ.

### 2.6 Các mốc thời gian khác

| Mốc | Việc |
|---|---|
| 01/7/2026 | NĐ 254 có hiệu lực; thay thế NĐ 123/2020 |
| 31/12/2026 | Biên lai giấy tạo theo NĐ 123/2020 còn dùng được đến hết ngày này |
| **01/01/2027** | **Toàn bộ biên lai giấy chưa sử dụng phải tiêu hủy**; chuyển sang biên lai điện tử |

**Hộ/cá nhân KD doanh thu > 1 tỷ/năm** (hoặc bán tài sản phải đăng ký quyền sở hữu/sử dụng)
→ bắt buộc dùng HĐĐT có mã CQT **hoặc HĐĐT khởi tạo từ máy tính tiền có kết nối dữ liệu với CQT**.

**Thưởng tố giác:** người tiêu dùng tố giác người bán không lập hóa đơn được thưởng
**tối đa 10.000.000 ₫** (TT 91 Điều 14).

---

## 3. TT 91/2026/TT-BTC — đọc nguyên văn (HĐĐT)

Nguồn: `luatvietnam.vn` (Điều 1–23) · `thuvienphapluat.vn` (Phụ lục I) · bài hướng dẫn Điều 10.
PDF chính thức (97 trang, 28 MB) là **file scan, 0 ký tự text** — không trích được.

### 3.1 Cấu trúc

| Chương | Điều |
|---|---|
| I. Quy định chung | 1–2 |
| II. Quy định đối với HĐĐT | 3–16 |
| III. Quy định về chứng từ điện tử | 17–20 |
| IV. Tra cứu, cung cấp, sử dụng thông tin HĐĐT | 21–23+ |

Đáng chú ý trong Chương II: **Điều 4** ký hiệu mẫu/ký hiệu HĐ · **Điều 6** ĐK sử dụng ·
**Điều 7** tiêu chí rủi ro cao · **Điều 9** ủy nhiệm lập HĐĐT · **Điều 10** xử lý HĐĐT đã lập ·
**Điều 12** điều kiện tổ chức cung cấp dịch vụ HĐĐT · **Điều 13** khuyến khích lấy HĐ ·
**Điều 14** khen thưởng tố giác · **Điều 15** cấp HĐ có mã theo lần phát sinh · **Điều 16** tiêu hủy HĐ đặt in.

### 3.2 Điều 4 — ký hiệu mẫu & ký hiệu (nguyên văn khoản 1, 2, 4)

> **1.** Ký hiệu mẫu hóa đơn điện tử là **ký tự có một chữ số tự nhiên là các số 1, 2, 3, 4, 5, 6, 7, 8, 9**
> để phản ánh loại hóa đơn điện tử.
>
> **2.** Ký hiệu hóa đơn điện tử là **nhóm sáu ký tự** gồm cả chữ viết và chữ số thể hiện ký hiệu hóa đơn
> điện tử để phản ánh các thông tin về loại hóa đơn điện tử có mã của cơ quan thuế hoặc hóa đơn điện tử
> không có mã của cơ quan thuế, năm lập hóa đơn, loại hóa đơn điện tử được sử dụng.
>
> **4.** Quy định chi tiết về ký hiệu mẫu, ký hiệu hóa đơn tại **Phụ lục I** kèm theo Thông tư này.

### 3.3 Phụ lục I — NGUYÊN VĂN (đây là phần quan trọng nhất để sửa code)

**Ký hiệu mẫu (1 chữ số):**

| Số | Ý nghĩa |
|---|---|
| 1 | HĐĐT giá trị gia tăng |
| 2 | HĐĐT bán hàng |
| 3 | HĐĐT bán tài sản công |
| 4 | HĐĐT bán hàng dự trữ quốc gia |
| 5 | Các loại HĐĐT khác: tem, vé, thẻ, phiếu thu điện tử hoặc chứng từ điện tử có tên gọi khác nhưng có nội dung của HĐĐT (Điều 10 NĐ 254) |
| 6 | Chứng từ điện tử dùng & quản lý như hóa đơn: phiếu xuất kho kiêm vận chuyển nội bộ, phiếu xuất kho hàng gửi bán đại lý |
| **7** | **HÓA ĐƠN THƯƠNG MẠI ĐIỆN TỬ** |
| 8 | HĐĐT GTGT tích hợp biên lai thu thuế, phí, lệ phí |
| 9 | HĐĐT bán hàng tích hợp biên lai thu thuế, phí, lệ phí |

**Ký hiệu hóa đơn (6 ký tự):**

- **Ký tự 1 — `C` hoặc `K`:** `C` = HĐĐT **có mã** của CQT · `K` = HĐĐT **không có mã**.
- **Ký tự 2–3:** hai chữ số Ả rập = **năm lập** (2 chữ số cuối). Ví dụ 2026 → `26`.
- **Ký tự 4 — MỘT trong 10 chữ: `T D L M N B G H X F`**
  (nguyên văn):
  > + Chữ **T**: Áp dụng đối với hóa đơn điện tử do các doanh nghiệp, tổ chức, hộ kinh doanh, cá nhân kinh doanh đăng ký sử dụng với cơ quan thuế;
  > + Chữ **D**: Áp dụng đối với hóa đơn điện tử bán tài sản công và hóa đơn điện tử bán hàng dự trữ quốc gia hoặc hóa đơn điện tử đặc thù không nhất thiết phải có một số tiêu thức do các doanh nghiệp, tổ chức đăng ký sử dụng;
  > + Chữ **L**: Áp dụng đối với hóa đơn điện tử của cơ quan thuế cấp theo từng lần phát sinh;
  > + Chữ **M**: Áp dụng đối với hóa đơn điện tử được khởi tạo từ máy tính tiền;
  > + Chữ **N**: Áp dụng đối với phiếu xuất kho kiêm vận chuyển nội bộ điện tử;
  > + Chữ **B**: Áp dụng đối với phiếu xuất kho hàng gửi bán đại lý điện tử;
  > + Chữ **G**: Áp dụng đối với tem, vé, thẻ điện tử là hóa đơn giá trị gia tăng;
  > + Chữ **H**: Áp dụng đối với tem, vé, thẻ điện tử là hóa đơn bán hàng;
  > + Chữ **X**: **Áp dụng đối với hóa đơn thương mại điện tử;**
  > + Chữ **F**: Áp dụng đối với hóa đơn giá trị gia tăng kiêm tờ khai hoàn thuế.
- **Ký tự 5–6:** do người bán tự xác định theo nhu cầu quản lý; **không có nhu cầu thì dùng `YY`**.
- Ký hiệu hóa đơn + ký hiệu mẫu số được thể hiện ở **phía trên bên phải** hóa đơn (hoặc vị trí dễ nhận biết).

**Ví dụ nguyên văn trong Phụ lục I:**

> + **"7K26XAB"** – là hóa đơn thương mại điện tử **loại không có mã** được lập năm 2026 do doanh nghiệp đăng ký với cơ quan thuế.

**🟢 KẾT LUẬN CHO CODE — chuỗi ký hiệu đúng của VComm:**

```
Nếu phát hành không có mã (VComm tự cấp, có T-VAN):      7K26XYY
Nếu phát hành có mã CQT (ủy nhiệm thay hộ/cá nhân KD):   7C26XYY
     ││││ ││
     ││││ └┴─ ký tự 5-6: người bán tự định nghĩa (mặc định YY)
     │││└──── ký tự 4: X = hóa đơn TMĐT
     ││└───── ký tự 2-3: năm lập (26 = 2026)
     │└────── ký tự 1: C = có mã CQT / K = không có mã
     └─────── ký hiệu mẫu: 7 = hóa đơn TMĐT
```

⚠️ **Phát hiện mới:** so với TT 32/2025 Điều 5.1.b (9 chữ `T D L M N B G H X`),
**TT 91/2026 Phụ lục I thêm chữ `F`** (HĐ GTGT kiêm tờ khai hoàn thuế) → **10 chữ**.
Mọi regex validate ký hiệu hóa đơn viết theo TT 32 sẽ **sai** (thiếu F).

### 3.4 Điều 9 — Ủy nhiệm lập HĐĐT (nguyên văn, đầy đủ khoản 1 và khoản 3)

> **Điều 9. Ủy nhiệm lập hóa đơn điện tử**
>
> **1. Nguyên tắc ủy nhiệm lập hóa đơn:**
> a) Người bán hàng hóa, cung cấp dịch vụ được ủy nhiệm cho bên thứ ba là đối tượng đủ điều kiện sử dụng
> hóa đơn điện tử để lập hóa đơn điện tử cho hoạt động bán hàng hóa, cung cấp dịch vụ. Người bán và bên
> nhận ủy nhiệm không thuộc trường hợp ngừng, tạm ngừng sử dụng hóa đơn điện tử theo quy định tại Điều 8
> Thông tư này…
> b) Việc ủy nhiệm phải được lập bằng văn bản (hợp đồng hoặc thỏa thuận) giữa bên ủy nhiệm và bên nhận ủy
> nhiệm, trừ trường hợp bán tài sản thi hành án của cơ quan thi hành án;
> c) Việc ủy nhiệm phải thông báo cho cơ quan thuế khi đăng ký sử dụng hóa đơn điện tử;
> d) Hóa đơn điện tử do bên nhận ủy nhiệm lập là hóa đơn điện tử có mã hoặc không có mã của cơ quan thuế
> (bao gồm hóa đơn điện tử khởi tạo từ máy tính tiền) và phải thể hiện tên, địa chỉ, mã số thuế của bên
> ủy nhiệm và tên, địa chỉ, mã số thuế của bên nhận ủy nhiệm;
> **đ) Bên ủy nhiệm và bên nhận ủy nhiệm có trách nhiệm niêm yết trên website của đơn vị mình hoặc trên
> giao diện gian hàng hoặc hệ thống của nền tảng hoặc thông báo công khai trên phương tiện thông tin đại
> chúng để người mua hàng hóa, dịch vụ được biết về việc ủy nhiệm lập hóa đơn.** Khi hết thời hạn ủy
> nhiệm hoặc chấm dứt trước thời hạn ủy nhiệm lập hóa đơn điện tử theo thỏa thuận giữa các bên thì bên ủy
> nhiệm, bên nhận ủy nhiệm hủy các niêm yết, thông báo trên website của đơn vị mình hoặc thông báo công
> khai trên phương tiện thông tin đại chúng về việc hết thời hạn hoặc chấm dứt trước thời hạn ủy nhiệm
> lập hóa đơn;
> e) Trường hợp hóa đơn ủy nhiệm là hóa đơn điện tử không có mã của cơ quan thuế thì bên ủy nhiệm và bên
> nhận ủy nhiệm thỏa thuận về chuyển dữ liệu hóa đơn điện tử đến cơ quan thuế quản lý trực tiếp hoặc
> thông qua tổ chức cung cấp dịch vụ để chuyển dữ liệu hóa đơn điện tử đến cơ quan thuế quản lý trực tiếp;
> g) Bên nhận ủy nhiệm có trách nhiệm lập hóa đơn điện tử ủy nhiệm theo đúng thực tế phát sinh, theo
> thỏa thuận với bên ủy nhiệm và tuân thủ nguyên tắc tại khoản 1 Điều này;
> h) Hóa đơn điện tử do bên nhận ủy nhiệm lập phải phù hợp với **phương pháp tính thuế giá trị gia tăng
> của bên ủy nhiệm**.

> **3. Thông báo với cơ quan thuế về việc ủy nhiệm lập hóa đơn điện tử:**
> a) Việc ủy nhiệm được xác định là thay đổi thông tin đăng ký sử dụng hóa đơn điện tử… Bên ủy nhiệm và
> bên nhận ủy nhiệm sử dụng **Mẫu số 01/ĐKTĐ-HĐĐT** Phụ lục III… bao gồm cả trường hợp chấm dứt trước
> thời hạn ủy nhiệm lập hóa đơn điện tử theo thỏa thuận giữa các bên;
> c) **Trường hợp người bán hàng hóa, cung cấp dịch vụ là hộ kinh doanh, cá nhân kinh doanh ủy nhiệm cho
> bên thứ ba là tổ chức kinh tế lập hóa đơn điện tử cho hoạt động bán hàng hóa, cung cấp dịch vụ thì hộ
> kinh doanh, cá nhân kinh doanh có trách nhiệm cung cấp thông tin cho bên nhận ủy nhiệm, bao gồm: tên,
> địa chỉ, mã số thuế và thuộc đối tượng áp dụng hóa đơn điện tử theo quy định tại Điều 6 Nghị định số
> 254/2026/NĐ-CP. Tổ chức kinh tế thực hiện thông báo danh sách hộ kinh doanh, cá nhân kinh doanh ủy
> nhiệm với cơ quan thuế theo Mẫu số 01/ĐKTĐ-HĐĐT Phụ lục III kèm theo Thông tư này.**

**🔴 Hai nghĩa vụ UI/Data MỚI (TT 32/2025 không có ở mức này):**

1. **Điều 9.1.đ — bắt buộc niêm yết thông báo ủy nhiệm trên "giao diện gian hàng hoặc hệ thống của
   nền tảng".** → VComm phải render một banner/badge "Hóa đơn này do VComm lập thay cho
   [Tên Seller] – MST [xxx] theo ủy nhiệm" trên **từng gian hàng và trên chính tờ hóa đơn**.
   Khi hết hạn/chấm dứt ủy nhiệm phải gỡ. Đây là tính năng UI, không chỉ là cấu hình.
2. **Điều 9.3.c — VComm (tổ chức kinh tế) phải thông báo DANH SÁCH hộ/cá nhân KD ủy nhiệm cho CQT
   theo Mẫu 01/ĐKTĐ-HĐĐT.** → cần sinh & xuất mẫu này, không chỉ lưu trong DB.

**Điều 9.2.a — hợp đồng ủy nhiệm phải có đủ:** thông tin 2 bên (tên, địa chỉ, MST/ĐDCN, **chứng thư số**);
thông tin HĐ ủy nhiệm (loại HĐ, ký hiệu HĐ, ký hiệu mẫu số); mục đích; thời hạn;
phương thức thanh toán (ghi rõ trách nhiệm thanh toán tiền hàng trên HĐ ủy nhiệm).

**Điều 9.1.h → trả lời gián tiếp câu hỏi #21:** HĐ ủy nhiệm phải khớp **phương pháp tính thuế GTGT
của bên ủy nhiệm** → **bắt buộc phải lưu `tax_method` của Seller.** Không lưu = không thể phát hành đúng.

### 3.5 Điều 10 — Xử lý HĐĐT đã lập (nguyên văn, đầy đủ khoản 1)

> **khoản 1:** *"Trường hợp phát hiện hóa đơn điện tử đã lập sai (bao gồm hóa đơn điện tử đã được cấp mã
> của cơ quan thuế, hóa đơn điện tử không có mã của cơ quan thuế đã gửi dữ liệu đến cơ quan thuế) thì
> người bán thực hiện xử lý như sau:"*

**(1) điểm a — Chỉ thông báo, không lập lại hóa đơn** *(Mẫu 04/SS-HĐĐT, Phụ lục III)*

> *"Trường hợp sai về các nội dung trên hóa đơn như tên, địa chỉ, số tiền bằng chữ hoặc các nội dung
> khác nhưng không sai về: mã số thuế, số tiền ghi trên hóa đơn, thuế suất, tiền thuế hoặc hàng hóa ghi
> trên hóa đơn thì người bán thông báo cho người mua về việc hóa đơn đã lập sai và không phải lập lại
> hóa đơn. Người bán thực hiện thông báo với cơ quan thuế về hóa đơn điện tử đã lập sai theo Mẫu số
> 04/SS-HĐĐT Phụ lục III kèm theo Thông tư 91/2026/TT-BTC;"*

**(2) điểm b — Điều chỉnh HOẶC thay thế** (do người bán lựa chọn)

> *"Trường hợp hóa đơn điện tử đã lập sai các nội dung về: mã số thuế; tên hàng hóa, hàng hóa ghi trên
> hóa đơn không đúng quy cách, chất lượng; số tiền ghi trên hóa đơn; thuế suất; tiền thuế hoặc các nội
> dung bắt buộc khác (trừ trường hợp quy định tại điểm a khoản 1 Điều 10…) thì người bán có thể lựa chọn
> điều chỉnh hoặc thay thế hóa đơn điện tử như sau:*
> *- Người bán lập hóa đơn điện tử điều chỉnh hóa đơn đã lập sai: Hóa đơn điện tử điều chỉnh hóa đơn
> điện tử đã lập sai phải có dòng chữ **"Điều chỉnh cho hóa đơn Mẫu số... ký hiệu... số... ngày... tháng... năm"**;*
> *- Người bán lập hóa đơn điện tử mới thay thế cho hóa đơn điện tử lập sai: Hóa đơn điện tử mới thay thế
> hóa đơn điện tử đã lập sai phải có dòng chữ **"Thay thế cho hóa đơn Mẫu số... ký hiệu... số... ngày... tháng... năm"**."*

**Miễn văn bản thỏa thuận — đoạn quan trọng nhất với VComm:**

> *"Người bán **không bắt buộc phải lập văn bản thỏa thuận** trong các trường hợp sau: chuyển dữ liệu
> hóa đơn điện tử theo Bảng tổng hợp dữ liệu hóa đơn điện tử theo quy định điểm a.1 khoản 3 Điều 16
> Nghị định 254/2026/NĐ-CP; chuyển cơ sở dữ liệu thông tin chi tiết giao dịch phát sinh theo Bảng thông
> tin chi tiết giao dịch theo quy định tại điểm a.2 khoản 3 Điều 16 Nghị định 254/2026/NĐ-CP;
> **hoạt động mua bán hàng hóa trên nền tảng thương mại điện tử, nền tảng số khác;**"*

🟢 **VComm được MIỄN văn bản thỏa thuận** khi điều chỉnh/thay thế HĐ cho giao dịch trên sàn.
Với người mua là cá nhân thì chỉ cần thông báo hoặc thông báo trên website.

**(3) Điều chỉnh/thay thế TỔNG HỢP kèm bảng kê** *(Mẫu 01/BK-ĐCTT, Phụ lục III)*

> *"Trường hợp trong tháng người bán đã lập sai cùng thông tin về người mua, tên hàng, đơn giá, số lượng,
> thuế suất trên nhiều hóa đơn của cùng một người mua trong cùng tháng, thì người bán được lập một hóa
> đơn điều chỉnh hoặc thay thế cho nhiều hóa đơn điện tử đã lập sai trong cùng tháng và đính kèm bảng kê
> các hóa đơn điện tử đã lập sai theo Mẫu số 01/BK-ĐCTT Phụ lục III…"*

**(4) điểm c — HĐ từ máy tính tiền / HĐ bán tài sản phải ĐK quyền sở hữu**

> *"…thì người bán lập hóa đơn **thay thế** cho hóa đơn đã lập sai, trừ trường hợp quy định tại điểm c.2
> khoản 5 Điều này;"*

**(5) Lưu ý áp dụng (nguyên văn)**

> *"- Trường hợp hóa đơn điện tử đã lập sai và người bán đã xử lý theo hình thức điều chỉnh hoặc thay thế…
> sau đó lại phát hiện hóa đơn sai thì các lần xử lý tiếp theo người bán sẽ **thực hiện theo hình thức đã
> áp dụng khi xử lý lần đầu**;*
> *- Trường hợp theo quy định hóa đơn điện tử được lập không có ký hiệu mẫu số hóa đơn, ký hiệu hóa đơn,
> số hóa đơn đã lập sai thì người bán **chỉ thực hiện lập hóa đơn điều chỉnh**;*
> *- Đối với nội dung về giá trị trên hóa đơn điều chỉnh thì bắt buộc **điều chỉnh tăng (ghi số dương)**,
> **điều chỉnh giảm (ghi số âm)** đúng với thực tế điều chỉnh."*

**🔴 KHÔNG CÓ "HỦY HÓA ĐƠN".** Khẳng định tuần trước (dựa trên NĐ 70/2025) nay được xác nhận lại
bằng nguyên văn TT 91 Điều 10: **"hủy" không tồn tại như một phương án xử lý.**
`cancelEInvoice()` trong `einvoiceService.ts:133` đang hiện thực một luồng **không có trong pháp luật**.

---

## 4. TT 89/2026/TT-BTC — đọc (quản lý thuế)

**Ban hành 30/6/2026 · Hiệu lực 01/7/2026 · Thay thế TT 80/2021/TT-BTC.**

Nguồn: `luatvietnam.vn` (Chương I–III, Điều 1–18 nguyên văn) + `einvoice.vn` (tổng hợp theo Điều).

### 4.1 Điều 99 — bãi bỏ & thay thế (mấu chốt)

**Bãi bỏ từ 01/7/2026:**
- TT 80/2021/TT-BTC (+ TT 94/2025, TT 21/2026 sửa đổi)
- TT 19/2021/TT-BTC về giao dịch điện tử trong lĩnh vực thuế (+ TT 46/2024)
- **TT 103/2014/TT-BTC về thuế nhà thầu nước ngoài** ← liên quan phần không cư trú
- TT 92/2015/TT-BTC (GTGT & TNCN đối với cá nhân kinh doanh)
- TT 84/2016/TT-BTC (thu, nộp NSNN)
- TT 96/2016, TT 97/2016 (miễn thuế TNCN đối tượng đặc thù)
- TT 179/2013/TT-BTC (xóa nợ tiền thuế trước 1/7/2007)

**Thay thế mẫu biểu (Điều 99.5):**
- Mẫu 01/TKN-CNKD (TT 50/2026) → Phụ lục I TT 89/2026
- Mẫu 02/CNKD-TNCN-QTT, 01/XSBHĐC, 01/BK-XSBHĐC, 01/TCKT, 01/BK-KTHTKD (TT 18/2026) → Phụ lục I TT 89/2026

### 4.2 Điều 22 — BỎ KHAI THUẾ TNCN THEO THÁNG (ảnh hưởng module lương)

> Từ 01/7/2026, tổ chức/cá nhân trả thu nhập đối với thu nhập từ **tiền lương, tiền công** chỉ thực hiện:
> - **Khai thuế theo QUÝ** đối với số thuế TNCN đã khấu trừ của người lao động;
> - **Quyết toán thuế theo năm**, đồng thời quyết toán thay cho cá nhân có ủy quyền.

🔴 **Điều này bãi bỏ khai TNCN theo tháng.** Module HRM/payroll của VComm nếu đang sinh tờ khai
TNCN tháng thì **sai chu kỳ**. Cần kiểm tra `payrollService` / `tt99Service`.

### 4.3 Điều 10.2 — chữ ký điện tử khi khai thay (nguyên văn điểm c)

> *"c) Người nộp thuế là tổ chức, cá nhân khai thuế thay, nộp thuế thay cho tổ chức, cá nhân khác thì
> tổ chức, cá nhân khai thuế thay, nộp thuế thay **sử dụng chữ ký điện tử của tổ chức, cá nhân khai thuế
> thay, nộp thuế thay** để ký trên các hồ sơ, chứng từ điện tử."*

→ VComm khai thay cho Seller thì **dùng chứng thư số của VComm**, không dùng của Seller.
Điều này quyết định thiết kế HSM/Auth: **một chứng thư số tổ chức, dùng cho toàn bộ tập tờ khai thay.**

### 4.4 Điều 11 & 12 — thời gian nộp & xử lý sự cố (đáng giá vận hành)

- **Điều 11.1.a:** nộp HĐT 24/7, kể cả ngày nghỉ/lễ/Tết. Ngày nộp = ngày ký gửi thành công
  trong khoảng 00:00:00–23:59:59.
- **Điều 11.1.b:** ngày nộp được xác định là ngày **Hệ thống thông tin quản lý thuế tiếp nhận đầy đủ hồ
  sơ hợp lệ**, ghi trên Thông báo tiếp nhận. CQT căn cứ vào đó để tính chậm nộp.
- **Điều 12.3.b:** nếu Hệ thống thông tin quản lý thuế **gặp sự cố trong ngày cuối cùng của thời hạn**,
  nộp trong ngày làm việc tiếp theo liền kề ngày hệ thống hoạt động lại → **vẫn được tính là đúng hạn**.

🟢 **Điều 12.3 là "phao cứu sinh" cho job kê khai tự động**: khi CQT sập đúng ngày 20, job được
phép nộp ngày hôm sau mà không bị phạt. Job kê khai tháng **phải hiện thực quy tắc này**
(ghi nhận timestamp sự cố + retry vào ngày làm việc kế tiếp).

### 4.5 Điều 4 — phân loại người nộp thuế theo rủi ro

Điều 4.3.b đưa **"mức độ rủi ro về thuế trong sử dụng hóa đơn điện tử"** thành tiêu chí phân loại.
Điều 4.2.d phân loại theo ngành nghề, bao gồm *"thương mại điện tử, kinh doanh trên nền tảng thương mại
điện tử, nền tảng số khác; giao dịch xuyên biên giới"*. Điều 3.3.c xác nhận có **Chi cục Thuế thương mại
điện tử** thuộc Cục Thuế — tức là **VComm có cơ quan thuế quản lý chuyên trách riêng**, không phải chi
cục địa phương thông thường. Điều này ảnh hưởng nơi nộp hồ sơ & nơi giải quyết khiếu nại.

### 4.6 Điều 66 — miễn hồ sơ đề nghị miễn/giảm thuế

Đáng chú ý: **miễn thuế TNCN đối với cá nhân có số thuế phải nộp sau quyết toán ≤ 50.000 ₫**;
và **miễn thuế + một số khoản phí đối với hộ/cá nhân KD có tổng số thuế phải nộp trong năm ≤ 50.000 ₫**.
→ Module thuế có thể tận dụng làm ngưỡng tự động bỏ qua (tiết kiệm thao tác).

---

## 5. TT 50/2026/TT-BTC — đọc (sửa đổi TT 18/2026 về hộ KD)

**Ban hành 13/5/2026 · KT Bộ trưởng Cao Anh Tuấn ký.** Điều 1 & Điều 2 (danh sách điều bị sửa) và
Điều 4 (hiệu lực) **không hiển thị** trên nguồn miễn phí — chỉ lấy được **Điều 3 "Thay thế mẫu biểu"**
và nội dung các mẫu mới.

**Điều này có nghĩa:** TT 50/2026 chủ yếu **thay đổi hệ thống mẫu biểu** của TT 18/2026, và các mẫu
này **lại tiếp tục bị TT 89/2026 Điều 99.5 thay thế** (01/7/2026). Vòng đời của TT 50/2026 vì thế
**chỉ kéo dài chưa tới 2 tháng về mặt mẫu biểu**.

### 5.1 Các điểm lấy được từ mẫu biểu (có giá trị tham chiếu)

| Mẫu | Ý nghĩa |
|---|---|
| **01/TKN-CNKD** | Hộ/cá nhân KD **doanh thu năm ≤ 1 tỷ ₫** → *"chỉ thực hiện thông báo doanh thu; không thực hiện khai số thuế GTGT, thuế TNCN phải nộp."* |
| **01/CNKD** | Doanh thu **> 1 tỷ ₫**. Chỉ tiêu [01a] >50 tỷ · [01b] >1 tỷ đến 50 tỷ · [01c] khai trước khi được cấp HĐ có mã theo lần phát sinh |
| **01/BĐS** | Cho thuê BĐS: GTGT = [10] × 5% · TNCN = ([10]-[11]) × 5% · TNCN từ tiền phạt/bồi thường = [14] × 5% |

**Quy tắc trừ 1 tỷ (chỉ tiêu [14], Mẫu 01/CNKD) — nguyên văn:**

> *"…có nhiều ngành, nghề kinh doanh áp dụng thuế suất thuế thu nhập cá nhân khác nhau, có nhiều địa
> điểm kinh doanh thì được **lựa chọn một (01) ngành, nghề hoặc một (01) địa điểm kinh doanh** để áp dụng
> mức trừ 01 tỷ đồng trước khi tính thuế thu nhập cá nhân **theo phương án có lợi nhất**. Trường hợp
> ngành, nghề, địa điểm kinh doanh được lựa chọn chưa trừ đủ 01 tỷ đồng, cá nhân được tiếp tục lựa chọn
> thêm ngành, nghề, địa điểm kinh doanh khác để tiếp tục được trừ cho đến khi đủ 01 tỷ đồng."*

⚠️ Nguyên tắc *"phương án có lợi nhất"* này **chỉ đúng cho quyết toán năm**, không phải cho
từng tháng. Nếu VComm khấu trừ/gợi ý thuế cho Seller hàng tháng mà áp dụng trừ 1 tỷ tháng → **sai**.

### 5.2 Điểm liên quan trực tiếp sàn TMĐT

Mẫu 01/CNKD có checkbox và Section II riêng:

> *"Hộ kinh doanh, cá nhân kinh doanh **chỉ** có hoạt động kinh doanh trên nền tảng thương mại điện tử,
> nền tảng số khác **không có chức năng đặt hàng trực tuyến và chức năng thanh toán**"*

→ Đây là kênh **tự khai** của hộ KD hoạt động trên nền tảng **KHÔNG có** chức năng đặt hàng/thanhtoán.
**VComm có cả hai chức năng này → không rơi vào ô này**; VComm thuộc diện **sàn khấu trừ & kê khai
thay** theo NĐ 252/2026 Điều 43–44. Xác nhận lại quyết định #15 (WITHHOLD_ALWAYS).

Mẫu 01/TKN-CNKD cũng cho phép điều chỉnh các tờ khai cũ đã kê theo TT 40/2021, TT 18/2026 và
**tờ khai Mẫu 02/TMĐT đã kê theo NĐ 117/2025** → xác nhận Mẫu 02/TMĐT (NĐ 117/2025) đã là quá khứ.

---

## 6. Chốt dứt điểm "ví điện tử" — NĐ 52/2024 + TT 40/2024 đọc nguyên văn

*(Phần này nâng kết luận tuần trước từ "lập luận tương tự" lên "kiểm tra 3 tiêu chí theo luật viện dẫn".)*

### 6.1 NĐ 52/2024/NĐ-CP Điều 3.16 — định nghĩa dịch vụ ví điện tử (nguyên văn)

> *"Dịch vụ ví điện tử là dịch vụ do **ngân hàng, chi nhánh ngân hàng nước ngoài, tổ chức cung ứng dịch
> vụ trung gian thanh toán** cung ứng cho khách hàng để **nạp tiền vào ví điện tử, rút tiền ra khỏi ví
> điện tử và thực hiện giao dịch thanh toán**."*

### 6.2 NĐ 52/2024 Điều 6 — ai được phát hành ví (nguyên văn)

> *"Ví điện tử, thẻ trả trước là **phương tiện lưu trữ tiền điện tử**. Ngân hàng, chi nhánh ngân hàng
> nước ngoài được phát hành, cung ứng ví điện tử, thẻ trả trước."*

### 6.3 NĐ 52/2024 Điều 3.2 — "thu hộ, chi hộ" (nguyên văn)

> *"Dịch vụ thanh toán qua tài khoản thanh toán của khách hàng là việc cung ứng phương tiện thanh toán;
> thực hiện dịch vụ thanh toán séc, lệnh chi, ủy nhiệm chi, nhờ thu, ủy nhiệm thu, thẻ ngân hàng,
> chuyển tiền, **thu hộ, chi hộ** … thông qua **tài khoản thanh toán của khách hàng**."*

### 6.4 Bảng kiểm 3 tiêu chí — VComm có phải ví điện tử không?

| Tiêu chí (Điều 3.16 + Điều 6) | Thiết kế #14 của VComm | Kết luận |
|---|---|---|
| (i) Là **phương tiện lưu trữ tiền điện tử**? | Số dư V-Xu / ví Seller là **khoản phải trả nội bộ**, không phải tiền điện tử được lưu trữ | ❌ Không |
| (ii) Do **ngân hàng / chi nhánh NHNNg / tổ chức TGTT** phát hành? | VComm không phải tổ chức nào trong 3 loại | ❌ Không |
| (iii) Hỗ trợ **nạp tiền vào / rút tiền ra / thanh toán** từ ví? | Không nạp tiền mặt, không rút ra ngoài hệ thống; chỉ bù trừ công nợ nội bộ | ❌ Không |

**Điều 3.2 độc lập xác nhận thêm:** "thu hộ, chi hộ" phải thông qua **tài khoản thanh toán của khách
hàng** — VComm không mở tài khoản thanh toán cho ai.

✅ **KẾT LUẬN: 3/3 tiêu chí không thỏa → thiết kế hiện tại không phải ví điện tử.**
Đây không còn là đánh giá rủi ro chủ quan, mà là kiểm tra định nghĩa theo luật.

### 6.5 TT 40/2024/TT-NHNN — điều quan trọng là **những gì KHÔNG có ở đó**

- Điều 3 TT 40/2024 có **13 khoản** nhưng **KHÔNG định nghĩa** "ví điện tử" và **KHÔNG định nghĩa**
  "hỗ trợ thu hộ, chi hộ" — hai định nghĩa này nằm ở **văn bản mẹ là NĐ 52/2024**.
  → Mọi lập luận kiểu "TT 40/2024 gọi X là ví điện tử" sẽ **không tìm thấy căn cứ**; đúng ra phải
  dẫn NĐ 52/2024.
- Điều 3.1 định nghĩa "**tài khoản đảm bảo thanh toán**": tài khoản thanh toán bằng VNĐ của tổ chức
  cung ứng dịch vụ ví điện tử / tổ chức cung ứng dịch vụ hỗ trợ thu hộ, chi hộ **mở tại ngân hàng hợp tác**.
- Điều 27.1: tổng số dư trên các tài khoản đảm bảo thanh toán phải **≥ tổng số dư của tất cả các ví
  điện tử đã phát hành**.

→ Vì VComm không phát hành ví, **không phát sinh nghĩa vụ tài khoản đảm bảo thanh toán**.

---

## 7. NĐ 252/2026 — Điều 10 (thời hạn) & Điều 43 (khấu trừ) đọc nguyên văn

### 7.1 Điều 10 — thời hạn nộp hồ sơ khai thuế

| Loại kỳ | Thời hạn |
|---|---|
| **Lần phát sinh** | **Ngày thứ 10** kể từ ngày phát sinh nghĩa vụ |
| **Tháng** | **Ngày thứ 20 của tháng tiếp theo** tháng phát sinh nghĩa vụ |
| **Quý** | Ngày cuối cùng của tháng đầu của quý tiếp theo |
| **Năm** | Ngày cuối cùng của tháng đầu tiên của năm tiếp theo |
| **Quyết toán** | Ngày cuối cùng của **tháng thứ 3** kể từ ngày kết thúc năm dương lịch / năm tài chính |

⚠️ **Lưu ý phương pháp:** bảng "tổng hợp" trên `thuvienphapluat` từng đặt thời hạn **quý** vào ô
**tháng** (ghi *"ngày cuối cùng tháng đầu của quý tiếp theo"* cho kỳ tháng). Kiểm chứng chéo với
`luatvietnam.vn` và `smartacc.vn` → cả hai đều cho **"ngày thứ 20 của tháng tiếp theo"** cho kỳ tháng.
**Chấp nhận ngày 20.** Ghi nhận đây là lần thứ 2 trong dự án một nguồn phụ bị sai nhãn cột.

### 7.2 Điều 43 — khấu trừ của tổ chức quản lý nền tảng (đã đọc nguyên văn)

Bao gồm cơ chế **Điều 43.4 chống khấu trừ trùng** (điểm mới so với NĐ 117/2025):

> Tổ chức tại Việt Nam đã khấu trừ phải **thông báo điện tử cho nền tảng** để nền tảng **không khấu trừ
> lại** cùng một giao dịch. Thông báo phải có: **MST**, **mã giao dịch/đơn hàng**, **giá trị giao dịch**,
> **số thuế đã khấu trừ**, **thông tin người bán**.

🟢 **Tác động thiết kế:** cần một bảng `withholding_exemptions` (hoặc cờ trên order) nhận thông báo
này, và job kê khai tháng phải **loại trừ** các giao dịch đã được bên thứ ba khấu trừ.
Nếu không có, VComm sẽ **khấu trừ hai lần** — rủi ro bị Seller khiếu nại và bị CQT truy thu phần
khấu trừ sai.

---

## 8. ND 253/2026 Điều 63 + Luật 109/2025 Điều 20.3 — thuế không cư trú

*(Đã đọc ở phiên trước; ghi lại để spec này tự đứng được.)*

- **NĐ 253/2026 Điều 63** — thu nhập từ kinh doanh của **người không cư trú** = doanh thu × tỷ lệ.
  Nếu không tách được các ngành nghề → áp **tỷ lệ cao nhất**. Thời điểm xác định = thời điểm
  **nhận thu nhập hoặc xuất hóa đơn**.
- **Luật 109/2025/QH15 Điều 20.3** — biểu tỷ lệ:

| Loại thu nhập | Tỷ lệ |
|---|---|
| Phân phối hàng hóa | **1%** |
| Dịch vụ / xây dựng **không** bao thầu NVL | **5%** |
| Sản xuất–vận tải / xây dựng **có** bao thầu NVL | **2%** |
| Nội dung số giải trí | **5%** |
| Khác | **2%** |

⚠️ **TT 103/2014/TT-BTC (thuế nhà thầu nước ngoài) đã bị TT 89/2026 Điều 99 bãi bỏ từ 01/7/2026.**
Nếu VComm có Seller/đối tác không cư trú thì phần hướng dẫn cũ không còn dùng được — cần tìm văn bản
thay thế (TT 89/2026 hoặc thông tư chuyên đề).

---

## 9. SỬA LẠI 4 chỗ tôi GÁN SAI trong các phiên trước

Trung thực ghi nhận — đây là lỗi của tôi, không phải của luật.

| # | Tôi từng viết | Sự thật | Nguồn sửa |
|---|---|---|---|
| 1 | "Điều **64** NĐ 253/2026 = thu nhập kinh doanh không cư trú" | **Điều 63** mới đúng. **Điều 64 = tiền lương, tiền công** | Mục lục file .docx NĐ 253/2026 |
| 2 | "TT 32/2025 **Điều 6** quy định danh sách đối tượng HĐ máy tính tiền" | Danh sách nằm ở **TT 32 Điều 12.4–5**, viện dẫn **NĐ 70/2025 khoản 8 Điều 1** | Toàn văn TT 32 .doc (36.029 ký tự) |
| 3 | "Sửa 21 chỗ TT 78/2021 → TT 32/2025" | (a) Số lượng thật là **10 chỗ trong 9 file**, không phải 21. (b) Đích đúng bây giờ là **TT 91/2026**, vì **TT 32/2025 đã hết hiệu lực 01/7/2026** | Grep lại + TT 91 Điều hiệu lực |
| 4 | "8% theo **NĐ 72/2025** đến 31/12/2026" | **NĐ 72/2025/NĐ-CP (28/3/2025) là nghị định về cơ chế, thời gian điều chỉnh GIÁ BÁN LẺ ĐIỆN BÌNH QUÂN.** Giảm 2% GTGT phải dẫn **NĐ 174/2025/NĐ-CP** (hiệu lực 1/7/2025 – 31/12/2026, theo NQ 204/2025/QH15) | vanban.chinhphu.vn docid 213249 · thuvienphapluat 206993 |

🟡 **Hệ quả của #4:** 8 chỗ viện dẫn sai văn bản, nằm ở `taxService.ts`, `QuickPrintModal.tsx`,
`VCommSupermarket.tsx`, `__tests__/tax_engine.test.ts`, `__tests__/workflow_integration.test.ts`.
Thuế suất 8% **vẫn đúng** (NĐ 174/2025 cũng cho 8% đến 31/12/2026) — **sai là phần trích dẫn**.
Nhưng nếu có ai đó kiểm tra chéo sẽ thấy VComm viện dẫn nghị định về giá điện làm căn cứ thuế.

---

## 10. Rà soát TOÀN BỘ căn cứ pháp lý trong code

Quét `src/` + `server.ts`. Cột "Số chỗ" đếm cả dạng `NN/YYYY` và `NN/YYYY/XX-XX`.

| Văn bản | Số chỗ | Tình trạng | Hành động |
|---|---|---|---|
| **99/2025/TT-BTC** | 21 | ✅ Hiệu lực 01/01/2026 | Giữ nguyên |
| **52/2013/NĐ-CP** (+85/2021) | 14 | ⚠️ Còn hiệu lực (được 85/2021 sửa đổi) — **chưa xác minh lần cuối** | Đối chiếu Điều 21 & Điều 8/85 |
| **78/2021/TT-BTC** | **10** / 9 file | 🔴 **Hết hiệu lực 01/6/2025** | → **TT 91/2026** |
| **72/2025** | **8** | 🔴 **SAI VĂN BẢN** (là NĐ về giá điện) | → **NĐ 174/2025/NĐ-CP** |
| **200/2014/TT-BTC** | 8 | 7/8 là câu kiểu *"thay thế TT200/2014"* → **đúng**; **1 chỗ sai**: `seller_finance.test.ts:144` *"compliant with Circular 200/2014"* | Sửa 1 dòng |
| **13/2023/TT-BCT** | 7 | ⚠️ **TT 31/2026/TT-BCT (11/6/2026, HL 01/7/2026)** quy định mới về truy xuất nguồn gốc; Điều 19 **không** ghi thay thế 13/2023 → cần đối chiếu tay | Xem #23 |
| **117/2025/NĐ-CP** | 6 | 🔴 **Hết hiệu lực 01/7/2026** | → **NĐ 252/2026** |
| **36/2024/QH15** (BVQLNTD) | 5 | ✅ Hiệu lực 01/7/2024 | Giữ nguyên |
| **86/2025/QH15** (BVDLCN) | 4 | ✅ Hiệu lực 01/01/2026 | Giữ nguyên |
| **85/2021/NĐ-CP** | 4 | ✅ | Giữ nguyên |
| **88/2021/TT-BTC** | 1 | ⚠️ Chỉ xuất hiện trong câu *"không còn chế độ kế toán riêng theo TT88/2021"* → **đúng về mặt nội dung** | Có thể giữ, nên đổi sang câu chủ động |
| **40/2021/TT-BTC** | 1 | ⚠️ Hết hiệu lực → TT 18/2026 → (TT 50/2026 sửa) → **mẫu TT 89/2026 Phụ lục I** | Sửa trong `TT99Accounting.tsx:381` |
| **219/2013/TT-BTC** | 1 | 🔴 **Hết hiệu lực 01/7/2025** → **TT 69/2025/TT-BTC** (Luật thuế GTGT 48/2024/QH15) | Sửa `taxService.ts:14` (0% xuất khẩu) |
| **145/2020/NĐ-CP** | 1 | ✅ | Giữ nguyên |
| **52/2024/NĐ-CP** | 1 | ✅ | Giữ nguyên |

**Tổng: 26 chỗ cần sửa** (10 TT78 + 8 NĐ72 + 6 NĐ117 + 1 TT219 + 1 TT40) **+ 8 chỗ cần xác minh**
(7× TT 13/2023 + 1× TT 200/2014).

### 10.1 Danh sách 10 chỗ TT 78/2021 (chính xác)

| File | Dòng |
|---|---|
| `src/components/PublicLegalInfo.tsx` | 140 *(trang công khai — rủi cao nhất)* |
| `src/components/IntegrationsSettings.tsx` | 362 |
| `src/components/Orders.tsx` | ? |
| `src/services/integrationConfigService.ts` | 2 chỗ (56/57 legalBasis, và field einvoice) |
| `src/services/taxService.ts` | 1 |
| `src/services/legalEntityService.ts` | 1 |
| `src/services/einvoiceService.ts` | 1 (comment Điều 19 TT 78) |
| `src/__tests__/tax_engine.test.ts` | 1 |
| `server.ts` | 1 |

---

## 11. Kế hoạch sửa — S0 / S1' / S2'

### S0 (MỚI, ~0.5 ngày) — Cơ chế chống tái diễn

Không sửa từng văn bản nữa. Tạo **`src/config/legalBasis.ts`**:

```ts
/**
 * Mọi căn cứ pháp lý trong hệ thống PHẢI tham chiếu hằng số trong file này.
 * Không viện dẫn số hiệu văn bản trực tiếp trong component/service.
 */
export const LEGAL_BASIS = {
  einvoice: {
    code: 'TT 91/2026/TT-BTC',
    decree: 'NĐ 254/2026/NĐ-CP',
    effectiveFrom: '2026-07-01',
    replaced: ['TT 32/2025/TT-BTC', 'TT 78/2021/TT-BTC', 'NĐ 123/2020/NĐ-CP'],
    url: '...',
  },
  vatReduction: { code: 'NĐ 174/2025/NĐ-CP', effectiveFrom: '2025-07-01', effectiveTo: '2026-12-31', rate: 0.08 },
  platformTax:  { code: 'NĐ 252/2026/NĐ-CP', circular: 'TT 89/2026/TT-BTC', effectiveFrom: '2026-07-01' },
  accounting:   { code: 'TT 99/2025/TT-BTC', effectiveFrom: '2026-01-01', replaced: ['TT 200/2014/TT-BTC'] },
  // ...
} as const;

/** Guard: ném lỗi nếu văn bản đã hết hiệu lực tại ngày chạy */
export function assertBasisValid(key: keyof typeof LEGAL_BASIS, at: Date = new Date()): void
```

Kèm **1 test** (`legal_basis.test.ts`) duyệt toàn bộ `LEGAL_BASIS`, đọc `effectiveTo`,
và fail nếu `effectiveTo < today`. → Lần sau văn bản hết hiệu lực, **CI sẽ đỏ**, không ai cần nhớ.

### S1' (~0.5 ngày) — Sửa 26 chỗ căn cứ sai/hết hiệu lực

- 10 chỗ `TT 78/2021` → `TT 91/2026` + `NĐ 254/2026`
- 8 chỗ `NĐ 72/2025` → `NĐ 174/2025`
- 6 chỗ `NĐ 117/2025` → `NĐ 252/2026`
- 1 chỗ `TT 219/2013` → `TT 69/2025`
- 1 chỗ `TT 40/2021` → `TT 89/2026` Phụ lục I
- 1 chỗ `TT 200/2014` trong `seller_finance.test.ts:144` → `TT 99/2025`
- **`invoiceTemplate: '1/2024/TT78-MST'`** (`einvoiceService.ts:50`) → **`7K26XYY`** (không có mã)
  hoặc **`7C26XYY`** (có mã), sinh động theo năm và theo cấu hình `hasTaxCode`.
- Sửa regex validate ký hiệu: tập ký tự thứ 4 = **`[TDLMNBGHXF]`** (10 chữ, đã thêm `F`).

### S2' (~1.5 ngày, tăng từ 1 ngày) — Tách 4 luồng xử lý hóa đơn

`cancelEInvoice()` hiện tại là luồng **không tồn tại trong pháp luật**. Thay bằng:

| Hàm | Căn cứ | Mẫu |
|---|---|---|
| `notifyInvoiceError()` | TT 91 Điều 10.1.a | **04/SS-HĐĐT** |
| `issueAdjustmentInvoice()` | TT 91 Điều 10.1.b | dòng *"Điều chỉnh cho hóa đơn Mẫu số… ký hiệu… số… ngày…"* |
| `issueReplacementInvoice()` | TT 91 Điều 10.1.b | dòng *"Thay thế cho hóa đơn Mẫu số… ký hiệu… số… ngày…"* |
| `bulkAdjustWithList()` | TT 91 Điều 10.1.b | **01/BK-ĐCTT** (nhiều HĐ cùng người mua, cùng tháng) |

Quy tắc bắt buộc kèm theo:
- Giá trị điều chỉnh **tăng ghi dương, giảm ghi âm**.
- Đã chọn điều chỉnh/thay thế lần đầu → **các lần sau phải dùng đúng hình thức đó**.
- Không có ký hiệu mẫu số/ký hiệu/số HĐ sai → **chỉ được điều chỉnh**, không được thay thế.
- **VComm được miễn văn bản thỏa thuận** (giao dịch trên nền tảng TMĐT).

### S3 (MỚI, ~1 ngày) — Nghĩa vụ ủy nhiệm HĐĐT (nếu #20 = có)

- Hiển thị **badge niêm yết ủy nhiệm** trên gian hàng + trên hóa đơn (TT 91 Điều 9.1.đ)
- Sinh & xuất **Mẫu 01/ĐKTĐ-HĐĐT** kèm **danh sách hộ/cá nhân KD ủy nhiệm** (TT 91 Điều 9.3.c)
- Lưu `tax_method` của Seller (TT 91 Điều 9.1.h) → **trả lời #21: bắt buộc**

### S4 (MỚI, ~0.5 ngày) — Đổi chu kỳ khai TNCN

Module lương: **tháng → quý** + quyết toán năm (TT 89 Điều 22).
Dùng **chứng thư số của VComm** cho tờ khai thay (TT 89 Điều 10.2.c).

### S5 (MỚI, ~0.5 ngày) — Job kê khai tháng theo Điều 10 + 12

- Hạn **ngày 20** tháng sau (NĐ 252 Điều 10)
- Retry hợp lệ nếu hệ thống CQT sự cố trong ngày cuối (TT 89 Điều 12.3.b)
- **Loại trừ giao dịch đã bị bên thứ ba khấu trừ** (NĐ 252 Điều 43.4)

### Thứ tự đề xuất

```
GĐ1 (CI/CD, health, logging)
  → S0  (0.5d)  ← TẤT CẢ các S khác phụ thuộc S0
  → S1' (0.5d)
  → S2' (1.5d)
  → [trả lời #20] → S3 (1d, chỉ nếu chọn "có")
  → S4  (0.5d)
  → S5  (0.5d)
  → GĐ2 như kế hoạch cũ
```

---

## 12. Câu hỏi mới cần quyết định

| # | Câu hỏi | Vì sao cần | Khuyến nghị |
|---|---|---|---|
| **#22** | VComm có thuộc diện "dịch vụ nền tảng số cần đối soát sau 7 ngày" (NĐ 254 Điều 9.4) không? | Quyết định **thời điểm lập hóa đơn**: lúc chốt đơn hay sau đối soát | Kiểm tra với CQT; tạm thời giữ chốt đơn + ghi chú |
| **#23** | TT 13/2023/TT-BCT còn hiệu lực sau TT 31/2026/TT-BCT (01/7/2026) không? | Module Databank (7 chỗ viện dẫn) | Đọc Điều 17–19 TT 31/2026; giai đoạn 2 từ **01/01/2027** |
| **#24** | VComm có Seller/đối tác **không cư trú** không? | TT 103/2014 đã bị bãi bỏ; cần hướng dẫn mới cho tỷ lệ 1/5/2/5/2% | Nếu không có → đánh dấu N/A, không làm |
| **#25** | Khoản VComm **thu hộ** có rơi vào diện miễn lập HĐ (NĐ 254 Điều 7.8) không? | Ảnh hưởng trực tiếp module escrow + ví | Hỏi CQT bằng văn bản — đây là chỗ mơ hồ nhất |

*(Các câu hỏi cũ chưa trả lời: #19 Hub bán hàng a/b/c · #20 ủy nhiệm HĐĐT thay Seller · #21 đã lưu `tax_method` chưa — #21 hiện đã có câu trả lời từ luật: **bắt buộc phải lưu**.)*

---

## 13. Những gì CHƯA đọc được — trung thực

| Mục | Lý do | Cách xử lý |
|---|---|---|
| **PDF chính thức ND 254/2026** (55 trang) | File scan, **0 ký tự text layer** | Dùng toàn văn web chinhphu.vn + Điều trên thuvienphapluat |
| **PDF chính thức TT 91/2026** (97 trang, 28 MB) | File scan, **0 ký tự text layer** | Đã lấy Điều 1–23 từ luatvietnam + Phụ lục I từ thuvienphapluat |
| **Điều hiệu lực TT 91/2026 nguyên văn** | Bị cắt ở Điều 23 | Bài phân tích pháp lý khẳng định: *"Kể từ ngày TT 91 có hiệu lực, TT 32/2025 hết hiệu lực"* — đủ dùng, nhưng nên đối chiếu bản công báo |
| **TT 89/2026 Điều 19–99** | Trang nguồn cắt ở Điều 18 | Các điểm quan trọng đã có qua bài tổng hợp theo Điều (22, 66, 99) |
| **TT 50/2026 Điều 1, 2, 4** | Khoá sau paywall ("Đang theo dõi") | Mẫu biểu của TT 50 đã bị TT 89 Điều 99.5 thay thế → **tác động thực tế = 0** |
| **TT 40/2024 Điều 15 (hỗ trợ thu hộ, chi hộ) & Điều 17+ (ví điện tử)** nguyên văn | Chưa tìm được bản mở | **Không còn cần thiết**: §6 đã chốt bằng định nghĩa ở văn bản mẹ NĐ 52/2024 |
| **NĐ 70/2025 khoản 8 Điều 1** (danh sách HĐ máy tính tiền) | NĐ 70/2025 đã bị ND 254 thay thế | **Đã lỗi thời** — chuyển sang đọc NĐ 254 Điều 6 |
| **NĐ 52/2013 Điều 21** đối chiếu ND 85/2021 | Chưa đối chiếu tay | Cần đọc trước khi chốt S1' cho 14 chỗ viện dẫn |
| **NĐ 254 Điều 8 (Loại hóa đơn)** nguyên văn | Chưa lấy được | Đã có gián tiếp qua TT 91 Phụ lục I (ký hiệu mẫu 1–9) |

---

## 14. Kết luận

1. **Nền pháp lý HĐĐT đã đổi hoàn toàn (01/7/2026)**: NĐ 123/2020 → **NĐ 254/2026**;
   TT 32/2025 → **TT 91/2026**. Kế hoạch S1 của tuần trước **chưa kịp làm đã lỗi thời**.
2. **Chuỗi ký hiệu hóa đơn đúng của VComm đã chắc chắn: `7K26XYY` / `7C26XYY`** — có ví dụ
   nguyên văn `"7K26XAB"` ngay trong Phụ lục I TT 91/2026.
3. **"Hủy hóa đơn" chính thức không tồn tại** — xác nhận lần 2 bằng nguyên văn TT 91 Điều 10.
4. **VComm được miễn văn bản thỏa thuận** khi điều chỉnh/thay thế HĐ trên sàn (TT 91 Điều 10.1.b).
5. **Ví điện tử: chốt 3/3 tiêu chí không thỏa** (NĐ 52/2024 Điều 3.16 + Điều 6 + Điều 3.2).
6. **Phát hiện sai văn bản nghiêm trọng**: 8 chỗ viện dẫn NĐ 72/2025 (giá điện) làm căn cứ thuế GTGT.
7. **Lần thứ 5 phát hiện văn bản hết hiệu lực** → phải làm **S0** trước mọi việc khác,
   nếu không S1' sẽ lại lỗi thời vào lần luật đổi tiếp theo.
