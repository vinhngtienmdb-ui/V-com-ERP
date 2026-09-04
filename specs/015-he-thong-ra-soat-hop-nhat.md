# Kế hoạch rà soát toàn hệ thống VComm ERP
### Giữ nguyên tính năng · Hợp nhất trùng lặp · Đảm bảo workflow theo Đề án hợp nhất

**Ngày lập:** 2026-09-01
**Căn cứ:** Đề án "Chiến lược và vận hành toàn diện — Xây dựng và phát triển nền tảng TMĐT VComm" (TP.HCM, 07/2026)
**Phạm vi:** Toàn bộ `V-com-ERP/src` — 45 route, 80 component, 19 service
**Tài liệu liên quan:** `specs/014-ui-redesign-plan.md` (thiết kế lại giao diện)

---

## 1. Tóm tắt điều hành

Rà soát sơ bộ đã phát hiện **ba loại vấn đề khác nhau**, cần ba cách xử lý khác nhau:

| Loại | Phát hiện | Mức độ |
|---|---|---|
| **Trùng lặp** | 5 hệ thống "công việc / phê duyệt" song song; `/tasks` và `/workspace` hiện **cùng 4 chức năng** (Kanban, Việc của tôi, Giao việc, Báo cáo) | Cao |
| **Khoảng trống** | Trụ cột 3 (Mua chung) và Trụ cột 4 (F2B2B) — **không có một dòng code nào**, dù Đề án xếp cả hai vào Giai đoạn 1 | **Nghiêm trọng** |
| **Rác** | 10 component chết (1.163 dòng), route `/bi` và `/analytics` trỏ cùng một component | Trung bình |

**Kết luận then chốt:** Hệ thống hiện tại được xây theo hướng "tích lũy module", chưa được rà soát theo bản đồ nghiệp vụ của Đề án. Việc hợp nhất vì thế **không thể làm theo cảm tính** — phải có kiểm kê đầy đủ trước, vì đang có những tính năng tồn tại ở nhiều nơi với mức độ hoàn thiện khác nhau. Xóa nhầm một trong hai bản sẽ mất tính năng.

**Nguyên tắc xuyên suốt: Đóng băng → Kiểm kê → Đối chiếu → Hợp nhất → Bổ sung.**
Không được xóa bất cứ thứ gì trước khi Giai đoạn 2 hoàn tất.

---

## 2. Hiện trạng hệ thống (số liệu đo được)

| Chỉ số | Giá trị |
|---|---|
| Route | 45 (43 component được route, 2 route public) |
| Component `.tsx` | 80 |
| Service | 19 |
| Entity trong `types/erp.ts` | 39 |
| Tổng LOC `src/` | 78.223 |
| Component chết | 10 files / 1.163 dòng |
| Spec nghiệp vụ đã có | 13 (`specs/001`–`013`) |

**Điểm tích cực:** tầng service **được tách khá sạch** — không phát hiện hàm trùng lặp giữa 19 service. `einvoiceService` / `taxService` / `accountingService` / `misaService` có ranh giới rõ ràng. Vấn đề nằm ở **tầng giao diện và tổ chức module**, không nằm ở logic nghiệp vụ. Đây là tin tốt: hợp nhất sẽ ít rủi ro hơn nhiều so với trường hợp logic cũng bị trùng.

---

## 3. Kết quả rà soát nhanh (đã thực hiện)

### 3.1 Khoảng trống so với Đề án — 7 trụ cột

| Trụ cột | Vai trò theo Đề án | Hiện trạng code | Đánh giá |
|---|---|---|---|
| **1. Tiếp thị liên kết** (Dropship + Affiliate) | Động cơ lưu lượng, GĐ1 | Affiliate: 10 file · **Dropship: 0** | ⚠️ Thiếu Dropship |
| **2. Gian hàng Seller** | Đa dạng danh mục, GĐ1 | `Sellers`, `SellerFinance`, `SupplierPortal` | ✅ Có |
| **3. Mua chung** | Giữ chân người dùng, GĐ1 | **`group_buying`: 0 · `gom đơn`: 0** | ❌ **Thiếu hoàn toàn** |
| **4. F2B2B** (Nhà máy → Cửa hàng) | **Động cơ lợi nhuận chính** | **`F2B2B`: 0 · `gom đơn`: 0** | ❌ **Thiếu hoàn toàn** |
| **5. VComm Shop Mall** | Trục đỡ niềm tin, xuyên suốt | `Compliance` (14 file HĐĐT) nhưng chưa có luồng thẩm định 5 tiêu chí | ⚠️ Chưa đúng thiết kế |
| **6. O2O** (Mua online, nhận offline) | Tối ưu hậu cần chặng cuối | **`VCommHub`: 0** · iPOS: 9 file rải rác | ❌ Thiếu lõi |
| **7. V-Xu** | Xuyên suốt toàn hệ sinh thái | **chỉ 2 file** | ❌ Gần như trống |

