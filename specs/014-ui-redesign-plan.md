# Kế hoạch thiết kế lại giao diện VComm ERP

**Ngày lập:** 2026-09-01
**Phạm vi:** Toàn bộ frontend `V-com-ERP/src` (React 19 + Vite 6 + Tailwind 4)
**Mục tiêu:** Chuyển hệ thống từ "giao diện được vá nhiều lớp" sang "hệ thống thiết kế có thể bảo trì", không làm gián đoạn vận hành.

---

## 1. Tóm tắt điều hành

VComm ERP có **45 route**, **80 component** và **78.223 dòng code**. Giao diện hiện tại hoạt động được, nhưng **không thể thiết kế lại theo cách thông thường** — vì lớp CSS hiện tại dùng 101 `!important` để ghi đè trực tiếp lên chính các utility class của Tailwind. Hệ quả: bất kỳ thay đổi visual nào cũng phải "đấu" với lớp override này, và không ai đoán trước được kết quả.

**Kết luận then chốt:** Vấn đề của VComm không phải là "giao diện xấu", mà là **"giao diện không có nền móng"**. Thiết kế lại mà không dọn nền móng trước sẽ chỉ tạo ra lớp vá thứ tư.

Vì vậy kế hoạch này chia làm 6 giai đoạn, trong đó **Giai đoạn 0 và 1 không tạo ra thay đổi visual đáng kể** — chúng tạo ra khả năng thay đổi. Đây là phần khó bán nhất với stakeholder, nhưng là phần quyết định dự án thành hay không.

**Tổng thời lượng ước tính:** 20–28 tuần (5–7 tháng) với 1–2 frontend dev. Có thể rút ngắn xuống 14–16 tuần nếu tăng lên 3 dev và bỏ qua Giai đoạn 5.

---

## 2. Chẩn đoán hiện trạng

### 2.1 Số liệu

| Chỉ số | Giá trị | Đánh giá |
|---|---|---|
| Tổng LOC `src/` | 78.223 | Rất lớn so với 45 màn hình |
| Số component `.tsx` | 80 | — |
| Số route | 45 | — |
| File > 1.000 dòng | 21 | Nên là 0 |
| File > 1.500 dòng | 12 | Không thể review |
| Component lớn nhất | `Settings.tsx` — **6.325 dòng / 332 KB** | Cần tách thành ~15 trang |
| `useState` trong toàn app | 984 | Trung bình 12 state/component |
| `Settings.tsx` useState | 90 | State không được quản lý tập trung |
| Bảng `<table>` viết tay | **107** | Không có component `DataTable` |
| `!important` trong `index.css` | **101** | Dấu hiệu override hell |
| Component trong `ui/` | **9** | Thiếu design system |

### 2.2 Năm vấn đề cốt lõi

#### (1) CSS override hell — nghiêm trọng nhất

`src/index.css` ghi đè trực tiếp lên utility class của Tailwind:

```css
.erp-modernized .rounded-lg { border-radius: 18px !important; }  /* dòng 400 */
.erp-modernized .rounded-lg { border-radius: 4px !important;  }  /* dòng 607 — mâu thuẫn */
.erp-modernized .shadow-sm  { box-shadow: ... }                  /* dòng 433 */
.erp-modernized .shadow-sm  { box-shadow: ... }                  /* dòng 437 — trùng lặp */
.erp-modernized .p-6        { padding: 1.25rem !important; }
```

**Hậu quả:** Tailwind class **nói dối**. Dev viết `rounded-lg` nhưng nhận 4px ở nơi này, 18px ở nơi khác. Không ai dám đoán. Mọi thay đổi visual đều là canh bạc.

Cùng lúc, `table` bị ép cứng toàn cục:

```css
table { table-layout: fixed !important; width: 100% !important; }
```

…triệt tiêu hoàn toàn nỗ lực canh chỉnh cột, đồng thời **xung đột trực tiếp với `ResizableTh.tsx`** (component cho phép resize cột).

#### (2) Dark mode bằng `filter: invert()` — sai phương pháp

```css
html[data-theme="dark"] { filter: invert(1) hue-rotate(180deg); }
html[data-theme="dark"] img, video, iframe, .no-invert { filter: invert(1) hue-rotate(180deg); }
```

