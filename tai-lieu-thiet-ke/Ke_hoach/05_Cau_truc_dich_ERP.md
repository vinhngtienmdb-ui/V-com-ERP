# 05 — Cấu trúc đích ERP sau chốt của chủ dự án (2026-10-06)

- **Mã**: KH-05 (cấu trúc đích + đánh số MOD lần cuối)
- **Trạng thái**: 🟡 Chờ chủ dự án xác nhận lần cuối trước khi thực thi đổi tên tệp
- **Ngày soạn**: 2026-10-06
- **Nguồn**: KH-04 (§1 đề xuất đánh số, §3 ánh xạ QT), `Quy_trinh_nghiep_vu/index.md`, `Ke_hoach/00_INDEX.md`
- **Quan hệ**: **thay thế bảng đánh số ở KH-04 §1**. KH-04 giữ nguyên làm bản đề xuất để truy vết.
- **Phạm vi**: ghi lại 8 quyết định của chủ dự án ngày 2026-10-06 và cấu trúc đích rút ra (**26 app**). **Chưa đổi tên tệp, chưa sửa mã nguồn.**

> Mục đích: chốt cấu trúc cuối để làm cơ sở thực thi hai việc còn lại — (1) đổi tên/đánh số lại tệp MOD, (2) xây lại quy trình QT tương ứng.

---

## 1. Tám quyết định của chủ dự án (2026-10-06)

| # | Quyết định | Ảnh hưởng |
|---|---|---|
| **Q1** | QT-32 (F2B2B) → **loại bỏ** | Lưu trữ QT-32; MOD-18 F2B2B đã loại bỏ từ 2026-10-06 |
| **Q2** | QT-39 (Livestream bán hàng) → **loại bỏ** | Lưu trữ QT-39; MOD-12 Quản lý Livestream đã loại bỏ |
| **Q3** | QT-54 (E-Menu & Đặt món tại bàn) → **tích hợp vào iPOS** | Rời ERP; thuộc HS-04 VComm iPOS |
| **Q4** | QT-31 (Mua chung) và QT-33 (Dropship) → **tính năng con** | Không phải app riêng; nằm trong app Khuyến mại và app Nhà bán hàng |
| **Q5** | Gộp **MOD-01/02/03** (Trang chủ, Bảng điều khiển, Phân tích dữ liệu) → một **"Dashboard"** | 3 → 1 |
| **Q6** | **Nhóm 2 Nhân sự tách thành 2 cổng**: cổng Phòng Nhân sự + cổng Tự phục vụ Nhân viên | 1 → 2 |
| **Q7** | **MOD-26 đổi tên** → **"Quản lý chữ ký số"** | Đổi tên (trước là "Trung tâm Ký số") |
| **Q8** | Gộp **MOD-21** (Điều hành & Workflow) và **MOD-27** (Không gian làm việc) **vào Dashboard của Vỏ Portal** → Dashboard riêng từng cá nhân | 2 → 0 (nhập vào Portal) |

**Ghi chú về số hiệu:** các mã ở cột "Quyết định" là **số của KH-04 bản đề xuất (v1)** — vì chủ dự án đã dùng chính các mã này khi ra quyết định. Sau khi áp dụng Q1–Q8, cấu trúc nhóm thay đổi nên **toàn bộ được đánh số lại** ở §2 (bản v2). Bảng truy vết v1 → v2 ở §3.

---

## 2. Cấu trúc đích — 26 app (đánh số v2, liên tục theo nhóm)

**Nguyên tắc:** Vỏ Portal giữ 01; rồi Nhóm 1→5 liên tục; đánh số trùng thứ tự cổng.

### Vỏ Portal (shell) — cổng 3000 — 1 app

| Mã | App | Tuyến đường | Gộp từ (v1) |
|---|---|---|---|
| **MOD-01** | Dashboard (cá nhân) | `/dashboard` | v1-01 Trang chủ + v1-02 Bảng điều khiển + v1-03 Phân tích dữ liệu + v1-21 Điều hành & Workflow + v1-27 Không gian làm việc |