**Hai trụ cột 3 và 4 = 0 dòng code.** Đây là phát hiện quan trọng nhất. Đề án xác định Trụ cột 4 là "động cơ lợi nhuận chính" (biên cao, không phải trợ giá), và Trụ cột 3 là cơ chế giữ chân người dùng — cả hai đều được xếp vào Giai đoạn 1 (tháng 1–3).

### 3.2 Khoảng trống về tuân thủ pháp lý (Phần F)

| Yêu cầu Đề án | Code | Đánh giá |
|---|---|---|
| Hóa đơn điện tử NĐ 123/2020 + TT78 | 14 file | ✅ Có nền tảng |
| Thuế hộ kinh doanh 1,5%–4,5% | 5 file | ⚠️ Một phần |
| **TT99/2025/TT-BTC — chế độ kế toán doanh nghiệp** (có hiệu lực 01/01/2026, thay thế TT200/2014) | **0** | ❌ Thiếu *(đang làm ở spec 021)* |
| **Xuất XML/Excel nộp `thuedientu.gdt.gov.vn`** | **0** | ❌ Thiếu *(đặt ở module Thuế, tách khỏi Kế toán)* |

> **Hiệu đính lần 2 (01/09/2026) — thay đổi hướng hẳn:**
>
> Bản gốc ghi "4 sổ kế toán"; hiệu đính lần 1 sửa thành 7 sổ theo TT88/2021 Điều 5(4)
> (S1-HKD doanh thu · S2-HKD vật liệu/sản phẩm/hàng hóa · S3-HKD chi phí SXKD · S4-HKD nghĩa vụ
> thuế NSNN · S5-HKD tiền lương · S6-HKD quỹ tiền mặt · S7-HKD tiền gửi ngân hàng). Đính chính
> số lượng sổ này vẫn đúng về mặt pháp lý.
>
> Tuy nhiên, chủ dự án đã quyết định **không triển khai chế độ kế toán hộ kinh doanh (TT88)**
> trong VComm ERP. Toàn bộ chủ thể — kể cả hộ kinh doanh, cá nhân kinh doanh trên sàn — sẽ áp
> dụng **chế độ kế toán doanh nghiệp theo TT99/2025/TT-BTC**. Lý do: TT99 (có hiệu lực
> 01/01/2026, thay thế TT200/2014) và TT88 điều chỉnh hai đối tượng khác nhau, **không thay thế
> nhau**; giữ cả hai sẽ tạo hai hệ thống tài khoản, hai chuẩn ghi nhận doanh thu và hai bộ BCTC
> song song. Luật Kế toán 2015 cũng không buộc hộ kinh doanh phải theo TT88 — TT88 Điều 2(2) chỉ
> *khuyến khích* hộ nộp theo phương pháp khoán.
>
> → spec 020 (TT88) đã được **lưu trữ** tại `specs/_archived/020-tt88-compliance/`.
> → Chuyển sang **spec 021 — TT99/2025/TT-BTC**.

| Sổ cái kép (`double-entry`) | 7 file | ✅ Có nền tảng, nhưng đang dùng hệ thống TK TT200 đã hết hiệu lực |
| Ký quỹ `HOLDING/RELEASED/REFUNDED` | escrow 12 file, nhưng `HOLDING` = 0 | ⚠️ Thiếu trạng thái giữ tiền |

### 3.3 Khoảng trống về kiến trúc (Phần F.4 — cần nói thẳng)

Đề án thiết kế: **Event-driven microservices**, Kubernetes, Apache Kafka, PostgreSQL 16 + PostGIS, Redis Cluster, backend Golang/Java, Flutter mobile.

Thực tế: **React 19 SPA + Express + Supabase**, chạy trên Vercel.

Kiểm tra cho thấy: `postgis` = 0, `geography` = 0, `kafka` = 0, `vector clock` = 0.

> **Khuyến nghị:** Không đuổi theo kiến trúc F.4 trong đợt này. Chi phí vượt xa lợi ích ở giai đoạn hiện tại, và hệ thống đang chạy được. Cần **ghi nhận chính thức đây là nợ kiến trúc**, đưa vào lộ trình Năm 2, và tập trung đợt này vào: (a) giữ nguyên tính năng, (b) hợp nhất trùng lặp, (c) bù các khoảng trống nghiệp vụ lõi (Trụ cột 3, 4 và tuân thủ TT88).