Cách này đảo ngược **toàn bộ** cây DOM rồi đảo ngược lại từng ảnh/biểu đồ để bù trừ. Hậu quả:
- Màu thương hiệu bị sai (xanh VComm `#003991` thành màu khác).
- Biểu đồ Recharts phải patch thủ công.
- Mọi ảnh/iframe mới sinh ra đều phải nhớ thêm class `.no-invert`.
- Hiệu năng kém (filter toàn trang trên mỗi repaint).

Dark mode đúng phải là **đổi giá trị token**, không phải đổi ảnh.

#### (3) Không có design system

`components/ui/` chỉ có 9 file: `Modal`, `StatCard`, `PageHeader`, `QuickActionCard`, `ResizableTh`, `DraggableGrid`, `SignaturePad`, `ExportButton`, `VNeidVerificationModal`.

80 component còn lại tự viết lại từ đầu: **107 bảng**, **10+ lớp phủ modal** (`fixed inset-0 z-[`), và **chỉ 4 nơi** có empty state ("Không có dữ liệu"). Nghĩa là **41/45 màn hình hiển thị khoảng trắng** khi không có dữ liệu.

#### (4) Bảng màu kép và hỗn loạn

Song song tồn tại 3 hệ màu xám:
- Tailwind `slate` — 1.232 lần `text-slate-500`, 1.128 lần `border-slate-300`
- Tailwind `gray` hardcode — 340 lần `#6B7280`, 219 lần `#111827`
- Màu kem riêng — 296 lần `#FAF9F5`, 90 lần `#F3F4F6`

Không có **token ngữ nghĩa** nào (`--surface`, `--text-muted`, `--border-subtle`). Toàn bộ là giá trị cụ thể rải rác. Muốn đổi theme phải sửa hàng nghìn chỗ.

#### (5) Component khổng lồ, không thể test

`Settings.tsx` 6.325 dòng với 90 `useState` và 8 bảng. `Warehouse.tsx` 3.772 dòng, 50 `useState`. File lớn đến mức một số công cụ phân tích không xử lý nổi.

### 2.3 Điểm mạnh cần giữ lại

Sửa chứ không đập đi xây lại. Những thứ này **đang hoạt động tốt**:

- ✅ **Lazy loading route** bằng `React.lazy()` — đã đúng, giữ nguyên.
- ✅ **Hệ thống theme đa trục** (`data-primary-color`, `data-border-radius`, `data-font-size`, `data-card-density`) — ý tưởng tốt, chỉ cần chuyển từ "override bằng CSS" sang "đổi giá trị token".
- ✅ **Phông hệ thống native** (`-apple-system / Segoe UI / Roboto`) — quyết định đúng: load tức thì, dấu tiếng Việt chuẩn. Giữ nguyên.
- ✅ **`tabular-nums`** cho bảng — chi tiết tốt, ít hệ thống làm được.
- ✅ **`prettier`, `eslint`, `vitest`** đã có sẵn hạ tầng kiểm soát chất lượng.
- ✅ **35 file test** trong `src/__tests__/` — nền tảng để refactor an toàn.
- ✅ **Theme ngày lễ** (Tết / Giáng sinh / Trung thu / Halloween) — khác biệt hóa thú vị, giữ lại nhưng cài bằng token thay vì `!important`.

---

## 3. Nguyên tắc thiết kế

Sáu nguyên tắc này dùng để giải quyết mọi tranh luận về chi tiết sau này:

1. **Token trước, component sau, màn hình cuối cùng.** Không viết component mới khi chưa có token. Không sửa màn hình khi chưa có component.
2. **Utility class phải nói thật.** Cấm tuyệt đối `!important` ghi đè utility class của Tailwind. Nếu cần override, phải sửa ở component.
3. **Một màu xám, một màu nhấn.** Xóa bỏ pallet kép (slate + gray + cream). Semantic token che giấu pallet thật.
4. **Dark mode bằng token, không bằng filter.** Xóa toàn bộ `filter: invert()`.
5. **Component hóa cái lặp lại 3 lần trở lên.** Bảng (107), modal (10+), empty state, form field, badge trạng thái.
6. **Mỗi giai đoạn phải chạy được trên production.** Không có "nhánh dài hạn rồi merge một lần". Dùng feature flag (`erp-modernized` → `ui-v2`).

### Hệ token đích

Thay vì `text-slate-500` rải rác 1.232 nơi, dùng:

```css
@theme {
  /* Bề mặt */
  --color-surface:          var(--surface);
  --color-surface-raised:   var(--surface-raised);
  --color-surface-sunken:   var(--surface-sunken);

  /* Chữ */
  --color-content:          var(--content);
  --color-content-secondary:var(--content-secondary);
  --color-content-muted:    var(--content-muted);

  /* Viền */
  --color-line:             var(--line);
  --color-line-strong:      var(--line-strong);

  /* Ngữ nghĩa */
  --color-success / --color-warning / --color-danger / --color-info
}
```

**Quy tắc:** component chỉ được dùng token. Pallet thật (slate/indigo/…) chỉ xuất hiện ở **một nơi** — file định nghĩa token.

---

## 4. Kiến trúc đích

```
src/
├── theme/                      # MỚI — nền móng
│   ├── tokens.css              # Định nghĩa toàn bộ token
│   ├── themes.css              # Biến thể: light/dark/vcomm/tết/…
│   └── tailwind-theme.ts       # Mapping token → Tailwind
│
├── components/ui/              # MỞ RỘNG: 9 → ~28 component
│   ├── DataTable/              # Thay thế 107 bảng viết tay
│   │   ├── DataTable.tsx
│   │   ├── useTableState.ts    # sort/filter/paging/resize
│   │   └── columns.tsx
│   ├── Modal.tsx  Drawer.tsx   # Thay thế 10+ lớp phủ
│   ├── Button.tsx  IconButton.tsx
│   ├── Input.tsx  Select.tsx  DatePicker.tsx  Textarea.tsx
│   ├── Card.tsx  StatCard.tsx  Badge.tsx  StatusBadge.tsx
│   ├── EmptyState.tsx  ErrorState.tsx  Skeleton.tsx
│   ├── Tabs.tsx  Toast.tsx  Tooltip.tsx  Pagination.tsx
│   └── PageShell.tsx           # Chuẩn hoá layout mọi màn hình
│
├── components/layout/          # MỚI
│   ├── AppShell.tsx  Sidebar.tsx  Header.tsx  CommandPalette.tsx
│
├── modules/                    # MỚI — chia nhỏ theo nghiệp vụ
│   ├── settings/               # Settings.tsx 6.325 dòng → ~15 file
│   │   ├── SettingsLayout.tsx
│   │   ├── GeneralSettings.tsx  IntegrationSettings.tsx
│   │   └── … (mỗi route con một file)
│   ├── warehouse/  hr/  finance/  orders/  pim/
│
└── hooks/  lib/  services/     # Giữ nguyên
```

**Chiến lược migration:** `modules/` và `components/` tồn tại song song. Route chuyển dần sang `modules/`. `App.tsx` chỉ đổi đường dẫn import, không đổi cấu trúc router.

---

## 5. Lộ trình 6 giai đoạn

### Giai đoạn 0 — Kiểm kê & chốt baseline (1 tuần)

*Không sửa code. Mục tiêu: biết chính xác mình có gì trước khi động tay.*

| Việc | Chi tiết |
|---|---|
| Chụp ảnh 45 route | Dùng Puppeteer (đã có trong deps) tạo gallery baseline — trước/sau để đối chiếu |
| Kiểm kê component | Phân loại 80 component: giữ / sửa / viết lại / xóa |
| Đo hiệu năng | Bundle size, Time-to-Interactive từng route |
| Thống kê sử dụng | Thêm analytics nhẹ để biết **route nào dùng nhiều nhất** — quyết định thứ tự Giai đoạn 4 |
| Khóa `!important` | Thêm rule ESLint/CI: cấm thêm `!important` mới |

**Tiêu chí hoàn thành:** Gallery baseline có 45 ảnh; danh sách ưu tiên route có số liệu thực tế; CI chặn được `!important` mới.

---

### Giai đoạn 1 — Xây nền móng: token & dọn override (2–3 tuần)

*Giai đoạn quan trọng nhất. Ít thay đổi visual, nhiều thay đổi khả năng.*

