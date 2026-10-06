# Phân tích chồng chéo iPOS – Hub – Mua chung – V-Xu – Loyalty

**Tham chiếu mô hình Pinduoduo (拼多多)**

- Dự án: VComm
- Ngày phân tích: 2026-10-09
- Ngày chốt quyết định: 2026-10-09
- Trạng thái: Đã chốt — bốn quyết định đã ghi tại mục 6
- Phạm vi: bốn điểm chồng chéo do chủ dự án nêu ngày 2026-10-09
- Nguồn bằng chứng: mã nguồn `_recovery_V-com-ERP`, `specs/018-o2o-tach-hai-san-pham`, `specs/016-tru-cot-3-4`, và tài liệu công khai về Pinduoduo (ghi rõ ở mục 3)

> Bốn quyết định của chủ dự án đã chốt ngày 2026-10-09 (mục 6). Bảng việc phải làm nằm ở mục 6.2.

---

## 1. Kết luận nhanh

| # | Điểm chồng chéo | Bản chất thật | Mức độ | Kết luận đã chốt |
|---|---|---|---|---|
| 1 | iPOS và VComm Hub | **Không chồng nhau về thiết kế** — `specs/018` đã tách rõ. Chồng nhau ở **chức năng bán tại quầy**: có tới bốn nơi cùng bán lẻ | Trung bình | Giữ tách hai sản phẩm; **bán tại quầy ở Hub chỉ áp cho trạm `standard` và `freeze`; trạm `locker` chỉ nhận hàng** |
| 2 | Mua chung (Group Buy) | Mã nguồn **đã đúng mô hình 拼团**; **tài liệu QT-31 mô tả sai hoàn toàn** (bịa ra "giá theo bậc") | **Cao** | Viết lại QT-31 theo mã nguồn; **áp đầy đủ 拼团**: 免拼, job hết hạn tự động, giới hạn mua mỗi người |
| 3 | V-Xu và Loyalty | **Hai sổ điểm song song** (V-Xu và Điểm thân thiết) cộng một trường điểm lưu đệm trên hồ sơ khách; màn hình Loyalty là giao diện giả, không nối cơ sở dữ liệu | **Cao** | **V-Xu là động cơ điểm duy nhất**; Loyalty trở thành tầng giao diện và giữ chân |

---

## 2. Hiện trạng và bằng chứng

### 2.1. iPOS và VComm Hub

**Quyết định cũ đã đúng.** `specs/018` tách O2O thành hai sản phẩm:

| | VComm Hub | iPOS |
|---|---|---|
| Chủ vận hành | VComm | Đối tác |
| Mô hình dữ liệu | Cùng tenant `tenant-vcomm-prod-01` | Đa tenant, mỗi shop một tenant |
| Phạm vi | Nhận hàng, giữ hàng, giao chặng cuối, đồng kiểm, hoàn tiền | POS đầy đủ: bán tại quầy, kho, thu ngân, ca, báo cáo |

Mã nguồn đã theo đúng quyết định này: `src/components/VCommHub.tsx:25` ghi rõ "Shop Offline ĐỐI TÁC (iPOS) là sản phẩm SaaS ĐA TENANT RIÊNG BIỆT — không nằm [trong repo]", và `:27` xác nhận điểm giao duy nhất là API xác thực mã nhận hàng dùng chung.

**Ba loại trạm Hub đã có trong mã nguồn** (`src/services/vcommHubService.ts:31`, nhãn ở `:612`–`:615`):

| Loại | Mã | Bản chất | Có nhân viên trực |
|---|---|---|---|
| Trạm tiêu chuẩn | `standard` | Nhận hàng thường | Có |
| Trạm đông lạnh | `freeze` | Có kho lạnh cho hàng tươi sống | Có |
| Tủ khóa 24-7 | `locker` | Tự phục vụ, mở bằng mã | **Không** |

**Chỗ chồng thật không nằm ở iPOS — nằm ở bán lẻ tại quầy.** Có **bốn** nơi cùng làm chức năng bán tại quầy:

| # | Nơi | Bằng chứng | Trạng thái |
|---|---|---|---|
| 1 | VComm Hub (quyết định #19) | `src/services/hubService.ts:3` — "Hub vừa bán hàng có sẵn tại trạm (cần kho + POS), vừa nhận đơn hộ"; hàm `createPosOrder` ở `:135`, `openShift` ở `:177` | **Mã chết** — không thành phần nào import `hubService.ts`; chỉ có tệp kiểm thử `hubService.test.ts` dùng |
| 2 | Siêu thị VComm | `src/components/VCommSupermarket.tsx` (1.189 dòng), tuyến `/vcomm-supermarket`; `openShift` dùng chung ở `hubService.ts:177` | Đang chạy |
| 3 | E-Menu (đặt món tại bàn) | `src/components/EMenu.tsx` (289 dòng), tuyến `/emenu/:tableId` | Đang chạy |
| 4 | iPOS (đối tác) | `server.ts:3074` — `orderData.source === 'ipos' ? 'Bán lẻ tại quầy'`; `server.ts:2651` `/api/ipos/licenses`; bảng `ipos_stores` | Sản phẩm ngoài repo |

Nói cách khác: **quyết định #19 (Hub bán hàng tại trạm) mâu thuẫn `specs/018` (Hub không cần POS).** Chủ dự án đã chốt phương án dung hoà: **giữ bán tại quầy ở Hub nhưng phân biệt theo loại trạm** — trạm `standard` và `freeze` có nhân viên trực nên bán được, trạm `locker` tự phục vụ nên **chỉ nhận hàng**. Xem mục 4.1.

### 2.2. Mua chung — và một lỗi tài liệu nghiêm trọng

**Mã nguồn đã đúng mô hình 拼团.** Kiểu dữ liệu `GroupBuySession` (`src/types/erp.ts:741`) có:

- `minParticipants` — số người tối thiểu (không phải bậc giá)
- `unitPrice` — **một mức giá duy nhất** cho cả phiên
- `leaderId` — người mở phiên (tương ứng 团长)
- `expiresAt` — hạn chót của phiên
- `lockedAt`, `supplierConfirmedAt`, `completedAt`, `cancelledAt`

Máy trạng thái thật (`src/types/erp.ts:732` và `GROUP_BUY_STATUS_LABEL` ở `src/services/groupBuyService.ts:422`): `group_open` (Đang mở) → `group_reached_minimum` (Đạt tối thiểu) → `group_locked` (Đã chốt sổ) → `supplier_confirmed` (Nguồn đã xác nhận) → `completed` (Hoàn tất); nhánh phụ `cancelled`, `expired`. Tập chuyển trạng thái hợp lệ nằm ở `ALLOWED_TRANSITIONS` (`groupBuyService.ts:34`).

Trạng thái người tham gia (`GROUP_BUY_PARTICIPANT_STATUS_LABEL`, `:432`): `joined` → `confirmed` → **`refunded`** (đã hoàn tiền) / `cancelled`.

Hàm `cancelSession` (`src/services/groupBuyService.ts:362`) **hoàn tiền cho toàn bộ người đã tham gia**: duyệt danh sách, đặt `status: 'refunded'` cho mọi người ở trạng thái `joined` hoặc `confirmed` (`:379`–`:385`), và trả về số người đã hoàn.

**Lỗi tài liệu: QT-31 mô tả một mô hình không tồn tại.** QT-31 viết "giá theo bậc số lượng", "Bảng bậc giá — Số người tối thiểu, giá tương ứng", và trích hàm `resolveTierPrice`. Kiểm chứng:

| Điều QT-31 khẳng định | Thực tế |
|---|---|
| `groupBuyService.ts:65` là "Bảng giá theo bậc" | Dòng 65 là `function newId(prefix: string): string {` |
| `groupBuyService.ts:76` là `resolveTierPrice` | Dòng 76 là `onlyOpen?: boolean;` |
| Có hàm `resolveTierPrice` trong mua chung | `resolveTierPrice` **chỉ tồn tại** ở `src/services/f2b2bService.ts:76` (gom đơn B2B), không có trong mua chung |
| Có "giá theo bậc" | `grep -cniE "bậc\|tier" src/services/groupBuyService.ts` trả về **0** |

Đây là lỗi **trộn khái niệm**: tác giả đã lấy mô hình giá theo bậc của F2B2B (gom đơn B2B) gán sang mua chung. Số dòng phần lớn đúng nhưng **khái niệm sai**, nguy hiểm hơn số dòng sai vì đọc qua khó phát hiện.

**Đã kiểm tra chéo: lỗi này là cá biệt, nhưng có một chỗ lệch nhỏ.** QT-53 (Siêu thị) trích dẫn **đúng hoàn toàn** — `VCommSupermarket.tsx:779/898/1074`, `taxService.ts:142` (`resolveVatRate`), `accountingOutbox.ts:70` (`publishPosSaleCompleted`) đều trỏ đúng chỗ. QT-34 (Hub) và QT-35 (V-Xu) cũng đúng. Riêng QT-37 có một trích dẫn lệch: câu "tự động gửi tin nhắn chăm sóc theo mẫu" trỏ `znsService.ts:212`, nhưng dòng 212 là `getZnsLogs` (hàm **đọc nhật ký**); hàm gửi thật là `sendZnsNotification` ở `znsService.ts:255`. Lệch này sẽ được sửa khi viết lại QT-37.

**Khoảng trống so với Pinduoduo:**

- **Chưa có 免拼** (mua một mình vẫn hưởng giá nhóm). Kiểu dữ liệu không có trường nào thể hiện.
- **Hết hạn chưa tự động.** `isExpired()` có ở `:60`, chuyển trạng thái `expired` có trong `ALLOWED_TRANSITIONS` ở `:41`, chú thích ở `:23` ghi "cancelled | expired (tự động)". **Đã có sẵn hàm cơ sở dữ liệu `gb_expire_stale_sessions()`** ở `specs/016-tru-cot-3-4/migrations/001_group_buy_sessions.sql:198` — hàm này tự đặt người tham gia sang `refunded` rồi đặt phiên sang `expired`. **Nhưng không có ai gọi nó:** `grep -rn "gb_expire_stale_sessions"` chỉ ra đúng hai dòng trong chính tệp migration (định nghĩa và chú thích); bộ lịch chạy duy nhất trong mã nguồn là `src/services/monthEndScheduler.ts`, và tệp này **không** tham chiếu mua chung. Nghĩa là cơ chế đã xây một nửa: hàm có, bộ kích hoạt thiếu.
- **Chưa có giới hạn mua mỗi người** (chống trục lợi). Hàm `joinSession` (`:210`) chỉ chặn một khách chiếm hai dòng đang hoạt động (`:232`), **không** giới hạn tổng số lượng hay giá trị.
- **`leaderId` có trong dữ liệu nhưng không lộ ra giao diện** — `groupBuyService.ts:158`, `:191`, ánh xạ `leader_id` ở `src/services/dbService.ts:334`, `:1050`; `grep -rnE "leaderId|leader_id" src/components/` trả về **rỗng**.

### 2.3. V-Xu và Loyalty

**Hai sổ điểm song song, cộng một trường lưu đệm:**

| # | Hệ thống | Nơi lưu | Bằng chứng | Trạng thái |
|---|---|---|---|---|
| 1 | V-Xu | `vxu_accounts`, `vxu_ledger`, `vxu_redemptions` | `src/services/vxuService.ts:98`, `:203`, `:446` | **Động cơ thật** — sổ cái kế toán kép, phân hạng, ma trận phiếu thưởng |
| 2 | Điểm thân thiết | `loyalty_points_ledger` | `src/services/crmService.ts:77` | Có ghi thật |
| 3 | Điểm lưu đệm trên hồ sơ khách | trường `points` của bảng khách hàng | `src/services/crmService.ts:101` | Ghi cùng lúc với #2 |

**Làm rõ mức độ trùng lặp:** #2 và #3 **không phải hai hệ thống độc lập** — hàm `addLoyaltyPoints` (`crmService.ts:65`) ghi **cả hai trong cùng một lời gọi**: ghi một dòng vào `loyalty_points_ledger` (`:77`) rồi cập nhật trường `points` trên hồ sơ khách (`:101`). Đây là mẫu **sổ cái + số dư lưu đệm**, chấp nhận được. Xung đột thật nằm giữa **V-Xu** (#1) và **Điểm thân thiết** (#2): hai sổ cùng ghi điểm cho một khách nhưng không liên quan tới nhau, nên khách sẽ có **hai số dư điểm mâu thuẫn**.

Chính tác giả V-Xu đã ghi nhận sự trùng lặp này trong chú thích `src/services/vxuService.ts:13`:

> "KHÁC loyalty điểm hiện có (spec 010 / loyalty_points_ledger): V-Xu dùng SỔ CÁI KẾ TOÁN KÉP (double-entry, Đề án F.5)"

Chú thích giải thích **cách V-Xu khác**, nhưng không giải quyết **việc hai hệ thống cùng tồn tại**.

**Động cơ nào đang chạy thật? Sổ cũ.** `src/components/Orders.tsx:1277` gọi `addLoyaltyPoints` mỗi khi đơn hoàn tất, với `pointsToEarn = Math.round(total / 10000)` (1 điểm mỗi 10.000 đồng). Hàm `recordCompletedOrder` của V-Xu **chỉ được gọi trong tệp kiểm thử** (`src/__tests__/vxu.test.ts:138`, `:163`, `:177`) — không có thành phần chạy thật nào gọi. Nghĩa là V-Xu, động cơ được thiết kế làm trục xuyên suốt, hiện **không hoạt động trong luồng thật**, còn sổ điểm cũ lại đang hoạt động. Hai bên còn dùng hai công thức khác nhau: sổ cũ 1 điểm mỗi 10.000 đồng (≈ 0,01%), V-Xu 1%–5% theo hạng (`src/types/erp.ts:1131`) — chênh khoảng **100 lần**. Đây là lý do việc gộp sổ không chỉ là dọn dữ liệu mà phải chốt lại mức tích điểm.

**Màn hình Loyalty là giao diện giả.** `src/components/Loyalty.tsx` **không có một lời gọi cơ sở dữ liệu nào** — không `from(`, không `collection(`, không `localStorage`. Toàn bộ dữ liệu là hằng số giả: `MOCK_LOYALTY` ở `:34`, `REWARDS` ở `:64`, danh sách thành viên VIP bằng `useState` ở `:72`. Nghĩa là màn hình Loyalty đang trưng bày dữ liệu bịa, còn động cơ thật nằm ở màn hình V-Xu (`src/components/VXu.tsx:10` có `import * as vxu from '../services/vxuService'`).

Bản thân V-Xu đã bao trùm phần lõi của Loyalty: `resolveTier` (`vxuService.ts:58`) phân hạng theo chi tiêu lũy kế và số đơn, `cashbackRateOf` (`:70`) tỉ lệ hoàn tiền theo hạng, `vouchersForTier` (`:377`) phiếu thưởng theo hạng. Loyalty không có gì thêm ngoài **giữ chân** (tin nhắn chăm sóc, quà tặng, dự đoán rời bỏ) — phần này mới là giá trị riêng.

---

## 3. Mô hình Pinduoduo tham chiếu

### 3.1. 拼团 — cơ chế ghép nhóm

| Thành phần | Cơ chế Pinduoduo | Đối chiếu VComm |
|---|---|---|
| Số người mở nhóm | Đặt theo giá trị đơn: hàng rẻ dùng **2人团** để chạy số lượng, hàng đắt dùng **3–5人团** để tăng tỉ lệ chia sẻ | `minParticipants` đã có (ràng buộc `>= 2` ở `groupBuyService.ts:165`), nhưng QT-31 lại ghi "bậc giá" |
| Giá | **Một giá duy nhất** cho cả nhóm, bắt buộc thấp hơn giá gốc | `unitPrice` — **đã đúng** |
| Thời hạn | **Thường 24 giờ.** Quá hạn mà chưa đủ người thì hệ thống **không giao hàng và hoàn tiền tự động về đúng phương thức thanh toán** | `expiresAt` có, `cancelSession` hoàn tiền được, hàm `gb_expire_stale_sessions()` có — **nhưng chưa nối bộ kích hoạt** |
| Người mở nhóm (团长) | Người phát động nhóm, được ưu đãi và là mấu chốt lan truyền | `leaderId` có trong dữ liệu, chưa lộ ra giao diện |
| 免拼 (miễn ghép) | Người mua **tự mua một mình vẫn hưởng giá nhóm**, tiêu hao "lượt miễn ghép" kiếm từ hoạt động, điểm danh hoặc mua sắm. Một số đơn quá hạn được hệ thống **tự động miễn ghép** | **Chưa có** |
| Chiến thuật vận hành | Khuyến khích người mua **tham gia nhóm có sẵn** thay vì mở nhóm mới — hiển thị "còn thiếu 1 người" để tận dụng tâm lý đám đông | `progressPercent` (`groupBuyService.ts:411`) tính được phần trăm, nhưng chưa dùng làm tín hiệu xã hội |
| Chống trục lợi | Giới hạn số lượng hoặc giá trị mua mỗi người để tránh bị "羊毛党" vét sạch tồn | **Chưa có** |

**Điểm quan trọng:** VComm **không cần đổi mô hình dữ liệu** — `GroupBuySession` đã là mô hình 拼团. Việc cần làm là **sửa tài liệu cho khớp mã nguồn** rồi **bổ sung ba thứ còn thiếu**: 免拼, bộ kích hoạt job hết hạn, giới hạn mua mỗi người.

### 3.2. 团长 và 自提点 — bài học cho iPOS và Hub

Pinduoduo (qua chuỗi 多多买菜) tách **hai vai trò khác nhau**, và đây là điểm VComm đang trộn:

| Vai trò | Bản chất | Thu nhập | Điều kiện |
|---|---|---|---|
| **团长** (trưởng nhóm cộng đồng) | Người **chủ động gom nhu cầu**: lập nhóm, đăng hàng, thu đơn, phối hợp kho, xử lý sau bán | **Hoa hồng theo bậc 5%–8%** trên giá trị đơn, cộng trợ giá và ưu đãi lưu lượng. Cần **tối thiểu 3 đơn hợp lệ** mới được quyết toán lô đầu | Định danh thật: điện thoại + căn cước + tài khoản ngân hàng; duyệt 1–3 ngày làm việc |
| **自提点** (điểm tự lấy hàng) | **Chỉ là địa điểm cố định**: cửa hàng tiện lợi, tủ khóa, quầy ban quản lý. **Không tạo đơn, không tương tác khách** | Phần lớn **không có thu nhập trực tiếp**; một số thành phố trợ cấp mặt bằng **khoảng 50–200 tệ/tháng** | Chỉ cần khai địa chỉ, nhưng phải có người trực mỗi ngày |

Hai vai trò **có thể cùng tồn tại nhưng trách nhiệm khác nhau**. Việc tách này cho phép Pinduoduo trả tiền theo **giá trị mà mỗi bên thực sự tạo ra**: gom nhu cầu trả theo hoa hồng, còn giữ hàng trả theo trợ cấp mặt bằng.

**Ánh xạ sang VComm:**

| Vai trò Pinduoduo | Tương ứng VComm | Hiện trạng |
|---|---|---|
| 自提点 (điểm lấy hàng, chỉ giữ hàng) | **VComm Hub**, riêng loại trạm `locker` | Đã có, đúng bản chất |
| 自提点 + POS (điểm lấy hàng kiêm bán lẻ) | **VComm Hub** loại `standard`/`freeze` (POS nội bộ) và **iPOS** (shop đối tác) | Đã có, đúng bản chất |
| 团长 (người gom nhu cầu, ăn hoa hồng) | **Mạng Affiliate/KOL (QT-36)** và người mở phiên mua chung (`leaderId`) | Có nền, nhưng chưa được giao vai trò gom nhu cầu |

Đây là **nguyên nhân gốc của sự chồng chéo**: vì chưa giao rõ vai trò "người gom nhu cầu", Hub bị gánh thêm việc bán hàng tại trạm (quyết định #19). Chủ dự án đã chốt **không xây vai trò mới** mà **dùng chính mạng Affiliate/KOL hiện có** để gánh vai trò này.

### 3.3. Hệ thống giữ chân

| Cơ chế | Bản chất | Bài học cho V-Xu/Loyalty |
|---|---|---|
| **省钱月卡** (thẻ tiết kiệm tháng) | **Hội viên trả phí theo tháng**: nhận phiếu giảm giá, đặc quyền miễn đơn, dùng thử miễn phí; tự động gia hạn | V-Xu hiện chỉ có hạng theo chi tiêu — **thiếu tầng trả phí**, vốn là nguồn thu ổn định và là bộ lọc khách hàng giá trị cao |
| **多多果园** (vườn cây) | Trò chơi nông trại: trồng cây ảo, chăm sóc hằng ngày, đổi **trái cây thật** | Giữ chân bằng **thói quen hằng ngày**, không bằng chiết khấu. Loyalty chưa có cơ chế này |
| **现金签到** (điểm danh nhận tiền) | Điểm danh hằng ngày nhận thưởng nhỏ | Tạo tần suất mở ứng dụng |
| **百亿补贴** (trợ giá) | Kênh trợ giá sâu; **hàng trong kênh này không cho 免拼** | Cần phân biệt rõ **kênh trợ giá** và **kênh thường** — trợ giá sâu thì không được cộng dồn ưu đãi |
| **砍一刀** (chặt giá) | Mời bạn bè cùng giảm giá | Lan truyền; VComm đã có Affiliate (QT-36) |

**Nguyên tắc rút ra:** Pinduoduo **không gộp** mọi ưu đãi vào một ví điểm. Họ tách bạch: *điểm thưởng* (tích lũy, tiêu được), *hội viên trả phí* (đặc quyền), *trợ giá* (kênh riêng), *trò chơi* (thói quen). VComm đang trộn cả bốn vào hai chỗ (V-Xu và Loyalty) mà lại không chỗ nào đủ.

---

## 4. Phương án theo quyết định đã chốt

### 4.1. iPOS và Hub — giữ tách, phân biệt bán tại quầy theo loại trạm

1. **Giữ nguyên `specs/018`.** Hai sản phẩm, hai chủ thể, hai mô hình tenant, một API xác thực mã nhận hàng dùng chung. Không gộp.
2. **Giữ bán tại quầy ở Hub nhưng có điều kiện theo loại trạm:**
   - Trạm `standard` và `freeze` — **có nhân viên trực**, được bán tại quầy (cần kho + ca + POS nội bộ).
   - Trạm `locker` — **tự phục vụ, không nhân viên**, **chỉ nhận hàng**, không bán.
   Quyết định #19 vì vậy **không bãi bỏ hoàn toàn**, mà bị **giới hạn phạm vi** cho khớp thực tế vận hành.
3. **Chốt ba nơi bán lẻ, mỗi nơi một chủ:**
   - **iPOS** — bán lẻ tại shop **đối tác** (ngoài repo, đa tenant).
   - **POS nội bộ** — bán lẻ tại cơ sở **do VComm vận hành**: siêu thị VComm, E-Menu, và trạm Hub `standard`/`freeze`.
   - **VComm Hub (trạm `locker`)** — **chỉ nhận hàng, giữ hàng, giao chặng cuối, đồng kiểm, hoàn tiền**.
4. **Giao vai trò "người gom nhu cầu" (团长) cho mạng Affiliate/KOL hiện có (QT-36)**, không xây vai trò mới. Trả hoa hồng theo bậc như Pinduoduo (hiện `Affiliate.tsx:251` đã thiết lập tỉ lệ hoa hồng theo ngành hàng, đủ nền để mở rộng theo bậc doanh số). `leaderId` của mua chung là điểm gắn kết tự nhiên giữa phiên mua chung và người gom nhu cầu.

### 4.2. Mua chung — sửa tài liệu, giữ mã nguồn, bổ sung ba thứ

1. **Viết lại QT-31** cho khớp mã nguồn thật (một giá `unitPrice`, `minParticipants >= 2`, `leaderId`, hoàn tiền khi huỷ).
2. **Bổ sung 免拼:** thêm trường thể hiện lượt miễn ghép; cho phép mua một mình hưởng giá nhóm; hàng trong kênh trợ giá sâu thì không cho miễn ghép.
3. **Nối bộ kích hoạt cho job hết hạn tự động:** hàm `gb_expire_stale_sessions()` đã có sẵn ở tầng cơ sở dữ liệu, chỉ cần đưa vào lịch chạy định kỳ (cron hoặc Edge Function) theo đúng chú thích ở cuối tệp migration.
4. **Bổ sung giới hạn mua mỗi người** để chống vét tồn.
5. **Lộ `leaderId` ra giao diện** và hiển thị "còn thiếu N người" để tận dụng tín hiệu xã hội.

### 4.3. V-Xu và Loyalty — một động cơ, một tầng giao diện

1. **V-Xu là động cơ điểm duy nhất.** Sổ cái kép, phân hạng, hoàn tiền, phiếu thưởng — tất cả ở `vxuService.ts`.
2. **Gộp `loyalty_points_ledger` và trường `points` trên hồ sơ khách vào V-Xu.** Hai sổ song song là lỗi dữ liệu: khách sẽ có hai số dư mâu thuẫn. Cần một lượt di trú dữ liệu có kiểm soát: đọc số dư cũ, ghi bút toán mở đầu vào `vxu_ledger`, rồi ngừng ghi vào sổ cũ. Đồng thời **thay lời gọi tại `Orders.tsx:1277`** từ `addLoyaltyPoints` sang `recordCompletedOrder` của V-Xu — nếu không thay, V-Xu mãi không hoạt động còn sổ cũ vẫn chạy. Phải chốt mức tích điểm trước (0,01% của sổ cũ hay 1%–5% theo hạng của V-Xu).
3. **Loyalty đổi vai trò thành tầng giao diện + giữ chân.** Giữ lại phần riêng có giá trị: tin nhắn chăm sóc, quà tặng đặc quyền, dự đoán rời bỏ. Bỏ toàn bộ dữ liệu giả, nối vào V-Xu.
4. **Cân nhắc thêm tầng trả phí** (như 省钱月卡) vì V-Xu hiện chỉ có hạng theo chi tiêu, chưa có nguồn thu định kỳ.
5. **Không gộp trợ giá vào ví điểm.** Giữ kênh trợ giá tách riêng, có quy tắc không cộng dồn với 免拼.

---

## 5. Việc phải sửa ngay, không phụ thuộc quyết định

| # | Việc | Lý do |
|---|---|---|
| 1 | Viết lại QT-31 theo mã nguồn thật | Tài liệu đang mô tả mô hình không tồn tại; nếu đem đi phê duyệt sẽ chốt sai thiết kế |
| 2 | Rà lại toàn bộ bộ quy trình tìm lỗi cùng loại | QT-31 sai vì trộn khái niệm giữa hai mô-đun; QT-37 lệch một trích dẫn. Cần kiểm tra các quy trình khác có bị lỗi tương tự không |
| 3 | Ghi nhận `hubService.ts` là mã chết và `gb_expire_stale_sessions()` chưa được gọi | Để lâu sẽ có người tưởng Hub luôn phải bán hàng, và tưởng mua chung đã tự hết hạn |

---

## 6. Quyết định đã chốt ngày 2026-10-09

### 6.1. Bốn quyết định

| # | Câu hỏi | Quyết định của chủ dự án | Hệ quả |
|---|---|---|---|
| 1 | Bãi bỏ quyết định #19 để Hub chỉ nhận hàng? | **Phân biệt theo loại trạm.** Trạm `standard` và `freeze` được bán tại quầy; trạm `locker` chỉ nhận hàng | QT-34 giữ phần bán tại quầy nhưng thêm điều kiện theo loại trạm; QT-53 và QT-54 ghi rõ là POS nội bộ do VComm vận hành |
| 2 | Áp mô hình 拼团 đầy đủ cho mua chung? | **Áp đầy đủ** | QT-31 viết lại; thêm 免拼, nối job hết hạn, giới hạn mua mỗi người, lộ `leaderId` |
| 3 | Gộp các sổ điểm về một động cơ V-Xu? | **V-Xu là động cơ duy nhất** | QT-35 và QT-37 viết lại; cần lượt di trú dữ liệu từ `loyalty_points_ledger` và trường `points` |
| 4 | Có xây vai trò "người gom nhu cầu" (团长) mới? | **Không xây mới — dùng mạng Affiliate/KOL hiện có** | QT-36 bổ sung vai trò gom nhu cầu; Hub hết phải gánh việc gom nhu cầu |

### 6.2. Bảng việc phải làm

> Cập nhật 2026-10-09: các việc 1–6 đã thực hiện cùng ngày chốt (viết lại QT-31, QT-35, QT-37, QT-34, QT-36, QT-53, QT-54 theo bốn quyết định ở mục 6.1).

| # | Việc | Tệp | Trạng thái |
|---|---|---|---|
| 1 | Viết lại QT-31 theo mã nguồn + 拼团 đầy đủ | `QT-31_Mua_chung_Group_Buy.md` | **Đã thực hiện** (2026-10-09) |
| 2 | Viết lại QT-35 thành động cơ điểm duy nhất | `QT-35_VXu_Diem_thuong_va_Hoan_tien.md` | **Đã thực hiện** (2026-10-09) |
| 3 | Viết lại QT-37 thành tầng giao diện và giữ chân | `QT-37_Khach_hang_than_thiet_Loyalty.md` | **Đã thực hiện** (2026-10-09) |
| 4 | Thêm điều kiện bán tại quầy theo loại trạm cho QT-34 | `QT-34_Van_hanh_VComm_Hub_O2O.md` | **Đã thực hiện** (2026-10-09) |
| 5 | Ghi rõ QT-53 và QT-54 là POS nội bộ do VComm vận hành, khác iPOS đối tác | `QT-53_Sieu_thi_Offline_va_Ban_le_tai_quay.md`, `QT-54_E_Menu_va_Dat_mon_tai_ban.md` | **Đã thực hiện** (2026-10-09) |
| 6 | Bổ sung vai trò gom nhu cầu vào QT-36 | `QT-36_KOL_KOC_va_Tiep_thi_lien_ket.md` | **Đã thực hiện** (2026-10-09) |
| 7 | Ghi nhận `hubService.ts` là mã chết và `gb_expire_stale_sessions()` chưa được gọi | tài liệu này | **Đã ghi** |
| 8 | Rà toàn bộ bộ quy trình tìm lỗi trích dẫn cùng loại | 30 tệp QT Nhóm 5 | **Đã thực hiện** (2026-10-09) — đã rà tổng 30 tệp, 211 trích dẫn `đường-dẫn:dòng`. Kết quả: `server.ts` (8 dòng) và toàn bộ tầng service (`crmService`, `escrowService`, `dbService`, `consentService`, `f2b2bService`, `dropshipService`, `sellerKycService`, `integrationConfigService`, ...) đều KHỚP nội dung; các trích dẫn component `.tsx:dòng` đều nằm trong phạm vi tệp. Phát hiện 1 lỗi mã chết: `SellerFinance.tsx` không còn trong `src/components` (chỉ còn ở `_tam_huy/2026-10-05`), dòng 1280 bị trích sai (thực tế là xác minh vận đơn), quy tắc xác minh tài khoản nhận tiền chưa được hiện thực hóa (dùng MOCK bank) — đã re-point sang bản lưu trữ và ghi chú vào "Chưa xác minh được" của QT-43, QT-44 |

---

## Chưa xác minh được

- **Đã xác minh** hàm `gb_expire_stale_sessions()` tồn tại trong migration; **chưa xác minh được** nó có được lịch chạy nào gọi trong môi trường sản xuất hay không — chỉ xác minh được bộ lịch chạy duy nhất trong mã nguồn (`monthEndScheduler.ts`) không tham chiếu mua chung.
- Chưa xác minh được `leaderId` có được đặt từ giao diện hay chỉ từ dữ liệu mẫu.
- Chưa xác minh được `loyalty_points_ledger` và trường `points` trên hồ sơ khách có bao nhiêu bản ghi thật trong cơ sở dữ liệu sản xuất.
- Chưa xác minh được iPOS đã có mã nguồn riêng chưa, hay mới chỉ có giấy phép và tuyến API trong repo này.
- Chưa xác minh được siêu thị VComm và E-Menu có dùng chung tồn kho với kênh trực tuyến hay không.
- Chưa xác minh được dịch vụ ZNS có gửi tin thật qua API hay chỉ lưu cục bộ — `znsService.ts` đọc/ghi `localStorage` ở nhiều hàm (`:108`, `:146`, `:212`).
- Chưa xác minh được quy mô và mức độ đầy đủ của bộ quy trình còn lại (mục 5 việc 2 chưa thực hiện).
- Các con số về Pinduoduo (hoa hồng 5%–8%, trợ cấp 50–200 tệ/tháng, thời hạn ghép đơn 24 giờ, tối thiểu 3 đơn để quyết toán) lấy từ tài liệu công khai trên web, **chưa đối chiếu văn bản chính thức của Pinduoduo**.