### 3.4 Các cụm trùng lặp — đã xác nhận bằng đối chiếu code

#### 🔴 Cụm 1 — Công việc / Phê duyệt: **5 hệ thống song song** (nghiêm trọng nhất)

| Hệ thống | Route | Thành phần |
|---|---|---|
| TasksPage | `/tasks` | 4 view: `kanban`, `my`, `delegation`, `reports` — **tự hiện thực lại** |
| Workspace | `/workspace` | 4 module: `work_project`, `work_mine`, `work_manage`, `work_report` → render `TaskKanban`, `TaskMyTasks`, `TaskDelegation`, `TaskReports` |
| RequestHub | `/requests` | + `requests/RequestDetail`, `/requests/new` → `DynamicRequestForm` |
| WorkflowHub | `/workflow` | Luồng phê duyệt riêng |
| NewRequestForm | — | **Chết** (273 dòng), bị bỏ dở |

**Bằng chứng trùng lặp trực tiếp:** `TasksPage` định nghĩa `VIEWS` gồm đúng 4 chức năng (Kanban / Việc của tôi / Giao việc / Báo cáo), trong khi `Workspace` nhúng đúng 4 component `TaskKanban` / `TaskMyTasks` / `TaskDelegation` / `TaskReports` cho đúng 4 chức năng đó. `TasksPage` **không import** các component này mà tự hiện thực lại → hai bản của cùng một tính năng, hai route khác nhau.

#### 🟠 Cụm 2 — Nhân sự: 4 route

`HR.tsx` (3.636 dòng) · `EasyHRM.tsx` (2.076) · `Performance.tsx` · `OrgStructure.tsx`
→ `/hr`, `/easyhrm`, `/performance`, `/org`

#### 🟠 Cụm 3 — Tài chính: 5 route

`Finance.tsx` (2.323) · `Settlement.tsx` · `Wallet.tsx` (1.050) · `SellerFinance.tsx` (1.496) · `Loyalty.tsx`
→ `/finance`, `/settlement`, `/wallet`, `/seller-finance`, `/loyalty`

#### 🟡 Cụm 4 — Giao tiếp / CSKH: 6 component

`InternalChat.tsx` (825) · `OmniChat.tsx` (475) · `MailClient.tsx` (1.125) · `CustomerService.tsx` (1.690) · `LiveCommerce.tsx` · `SocialCommerce.tsx`

#### 🟡 Cụm 5 — Route trùng

`/bi` và `/analytics` **cùng trỏ về `AnalyticsBI`**. Route `*`（fallback）và `/dashboard` cùng trỏ `Dashboard` — trường hợp này chủ đích, giữ nguyên.

### 3.5 Component chết — 10 file, 1.163 dòng

| File | Dòng | Ghi chú |
|---|---|---|
| `CommandPalette.tsx` | 259 | Đáng chú ý: từng được xem là điều hướng chính |
| `NewRequestForm.tsx` | 273 | Bị bỏ dở, thay bởi `DynamicRequestForm` |
| `ui/SignaturePad.tsx` | 142 | Trùng chức năng với `SignatureHub` |
| `ActivityFeed.tsx` | 141 | — |
| `ShortcutsModal.tsx` | 85 | — |
| `Breadcrumb.tsx` | 60 | — |
| `ui/PageHeader.tsx` | 59 | — |
| `ui/ExportButton.tsx` | 54 | — |
| `ui/StatCard.tsx` | 50 | — |
| `ui/QuickActionCard.tsx` | 40 | — |

⚠️ Dù "chết" theo phân tích import tĩnh, **phải kiểm tra bằng tay trước khi xóa** — có thể được gọi gián tiếp qua chuỗi ký tự hoặc chỉ dùng ở môi trường cụ thể.

### 3.6 Độ kết dính quá mức

| Domain | Số component đụng vào |
|---|---|
| Đơn hàng | **70 / 80** |
| Công việc / Phê duyệt | 32 |
| Báo cáo / BI | 21 |
| Seller / NCC | 17 |

**70/80 component đều nhắc đến "đơn hàng"** — nghĩa là không có ranh giới module rõ ràng. `Settings.tsx` một mình đụng vào **cả 10 domain**. Đây là nguyên nhân gốc khiến việc "tách module" trở nên khó, và là lý do Giai đoạn 1 của kế hoạch thiết kế lại UI (`014`) phải làm nền móng trước.

---