| # | Việc | Chi tiết |
|---|---|---|
| 1.1 | Tạo `theme/tokens.css` | Định nghĩa đầy đủ token: surface, content, line, radius, shadow, semantic |
| 1.2 | Gỡ **toàn bộ 101 `!important`** | Thay bằng giá trị token. Xử lý từng block một, kiểm tra bằng gallery baseline |
| 1.3 | Xóa mâu thuẫn & trùng lặp | `.rounded-lg` (dòng 400 vs 607), `.shadow-sm` (433 vs 437) |
| 1.4 | Gỡ `table { table-layout: fixed !important }` | Trả quyền canh cột về cho component, sửa `ResizableTh` |
| 1.5 | Viết lại dark mode bằng token | Xóa hoàn toàn `filter: invert()`. Chuyển `data-theme="dark"` sang đổi biến |
| 1.6 | Gộp pallet kép | `slate` + 340× `#6B7280` + 296× `#FAF9F5` → một bộ, đi qua token |
| 1.7 | Chuyển theme lễ hội sang token | Tết / Giáng sinh / Trung thu / Halloween: giữ hiệu ứng, bỏ `!important` |
| 1.8 | Giữ nguyên hệ đa trục | `data-primary-color`, `data-border-radius`, `data-font-size`, `data-card-density` chuyển sang đổi biến |

**Rủi ro lớn nhất:** Gỡ `!important` có thể làm vỡ layout ở nơi đang vô tình phụ thuộc vào nó.
**Cách giảm thiểu:** Làm từng block một (1 block = 1 commit), đối chiếu gallery baseline sau mỗi block. Nếu vỡ, thêm tạm **class riêng** (`.legacy-table`) thay vì dùng lại `!important`.

**Tiêu chí hoàn thành:**
- `grep -c '!important' index.css` → **0**
- Dark mode không còn `filter: invert()`
- Gallery baseline: 45/45 route không thay đổi ngoài dự kiến
- Toàn bộ 35 test hiện có vẫn pass

---

### Giai đoạn 2 — Thư viện component (3–4 tuần)

*Xây bộ component chuẩn. Đây là nơi "thiết kế lại" thực sự bắt đầu.*

| Ưu tiên | Component | Lý do |
|---|---|---|
| P0 | `DataTable` + `useTableState` | Thay 107 bảng. Hỗ trợ sort/filter/resize/paging, ảo hóa bằng `react-virtuoso` (đã cài) |
| P0 | `Modal` / `Drawer` | Thống nhất 10+ lớp phủ. Xử lý focus trap, `body.modal-open`, ESC |
| P0 | `EmptyState` / `ErrorState` / `Skeleton` | **41/45 màn hình đang trống trơn** khi không có dữ liệu |
| P0 | `Button` / `IconButton` | Dùng nhiều nhất, hiện tại mỗi nơi một kiểu |
| P1 | `Input` / `Select` / `Textarea` / `DatePicker` | Thống nhất form, xóa `!important` focus-ring trong CSS |
| P1 | `Card` / `StatCard` / `Badge` / `StatusBadge` | Chuẩn hóa trạng thái (hiện tại mỗi module một màu) |
| P1 | `PageShell` | Chuẩn hóa tiêu đề, breadcrumb, action bar cho 45 màn hình |
| P2 | `Tabs` / `Toast` / `Tooltip` / `Pagination` | Hoàn thiện bộ |

**Quan trọng về công cụ:** Cân nhắc kỹ trước khi đưa vào thư viện ngoài (shadcn/ui, Radix, MUI):
- **Khuyến nghị: tự xây trên Radix Primitives** (headless, chỉ behaviour + a11y, tự kiểm soát style). Lý do: bundle hiện tại đã nặng; hệ thống đã có sẵn `motion`, `clsx`, `tailwind-merge`, `lucide-react` — đủ để tự xây mà không phình bundle.
- **Tránh** MUI / Ant Design: phình bundle, khó ép theo token riêng, và sẽ phá vỡ toàn bộ class Tailwind hiện tại.

**Kèm theo:** Trang `/ui-kit` nội bộ (chỉ hiện ở dev) để xem toàn bộ component, tương tự Storybook nhưng không cần thêm hạ tầng.

**Tiêu chí hoàn thành:**
- ~28 component trong `ui/`, mỗi component có test
- Trang `/ui-kit` hiển thị đầy đủ trạng thái (default/hover/active/disabled/loading/error/empty)
- Tất cả dùng token, **không hardcode màu**
- Đạt WCAG 2.1 AA (tương phản ≥ 4.5:1)

---

### Giai đoạn 3 — Shell & điều hướng (2 tuần)

