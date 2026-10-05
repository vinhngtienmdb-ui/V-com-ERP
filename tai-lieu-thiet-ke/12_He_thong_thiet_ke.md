# Hệ thống thiết kế

> Màu sắc, chữ, khoảng cách, thành phần dùng chung, quy tắc thiết kế thống nhất.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Công nghệ tạo kiểu

- Tailwind CSS 4.1.14, tích hợp qua plugin Vite `@tailwindcss/vite` (`package.json:23`, `:58`).
- Tailwind 4 dùng cấu hình hướng CSS (không có `tailwind.config.js`); token định nghĩa trong `src/index.css`.
- Tiện ích gộp lớp: `tailwind-merge` 3.5.0 (`package.json:44`).

## 2. Màu sắc

- Bảng màu chính (primary) ánh xạ sang dải indigo: `--color-primary-50` … `--color-primary-900` trỏ tới `--app-primary-50` … `--app-primary-900`, mà `--app-primary-*` gán bằng `var(--color-indigo-*)` (`src/index.css:22-31`, `:44-48`).
- Màu nhấn (accent): cam — ví dụ `group-focus-within:text-orange-600` (`src/components/Header.tsx`).
- Màu trung tính: dải slate — `text-slate-900`, `text-slate-600`, `border-slate-300` (`src/components/Header.tsx`).
- Nền: trắng và xám nhạt `bg-[#F9FAFB]/95` (`src/components/Header.tsx`).

## 3. Chữ

- Họ chữ: `font-sans` (`src/components/Header.tsx`).
- Tiêu đề: `text-xl md:text-2xl font-bold text-slate-900 tracking-tight` (`src/components/Header.tsx`).
- Phụ đề: `text-[11px] md:text-xs text-slate-600 font-medium` (`src/components/Header.tsx`).

## 4. Khoảng cách và bo góc

- Khoảng cách theo thang Tailwind (`gap-4 md:gap-6`, `px-4 md:px-6`) (`src/components/Header.tsx`).
- Bo góc: `rounded-lg` (`src/components/Header.tsx`).

## 5. Trạng thái tương tác

- Tiêu điểm (focus): `focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-slate-900` (`src/components/Header.tsx`).
- Chuyển tiếp: `transition-all`, `transition-colors` (`src/components/Header.tsx`).
- Hiệu ứng nền mờ: `backdrop-blur-md` (`src/components/Header.tsx`).

## 6. Thành phần dùng chung

| Thành phần | Vai trò | Tệp |
|---|---|---|
| `Header` | Thanh điều hướng trên | `src/components/Header.tsx` |
| `Breadcrumb` | Đường dẫn phân cấp | `src/components/Breadcrumb.tsx` |
| `ErrorBoundary` | Bắt lỗi giao diện | `src/components/ErrorBoundary.tsx` |
| `LoadingScreen` | Trạng thái tải | `src/components/LoadingScreen.tsx` |
| `AccessDenied` | Không đủ quyền | `src/components/AccessDenied.tsx` |
| `CommandPalette` | Bảng lệnh nhanh | `src/components/CommandPalette.tsx` |

## 7. Quy tắc thiết kế thống nhất

- Dùng token màu `primary` (indigo) cho hành động chính; cam cho nhấn mạnh.
- Dùng dải slate cho chữ và viền trung tính.
- Bo góc thống nhất `rounded-lg`; trạng thái tiêu điểm dùng vòng `ring-primary-500`.

## Chưa xác minh được

- Định nghĩa đầy đủ mọi token trong `src/index.css` (mới trích phần primary; chưa liệt kê hết biến).
- Có hay không bảng token cho trạng thái nguy hiểm/thành công (danger/success) và giá trị cụ thể.
- Chế độ tối (dark mode) và bảng màu tương ứng.
- Quy tắc cỡ chữ theo cấp bậc tiêu đề (h1–h6) toàn hệ thống.
