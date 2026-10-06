# 03 — Kế hoạch tách source: Cổng Portal + 29 mini-app (S1–S7)

- **Mã**: KH-03 (kế hoạch kỹ thuật)
- **Trạng thái**: 🟡 Chờ duyệt — **chưa thực thi mã nguồn**
- **Ngày soạn**: 2026-10-06 (cập nhật lần 2 cùng ngày, sau khi chủ dự án chốt D1–D8)
- **Nguồn**: `Checklist_cong_viec.md` §2.5 · `HS-01_VComm_ERP.md` §7, §8 · `00_INDEX.md` · `00_KE_HOACH_TONG_THE.md` §5 · `Quy_trinh_nghiep_vu/Phan_tich_chong_cheo_iPOS_Hub_MuaChung_VXu.md`
- **Phạm vi**: tài liệu hóa kế hoạch. Không sửa mã nguồn cho tới khi chủ dự án duyệt.

> Nguyên tắc: "Con người quyết định, AI thực hiện". D1–D6 đã chốt; D7–D8 là đề xuất chờ chốt.

---

## 1. Bối cảnh và mục tiêu

Theo yêu cầu chủ dự án ngày 2026-10-06, ERP chuyển thành **cổng Portal**: các chức năng trở thành **mini-app**, mỗi mini-app có giao diện và cổng riêng, kết nối dữ liệu qua **API server HS-02 (VComm Core Backend, cổng 5000)**. Kế hoạch này là bước kỹ thuật theo sau.

Mục tiêu đo lường được:
1. Vỏ Portal (shell) chỉ còn 3 module: MOD-01 Trang chủ, MOD-02 Bảng điều khiển, MOD-03 Phân tích dữ liệu.
2. 26 module còn lại (29 hoạt động trừ 3 ở shell) thành mini-app độc lập, mỗi app một cổng riêng.
3. Mọi mini-app truy cập dữ liệu **qua HS-02**, không truy cập cơ sở dữ liệu trực tiếp.
4. Đăng nhập một lần (SSO), menu động dẫn tới từng mini-app theo cổng.

---

## 2. Hiện trạng đã xác minh (bằng chứng)

| Hạng mục | Thực tế | Bằng chứng |
|---|---|---|
| **Nguồn chuẩn** | `_recovery_V-com-ERP` (nhánh `main`, commit nguồn `52a822e` ngày 2026-10-06) — repo có version (origin/main) và là nguồn tài liệu bám theo | `git log` |
| **Bản ERP cũ (không chuẩn)** | `D:/VComm/vcomm-erp` (nhánh `feat/digital-signature-upgrade`, HEAD `534dfff` ngày 2026-09-24, **thiếu** bản vá M1 `c384e46`/M2 `4b9cd56`); cấu trúc component khác (thư mục `accounting/`, các tệp `Task*`) | `git log`; đối chiếu cây component |
| HS-01 VComm ERP | Monolith: một tiến trình Node chạy cả API (Express `server.ts`) và render giao diện (Vite SSR); không microservice, không message broker | `09_Kien_truc_he_thong.md:12` |
| HS-02 VComm Core Backend | **Đã tồn tại, đầy đủ** — NestJS, cổng **5000**, tiền tố `/api/v1/`, Swagger. Module: `auth, catalog, crm, gateway, hr, integrations, inventory, orders, payments, seller, wallets` | `vcomm-core-backend/src/modules/`; `main.ts:82` |
| Xác thực HS-02 | JWT Bearer; `JwtAuthGuard` verify `JWT_SECRET`; `auth.service` ký payload **`{ id, role }`** (access 1h, refresh 30d) — **CHƯA có claim `tenant_id`** | `common/guards/jwt-auth.guard.ts`; `modules/auth/auth.service.ts:109-117` |
| ERP → HS-02 | **Chưa nối**: không có tham chiếu `:5000`/`core-backend` trong `src/lib`, `src/services`, `src/routes`; ERP gọi Supabase trực tiếp (`dbService.ts`) | grep |
| Số component giao diện | 29/29 tệp của bản đồ module **tồn tại**; tổng **41.892 dòng** (khớp 41.922, lệch 30 dòng) | đo trên `_recovery_V-com-ERP/src/components` |
| Menu điều hướng | `navGroups` = **42 mục `path`** (chưa giảm về 29) | `src/constants.ts` |
| Xác thực người bán (ERP) | Đã có `src/lib/sellerAuth.ts` (HMAC) + guard `/api/seller/*` | `Checklist_cong_viec.md:39,111` |

