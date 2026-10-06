# 03 — Kế hoạch tách source: Cổng Portal + 29 mini-app (S1–S7)

- **Mã**: KH-03 (kế hoạch kỹ thuật)
- **Trạng thái**: 🟡 Chờ duyệt — **chưa thực thi mã nguồn**
- **Ngày soạn**: 2026-10-06 (theo yêu cầu chủ dự án 2026-10-06)
- **Nguồn**: `Checklist_cong_viec.md` §2.5 (S1–S7) · `HS-01_VComm_ERP.md` §7, §8 · `00_INDEX.md` · `00_KE_HOACH_TONG_THE.md` §5
- **Phạm vi**: tài liệu hóa kế hoạch. Không sửa mã nguồn, không đổi cổng, không đổi hạ tầng cho tới khi chủ dự án duyệt.

> Nguyên tắc: "Con người quyết định, AI thực hiện". Mọi mục ở §6 cần chủ dự án chốt **trước** khi bắt đầu S1–S7.

---

## 1. Bối cảnh và mục tiêu

Theo yêu cầu chủ dự án ngày 2026-10-06, ERP chuyển thành **cổng Portal**: các chức năng trở thành **mini-app**, mỗi mini-app có giao diện và cổng riêng, kết nối dữ liệu với nhau qua **API server HS-02 (VComm Core Backend, cổng 5000)**. Tài liệu đã được tái cấu trúc (Portal + 6 nhóm mini-app, 29 module — việc #168–#173). Kế hoạch này là **bước kỹ thuật theo sau**: tách mã nguồn monolith hiện tại thành vỏ Portal + các mini-app.

Mục tiêu đo lường được:
1. Vỏ Portal (shell) chỉ còn 3 module: MOD-01 Trang chủ, MOD-02 Bảng điều khiển, MOD-03 Phân tích dữ liệu.
2. 29 module hoạt động trở thành 29 mini-app độc lập, mỗi app một cổng riêng.
3. Mọi mini-app truy cập dữ liệu **qua HS-02**, không truy cập cơ sở dữ liệu trực tiếp.
4. Đăng nhập một lần (SSO), menu động dẫn tới từng mini-app theo cổng.

---

## 2. Hiện trạng đã xác minh (bằng chứng)

| Hạng mục | Thực tế | Bằng chứng |
|---|---|---|
| HS-01 VComm ERP | Monolith hợp nhất: một tiến trình Node chạy cả API (Express `server.ts`) và render giao diện (Vite SSR); không microservice, không message broker | `09_Kien_truc_he_thong.md:12` |
| HS-02 VComm Core Backend | **Đã tồn tại** — NestJS, "Enterprise Core Backend API for VComm Ecosystem (ERP, eCommerce, iPOS, Seller Portal)", dùng `passport-jwt`; cổng mặc định **5000** | `D:/VComm/vcomm-core-backend/package.json`; `vcomm-core-backend/src/main.ts:82` (`process.env.PORT || 5000`) |
| Định tuyến giao diện ERP | `react-router-dom` (`BrowserRouter`, `Routes`, `Route`) + lazy-load từng component | `vcomm-erp/src/App.tsx:2`, `:11–29` |
| Số component giao diện | 95 tệp `.tsx` trong `vcomm-erp/src/components/` | `find` đếm 2026-10-06 |
| Menu điều hướng | `navGroups` trong `vcomm-erp/src/constants.ts:41` — **42 mục `path`** | `grep -c "path: '"` = 42 |
| Xác thực người bán | Đã có `src/lib/sellerAuth.ts` (HMAC `node:crypto`) + guard `/api/seller/*` | `Checklist_cong_viec.md:39,111` (commit `c384e46`) |
| Multi-tenant / RLS | Đã siết `domain_events`; còn nợ M2.1 (JWT mang claim `tenant_id`) | `Checklist_cong_viec.md:40` |

---

## 3. Lệch mã nguồn ↔ tài liệu (phát hiện 2026-10-06) — phải xử lý trước khi tách

Đây là **phát hiện quan trọng nhất** và là lý do bắt buộc có bước S0 (§5). Bản đồ "29 module" trong tài liệu **chưa khớp mã nguồn thật**:

1. **Mã nguồn chưa giảm về 29.** `src/constants.ts` (navGroups) vẫn còn **42 mục menu**, không phải 29. Tài liệu `00_KE_HOACH_TONG_THE.md:184` từng ghi "29 theo menu điều hướng thật (`src/constants.ts`)" — **đã sửa** thành "29 là mục tiêu tài liệu".
2. **3 module tài liệu nói đã loại bỏ vẫn còn trong mã nguồn**: `/live` (MOD-12 Livestream), `/social` (MOD-13 Mạng xã hội), `/sales` (MOD-38 Đội ngũ Kinh doanh) — có trong `constants.ts` và được nối ở `App.tsx` (`LiveCommerce`, `SocialCommerce`, `Sales`).
3. **4 module tài liệu nói đang hoạt động nhưng KHÔNG có trong mã nguồn**: MOD-30 Kế toán (`/ke-toan-tt99`, `TT99Accounting.tsx`), MOD-05 Công việc (`/tasks`, `TasksPage.tsx`), MOD-20 Hub O2O (`/vcomm-hub`, `VCommHub.tsx`), MOD-21 V-Xu (`/vxu`, `VXu.tsx`). Cả tuyến đường lẫn tệp component đều không tồn tại trong `vcomm-erp/src`.
4. **Cột "Dòng" và con số 41.922 là ảnh chụp lỗi thời**: chỉ **25/29** tệp giao diện còn tồn tại tại đường dẫn đã ghi; tổng thực tế **36.876 dòng**; 4 tệp nêu ở mục 3 không còn (chi tiết tại `00_KE_HOACH_TONG_THE.md` §5, ghi chú "Cập nhật 2026-10-06").

**Hệ quả**: không thể tách 29 mini-app theo bản đồ tài liệu khi bản đồ đó chưa đối chiếu được với mã nguồn. S0 phải làm rõ từng điểm trên.

> Giả thuyết cần kiểm chứng (chưa kết luận): MOD-20 "Hub O2O" và MOD-21 "V-Xu" có thể nằm ở project khác (HS-07 `vcomm-nexthub`, hoặc ví nằm ở HS-02), không phải trong ERP; MOD-30 "Kế toán" có thể đang là `Finance.tsx` (tồn tại) chứ không phải `TT99Accounting.tsx`. **Chưa xác minh.**

---

## 4. Kiến trúc đích

```
┌──────────────────────────── Vỏ Portal (shell) — cổng 3000 ────────────────────────────┐
│  MOD-01 Trang chủ   ·   MOD-02 Bảng điều khiển   ·   MOD-03 Phân tích dữ liệu          │
│  + Gateway/SSO: đăng nhập một lần, menu động dẫn tới mini-app theo cổng                │
└───────────────┬────────────────────────────────────────────────────────────────────────┘
                │  mọi lời gọi dữ liệu (REST/JSON)
                ▼
      ┌──────────────────────────────────────────┐
      │  HS-02 VComm Core Backend (NestJS :5000)  │  ← nguồn dữ liệu duy nhất
      │  Auth (JWT + tenant_id) · RLS · domain    │
      └───────────────┬──────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
  Mini-app nhóm Kế toán/Nhân sự   Mini-app nhóm Kinh doanh/Văn phòng/Chia sẻ
  (cổng 3101–3102)                (cổng 3201–3215, 3301–3307, 3401–3402)
  29 mini-app · mỗi app 1 tiến trình + 1 cổng · KHÔNG truy cập DB trực tiếp
```

Nguyên tắc kiến trúc:
- **Một nguồn dữ liệu duy nhất**: mọi mini-app gọi HS-02; không app nào mở kết nối Supabase/PostgreSQL trực tiếp.
- **SSO ở Portal**: Portal phát token; mini-app xác thực token qua HS-02 (JWT mang `tenant_id`).
- **Menu động**: Portal đọc danh mục mini-app + cổng từ cấu hình, không hard-code.
- **Vỏ mỏng**: shell chỉ giữ 3 module + khung điều hướng + design system dùng chung.

---

## 5. Phân rã công việc

### S0 — Đối chiếu mã nguồn ↔ tài liệu (mới, bắt buộc trước S1)

- **Mục tiêu**: chốt bản đồ 29 module khớp mã nguồn thật; giải quyết §3.
- **Việc**: (a) liệt kê đủ 42 mục `navGroups` và đối chiếu với 44 mã MOD; (b) truy tìm 4 module "mất" (MOD-30/05/20/21) — chúng ở project nào, tên component thật là gì; (c) xác nhận 3 module "đã loại bỏ" (MOD-12/13/38) có gỡ khỏi mã nguồn hay không; (d) đo lại số dòng giao diện thực tế cho 29 module.
- **Đầu ra**: bảng đối chiếu `MOD-nn ↔ tuyến đường ↔ component ↔ cổng`, có cột "chưa xác minh".
- **Nghiệm thu**: 29/29 module có đúng 1 tuyến đường và 1 component thật, hoặc ghi rõ "không tồn tại".

### S1 — Tách vỏ Portal

- **Mục tiêu**: `vcomm-erp` trở thành shell (cổng 3000) chỉ còn MOD-01/02/03.
- **Việc**: gỡ 29 module khỏi `App.tsx`/`constants.ts`; giữ khung điều hướng + design system; thay nội dung module bằng liên kết sang mini-app.
- **Phụ thuộc**: S0, S3 (menu động), S2 (mini-app đã tồn tại để dẫn tới).
- **Nghiệm thu**: shell chỉ còn 3 tuyến đường nội bộ; không còn import component của 29 module.

### S2 — Tạo 29 mini-app

- **Mục tiêu**: 29 ứng dụng độc lập, mỗi app một cổng (3101–3402), bootstrap từ template chung.
- **Việc**: chọn đơn vị tách (monorepo workspaces hay repo riêng — §6 D1); tạo template (Vite + React + Tailwind + client HS-02); di chuyển từng component vào app tương ứng.
- **Phụ thuộc**: S0, S4 (client dữ liệu chung).
- **Nghiệm thu**: 29 app khởi động được ở cổng riêng, hiển thị đúng module, gọi dữ liệu qua HS-02.

### S3 — Gateway / SSO Portal

- **Mục tiêu**: đăng nhập một lần; menu động dẫn tới mini-app theo cổng.
- **Việc**: phát token ở Portal; mini-app xác thực token qua HS-02; danh mục mini-app (mã, tên, cổng, nhóm) đọc từ cấu hình.
- **Phụ thuộc**: S4/S5 (auth + tenant).
- **Nghiệm thu**: đăng nhập ở Portal → vào mini-app không phải đăng nhập lại; menu dựng từ cấu hình.

### S4 — Chuẩn hóa giao tiếp qua HS-02

- **Mục tiêu**: mọi mini-app gọi chung HS-02; không truy cập DB trực tiếp.
- **Việc**: liệt kê API hiện có của HS-02; bổ sung API còn thiếu cho 29 module; thay `dbService.ts`/`supabase-js` trong ERP bằng client HS-02; chuẩn hóa báo lỗi + validation (liên quan M6).
- **Phụ thuộc**: S0.
- **Rủi ro**: đây là thay đổi lớn — ERP hiện gọi Supabase trực tiếp; chuyển hết sang HS-02 cần HS-02 phủ đủ nghiệp vụ.
- **Nghiệm thu**: không còn lời gọi Supabase trực tiếp trong mã mini-app; 100% qua HS-02.

### S5 — Chia sẻ dữ liệu và auth đa tenant

- **Mục tiêu**: `tenant_id` xuyên suốt các mini-app qua HS-02.
- **Việc**: JWT mang claim `tenant_id` (gỡ nợ M2.1); áp RLS nhất quán; phiên người bán (`sellerAuth`) mở rộng cho mô hình nhiều app.
- **Phụ thuộc**: S4.
- **Nghiệm thu**: mỗi mini-app chỉ thấy dữ liệu đúng tenant; có kiểm thử chứng minh cách ly.

### S6 — CI/CD và deploy độc lập

- **Mục tiêu**: build/deploy từng mini-app riêng.
- **Việc**: Dockerfile mỗi app; cấu hình cổng; pipeline độc lập; phiên bản hóa.
- **Phụ thuộc**: S2.
- **Nghiệm thu**: một mini-app deploy/rollback độc lập không ảnh hưởng app khác.

### S7 — Chốt ranh giới ERP ↔ eCommerce / Hub / iPOS

- **Mục tiêu**: tránh trùng chức năng (đơn hàng, sản phẩm) giữa các hệ thống con trước khi tách.
- **Việc**: xác định hệ thống nào **sở hữu** đơn hàng, sản phẩm, tồn kho, khách hàng; ghi rõ ai đọc/ai ghi.
- **Phụ thuộc**: không (nên làm sớm, song song S0).
- **Nghiệm thu**: bảng ranh giới trách nhiệm có chủ dự án duyệt.

---

## 6. Quyết định cần chủ dự án chốt (chặn thực thi)

| Mã | Quyết định | Ảnh hưởng |
|---|---|---|
| D1 | Đơn vị tách: **monorepo (workspaces)** hay **repo riêng** cho 29 mini-app? | S2, S6 |
| D2 | Cổng thật cho 29 mini-app (3101–3402 hiện là **giả định**) | S1, S2, S3, S6 |
| D3 | Ranh giới vỏ Portal ↔ mini-app: chia sẻ design system/component/auth thế nào? | S1, S2 |
| D4 | HS-02 đã sẵn sàng làm **cổng dữ liệu duy nhất** chưa? ERP hiện gọi Supabase trực tiếp — chuyển hết sang HS-02? | S4 (lớn) |
| D5 | 4 module "mất" (MOD-30/05/20/21): ở đâu / tên thật là gì / có xây không? | S0, S2 |
| D6 | 3 module "đã loại bỏ" (MOD-12/13/38): có **gỡ thật** khỏi mã nguồn không? | S0, S1 |
| D7 | Auth đa tenant: dùng JWT HS-02 (`passport-jwt`) + claim `tenant_id`? | S3, S5 |
| D8 | S7: hệ thống nào **sở hữu** đơn hàng/sản phẩm/tồn kho giữa ERP ↔ eCommerce ↔ Hub ↔ iPOS? | S7 |

---

## 7. Thứ tự đề xuất và phụ thuộc

```
S0 (đối chiếu) ─┬─► S7 (ranh giới)
                ├─► S4 (HS-02 data layer) ─► S5 (tenant/auth) ─► S3 (SSO)
                └─► S2 (mini-app) ─┬─► S1 (shell)
                                   └─► S6 (CI/CD)
```

Đề xuất: **S0 + S7 trước** (làm rõ sự thật, chốt ranh giới) → **S4/S5/S3** (nền dữ liệu + xác thực) → **S2** (tách app) → **S1** (dọn shell) → **S6** (vận hành).

---

## 8. Chưa xác minh được

- Cổng thật của 29 mini-app — 3101–3402 chỉ là **giả định**.
- Vị trí và tên thật của 4 module MOD-30/05/20/21 trong mã nguồn.
- HS-02 có phủ đủ API cho cả 29 module hay không (chưa liệt kê hết route của `vcomm-core-backend`).
- 3 module MOD-12/13/38 có thực sự sẽ bị gỡ khỏi mã nguồn hay không.
- Số dòng giao diện thực tế của 29 module (cột "Dòng" tài liệu đã lỗi thời — xem `00_KE_HOACH_TONG_THE.md` §5).
- Ranh giới ERP ↔ eCommerce/Hub/iPOS (chờ D8).

## 9. Ngoài phạm vi

- Không sửa mã nguồn trong kế hoạch này.
- Không đổi cổng/hạ tầng production.
- Việc hợp nhất hay gỡ module trong mã nguồn chỉ thực hiện sau khi chủ dự án duyệt §6.
