# 04 — Mô tả chức năng các app ERP (Cổng Portal + 29 mini-app)

- **Mã**: KH-04 (mô tả chức năng — để chủ dự án kiểm tra mức độ hiểu đúng)
- **Trạng thái**: 🟡 Chờ chủ dự án xác nhận
- **Ngày soạn**: 2026-10-06
- **Nguồn**: `02_ERP_Module/*` (§1 Mục tiêu, §3 Khối giao diện ghi nhận từ mã nguồn), `00_INDEX.md`, `00_KE_HOACH_TONG_THE.md`, `Quy_trinh_nghiep_vu/index.md`
- **Phạm vi**: mô tả chức năng + đề xuất đánh số lại MOD. Chưa đổi tên tệp.

> Mục đích: để chủ dự án đọc và xác nhận "Minh có hiểu đúng từng app không" **trước khi** thực hiện đánh số lại và xây lại quy trình.

---

## 1. Đề xuất đánh số lại MOD theo nhóm phân hệ

> ⚠️ **ĐÃ THAY THẾ (2026-10-06):** chủ dự án đã chốt 8 thay đổi cấu trúc (gộp Dashboard, tách Nhóm 2 Nhân sự, đổi tên Ký số, gộp Workflow/Workspace vào Portal…). Bảng đánh số dưới đây là **bản đề xuất v1**; bảng chính thức là **`05_Cau_truc_dich_ERP.md` §2** (26 app). Giữ §1 này để truy vết.

**Nguyên tắc:** đánh số **liên tục theo nhóm** — Vỏ Portal giữ 01–03, rồi lần lượt Nhóm 1→5. Đánh số mới **trùng thứ tự cổng** (3101–3402) để dễ tra.

| Số mới | Số cũ | Tên app | Nhóm | Tuyến đường | Cổng |
|---|---|---|---|---|---|
| **MOD-01** | MOD-01 | Trang chủ | Vỏ Portal | `/` | 3000 |
| **MOD-02** | MOD-02 | Bảng điều khiển | Vỏ Portal | `/dashboard` | 3000 |
| **MOD-03** | MOD-03 | Phân tích dữ liệu | Vỏ Portal | `/bi` | 3000 |
| **MOD-04** | MOD-30 | Kế toán TT99/2025 | Nhóm 1 — Kế toán | `/ke-toan-tt99` | 3101 |
| **MOD-05** | MOD-39 | Quản trị Nhân sự (HRM) | Nhóm 2 — Nhân sự | `/hr` | 3102 |
| **MOD-06** | MOD-36 | Khách hàng (CRM) | Nhóm 3 — Kinh doanh | `/customers` | 3201 |
| **MOD-07** | MOD-37 | Chăm sóc Khách hàng | Nhóm 3 — Kinh doanh | `/cskh` | 3202 |
| **MOD-08** | MOD-35 | Nhà bán hàng | Nhóm 3 — Kinh doanh | `/sellers` | 3203 |
| **MOD-09** | MOD-11 | Quản lý Đơn hàng | Nhóm 3 — Kinh doanh | `/orders` | 3204 |
| **MOD-10** | MOD-14 | Quản lý sản phẩm (PIM) | Nhóm 3 — Kinh doanh | `/pim` | 3205 |
| **MOD-11** | MOD-15 | Social | Nhóm 3 — Kinh doanh | `/social` | 3206 |
| **MOD-12** | MOD-16 | Quản lý khuyến mại | Nhóm 3 — Kinh doanh | `/flash-sale` | 3207 |
| **MOD-13** | MOD-20 | VComm Hub (O2O) | Nhóm 3 — Kinh doanh | `/vcomm-hub` | 3208 |
| **MOD-14** | MOD-21 | V-Xu | Nhóm 3 — Kinh doanh | `/vxu` | 3209 |
| **MOD-15** | MOD-22 | KOL/KOC & Affiliate | Nhóm 3 — Kinh doanh | `/affiliate` | 3210 |
| **MOD-16** | MOD-24 | Quản lý Quảng cáo (Ads) | Nhóm 3 — Kinh doanh | `/ads` | 3211 |
| **MOD-17** | MOD-10 | Siêu thị VComm (Offline) | Nhóm 3 — Kinh doanh | `/vcomm-supermarket` | 3212 |
| **MOD-18** | MOD-32 | Ví & Thanh toán | Nhóm 3 — Kinh doanh | `/wallet` | 3213 |
| **MOD-19** | MOD-25 | Kho vận & Logistics | Nhóm 3 — Kinh doanh | `/warehouse` | 3214 |
| **MOD-20** | MOD-27 | Mua hàng, NCC & Đối soát | Nhóm 3 — Kinh doanh | `/scm` | 3215 |
| **MOD-21** | MOD-04 | Điều hành & Workflow | Nhóm 4 — Văn phòng | `/workflow` | 3301 |
| **MOD-22** | MOD-05 | Quản lý Công việc | Nhóm 4 — Văn phòng | `/tasks` | 3302 |
| **MOD-23** | MOD-06 | Đề xuất & Trình ký | Nhóm 4 — Văn phòng | `/requests` | 3303 |
| **MOD-24** | MOD-07 | Hợp đồng & Pháp chế | Nhóm 4 — Văn phòng | `/contracts` | 3304 |
| **MOD-25** | MOD-08 | Quản lý Công văn | Nhóm 4 — Văn phòng | `/documents` | 3305 |
| **MOD-26** | MOD-09 | Trung tâm Ký số | Nhóm 4 — Văn phòng | `/signature` | 3306 |
| **MOD-27** | MOD-43 | Không gian làm việc | Nhóm 4 — Văn phòng | `/workspace` | 3307 |
| **MOD-28** | MOD-28 | Tuân thủ & Pháp chế | Nhóm 5 — Chia sẻ & Nền tảng | `/compliance` | 3401 |
| **MOD-29** | MOD-44 | Cấu hình hệ thống | Nhóm 5 — Chia sẻ & Nền tảng | `/settings` | 3402 |