| Việc | Chi tiết |
|---|---|
| `AppShell` | Tách layout khỏi `App.tsx` (hiện tại `AppLayout` đang ôm cả logic seed demo data, favicon, realtime subscription — khoảng 230 dòng không liên quan) |
| Sidebar | 45 route hiện tại là danh sách phẳng → **nhóm theo nghiệp vụ**: Bán hàng / Kho & Chuỗi cung ứng / Tài chính / Nhân sự / Khách hàng / Cài đặt |
| Header | Dọn 309 dòng, tách search + notification + user menu thành component riêng |
| Command palette | `CommandPalette.tsx` đã có — nâng cấp thành điều hướng chính (Cmd+K) |
| Responsive | Kiểm tra và sửa 45 route trên tablet/mobile. Hiện tại sidebar dùng `xl:flex` — mobile chưa rõ ràng |
| Tách logic khỏi view | Chuyển seed demo data, favicon, realtime subscription ra khỏi `App.tsx` vào `hooks/` và `services/` |

**Tiêu chí hoàn thành:** Sidebar nhóm theo nghiệp vụ; `App.tsx` còn < 80 dòng; 45 route dùng được trên màn hình 1024px trở xuống.

---

### Giai đoạn 4 — Di cư module (6–10 tuần)

*Giai đoạn dài nhất. Thứ tự theo **lưu lượng sử dụng thực tế** (từ Giai đoạn 0), không theo thứ tự alphabet.*

**Nguyên tắc:** Mỗi sprint di cư 2 module. Mỗi module: tách file → thay bảng viết tay bằng `DataTable` → áp `PageShell` → thêm empty/error state → test.

| Đợt | Module | Độ khó | Ghi chú |
|---|---|---|---|
| 1 | `Dashboard`, `Home` | Thấp | Là trang đầu tiên user thấy, hiệu ứng cao, rủi ro thấp. Làm trước để tạo động lực |
| 2 | `Orders`, `Customers` | Trung bình | Nghiệp vụ lõi, dùng nhiều nhất |
| 3 | `Finance`, `Settlement` | Cao | Nhiều bảng (14), logic phức tạp, cẩn thận số liệu |
| 4 | **`Settings`** | **Rất cao** | 6.325 dòng → ~15 file. Đây là dự án con, cần 2–3 tuần riêng |
| 5 | `Warehouse`, `PIM` | Cao | 3.772 + 2.737 dòng |
| 6 | `HR`, `EasyHRM` | Cao | 3.636 + 2.076 dòng, 16 bảng trong EasyHRM |
| 7 | Còn lại (~20 module) | Thấp–TB | Làm theo lưu lượng |

**Quy tắc bất di bất dịch:** Module chưa di cư vẫn phải chạy bình thường. Giữ `components/` cũ song song với `modules/` mới, chuyển route từng cái một.

**Tiêu chí hoàn thành từng module:** Component gốc < 500 dòng; không còn `<table>` viết tay; có empty/error state; có test; gallery baseline đối chiếu xong.

---

### Giai đoạn 5 — Hoàn thiện (2–3 tuần)

| Việc | Chi tiết |
|---|---|
| Accessibility | Rà soát 45 route: keyboard navigation, focus visible, ARIA, screen reader |
| Hiệu năng | Tối ưu bundle (hiện tại có `puppeteer` trong `dependencies` — **nên chuyển sang devDependencies**); lazy-load Recharts; ảo hóa bảng dài |
| Mật độ hiển thị | Hoàn thiện chế độ compact/comfortable, nhớ theo user |
| Ngôn ngữ & định dạng | Chuẩn hóa `vi-VN`: tiền tệ ₫, ngày tháng, số. Hiện tại có chỗ dùng `toLocaleString('vi-VN')`, có chỗ không |
| Dọn dẹp | Xóa file tạm: `out.js`, `out2.js`, `output.html`, `screenshot.png`, `saas_layout.txt`, và hàng loạt script `fix_*.ts` / `patch_*.cjs` đã hết tác dụng |
| Tài liệu | Hướng dẫn dùng design system cho dev mới |

---

## 6. Rủi ro & cách giảm thiểu