> Dashboard là **trang riêng của từng cá nhân**: việc của tôi, luồng chờ tôi xử lý, bảng tin/không gian làm việc, chỉ số & BI. Vỏ Portal **không còn app nào khác** — shell chính là Dashboard.

### Nhóm 1 — Kế toán — cổng 3101 — 1 app

| Mã | App | Tuyến đường | Gộp từ (v1) |
|---|---|---|---|
| **MOD-02** | Kế toán TT99/2025 | `/ke-toan-tt99` | v1-04 |

### Nhóm 2 — Nhân sự — cổng 3102–3103 — 2 app

| Mã | App | Tuyến đường | Cổng | Ghi chú |
|---|---|---|---|---|
| **MOD-03** | Cổng Phòng Nhân sự (HR Portal) | `/hr` | 3102 | Tách từ v1-05 HRM |
| **MOD-04** | Cổng Tự phục vụ Nhân viên (ESS Portal) | `/ess` | 3103 | Tách từ v1-05 HRM |

> Chủ dự án liệt kê các mảng: *Quản lý thông tin nhân sự, Nghỉ phép, Hồ sơ nhân sự, BHXH, Thuế TNCN…*. Phân bổ đề xuất (chờ xác nhận — xem §5):
> - **MOD-03 (Phòng Nhân sự):** Quản lý thông tin nhân sự, Hồ sơ nhân sự, BHXH, Thuế TNCN, tuyển dụng, hợp đồng lao động, chấm công, tính lương, KPI/OKR, đào tạo, khen thưởng–kỷ luật.
> - **MOD-04 (Tự phục vụ Nhân viên):** Nghỉ phép (đăng ký/xem), phiếu lương cá nhân, thông tin cá nhân, chấm công cá nhân, yêu cầu nội bộ.

### Nhóm 3 — Kinh doanh — cổng 3201–3215 — 15 app

| Mã | App | Tuyến đường | Cổng | Gộp từ (v1) |
|---|---|---|---|---|
| **MOD-05** | Khách hàng (CRM) | `/customers` | 3201 | v1-06 |
| **MOD-06** | Chăm sóc Khách hàng | `/cskh` | 3202 | v1-07 |
| **MOD-07** | Nhà bán hàng | `/sellers` | 3203 | v1-08 (+ Dropship, Q4) |
| **MOD-08** | Quản lý Đơn hàng | `/orders` | 3204 | v1-09 |
| **MOD-09** | Quản lý sản phẩm (PIM) | `/pim` | 3205 | v1-10 |
| **MOD-10** | Social | `/social` | 3206 | v1-11 |
| **MOD-11** | Quản lý khuyến mại | `/flash-sale` | 3207 | v1-12 (+ Mua chung, Q4) |
| **MOD-12** | VComm Hub (O2O) | `/vcomm-hub` | 3208 | v1-13 |
| **MOD-13** | V-Xu | `/vxu` | 3209 | v1-14 |
| **MOD-14** | KOL/KOC & Affiliate | `/affiliate` | 3210 | v1-15 |
| **MOD-15** | Quản lý Quảng cáo (Ads) | `/ads` | 3211 | v1-16 |
| **MOD-16** | Siêu thị VComm (Offline) | `/vcomm-supermarket` | 3212 | v1-17 |
| **MOD-17** | Ví & Thanh toán | `/wallet` | 3213 | v1-18 |
| **MOD-18** | Kho vận & Logistics | `/warehouse` | 3214 | v1-19 |
| **MOD-19** | Mua hàng, NCC & Đối soát | `/scm` | 3215 | v1-20 |

### Nhóm 4 — Văn phòng — cổng 3301–3305 — 5 app