## 4. Năm nguyên tắc bất di bất dịch

1. **Không mất tính năng — tuyệt đối.** Chưa có Feature Registry đầy đủ thì không xóa gì. Mỗi lần xóa phải có dòng trong Registry ghi rõ lý do và nơi tính năng đó được thay thế.
2. **Hợp nhất theo bản hoàn thiện hơn, không theo bản mới hơn.** Với cặp trùng lặp, phải so sánh độ hoàn thiện thực tế (số trường, số trạng thái, test) — không mặc định giữ file mới.
3. **Đối chiếu theo Đề án, không theo ý thích.** Một tính năng chỉ được giữ nếu (a) Đề án yêu cầu, hoặc (b) có minh chứng người dùng đang dùng. Không giữ vì "lỡ làm rồi".
4. **Hợp nhất UI trước, logic sau.** Tầng service đã sạch — đừng đụng vào. Tập trung tầng module/giao diện.
5. **Mọi bước phải chạy được production.** Không nhánh dài hạn. Dùng feature flag, chuyển route từng cái.

---

## 5. Lộ trình 6 giai đoạn

### Giai đoạn 0 — Đóng băng & lưới an toàn (1 tuần)

*Chưa sửa gì. Tạo điều kiện để sửa an toàn.*

| Việc | Chi tiết |
|---|---|
| Đóng băng tính năng mới | Chỉ nhận bugfix trong 4–6 tuần tới. Tránh xung đột với hợp nhất |
| Xử lý 7 file đang dang dở | `App.tsx`, `HR.tsx`, `Settings.tsx`, `Customers.tsx`, `Settlement.tsx`, `Wallet.tsx`, `CustomerService.tsx`, `constants.ts` — commit hoặc stash ngay |
| Chụp baseline 45 route | Puppeteer (đã có trong deps) — đối chiếu trước/sau mọi giai đoạn |
| Tăng test cho module sắp hợp nhất | Ưu tiên Tasks/Workspace/Finance. Hiện có 35 file test |
| Backup DB | Snapshot Supabase + script SQL hiện tại |

**Nghiệm thu:** 45 ảnh baseline; 7 file dang dở đã xử lý; test chạy xanh; backup xác nhận khôi phục được.

---

### Giai đoạn 1 — Kiểm kê toàn bộ tính năng (2–3 tuần)

*Giai đoạn quan trọng nhất. Kết quả là Feature Registry — tài liệu bắt buộc cho mọi quyết định sau này.*

**1.1 Kiểm kê tự động**

Với mỗi route, trích xuất: danh sách tính năng (button/menu/tab), entity và trường dữ liệu, service/bảng được gọi, quyền truy cập.

**1.2 Kiểm kê thủ công (không thể tự động)**

- Phỏng vấn người dùng thực tế: tính năng nào **đang dùng hàng ngày**, tính năng nào **chưa bao giờ mở**.
- Ghi nhận tính năng "ẩn" — có trong code nhưng không hiện trên menu.

**1.3 Feature Registry — cấu trúc chuẩn**

| Cột | Ý nghĩa |
|---|---|
| `ID` | Mã định danh duy nhất |
| `Tên tính năng` | Tên nghiệp vụ |
| `Route / Vị trí` | Nơi truy cập |
| `Module` | File component |
| `Entity / Bảng` | Dữ liệu đụng tới |
| `Trụ cột Đề án` | Gắn với trụ cột nào (1–7), hay "ngoài Đề án" |
| `Mức độ dùng` | Cao / Trung bình / Thấp / Không rõ |
| **Quyết định** | **Giữ / Hợp nhất / Tách / Loại bỏ** |
| `Lý do` | Bắt buộc ghi |

**1.4 Phân loại kết quả** → bốn nhóm: **Giữ nguyên** · **Trùng lặp** · **Mồ côi** · **Nằm ngoài Đề án**

**Nghiệm thu:** Registry phủ 100% route; mỗi tính năng có quyết định + lý do; có chữ ký xác nhận của người phụ trách nghiệp vụ.

---

### Giai đoạn 2 — Đối chiếu workflow với Đề án (2 tuần)

*Biến các quy trình trong Đề án thành "hợp đồng workflow" để kiểm tra từng bước.*

**2.1 Sáu bước chu kỳ đơn F2B2B (Đề án B.4.4)**