---

## 3. Quyết định đã chốt (D1–D8)

| Mã | Quyết định | Chủ dự án chốt | Ghi chú triển khai |
|---|---|---|---|
| D1 | Đơn vị tách | **Monorepo (workspaces)** | 29 mini-app trong một monorepo, dùng npm/pnpm workspaces |
| D2 | Cổng mini-app | **Cổng thật** | Chốt phân bổ chính thức tại §6 (3101–3402) |
| D3 | Ranh giới shell ↔ mini-app | **Dùng chung giao diện + CSDL** | Chia sẻ design system/component; chung một CSDL (HS-08) qua HS-02 |
| D4 | HS-02 là cổng dữ liệu | **Duy nhất** | Mọi mini-app gọi HS-02; bỏ truy cập Supabase trực tiếp |
| D5 | 4 module "mất" | **Rà soát lại kế hoạch** | **Đã rà: KHÔNG mất** — xem §3.1 |
| D6 | 3 module loại bỏ còn trong code | **Tạm cách ly** | Cơ chế tại §9 (không xóa) |
| D7 | Ranh giới sở hữu ERP ↔ eCommerce/Hub/iPOS | **Đề xuất** | Ma trận tại §7 (chờ chốt) |
| D8 | Auth đa tenant | **Đề xuất** | Thiết kế tại §8 (chờ chốt) |

### 3.1. Kết quả rà soát D5 — 4 module KHÔNG hề mất

Rà trên **nguồn chuẩn** `_recovery_V-com-ERP/src/components/`:

| Module | Tuyến đường | Tệp thật | Dòng |
|---|---|---|---|
| MOD-30 Kế toán (TT99) | `/ke-toan-tt99` | `TT99Accounting.tsx` (+ thư mục `accounting/`) | 2306 |
| MOD-05 Quản lý Công việc | `/tasks` | `TasksPage.tsx` | 214 |
| MOD-20 VComm Hub (O2O) | `/vcomm-hub` | `VCommHub.tsx` (+ `services/vcommHubService.ts`, `services/hubService.ts`) | 684 |
| MOD-21 V-Xu | `/vxu` | `VXu.tsx` (+ `services/vxuService.ts`) | 546 |

Cả 4 đều có trong `navGroups` và được nối ở `App.tsx`. **Kết luận: bản đồ 29 module của kế hoạch tổng thể là ĐÚNG.**

> ⚠️ **Vấn đề thật cần chốt (không phải 4 module "mất"):** có **hai cây mã nguồn ERP song song** — nguồn chuẩn `_recovery_V-com-ERP` (`main`, 2026-10-06) và bản cũ `D:/VComm/vcomm-erp` (`feat/digital-signature-upgrade`, 2026-09-24). Hai bản **khác cấu trúc component** và bản cũ **thiếu bản vá bảo mật M1/M2**. Cần chủ dự án xác nhận **nguồn chuẩn để tách là `_recovery_V-com-ERP`** và xử lý bản cũ (dừng dùng / đồng bộ / xóa). Việc này chặn S0.

---

## 4. Kiến trúc đích