| Mã | App | Tuyến đường | Cổng | Gộp từ (v1) |
|---|---|---|---|---|
| **MOD-20** | Quản lý Công việc | `/tasks` | 3301 | v1-22 |
| **MOD-21** | Đề xuất & Trình ký | `/requests` | 3302 | v1-23 |
| **MOD-22** | Hợp đồng & Pháp chế | `/contracts` | 3303 | v1-24 |
| **MOD-23** | Quản lý Công văn | `/documents` | 3304 | v1-25 |
| **MOD-24** | **Quản lý chữ ký số** | `/signature` | 3305 | v1-26 (**đổi tên**, Q7) |

> v1-21 (Điều hành & Workflow) và v1-27 (Không gian làm việc) đã nhập vào MOD-01 (Q8) — không còn ở Nhóm 4.

### Nhóm 5 — Chia sẻ & Nền tảng — cổng 3401–3402 — 2 app

| Mã | App | Tuyến đường | Cổng | Gộp từ (v1) |
|---|---|---|---|---|
| **MOD-25** | Tuân thủ & Pháp chế | `/compliance` | 3401 | v1-28 |
| **MOD-26** | Cấu hình hệ thống | `/settings` | 3402 | v1-29 |

**Tổng: 1 + 1 + 2 + 15 + 5 + 2 = 26 app.**

---

## 3. Truy vết 3 lớp (mã gốc 44 → KH-04 v1 → v2)

| Mã gốc | Tên gốc | KH-04 v1 | v2 | Ghi chú |
|---|---|---|---|---|
| MOD-01 | Trang chủ | 01 | **01** | Nhập vào Dashboard |
| MOD-02 | Bảng điều khiển | 02 | **01** | Nhập vào Dashboard |
| MOD-03 | Phân tích dữ liệu | 03 | **01** | Nhập vào Dashboard |
| MOD-04 | Điều hành & Workflow | 21 | **01** | Nhập vào Dashboard (Q8) |
| MOD-43 | Không gian làm việc | 27 | **01** | Nhập vào Dashboard (Q8) |
| MOD-30 | Kế toán TT99/2025 | 04 | **02** | |
| MOD-39 | Quản trị Nhân sự (HRM) | 05 | **03 + 04** | Tách 2 cổng (Q6) |
| MOD-36 | Khách hàng (CRM) | 06 | **05** | |
| MOD-37 | Chăm sóc Khách hàng | 07 | **06** | |
| MOD-35 | Nhà bán hàng | 08 | **07** | + Dropship (tính năng con) |
| MOD-11 | Quản lý Đơn hàng | 09 | **08** | |
| MOD-14 | Quản lý sản phẩm | 10 | **09** | |
| MOD-15 | Social | 11 | **10** | |
| MOD-16 | Quản lý khuyến mại | 12 | **11** | + Mua chung (tính năng con) |
| MOD-20 | VComm Hub (O2O) | 13 | **12** | |
| MOD-21 | V-Xu | 14 | **13** | |
| MOD-22 | KOL/KOC & Affiliate | 15 | **14** | |
| MOD-24 | Quản lý Quảng cáo (Ads) | 16 | **15** | |
| MOD-10 | Siêu thị VComm (Offline) | 17 | **16** | |
| MOD-32 | Ví & Thanh toán | 18 | **17** | |
| MOD-25 | Kho vận & Logistics | 19 | **18** | |
| MOD-27 | Mua hàng, NCC & Đối soát | 20 | **19** | |
| MOD-05 | Quản lý Công việc | 22 | **20** | |
| MOD-06 | Đề xuất & Trình ký | 23 | **21** | |
| MOD-07 | Hợp đồng & Pháp chế | 24 | **22** | |
| MOD-08 | Quản lý Công văn | 25 | **23** | |
| MOD-09 | Trung tâm Ký số | 26 | **24** | **Đổi tên** → Quản lý chữ ký số |
| MOD-28 | Tuân thủ & Pháp chế | 28 | **25** | |
| MOD-44 | Cấu hình hệ thống | 29 | **26** | |

