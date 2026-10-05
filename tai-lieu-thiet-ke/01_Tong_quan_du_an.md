# Tổng quan dự án

> Tên sản phẩm, vấn đề cần giải quyết, mục tiêu sản phẩm, đối tượng sử dụng, giá trị mang lại, kết quả mong đợi, yêu cầu cấp cao, giới hạn ban đầu.

- Dự án: VComm ERP
- Trạng thái: Đang soạn (khảo sát lại toàn bộ quy trình — GĐ BA / Thiết kế)
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05
- Cơ sở mã nguồn khảo sát: bản clone sạch `_recovery_V-com-ERP` (origin/main), commit mới nhất `128dd2f` (`fix(db): báo lỗi ghi payments thay vì nuốt thầm (pattern #74)`).

## 1. Tên sản phẩm và định vị

VComm ERP là hệ sinh thái quản trị doanh nghiệp đa mô-đun: thương mại điện tử, bán lẻ/POS (iPOS), quản lý kho, nhân sự/tiền lương, kế toán, trung tâm người bán (Seller Centre), đối soát (Settlement), loyalty, mua chung (group-buy), và F2B2B. Triển khai dưới dạng ứng dụng web đơn (SPA) được phục vụ qua một máy chủ Node/Express kết hợp Vite SSR (`server.ts`).

## 2. Vấn đề cần giải quyết

Doanh nghiệp vừa và nhỏ thường dùng các công cụ rời rạc (Excel, phần mềm kế toán đứng riêng, POS riêng). VComm gộp nghiệp vụ bán hàng → kho → nhân sự → kế toán thành một luồng dữ liệu liên tục, hướng tới chuẩn kế toán Việt Nam Thông tư 99/2025/TT-BTC.

## 3. Mục tiêu sản phẩm

- Một luồng dữ liệu từ đơn hàng đến bút toán kế toán (single source of truth).
- Đa doanh nghiệp (multi-tenant) trên một cơ sở dữ liệu Supabase dùng chung, phân cách bằng cột `tenant_id`.
- Tuân thủ Thông tư 99/2025/TT-BTC (hiệu lực 01/01/2026), thay thế Thông tư 200/2014.
- Cung cấp trung tâm người bán và cổng tích hợp mở (Open API) cho đối tác.

## 4. Đối tượng sử dụng

Người quản lý/owner doanh nghiệp, kế toán, thủ kho, nhân viên POS, nhân sự, và người bán (seller). Chi tiết vai trò xem `05_Vai_tro_nguoi_dung.md`.

## 5. Giá trị mang lại

- Giảm thao tác thủ công đối soát.
- Truy xuất được luồng nghiệp vụ (audit trail) qua bảng `domain_events`.
- Báo cáo tài chính theo chuẩn TT99.

## 6. Kết quả mong đợi (sau khảo sát)

Bộ 20 tệp thiết kế này là kết quả khảo sát lại, làm cơ sở cho các GĐ Code / Test / Release. Mọi phát biểu đều trỏ đến đường dẫn tệp và số dòng mã nguồn thực tế (nguyên tắc "bằng chứng trong tài liệu").

## 7. Yêu cầu cấp cao (đã có trong mã)

- Hệ thống phải báo lỗi rõ ràng khi ghi CSDL thất bại, không nuốt lỗi thầm — cơ chế chuẩn `src/services/writeFailure.ts`, đã áp dụng tại `src/services/dbService.ts:2134` (`reportWriteFailure`).
- Khóa sổ kế toán dùng vân tay giữ dấu, chống sửa sổ sau khóa — `src/services/ledgerClosing.ts` (`closingCanonical` + `hashLedgerClosing`, SHA-256).
- Phân quyền đa doanh nghiệp qua cột `tenant_id` (`src/services/dbService.ts:150`, mặc định `tenant-vcomm-prod-01`).

## 8. Giới hạn ban đầu của đợt khảo sát

- Chỉ khảo sát mã nguồn hiện có; chưa thiết kế lại.
- Một số rủi ro bảo mật / multi-tenant còn mở (xem `19_Bao_mat.md`, `14_Dac_ta_API.md`).

## Bằng chứng (evidence)

| Hạng mục | Đường dẫn tệp / số dòng |
|---|---|
| Máy chủ hợp nhất (Express + Vite SSR), cổng cấu hình | `server.ts:119` |
| Lớp dữ liệu Firestore-compat trên Supabase | `src/services/dbService.ts` |
| Kế toán TT99/2025 (thay thế TT200/2014) | `src/services/tt99Service.ts:18`, `:20` |
| Vân tay khóa sổ giữ dấu | `src/services/ledgerClosing.ts:31`, `:60` |
| Thành phần giao diện | 76 tệp `.tsx` tại `src/components` (mức 1) |

## Chưa xác minh được

- Quy mô thực tế số người dùng / doanh nghiệp đang hoạt động trên Production (không truy cập được CSDL thực).
- Kết quả đo lường hiệu năng dưới tải lớn (chưa có benchmark).
- Trạng thái triển khai thực tế của các trigger CSDL (`scripts/setup_cross_module_triggers.sql`) trên môi trường Production — chưa xác nhận đã chạy thành công.
- Số lượng doanh nghiệp (tenant) thực sự tách biệt dữ liệu đúng cách qua RLS — cần truy cập Supabase để kiểm tra.