```
┌──────────────────── Vỏ Portal (shell) — cổng 3000 ────────────────────┐
│  MOD-01 Trang chủ · MOD-02 Bảng điều khiển · MOD-03 Phân tích dữ liệu   │
│  + Gateway/SSO: đăng nhập một lần, menu động dẫn tới mini-app theo cổng │
│  + Design system dùng chung (D3)                                        │
└───────────────┬─────────────────────────────────────────────────────────┘
                │  mọi lời gọi dữ liệu: REST/JSON + Bearer JWT (tenant_id)
                ▼
   ┌───────────────────────────────────────────────┐
   │ HS-02 VComm Core Backend (NestJS :5000)         │ ← cổng dữ liệu DUY NHẤT (D4)
   │ modules: auth·catalog·crm·hr·inventory·orders   │
   │          payments·wallets·seller·gateway·integ. │
   │ Auth JWT (thêm claim tenant_id) · RLS           │
   └───────────────┬─────────────────────────────────┘
                   │
   ┌───────────────┴─────────────────────────────┐
   ▼                                             ▼
26 mini-app (nhóm Kế toán/Nhân sự/Kinh doanh/  HS-08 Hạ tầng CSDL trung tâm
 Văn phòng/Chia sẻ) — cổng 3101–3402            (chung, qua HS-02)
```

Nguyên tắc: một nguồn dữ liệu duy nhất (HS-02); SSO ở Portal; menu động; vỏ mỏng (3 module).

---

## 5. Phân rã công việc

### S0 — Đối chiếu và xác nhận nguồn chuẩn (bắt buộc trước S1)

- **Mục tiêu**: chốt nguồn chuẩn (§3.1) và bản đồ `MOD-nn ↔ tuyến đường ↔ component ↔ cổng`.
- **Việc**: (a) chủ dự án xác nhận `_recovery_V-com-ERP` là nguồn tách; (b) xử lý bản cũ `D:/VComm/vcomm-erp`; (c) lập bảng đối chiếu 42 mục `navGroups` ↔ 44 mã MOD ↔ 29 module mục tiêu.
- **Nghiệm thu**: một nguồn chuẩn duy nhất; 29/29 module có tuyến đường + component thật.

### S1 — Tách vỏ Portal
- **Việc**: `vcomm-erp` thành shell (cổng 3000) chỉ còn MOD-01/02/03; gỡ 26 module khỏi `App.tsx`/`constants.ts`; thay bằng liên kết sang mini-app.
- **Phụ thuộc**: S0, S3, S2. **Nghiệm thu**: shell chỉ còn 3 tuyến đường nội bộ.

### S2 — Tạo 26 mini-app (monorepo, D1)
- **Việc**: monorepo workspaces; template chung (Vite + React + Tailwind + client HS-02); di chuyển từng component vào app tương ứng; gán cổng theo §6.
- **Phụ thuộc**: S0, S4. **Nghiệm thu**: 26 app khởi động ở cổng riêng, gọi dữ liệu qua HS-02.

### S3 — Gateway / SSO Portal
- **Việc**: Portal gọi HS-02 `/api/v1/auth/login` → access+refresh; phát cho mini-app; menu động từ cấu hình (mã, tên, cổng, nhóm).
- **Phụ thuộc**: S4/S5. **Nghiệm thu**: đăng nhập một lần; menu dựng từ cấu hình.

### S4 — Chuẩn hóa giao tiếp qua HS-02 (D4)
- **Việc**: liệt kê API HS-02 hiện có; bổ sung API còn thiếu cho 26 module; thay `dbService.ts`/`supabase-js` trong ERP bằng client HS-02; chuẩn hóa lỗi + validation (liên quan M6).
- **Rủi ro**: ERP hiện gọi Supabase trực tiếp; HS-02 phải phủ đủ nghiệp vụ.
- **Nghiệm thu**: không còn lời gọi Supabase trực tiếp; 100% qua HS-02.

### S5 — Chia sẻ dữ liệu và auth đa tenant
- **Việc**: thêm claim `tenant_id` vào JWT (§8); áp RLS nhất quán (gỡ nợ M2.1 — bỏ `OR tenant mặc định`); mở rộng phiên người bán.
- **Phụ thuộc**: S4. **Nghiệm thu**: mỗi mini-app chỉ thấy dữ liệu đúng tenant; có test chứng minh cách ly.

