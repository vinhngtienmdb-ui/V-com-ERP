# Đặc tả giao diện

> Danh sách màn hình, điều hướng, bố cục, thành phần, dữ liệu hiển thị, thao tác, trạng thái, thông báo, xử lý lỗi, quyền hiển thị, khả năng thích ứng màn hình.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Kiến trúc giao diện

- Ứng dụng React 19 + Vite 6, định tuyến client-side bằng React Router trong `src/App.tsx:383-432`.
- 76 thành phần `.tsx` tại `src/components/`.
- Bố cục chung: `Header.tsx` dạng thanh cố định (`sticky top-0 z-50`), có ô tìm kiếm và điều hướng (`src/components/Header.tsx`).
- Thành phần dùng chung: `Breadcrumb.tsx`, `ErrorBoundary.tsx`, `LoadingScreen.tsx`, `AccessDenied.tsx`, `CommandPalette.tsx`.

## 2. Danh sách màn hình (từ `src/App.tsx`)

| Đường dẫn | Thành phần | Dòng |
|---|---|---|
| `/` | `Home` | `src/App.tsx:384` |
| `/dashboard` | `Dashboard` | `:385` |
| `/orders` | `Orders` | `:386` |
| `/pim` | `PIM` | `:387` |
| `/sellers` | `SellerManagement` | `:388` |
| `/marketing` | `Marketing` | `:389` |
| `/flash-sale` | `FlashSale` | `:390` |
| `/group-buy` | `GroupBuyManager` | `:391` |
| `/f2b2b` | `F2B2BManager` | `:392` |
| `/dropship` | `DropshipManager` | `:393` |
| `/ke-toan-tt99` | `TT99Accounting` | `:396` |
| `/customers` | `Customers` | `:398` |
| `/warehouse` | `WarehouseModule` | `:401` |
| `/logistics` | `Logistics` | `:402` |
| `/finance` | `Finance` | `:403` |
| `/settlement` | `SettlementManagement` | `:404` |
| `/hr` | `HumanResources` | `:405` |
| `/easyhrm` | `EasyHRM` | `:406` |
| `/bi` | `AnalyticsBI` | `:409` |
| `/loyalty` | `LoyaltyManagement` | `:411` |
| `/wallet` | `WalletHub` | `:412` |
| `/compliance` | `Compliance` | `:415` |
| `/seller-finance` | `SellerFinance` | `:416` |
| `/contracts` | `ContractManager` | `:422` |
| `/settings` | `SettingsPage` | `:430` |
| `/emenu/:tableId` | `EMenu` (nhánh riêng) | `:457` |
| `/supplier-portal` | `SupplierPortal` (nhánh riêng) | `:469` |
| `/legal-info` | `PublicLegalInfo` (nhánh riêng) | `:481` |
| `*` | `Dashboard` (mặc định) | `:432` |

## 3. Điều hướng

- Thanh trên (`Header.tsx`) + điều hướng theo nhánh: khu vực nội bộ chính, khu vực e-menu theo bàn, cổng nhà cung cấp, trang thông tin pháp lý công khai (`src/App.tsx:456`, `:468`, `:480`).

## 4. Bố cục và thành phần

- Lưới và khoảng cách theo tiện ích Tailwind; container `h-20 px-4 md:px-6` cho header (`src/components/Header.tsx`).
- Ô tìm kiếm: `w-48 md:bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2` (`src/components/Header.tsx`).

## 5. Trạng thái và thông báo

- Trạng thái tải: `LoadingScreen.tsx`.
- Lỗi giao diện: `ErrorBoundary.tsx`.
- Không đủ quyền: `AccessDenied.tsx`.
- Nhắc nhở/uy quyền: `DelegationNotice.tsx`.

## 6. Xử lý lỗi

- Lỗi bắt ở `ErrorBoundary`; thông báo lỗi API hiển thị tại màn hình tương ứng (chưa chuẩn hóa tập trung — xem `19_Bao_mat.md` §3.6).

## 7. Quyền hiển thị

- Ẩn/hiện thành phần theo quyền trên giao diện **không phải là bảo mật**; quyền do máy chủ quyết định (`05_Vai_tro_nguoi_dung.md`). Giao diện chỉ hỗ trợ trải nghiệm, không thay thế guard API.

## 8. Khả năng thích ứng màn hình

- Dùng tiền tố đáp ứng của Tailwind (`md:`, `sm:`) — ví dụ `px-4 md:px-6`, `hidden sm:block` (`src/components/Header.tsx`).

## Chưa xác minh được

- Bố cục chi tiết từng màn hình (mới xác định danh sách route, chưa mô tả thành phần trong từng trang).
- Có hay không chế độ tối (dark mode) — chưa tìm thấy cấu hình trong `src/index.css`.
- Luồng điều hướng cụ thể giữa các màn hình (chưa lập bản đồ liên kết).
- Trạng thái rỗng (empty state) và phân trang của từng bảng dữ liệu.