| Bước | Yêu cầu | Hiện trạng |
|---|---|---|
| 1. Đăng ký & xác thực | Nhà máy đăng ký trên Cổng NCC, cung cấp GCN ĐKKD, công bố sản phẩm | Cần kiểm tra `SupplierPortal` |
| 2. Niêm yết & định giá | Giá sỉ **bậc thang theo mốc số lượng** | Cần kiểm tra |
| 3. Gom đơn theo khu vực | Tự động gom đơn cùng khu vực trong khung giờ | ❌ Chưa có |
| 4. Xác nhận & xuất HĐĐT | Đạt mốc → xác nhận tự động, xuất HĐĐT cho từng cửa hàng | ❌ Chưa có |
| 5. Giao qua VComm Hub | Giao gộp về Hub, chia chặng cuối | ❌ Chưa có |
| 6. Đối soát & hoàn V-Xu | Đối soát công nợ, hoàn 1–2% V-Xu | ⚠️ Có đối soát, thiếu V-Xu |

→ **Bước 3, 4, 5 chưa tồn tại.** Đây là lõi của Trụ cột 4.

**2.2 Luồng O2O (Đề án E.2, E.3)**

| Yêu cầu | Hiện trạng |
|---|---|
| Đặt online, chọn nhận tại Hub gần nhất | ❌ |
| Định tuyến linh hoạt khi Hub quá tải (ẩn Hub, điều hướng lân cận) | ❌ |
| 3 loại trạm: Standard / Freeze Hub / Tủ khóa 24-7 | ❌ |
| Nhận hàng 30 giây bằng QR động, chủ Hub quét trên iPOS | ⚠️ Có TOTP ở 5 file |
| Đồng kiểm & hoàn tiền tức thì tại trạm | ❌ |
| Nhắc 48h/72h, tự hủy sau 72h, phạt 15% | ❌ |
| Quỹ bảo hiểm O2O 100–200đ/đơn | ❌ |

**2.3 Luồng thanh toán ECO Pay (Đề án F.6)**

| Yêu cầu | Hiện trạng |
|---|---|
| Ký HMAC-SHA256 `MerchantId\|OrderId\|Amount\|Timestamp` | Cần kiểm tra `sepayService` |
| IPN webhook + kiểm tra checksum, bất biến | ⚠️ Có SePay listener |
| Đối soát tự động T+1 lúc 02:00 | Cần kiểm tra |
| POS hai chiều 5 bước (Sinh QR → POS quét → Hold điểm → In bill → Xử lý lỗi) | ⚠️ Có TOTP |
| True-Offline: Local SQLite + Vector Clocks | ❌ `vector clock` = 0 |

**2.4 V-Xu (Đề án E.5)**

| Hạng | Điều kiện | Hoàn tiền |
|---|---|---|
| Đồng | Mặc định | 1,0% |
| Bạc | > 2 triệu (5 đơn) | 2,0% |
| Vàng | > 8 triệu (20 đơn) | 3,5% |
| Kim Cương | > 20 triệu (50 đơn) | 5,0% |

Yêu cầu thêm: sổ cái **kế toán kép** (`loyalty_ledger` Debit/Credit), ma trận phiếu ưu đãi.
→ Hiện trạng: 2 file. Cần xây gần như từ đầu.

**Nghiệm thu:** Ma trận đối chiếu Đề án ↔ code hoàn chỉnh; mỗi workflow có trạng thái ✅/⚠️/❌ kèm file và dòng; danh sách khoảng trống được xếp hạng theo mức độ ảnh hưởng doanh thu.

---

### Giai đoạn 3 — Hợp nhất trùng lặp (4–6 tuần)

*Chỉ bắt đầu khi Giai đoạn 1–2 xong. Thứ tự theo độ rủi ro tăng dần.*

| Đợt | Cụm | Cách làm | Rủi ro |
|---|---|---|---|
| 1 | Route trùng `/analytics` → `/bi` | Chuyển hướng 301, giữ `/analytics` làm alias 1 phiên bản | Rất thấp |
| 2 | Component chết (10 file) | Xóa sau khi **kiểm tra tay** từng file. Giữ `CommandPalette` — khôi phục ở Giai đoạn 3 UI | Thấp |
| 3 | **Công việc/Phê duyệt (5 hệ thống)** | Giữ `Workspace` làm trạm gốc. Gộp `TasksPage` + `WorkflowHub` + `RequestHub` vào một hệ thống duy nhất theo 4 view | **Cao** |
| 4 | Giao tiếp/CSKH (6 component) | Hợp nhất thành 1 module CSKH đa kênh | Trung bình |
| 5 | Tài chính (5 route) | Giữ 1 trang Tài chính + các tab con. `Wallet`/`Loyalty` thành tab | Trung bình |
| 6 | Nhân sự (4 route) | Giữ `HR` làm trạm gốc, `EasyHRM`/`Performance`/`OrgStructure` thành tab | Trung bình |