### S6 — CI/CD và deploy độc lập
- **Việc**: Dockerfile mỗi app; cấu hình cổng; pipeline độc lập; phiên bản hóa.
- **Phụ thuộc**: S2. **Nghiệm thu**: deploy/rollback một app không ảnh hưởng app khác.

### S7 — Ranh giới ERP ↔ eCommerce / Hub / iPOS
- **Việc**: chốt ma trận sở hữu tại §7. **Nghiệm thu**: bảng ranh giới có chủ dự án duyệt.

---

## 6. Cổng thật cho mini-app (D2)

Phân bổ **chính thức** (thay cho "giả định"). Không trùng cổng đang dùng: HS-01 `3000`, HS-04 `3002`, HS-06 `3003`, HS-05 `3004`, HS-07 `3005`, HS-02 `5000`, HS-03 `5173`.

| Nhóm | Module | Cổng |
|---|---|---|
| **Vỏ Portal (shell)** | MOD-01, MOD-02, MOD-03 | **3000** |
| Nhóm 1 — Kế toán | MOD-30 | 3101 |
| Nhóm 2 — Nhân sự | MOD-39 | 3102 |
| Nhóm 3 — Kinh doanh (15) | MOD-36/37/35/11/14/15/16/20/21/22/24/10/32/25/27 | 3201–3215 |
| Nhóm 4 — Văn phòng (7) | MOD-04/05/06/07/08/09/43 | 3301–3307 |
| Nhóm 5 — Chia sẻ & Nền tảng (2) | MOD-28, MOD-44 | 3401–3402 |

> Dải 3101–3402 không trùng cổng hệ thống nào đang dùng. **Chờ chủ dự án xác nhận** trước khi cố định.

---

## 7. Ranh giới sở hữu ERP ↔ eCommerce / Hub / iPOS (D7 — đề xuất)

Nguyên tắc: mỗi thực thể có **một chủ ghi (write owner)**; các hệ thống khác chỉ **đọc**.

| Thực thể | Chủ ghi (write owner) | Đọc | Bằng chứng |
|---|---|---|---|
| **Khách hàng** | eCommerce (khách tự đăng ký); quản trị viên ERP là ngoại lệ | ERP/CRM, Seller, iPOS | `supabase.auth.signUp`; QT-24 |
| **Sản phẩm (master)** | ERP PIM (MOD-14, `/pim`) | eCommerce, iPOS, Seller, Hub | `navGroups` `/pim` "thông tin sản phẩm tập trung" |
| **Đơn hàng online** | eCommerce (khách checkout) | ERP (quản trị), Seller | bảng `orders` |
| **Đơn hàng tại quầy** | iPOS (shop đối tác) và POS nội bộ VComm (Siêu thị, E-Menu, Hub `standard`/`freeze`) | ERP | `server.ts:3074` (`source === 'ipos'`), overlap doc §4.1 |
| **Đơn nhận tại Hub** | VComm Hub (trạm `locker`: chỉ nhận/giữ/giao/đồng kiểm/hoàn tiền) | ERP | overlap doc §2.1, §4.1 |
| **Tồn kho** | ERP Kho vận (MOD-25) cho kho VComm; iPOS kho riêng đối tác; Hub tồn trạm | — | `navGroups` `/warehouse` |
| **Ví / V-Xu (điểm)** | V-Xu (động cơ điểm duy nhất) | ERP Loyalty (giao diện + giữ chân) | overlap doc §4.3 |
| **Thanh toán / ví tiền** | HS-02 `payments`/`wallets` | ERP | `modules/payments`, `modules/wallets` |