**Ghi chú quan trọng về truy vết:**
- 13 module lưu trữ trong `_Tam_huy/` **giữ nguyên mã cũ** (12, 13, 17, 18, 19, 23, 26, 29, 31, 38, 40, 41, 42) và 2 mã tạm hủy trước (33, 34) — không đánh lại.
- Vì mã được cấp lại, **một số mã cũ đổi chủ** (ví dụ cũ MOD-11 = Đơn hàng → mới MOD-09; mã "11" nay là Social). Bảng trên là bản đồ đối chiếu chính thức; cần giữ lại để tra cứu.
- Vẫn còn 44 mã đã cấp cho vòng đời: 29 đang hoạt động (đánh lại 01–29) + 15 lưu trữ (giữ mã cũ).

---

## 2. Mô tả chức năng từng app (theo số mới)

### Vỏ Portal (shell) — cổng 3000

**MOD-01 — Trang chủ** · `/` · cũ MOD-01 · `Home.tsx` (857 dòng)
- Điểm vào tổng quan; truy cập nhanh mọi module.
- Khối ghi nhận: Phân hệ Quản trị Sản xuất & Chế biến · Nhu cầu nguyên vật liệu · Chế tạo & Lắp ráp phân xưởng · Quản lý chất lượng (IQC/OQC).

**MOD-02 — Bảng điều khiển** · `/dashboard` · cũ MOD-02 · `Dashboard.tsx` (978 dòng)
- Báo cáo và thông số vận hành realtime.
- AI Intelligence Summary · Cảnh báo hiệu suất thời gian thực · Biểu đồ tăng trưởng & xu hướng · Tỷ trọng ngành · Top Sellers · Cộng đồng Seller · Tùy chỉnh giao diện.

**MOD-03 — Phân tích dữ liệu** · `/bi` · cũ MOD-03 · `AnalyticsBI.tsx` (1031 dòng)
- Công cụ BI và phân tích chuyên sâu.
- Lãi gộp combo & sản phẩm · Hiệu quả kênh CTV/Sellers · Hiệu quả mua chung (Group Buy) · Fraud Detection Guardian.