**Quy trình hợp nhất một cụm (bắt buộc):**
1. Đọc Registry, xác định **bản hoàn thiện hơn** (nhiều trường/trạng thái/test hơn).
2. Viết test bao phủ **cả hai bản** trước khi động tay.
3. Chuyển dần: route cũ → redirect → component mới, chạy song song tối thiểu 1 phiên bản.
4. Đối chiếu baseline đối chiếu từng route.
5. Chỉ xóa bản cũ khi bản mới đã chạy 2 tuần không lỗi.

**Đợt 3 (Công việc/Phê duyệt) cần 2–3 tuần riêng** — đây là cụm phức tạp nhất, chạm vào 32 component.

**Nghiệm thu:** Mỗi cụm còn đúng 1 entry point; số dòng giảm ≥ 30%; không có tính năng nào biến mất (đối chiếu Registry); 45 route baseline không đổi ngoài dự kiến.

---

### Giai đoạn 4 — Bù khoảng trống nghiệp vụ (8–12 tuần)

*Xây những gì Đề án yêu cầu mà chưa có. Thứ tự theo giá trị doanh thu.*

| Ưu tiên | Hạng mục | Căn cứ Đề án | Ước tính |
|---|---|---|---|
| **P0** | **Trụ cột 4 — F2B2B**: Cổng nhập hàng, giá bậc thang, gom đơn theo khu vực, xuất HĐĐT | B.4.4 bước 1–6 | 4–5 tuần |
| **P0** | **Trụ cột 3 — Mua chung**: `group_buying_sessions` (OPEN/SUCCESS/EXPIRED), nhóm 3-5-10 người, mốc Livestream | B.3, F.5 | 3–4 tuần |
| **P1** | **V-Xu**: 4 hạng, tỷ lệ 1/2/3,5/5%, sổ cái kế toán kép | E.5, F.5 | 2–3 tuần |
| **P1** | **Tuân thủ TT88**: 4 sổ kế toán, thuế 1,5–4,5%, xuất XML nộp `thuedientu.gdt.gov.vn` | F.2 | 2–3 tuần |
| **P2** | **O2O lõi**: VComm Hub, định tuyến, nhận hàng QR, đồng kiểm hoàn tiền | E.1–E.4 | 4–6 tuần |
| **P2** | **Trụ cột 1 — Dropship** (hiện = 0) | B.1 | 2–3 tuần |
| **P3** | **Trụ cột 5 — Shop Mall**: luồng thẩm định 5 tiêu chí, nhãn "Hàng chính hãng" | A.2 TC5 | 2–3 tuần |

**Lưu ý về thứ tự:** Trụ cột 3 và 4 là P0 vì Đề án xác định Trụ cột 4 là động cơ lợi nhuận chính, và cả hai được xếp Giai đoạn 1. O2O (P2) dù quan trọng nhưng phụ thuộc vào mạng lưới Hub vật lý — xây trước khi chưa có Hub sẽ thành tính năng chết.

**Nghiệm thu:** Mỗi hạng mục có spec riêng (`specs/016` trở đi), có test, chạy được thực tế với dữ liệu thật.

---

### Giai đoạn 5 — Chốt & bàn giao (2 tuần)

| Việc | Chi tiết |
|---|---|
| Cập nhật Feature Registry | Trạng thái cuối cùng của mọi tính năng |
| Rà soát cuối | Đối chiếu 45 route với baseline; walkthrough từng workflow Đề án |
| Cập nhật tài liệu | Sơ đồ module, quy ước đặt tên, quy trình thêm module mới |
| Kế hoạch nợ kiến trúc | Ghi nhận chính thức khoảng cách với F.4 (K8s/Kafka/PostGIS), lộ trình Năm 2 |
| Dọn dẹp | Xóa script `fix_*` / `patch_*` hết tác dụng, `out.js`, `output.html` |

---

## 6. Rủi ro và cách giảm thiểu