Ranh giới cần chốt (đề xuất):
- **iPOS** = bán lẻ tại shop **đối tác**, đa tenant (ngoài repo). **POS nội bộ VComm** = Siêu thị/E-Menu/Hub `standard`/`freeze`. Không gộp (giữ `specs/018`).
- **Hub** không phải kênh gom nhu cầu — vai trò đó giao cho mạng Affiliate/KOL (QT-36).
- **ERP** là **back-office**: quản trị, kế toán, kho, nhân sự, văn phòng; không tạo đơn khách hàng.

> Bảng này là **đề xuất**, chờ chủ dự án chốt. Một số ô "Đọc" và tồn kho chưa có bằng chứng trực tiếp (xem §10).

---

## 8. Auth đa tenant (D8 — đề xuất)

Hiện trạng: HS-02 ký JWT `{ id, role }`, **thiếu `tenant_id`**; RLS còn `OR tenant mặc định` (nợ M2.1). ERP có HMAC riêng (`sellerAuth.ts`).

Đề xuất:
1. **Một cơ chế token**: HS-02 (`auth.service.ts`) là nơi **duy nhất** ký/kiểm JWT; bỏ HMAC riêng của ERP.
2. **Thêm claim `tenant_id`** (và `role`, `scope`) vào payload access + refresh tại `auth.service.ts:109-117`.
3. **Guard tenant**: thêm `tenant.decorator.ts` + guard đọc `tenant_id` từ token, chặn mọi truy vấn chéo tenant; áp cho toàn bộ module HS-02 (hiện chỉ 2 module dùng `tenant_id`).
4. **SSO ở Portal**: Portal giữ token; mini-app nhận token khi mở (cookie cùng domain hoặc `postMessage`); mọi request kèm `Bearer`.
5. **Gỡ nợ M2.1**: khi JWT đã mang `tenant_id`, bỏ `OR tenant_id = 'tenant-vcomm-prod-01'` trong RLS `domain_events`.
6. **Refresh**: access 1h / refresh 30d (giữ như hiện tại); Portal tự refresh.

> Đề xuất, chờ chốt. Điểm cần xác nhận: cơ chế chuyển token Portal → mini-app (cookie vs postMessage) và mô hình tenant đơn hay đa cho VComm.

---

## 9. Cơ chế tạm cách ly 3 module (D6)

Ba module tài liệu nói đã loại bỏ nhưng mã nguồn còn: MOD-12 Livestream (`/live`), MOD-13 Mạng xã hội (`/social`), MOD-38 Đội ngũ Kinh doanh (`/sales`).

"Cách ly" (không xóa, theo nguyên tắc không xóa chức năng):
1. Gỡ khỏi `navGroups` (không hiện trong menu).
2. Chặn tuyến đường bằng cờ cấu hình (`FEATURE_FLAGS`) — trả trang "tạm ẩn" thay vì 404.
3. Giữ nguyên component + test; ghi chú "tạm cách ly" ở đầu tệp.
4. Ghi vào `_Tam_huy/README.md` và `00_INDEX.md` mục 3.1.

---

## 10. Chưa xác minh được

- Chủ dự án chưa xác nhận **nguồn chuẩn** (`_recovery_V-com-ERP`) và cách xử lý bản cũ `D:/VComm/vcomm-erp`.
- Cổng 3101–3402 là đề xuất, chưa được chốt cứng.
- HS-02 có phủ đủ API cho cả 26 module hay không (chưa liệt kê hết route HS-02).
- Chủ ghi thật của **sản phẩm** (PIM ERP hay AdminProducts eCommerce) — mới suy từ nhãn menu, chưa đọc mã ghi.
- Tồn kho: siêu thị VComm và E-Menu có dùng chung tồn kho với kênh trực tuyến hay không (overlap doc cũng nêu).
- Mô hình tenant của VComm: đơn tenant (VComm) hay đa tenant (có cả shop đối tác) — ảnh hưởng D8.

## 11. Ngoài phạm vi

- Không sửa mã nguồn trong kế hoạch này.
- Không đổi cổng/hạ tầng production.
- Việc gộp/gỡ/cách ly module trong mã nguồn chỉ thực hiện sau khi chủ dự án duyệt.