### Nhóm 1 — Kế toán (1 app)

**MOD-04 — Kế toán TT99/2025** · `/ke-toan-tt99` · cũ MOD-30 · `TT99Accounting.tsx` (2306 dòng) + thư mục `accounting/`
- Chế độ kế toán doanh nghiệp theo Thông tư 99/2025.
- Hệ tài khoản TT99 · sổ cái kép · lưu vết Điều 28 · hợp nhất Điều 7 · IFRS 15 · Báo cáo tài chính B01-DN.
- Thư mục `accounting/`: `NhatKyChungPage`, `ChungTuEditor`, `DinhKhoanGrid`, `KiemSoatDieu28Page`, `DoiChieuHoaDonPage`, `FinancialShell`.

### Nhóm 2 — Nhân sự (1 app)

**MOD-05 — Quản trị Nhân sự (HRM)** · `/hr` · cũ MOD-39 · `HR.tsx` (3721 dòng)
- Tuyển dụng, hồ sơ và chế độ nhân viên.
- Tỷ lệ tuyển dụng & nghỉ việc · Biểu đồ vi phạm chấm công · AI Skill Gap Analysis · Dynamic Salary Engine · AI Smart-Sync Optimizer · Bảng theo dõi mục tiêu · Performance Leaderboard.

### Nhóm 3 — Kinh doanh (15 app)

**MOD-06 — Khách hàng (CRM)** · `/customers` · cũ MOD-36 · `Customers.tsx` (2221 dòng)
- Quản lý quan hệ khách hàng đa kênh.
- Hồ sơ Khách hàng 360° · Hạng thành viên & mục tiêu lên hạng · Cấu hình tích/tiêu điểm · Thẻ phân loại ưu tiên (VIP, Fraud) · Cấu hình nguồn tracking · Chiến dịch tự động · Điều chỉnh điểm/ví.

**MOD-07 — Chăm sóc Khách hàng** · `/cskh` · cũ MOD-37 · `CustomerService.tsx` (1723 dòng)
- Tổng đài và hỗ trợ sau bán hàng.
- Phân ca & chấm công CSKH · Tổng đài OmiCall (VoIP) · Kênh Facebook Fanpage, Zalo OA, Zalo cá nhân, TikTok Shop.

**MOD-08 — Nhà bán hàng** · `/sellers` · cũ MOD-35 · `Sellers.tsx` (1338 dòng)
- Hệ thống quản lý đối tác nhà bán hàng.
- Đăng ký & duyệt seller · định mức mặc định · kiểm duyệt sản phẩm · hiệu suất & chế tài vi phạm · SLA vận chuyển · phê duyệt hồ sơ tự động.

**MOD-09 — Quản lý Đơn hàng** · `/orders` · cũ MOD-11 · `Orders.tsx` (1998 dòng)
- Xử lý đơn hàng đa nền tảng tập trung.
- Vận hành đơn hàng & logistics · Phê duyệt đổi trả tự động.

**MOD-10 — Quản lý sản phẩm (PIM)** · `/pim` · cũ MOD-14 · `PIM.tsx` (2738 dòng)
- Thông tin sản phẩm tập trung (Product Information Management).
- AI Pricing 2.0 · thêm sản phẩm · import CSV/Excel & chuẩn hóa dữ liệu · quét mã vạch & kiểm kê.

**MOD-11 — Social** · `/social` · cũ MOD-15 · `Marketing.tsx` (530 dòng)
- Chiến dịch tiếp thị và quảng bá (Omnichannel).
- Omni Chat (inbox tập trung) · Auto Content Sync · Shoppable Video · mã giảm giá · tạo chiến dịch marketing.

**MOD-12 — Quản lý khuyến mại** · `/flash-sale` · cũ MOD-16 · `FlashSale.tsx` (825 dòng)
- Quản lý chương trình khuyến mãi giờ vàng.
- Flash Sale · Group Buy (mua chung) · các mốc giảm giá (multi-tier) · thêm sản phẩm flash sale.