> ⚠️ **Cảnh báo truy vết:** vì đánh số lại lần hai, một mã v1 **đổi chủ** (ví dụ v1-05 HRM tách thành v2-03 + v2-04; v1-06 CRM → v2-05). Khi tra tài liệu cũ phải dùng bảng này.

**15 module lưu trữ `_Tam_huy/` — giữ nguyên mã gốc**, không đánh lại:
12, 13, 17, 18, 19, 23, 26, 29, 31, 38, 40, 41, 42 (13 mã ngày 2026-10-06) + 33, 34 (tạm hủy 2026-10-05).

---

## 4. Ánh xạ quy trình QT ↔ app sau chốt

**Trạng thái QT** (nguồn `Quy_trinh_nghiep_vu/index.md`, 2026-10-09): **30 QT đang hoạt động** (đều Nhóm 5) + **24 QT đã hợp nhất vào MD_ERP** (Nhóm 1–4) + **6 QT tạm hủy**. Số tiếp theo: **QT-55**.

### 4.1. QT đang hoạt động → app v2

| Nhóm QT | QT | App v2 |
|---|---|---|
| 5A Xác thực & Khách hàng | QT-01 | (xác thực phiên người bán — HS-02, không thuộc app ERP) |
| | QT-24 | MOD-05 Khách hàng (CRM) |
| 5B Sàn, Sản phẩm & Nhà bán hàng | QT-27 | MOD-08 Quản lý Đơn hàng |
| | QT-28 | MOD-09 PIM |
| | QT-29 | MOD-07 Nhà bán hàng |
| | QT-53 | MOD-16 Siêu thị Offline |
| | QT-54 | **→ iPOS (HS-04)** — rời ERP (Q3) |
| 5C Xúc tiến & Marketing | QT-30 | MOD-11 Quản lý khuyến mại |
| | QT-31 | MOD-11 — **tính năng con** Mua chung (Q4) |
| | QT-36 | MOD-14 KOL/KOC & Affiliate |
| | QT-38 | MOD-15 Quảng cáo (Ads) |
| | QT-39 | **Loại bỏ** (Q2) |
| 5D Mô hình hợp tác & Hậu cần | QT-32 | **Loại bỏ** (Q1) |
| | QT-33 | MOD-07 — **tính năng con** Dropship (Q4) |
| | QT-34 | MOD-12 VComm Hub (O2O) |
| | QT-40 | MOD-18 Kho vận |
| | QT-41 | MOD-18 Kho vận (Vận chuyển & Logistics) |
| | QT-42 | MOD-19 Mua hàng & NCC (SCM) |
| 5E Tài chính mở rộng & Đối soát | QT-35 | MOD-13 V-Xu |
| | QT-37 | MOD-05 / MOD-13 (Loyalty — lớp UI trên V-Xu) |
| | QT-43 | MOD-19 Đối soát & Công nợ |
| | QT-44 | MOD-17 Ví, Ký quỹ & Thanh toán |
| 5F Nền tảng, Tuân thủ & Cấu hình | QT-45 | MOD-06 Chăm sóc Khách hàng & Tổng đài |
| | QT-46 | MOD-22 Hợp đồng & Pháp chế |
| | QT-47 | MOD-23 Quản lý Công văn |
| | QT-48 | MOD-24 Quản lý chữ ký số |
| | QT-49 | MOD-25 Tuân thủ & Bảo vệ Thương hiệu |
| | QT-50 | MOD-21 Đề xuất & Trình ký |
| | QT-51 | MOD-01 Dashboard (Phân tích dữ liệu & BI) |
| | QT-52 | MOD-26 Cấu hình Hệ thống & Tích hợp |

### 4.2. Nhóm 1–4 (nguồn MD_ERP, không có QT riêng) → app v2

| Nhóm MD_ERP | Nội dung | App v2 |
|---|---|---|
| 1_accounting (11 đặc tả) | Kế toán | MOD-02 |
| 2_hrm (11 đặc tả) | Nhân sự | MOD-03 + MOD-04 |
| 3_crm (5 đặc tả) | CRM — chỉ giữ QT-24 viết lại theo TMĐT | MOD-05 |
| 4_office (2 đặc tả) | Văn phòng | MOD-20…MOD-24 |