| # | Rủi ro | Mức | Cách giảm thiểu |
|---|---|---|---|
| 1 | **Hợp nhất làm mất tính năng** | **Cao** | Không xóa trước khi Registry xong. Test bao phủ cả hai bản trước khi gộp. Chạy song song 2 tuần |
| 2 | Chọn nhầm bản kém hoàn thiện hơn khi hợp nhất | Cao | Quy trình bắt buộc so sánh số trường/trạng thái/test, không theo ngày tạo file |
| 3 | Giai đoạn 4 phình to (8–12 tuần dễ thành 6 tháng) | **Cao** | Chia P0/P1/P2/P3, mỗi đợt giao hàng độc lập. Không bắt đầu P1 khi P0 chưa xong |
| 4 | Khoảng cách kiến trúc với Đề án F.4 gây áp lực đổi nền tảng | Trung bình | Ghi nhận chính thức thành nợ kiến trúc, lộ trình Năm 2. Không đổi nền tảng trong đợt này |
| 5 | Xung đột với kế hoạch thiết kế lại UI (`014`) | **Cao** | **Xem mục 7** |
| 6 | Xóa nhầm component "chết" nhưng thực tế được dùng | Trung bình | Kiểm tra tay từng file, đối chiếu baseline sau mỗi lần xóa |
| 7 | Thiếu người xác nhận nghiệp vụ cho Registry | Trung bình | Chỉ định người phụ trách trước Giai đoạn 1; không bắt đầu khi chưa có |

---

## 7. Mối quan hệ với kế hoạch thiết kế lại UI (`specs/014`)

Hai kế hoạch này **chạm vào nhau ở Giai đoạn 3 của cả hai** — cần phối hợp, nếu không sẽ xung đất.

| | `014` Thiết kế lại UI | `015` Rà soát & hợp nhất |
|---|---|---|
| GĐ 0–1 | Kiểm kê + token | Đóng băng + kiểm kê |
| **GĐ 2** | **Xây thư viện component** | **Đối chiếu workflow** |
| **GĐ 3** | **Shell & điều hướng** | **Hợp nhất trùng lặp** ⚠️ **VA CHẠM** |
| GĐ 4 | Di cư 45 module | Bù khoảng trống |

**Khuyến nghị phối hợp — làm `015` Giai đoạn 3 trước `014` Giai đoạn 4:**

Hợp nhất trùng lặp (015/GĐ3) làm **giảm số module cần di cư**, nên thiết kế lại UI (014/GĐ4) sẽ nhẹ hơn đáng kể. Làm ngược lại sẽ phải thiết kế lại cả những module sắp bị gộp — lãng phí.

**Thứ tự khuyến nghị:**
1. `015` GĐ0–1 (đóng băng, kiểm kê) + `014` GĐ0–1 (baseline, token) — **chạy song song, không xung đột**
2. `015` GĐ2 (đối chiếu workflow) + `014` GĐ2 (thư viện component) — **chạy song song**
3. `015` GĐ3 (hợp nhất) — **làm trước**
4. `014` GĐ3–4 (shell + di cư) — **sau khi hợp nhất xong**
5. `015` GĐ4 (bù khoảng trống) — chạy song song với `014` GĐ4, dùng chung thư viện component mới

**Lợi ích:** component mới từ `014` GĐ2 được dùng ngay cho các module mới ở `015` GĐ4 — tránh tạo thêm 107 bảng viết tay lần nữa.

---

## 8. Bắt đầu ngay: 4 việc tuần này

Không cần chờ duyệt toàn bộ kế hoạch:

1. **Xử lý 7 file đang sửa dang dở** — commit hoặc stash. Điều kiện tiên quyết cho mọi việc khác.
2. **Chụp baseline 45 route bằng Puppeteer** — lưới an toàn cho cả hai kế hoạch (`014` và `015`).
3. **Chỉ định người phụ trách nghiệp vụ** cho Feature Registry — không bắt đầu Giai đoạn 1 khi chưa có người xác nhận.
4. **Xác nhận quyết định kiến trúc** — chấp nhận ghi nhận khoảng cách với Đề án F.4 thành nợ kiến trúc Năm 2, không đổi nền tảng trong đợt này.

---

## 9. Quyết định đã chốt (xác nhận ngày 2026-09-01)

### 9.1 Hiệu đính kết luận — Trụ cột 3 KHÔNG phải 0 dòng code

Kết luận ban đầu tại Mục 3 ("Trụ cột 3 & 4 = 0 dòng code") được đưa ra từ grep tên miền và **đã sai một phần**. Kiểm tra lại theo từng lớp:

| Lớp | Trụ cột 3 — Mua chung | Trụ cột 4 — F2B2B |
|---|---|---|
| Schema DDL | ✅ **Đã có** — `group_buy_sessions` trong `specs/012-vn-legal-compliance/migrations/005_relational_modules.sql` | ❌ Chưa có (0 occurrence `F2B2B` / `gom đơn` / `nhaMay`) |
| Type | ✅ **Đã có** — `GroupBuySession` trong `src/types/erp.ts:714` | ❌ Chưa có |
| Persistence | ✅ **Đã có** — `group_buy_sessions` nằm trong `RELATIONAL_TABLES`, có đủ `toRelationalPayload` / `fromRelationalRow` trong `dbService.ts` | ❌ Chưa có |
| Business logic | ❌ **Thiếu** — không có service điều phối phiên mua chung | ❌ Thiếu |
| UI | ⚠️ **Chưa đúng** — `FlashSale.tsx` chỉ coi `group_buy` là một `campaign.type` (marketing), không phải phiên mua chung có người tham gia | ❌ Thiếu |