**MOD-13 — VComm Hub (O2O)** · `/vcomm-hub` · cũ MOD-20 · `VCommHub.tsx` (684 dòng) + `services/vcommHubService.ts`, `hubService.ts`
- Trạm giao hàng & shop offline do VComm tự vận hành; nhận hàng bằng QR, tự hủy sau 72h.
- Ba loại trạm: `standard`, `freeze` (có nhân viên, bán tại quầy) và `locker` (tự phục vụ, chỉ nhận hàng).

**MOD-14 — V-Xu** · `/vxu` · cũ MOD-21 · `VXu.tsx` (546 dòng) + `services/vxuService.ts`
- Điểm thưởng xuyên suốt hệ sinh thái; hoàn tiền 1–5% theo hạng; sổ cái kế toán kép.
- Cách tính hạng & hoàn tiền · Ma trận phiếu ưu đãi mở khóa theo hạng · Phiếu đã đổi.

**MOD-15 — KOL/KOC & Affiliate** · `/affiliate` · cũ MOD-22 · `Affiliate.tsx` (288 dòng)
- Mạng lưới cộng tác viên và tiếp thị liên kết.
- Quản lý KOL/KOC & Affiliate · thiết lập hoa hồng affiliate theo ngành hàng.

**MOD-16 — Quản lý Quảng cáo (Ads)** · `/ads` · cũ MOD-24 · `AdManager.tsx` (372 dòng)
- Tối ưu ngân sách và hiệu quả quảng cáo.
- Advertising Manager (quảng cáo nội bộ) · Marketplace Ad Revenue Trends · Ad Bidding Algorithm v3.

**MOD-17 — Siêu thị VComm (Offline)** · `/vcomm-supermarket` · cũ MOD-10 · `VCommSupermarket.tsx` (1189 dòng)
- Quản lý bán hàng offline và tồn kho siêu thị VComm.
- Kệ trưng bày & tồn phát · thêm mặt hàng · hóa đơn bán lẻ.

**MOD-18 — Ví & Thanh toán** · `/wallet` · cũ MOD-32 · `Wallet.tsx` (1051 dòng)
- Xử lý giao dịch và cổng thanh toán.
- Ví tài chính & ký quỹ · Escrow Smart Protocol · Instant Settlement · SePay Bank Hub · tích điểm/hoàn tiền · tra cứu giao dịch.

**MOD-19 — Kho vận & Logistics** · `/warehouse` · cũ MOD-25 · `Warehouse.tsx` (3794 dòng)
- Tối ưu tồn kho và quản lý kho bãi.
- Quản trị kho vận · AI recommendation & layout · tối ưu tuyến giao hàng · tồn kho nguyên vật liệu · phiếu kho (nhập/xuất/luân chuyển).

**MOD-20 — Mua hàng, NCC & Đối soát** · `/scm` · cũ MOD-27 · `Procurement.tsx` (817 dòng)
- Quản lý nhà cung cấp và thu mua.
- Quản lý nhà cung cấp · phiếu đề xuất mua hàng · đơn đặt hàng (Purchase Order PDF) · đối soát công nợ.

### Nhóm 4 — Văn phòng (7 app)

**MOD-21 — Điều hành & Workflow** · `/workflow` · cũ MOD-04 · `WorkflowHub.tsx` (743 dòng)
- Quản lý quy trình và luồng công việc. Đồng bộ Google Calendar (đơn lẻ & hàng loạt).

**MOD-22 — Quản lý Công việc** · `/tasks` · cũ MOD-05 · `TasksPage.tsx` (214 dòng)
- Kanban, việc của tôi, giao việc & báo cáo.

**MOD-23 — Đề xuất & Trình ký** · `/requests` · cũ MOD-06 · `RequestHub.tsx` (1628 dòng)
- Hệ thống phê duyệt và trình ký điện tử. E-Form · xác thực chữ ký số · luân chuyển văn bản điện tử.

**MOD-24 — Hợp đồng & Pháp chế** · `/contracts` · cũ MOD-07 · `ContractManager.tsx` (822 dòng)
- Quản lý kho hợp đồng và tuân thủ. Tình trạng hồ sơ · thao tác phê duyệt · tiến trình chữ ký số · tạo hợp đồng mới.