### 4.3. Ba xung đột đã được chủ dự án giải quyết

| Xung đột | Trước | Chốt |
|---|---|---|
| QT-32 (F2B2B) còn hoạt động, MOD-18 đã loại bỏ | Mâu thuẫn | **Loại bỏ QT-32** (Q1) |
| QT-39 (Livestream) còn hoạt động, MOD-12 đã loại bỏ | Mâu thuẫn | **Loại bỏ QT-39** (Q2) |
| QT-54 (E-Menu) chưa có app ERP | Thiếu chủ | **Tích hợp vào iPOS** (Q3) |
| QT-31 / QT-33 ánh xạ vào module đã gộp | Mơ hồ | **Tính năng con** (Q4) |

> ⚠️ **Hệ quả cần chốt (cascading):** "loại bỏ" QT-32 và QT-39 theo quy ước dự án = **dời `_Tam_huy/`, bỏ tiền tố mã**. Nhưng mục lục QT đang theo hai quy ước trái nhau — tạm hủy thì **dồn số** (liền mạch), còn hợp nhất vào MD_ERP thì **không dồn số** (giữ mã nghỉ hưu). Vậy khi bỏ QT-32/QT-39: **có dồn số các QT sau không?** (xem §5, câu 3).

---

## 5. Việc cần chủ dự án xác nhận (trước khi thực thi)

1. **Cách đánh số:** đồng ý đánh số lại **v2** (Vỏ Portal 01 → Nhóm 1→5 liên tục 02–26) như §2 chưa? Hay muốn **giữ số v1** và để trống các mã đã gộp (v1-02, 03, 21, 27)?
2. **Q8 — hiểu đúng chưa?** Tôi hiểu "MOD-21 (Điều hành & Workflow) + MOD-27 (Không gian làm việc)" là **hai mã v1**, gộp vào Dashboard cá nhân. Nếu anh đang dùng số khác, xin chỉnh.
3. **Q5 — BI:** gộp cả "Phân tích dữ liệu (BI)" vào Dashboard cá nhân sẽ làm mất vai trò **công cụ phân tích toàn hệ** cho quản trị. Đồng ý gộp, hay tách BI thành màn hình riêng của quản trị?
4. **Q6 — phân bổ chức năng 2 cổng Nhân sự:** đồng ý cách chia ở §2 (Phòng Nhân sự = nghiệp vụ; Tự phục vụ = nghỉ phép, phiếu lương, thông tin cá nhân…) chưa?
5. **QT-32/QT-39:** có **dồn số** các QT còn lại không? (xem §4.3)
6. **QT-54:** dời hẳn sang phạm vi HS-04 iPOS (khỏi bộ QT ERP), hay giữ tệp trong `Quy_trinh_nghiep_vu/` nhưng ghi rõ "thuộc iPOS"?
7. **Thực thi:** xác nhận để tôi bắt đầu **đổi tên 26 tệp MOD + cập nhật mọi tham chiếu** và **lưu trữ QT-32/QT-39**.

## 6. Chưa xác minh được

- Cách chia chức năng giữa 2 cổng Nhân sự (§2) là **đề xuất của tôi**, chưa có nguồn nào trong dự án xác nhận.
- "Dashboard cho từng cá nhân" — chưa rõ có cần phân quyền theo vai trò/vị trí không, và BI toàn hệ có bị mất không (§5 câu 3).
- Chưa đối chiếu từng màn hình mã nguồn để xác nhận `WorkflowHub.tsx` và `Workspace.tsx` đủ nội dung cho một Dashboard cá nhân.
- Số phận 3 module tài liệu nói đã loại bỏ nhưng mã nguồn còn (`/live`, `/social`, `/sales`) vẫn chưa gỡ — nằm ngoài phạm vi tệp này (xem KH-03 §9, D6).