**Kết luận đã sửa:** Trụ cột 3 thiếu **logic nghiệp vụ + UI điều phối**, không phải thiếu toàn bộ. Trụ cột 4 thiếu hoàn toàn nhưng có sẵn các khối lân cận: `PurchaseRequest`, `B2BInventoryItem`, `SupplierPortal`, `Procurement.tsx`.

### 9.2 Phát hiện lỗi kỹ thuật kèm theo

**Mismatch tên cột giữa DDL và `dbService.ts`** — đang âm thầm ghi sai dữ liệu:

| Ý nghĩa | Cột trong DDL (`005_relational_modules.sql`) | Trường mà `dbService.ts` map |
|---|---|---|
| Số lượng tối thiểu | `min_participants` | `min_qty` ❌ |
| Số lượng hiện tại | `current_participants` | `current_qty` ❌ |
| Thời gian kết thúc | `expires_at` | `end_time` ❌ |

Vì `mapJsFieldToDbColumn()` có fallback snake_case tự động, `min_qty` → `min_qty` (cột không tồn tại) → **ghi lỗi hoặc mất dữ liệu**. Lỗi này phải được sửa trước khi xây tiếp lên trên.

**Cách xử lý:** migration `016` chuẩn hoá về một bộ tên duy nhất, đồng bộ cả DDL lẫn mapping layer.

### 9.3 Các quyết định đã được xác nhận

| # | Câu hỏi | Quyết định |
|---|---|---|
| 1 | Trụ cột 3 & 4 = 0 dòng code? | **Viết code.** Bù ngay cả hai trụ cột, theo đúng quy ước data layer hiện tại (`dbService` + `tenant_id` + RLS). |
| 2 | Dropship = 0, có bỏ không? | **Không bỏ.** Affiliate và Dropship là **hai mô hình khác nhau** — Dropship là hạng mục độc lập cần xây riêng, không gộp vào Affiliate. |
| 3 | `015` GĐ3 trước `014` GĐ4? | **Đồng ý.** Hoãn thiết kế lại UI đến khi hợp nhất xong. |
| 4 | Kiến trúc F.4 (Đề án)? | **Đồng ý** ghi nhận thành nợ kiến trúc Năm 2. Không đổi nền tảng trong đợt này. |
| 5 | Nguồn lực (mấy dev? ai xác nhận Registry?) | ⏳ **Chưa trả lời** — GĐ1 (Feature Registry) vẫn bị chặn ở điều kiện này. |
| 6 | O2O — đã có mạng lưới VComm Hub? | **Tách thành 2 sản phẩm phần mềm riêng biệt**: |

#### Quyết định 6 — O2O tách thành 2 sản phẩm

Đây là thay đổi kiến trúc đáng kể nhất trong đợt xác nhận này:

**Loại 1 — VComm Hub** (tự vận hành)
- Trạm giao hàng và các shop offline **do VComm trực tiếp vận hành**
- Dùng phần mềm **VComm HUB**
- Cùng một tenant, cùng database lõi → kế thừa toàn bộ OMS/WMS hiện tại

**Loại 2 — Shop Offline đối tác** (SaaS)
- Shop offline của **đối tác**, VComm không trực tiếp vận hành
- Dùng phần mềm **iPOS** — sản phẩm **riêng biệt**, phát triển theo **mô hình SaaS**, có đầy đủ chức năng
- Hệ quả: cần **đa tenant thực sự** (tenant provisioning, isolation, billing, upgrade path) — không thể dùng chung giả định `tenant-vcomm-prod-01` cố định như hiện tại

> ⚠️ **Hệ quả kiến trúc:** iPOS SaaS đẩy yêu cầu multi-tenancy từ "Năm 2" lên **trước khi O2O ra mắt**. RLS đã có, nhưng thiếu: tenant provisioning, tenant-scoped billing, và tách deployment. Cần một spec riêng cho việc này.

---

*Tài liệu này cần được xem lại sau mỗi giai đoạn. Feature Registry (Giai đoạn 1) là tài liệu sống — cập nhật liên tục.*