**MOD-25 — Quản lý Công văn** · `/documents` · cũ MOD-08 · `DocumentManager.tsx` (1126 dòng)
- Số hóa và lưu trữ văn bản đến/đi. AI tóm tắt nội dung · phiên bản · văn bản liên quan.

**MOD-26 — Trung tâm Ký số** · `/signature` · cũ MOD-09 · `SignatureHub.tsx` (1213 dòng)
- Quản lý chữ ký số và xác thực doanh nghiệp. Chờ tôi ký/đã hoàn tất · chứng thư đang hoạt động · quản lý con dấu · quy trình ký & phân quyền.

**MOD-27 — Không gian làm việc** · `/workspace` · cũ MOD-43 · `Workspace.tsx` (493 dòng)
- Cộng tác nội bộ và chia sẻ tài liệu. Bảng tin & thông báo công ty.

### Nhóm 5 — Chia sẻ & Nền tảng (2 app)

**MOD-28 — Tuân thủ & Pháp chế** · `/compliance` · cũ MOD-28 · `Compliance.tsx` (344 dòng)
- Đảm bảo tiêu chuẩn vận hành toàn chuỗi. Pháp chế & bảo vệ thương hiệu · Compliance Guardian.

**MOD-29 — Cấu hình hệ thống** · `/settings` · cũ MOD-44 · `Settings.tsx` (6328 dòng)
- Thiết lập tham số và vận hành hệ thống.
- Cấu hình & tích hợp hệ thống · theme (màu chủ đạo, bo góc, theme lễ tết) · cấu hình ví & payout · quy tắc điều chuyển số dư · danh sách khối homepage · ma trận quyền hạn chi tiết · Kế toán MISA SME.

---

## 3. Đối chiếu quy trình (QT) ↔ nhóm module

**Trạng thái QT thực tế** (nguồn: `Quy_trinh_nghiep_vu/index.md`, cập nhật 2026-10-09):

- **30 QT đang hoạt động** — đều thuộc **Nhóm 5 — Thương mại & Nền tảng mở rộng** (QT-01, QT-24, QT-27…QT-54).
- **24 QT đã hợp nhất vào MD_ERP** — Nhóm 1–4 (Kế toán, Nhân sự, CRM, Văn phòng) **không có QT riêng**; nội dung đầy đủ nằm ở `Mo ta nghiep vu/MD_ERP/`. QT cũ đã dời `_Tam_huy/`, bỏ tiền tố mã, mã nghỉ hưu không cấp lại.
- **6 QT tạm hủy** (không mang mã), gồm 4 QT CRM (Tiềm năng / Liên hệ / Cơ hội / Báo giá) + 2 QT tài chính seller (Hỗ trợ tài chính, Cho thuê thiết bị).
- Số tiếp theo: **QT-55**.

**Ánh xạ QT đang hoạt động → nhóm module mới:**

| Nhóm QT | QT | Nhóm module mới |
|---|---|---|
| 5A Xác thực & Khách hàng | QT-01, QT-24 | MOD-06 (QT-24); QT-01 là xác thực phiên người bán (HS-02) |
| 5B Sàn, Sản phẩm & Nhà bán hàng | QT-27, QT-28, QT-29, QT-53, QT-54 | MOD-09, MOD-10, MOD-08, MOD-17 |
| 5C Xúc tiến & Marketing | QT-30, QT-31, QT-36, QT-38, QT-39 | MOD-12, MOD-12, MOD-15, MOD-16, MOD-11 |
| 5D Mô hình hợp tác & Hậu cần | QT-32, QT-33, QT-34, QT-40, QT-41, QT-42 | MOD-08 (Dropship), MOD-13, MOD-19, MOD-20 |
| 5E Tài chính mở rộng & Đối soát | QT-35, QT-37, QT-43, QT-44 | MOD-14, MOD-06/MOD-14, MOD-20, MOD-18 |
| 5F Nền tảng, Tuân thủ & Cấu hình | QT-45, QT-46, QT-47, QT-48, QT-49, QT-50, QT-51, QT-52 | MOD-07, MOD-24, MOD-25, MOD-26, MOD-28, MOD-23, MOD-03, MOD-29 |

