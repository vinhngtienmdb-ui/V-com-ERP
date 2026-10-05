# Phạm vi

> Phạm vi trong, phạm vi ngoài, chức năng bắt buộc, chức năng ưu tiên, chức năng để giai đoạn sau, giới hạn của phiên bản.

- Dự án: VComm
- Trạng thái: Đang soạn
- Ngày tạo: 2026-10-05
- Ngày cập nhật: 2026-10-05

## 1. Phạm vi trong (in-scope)

Khảo sát bao phủ toàn bộ mã nguồn ứng dụng tại bản clone `_recovery_V-com-ERP`, gồm các mô-đun nghiệp vụ đã hiện diện:

| Mô-đun | Thành phần / dịch vụ chính (bằng chứng) |
|---|---|
| Thương mại điện tử | `src/components/` (trang chủ, giỏ hàng, đơn hàng) |
| Bán lẻ / POS (iPOS) | `server.ts` route `/api/ipos/*` (`:4031`, `:4161`, `:4260`) |
| Quản lý kho | `src/components/` kho; trigger duyệt phiếu kho fail-closed (`src/services/dbService.ts` — `validateVoucherApproval`) |
| Nhân sự / Tiền lương | `src/services/payrollDeclaration.ts`, `src/components/HR.tsx` (tham chiếu) |
| Kế toán (TT99) | `src/services/tt99Service.ts`, `src/services/accountingService.ts`, `src/components/TT99Accounting.tsx`, `src/components/Finance.tsx` |
| Trung tâm người bán (Seller) | `server.ts` route `/api/seller/*` (`:3751` wallet/withdraw) |
| Đối soát (Settlement) | `src/components/Settlement.tsx` |
| Loyalty / điểm thưởng | `src/services/dbService.ts` (`loyalty_points_ledger` trong `RELATIONAL_TABLES:15`) |
| Mua chung (group-buy) / F2B2B | `RELATIONAL_TABLES:15` (`group_buy_sessions`, `f2b2b_pool_orders`) |
| Tích hợp MISA | `src/services/misaService.ts` |
| AI (Gemini) | `src/services/` dùng `@google/genai`; route `/api/gemini/db-query` (`server.ts:1515`) |

## 2. Phạm vi ngoài (out-of-scope) của đợt khảo sát

- Thiết kế lại kiến trúc (chỉ khảo sát hiện trạng).
- Viết mã nguồn mới (thuộc GĐ Code sau này).
- Đánh giá hạ tầng mạng / phần cứng vật lý.
- Kiểm thử xâm nhập (penetration test) thực tế.

## 3. Chức năng bắt buộc (đã có trong mã)

- Ghi nhận đơn hàng và tự động hạch toán (`handleOrderPaymentTrigger`, `src/services/dbService.ts:2099`).
- Khóa sổ kế toán có vân tay chống sửa (`src/services/ledgerClosing.ts`).
- Báo lỗi ghi CSDL thay vì nuốt thầm (`src/services/writeFailure.ts`, áp dụng `:2134`).
- Phân cách dữ liệu đa doanh nghiệp (`tenant_id`, `src/services/dbService.ts:150`).

## 4. Chức năng ưu tiên (nên có, chưa đủ)

- Bảo mật thống nhất cho 86 route API (`server.ts`) — hiện chỉ 23 route có guard.
- Giao dịch nguyên tử (transaction) cho đường tiền — hiện `dbService.ts` không có cơ chế transaction.
- RLS đầy đủ cho `domain_events` — hiện chưa có policy.

## 5. Chức năng để giai đoạn sau

- Hệ thống ví điện tử nội bộ đầy đủ (hiện chỉ có `updateWalletBalance` phiên bản sơ khai, chưa atomic).
- Đóng gói部署 (deploy) đa môi trường tự động hóa.

## 6. Giới hạn của phiên bản khảo sát

Đây là tài liệu khảo sát hiện trạng (as-is), không phải thiết kế tương lai (to-be). Các số liệu dòng mã mang tính thời điểm của commit `128dd2f`.

## Bằng chứng (evidence)

- Danh sách bảng quan hệ: `src/services/dbService.ts:15` (`RELATIONAL_TABLES`).
- Route iPOS / Seller / Gemini: `server.ts:4031`, `:4161`, `:3751`, `:1515`.
- Payroll / HR: `src/services/payrollDeclaration.ts`.
- MISA: `src/services/misaService.ts`.

## Chưa xác minh được

- Phân loại chính xác từng tệp `.tsx` (76 tệp) vào mô-đun nào — cần duyệt thủ công từng tệp.
- Mức độ hoàn thiện thực tế của từng mô-đun (nhiều mô-đun có thể ở dạng khung).
- Các môi trường (staging / production) và cấu hình tương ứng.