| # | Rủi ro | Mức độ | Cách giảm thiểu |
|---|---|---|---|
| 1 | Gỡ `!important` làm vỡ layout diện rộng | **Cao** | Làm từng block, đối chiếu gallery baseline sau mỗi block. Dùng class legacy tạm thay vì `!important` |
| 2 | Component khổng lồ không tách được (Settings 6.325 dòng) | **Cao** | Tách theo **route con** trước (ít rủi ro), rồi mới tách logic. Mỗi bước phải chạy được |
| 3 | Di cư làm sai lệch số liệu tài chính | **Cao** | Module tài chính chỉ di cư sau khi có test bao phủ. Đối chiếu song song môi trường cũ/mới |
| 4 | Team quen style cũ, không dùng component mới | Trung bình | Trang `/ui-kit` + review bắt buộc dùng token. Thêm lint rule cấm hardcode màu |
| 5 | Dự án kéo dài, mất động lực | Trung bình | Giai đoạn 4 chia theo đợt, mỗi đợt 2 tuần có kết quả nhìn thấy được. Dashboard + Home làm đầu tiên |
| 6 | Bundle phình to khi thêm component | Thấp | Tự xây trên Radix thay vì đưa MUI/Ant. Đo bundle mỗi giai đoạn |
| 7 | Xung đột với code đang dang dở | Trung bình | Hiện tại **7 file đang sửa chưa commit** (`App.tsx`, `HR.tsx`, `Settings.tsx`, `Customers.tsx`, `Settlement.tsx`, `Wallet.tsx`, `CustomerService.tsx`, `constants.ts`) — cần commit hoặc stash **trước khi bắt đầu** |

---

## 7. Chỉ số đo lường

**Chỉ số kỹ thuật (đo tự động được):**

| Chỉ số | Hiện tại | Mục tiêu |
|---|---|---|
| `!important` trong `index.css` | 101 | **0** |
| File > 1.000 dòng | 21 | **0** |
| File > 500 dòng | ~35 | **< 10** |
| `<table>` viết tay | 107 | **0** (qua `DataTable`) |
| Component trong `ui/` | 9 | **~28** |
| Màn hình có empty state | 4 / 45 | **45 / 45** |
| Màu hardcode (#hex) | ~1.200 | **0** |
| `filter: invert()` | Có | **Không** |
| Bundle size (gzip) | Đo ở GĐ 0 | Giảm ≥ 20% |
| Test coverage | 35 file | ≥ 70% `ui/` |

**Chỉ số trải nghiệm (cần khảo sát user):**
- Thời gian hoàn thành tác vụ lõi (tạo đơn, duyệt yêu cầu) — đo trước/sau
- Số click để đến được chức năng thường dùng
- Tỷ lệ lỗi thao tác
- Điểm hài lòng (SUS) — khảo sát trước ở GĐ 0, sau ở GĐ 5

---

## 8. Quyết định cần xác nhận trước khi bắt đầu

Bảy việc cần chốt trước khi bước vào Giai đoạn 0:

1. **Phạm vi** — Toàn bộ 45 route, hay chỉ các module lõi (Dashboard, Orders, Customers, Finance, Settings)?
2. **Thư viện component** — Tự xây trên Radix (khuyến nghị, kiểm soát tốt, không phình bundle), hay dùng shadcn/ui (nhanh hơn, nhưng mang phong cách của họ)?
3. **Có giữ theme lễ hội không** (Tết / Giáng sinh / Trung thu / Halloween)? Nó đang là nguồn tạo `!important` đáng kể.
4. **Dark mode** — Có nằm trong phạm vi đợt này không? Viết lại bằng token tốn thêm khoảng 1 tuần trong Giai đoạn 1.
5. **Mobile** — Có cần tối ưu tablet/mobile thật sự, hay chỉ cần không vỡ trên màn hình nhỏ?
6. **Nguồn lực** — Mấy frontend dev? Có designer không, hay dev tự quyết định visual?
7. **Code đang dang dở** — 7 file chưa commit. Commit hay stash?

---

## 9. Bắt đầu ngay: 3 việc đầu tiên

Không cần chờ mọi quyết định, ba việc này an toàn và nên làm ngay:

1. **Dọn dẹp an toàn.** Xóa `out.js`, `out2.js`, `output.html`, `saas_layout.txt`, và các script `fix_*` / `patch_*` đã hết tác dụng. Chuyển `puppeteer` từ `dependencies` sang `devDependencies`. Commit riêng.
2. **Thêm lint rule cấm `!important` mới.** Chặn ngay việc nợ kỹ thuật tiếp tục phình to trong lúc chờ duyệt kế hoạch.
3. **Chụp gallery baseline 45 route bằng Puppeteer.** Cần làm **trước khi** động vào CSS — đây là lưới an toàn cho toàn bộ Giai đoạn 1.

---

*Tài liệu này nên được xem lại sau mỗi giai đoạn và cập nhật theo thực tế.*