> ⚠️ **Xung đột cần chốt** (giữa bộ QT 2026-10-09 và bộ MOD 2026-10-06):
> - **QT-32 (F2B2B)** còn hoạt động nhưng **MOD-18 F2B2B đã bị loại bỏ**.
> - **QT-39 (Livestream bán hàng)** còn hoạt động nhưng **MOD-12 Quản lý Livestream đã bị loại bỏ**.
> - **QT-54 (E-Menu & Đặt món tại bàn)** chưa có module ERP nào đứng tên.
> - **QT-31 (Mua chung)** và **QT-33 (Dropship)** ánh xạ vào module đã gộp (MOD-16, MOD-35) — cần xác nhận là "tính năng con" hay tách lại.

> **Cần chủ dự án chốt:** "xây dựng lại quy trình tương ứng cho phù hợp" nghĩa là:
> **(a)** Chỉ cập nhật tham chiếu `MOD-nn` bên trong các QT (giữ nguyên 30 QT, giữ số QT); hay
> **(b)** Đánh số lại QT theo cùng thứ tự nhóm module mới (QT-01 → app 1, …) — phá vỡ truy vết MD_ERP, phải ghi bảng lịch sử đánh số; hay
> **(c)** Viết lại **nội dung** 30 QT theo cấu trúc app mới (mỗi app = một nhóm quy trình), gộp/loại các QT trùng module đã gộp.
> Ba cách cho khối lượng và rủi ro rất khác nhau. Đề xuất của tôi: **(a) trước** (rẻ, an toàn, giữ truy vết), rồi xử lý 4 xung đột trên, sau đó mới cân nhắc (c).

---

## 4. Việc cần chủ dự án xác nhận (trước khi thực thi)

1. **Hiểu đúng chưa?** Tên và mô tả chức năng 29 app ở §2 có đúng ý anh không?
2. **Đánh số lại (§1):** đồng ý scheme "Vỏ Portal 01–03, rồi Nhóm 1→5 liên tục 04–29" chưa? Có muốn giữ 3 module shell ở 01–03 không, hay đánh cả shell theo nhóm?
3. **Thứ tự trong nhóm:** thứ tự Kinh doanh hiện xếp theo cổng 3201–3215 (CRM → CSKH → Seller → Đơn hàng → PIM → …). Giữ hay đổi?
4. **Quy trình (§3):** chọn cách (a)/(b)/(c) — đề xuất làm (a) trước.
5. **Truy vết:** đồng ý giữ mã cũ của 15 module lưu trữ và ghi bảng đối chiếu cũ→mới chứ?
6. **4 xung đột QT ↔ MOD (§3):** QT-32 (F2B2B) và QT-39 (Livestream) còn hoạt động nhưng MOD-18 và MOD-12 đã bị loại bỏ — giữ QT hay hủy QT? QT-54 (E-Menu) chưa có app đứng tên — gán vào MOD-17 hay tách app mới?

## 5. Chưa xác minh được

- Vài app mô tả theo nhãn giao diện trích tự động (mục §3 của tệp MOD), chưa đối chiếu từng tính năng với mã nguồn.
- MOD-04 (Kế toán) và MOD-13 (Hub) chưa trích được "Khối giao diện" (mục §3 trống) — mô tả dựa trên mục tiêu.
- **Ánh xạ QT ↔ app chỉ ở mức nhóm**, chưa đối chiếu từng quy trình ↔ từng màn hình; bảng §3 là suy luận theo tên, chưa đọc hết nội dung 30 QT.
- **Xung đột QT-32/QT-39/QT-54** (§3) chưa có nguồn nào phân xử — cần chủ dự án quyết.
- Chưa xác minh `_Tam_huy/` có bao nhiêu tệp QT (đếm thô 46 tệp, gồm cả tài liệu không phải QT).
