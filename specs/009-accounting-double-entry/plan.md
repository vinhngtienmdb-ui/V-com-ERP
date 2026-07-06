# Kế hoạch Triển khai: Kế toán Sổ kép & Ví Đối soát (Phase 3)

**Branch**: `009-accounting-double-entry` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

## Summary
Kế hoạch này triển khai:
1. **Hệ thống hạch toán sổ kép tự động**: Khi đơn hàng được cập nhật trạng thái `completed` (hoàn tất), tự động hạch toán Doanh thu & Giá vốn. Khi ví hoa hồng/CTV rút tiền được duyệt, tự động hạch toán giảm nợ phải trả.
2. **Khóa sổ kế toán bất biến**: Chặn tất cả thay đổi/ghi sổ vào `journal_entries` trước/bằng ngày khóa sổ `closingLockDate` cấu hình trong hệ thống.
3. **Ví số dư CTV/Seller**: Thiết lập ràng buộc hạn mức rút tiền tối thiểu, hạn mức ngày.

## Proposed Changes

### Accounting Service

#### [NEW] [accountingService.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/services/accountingService.ts)
- Viết hàm `checkIfPeriodLocked(dateStr)` lấy ngày khóa sổ từ `tenant_settings/config` và kiểm tra.
- Viết hàm `postOrderJournalEntries(order)` tự động hạch toán doanh thu (Nợ 1311 / Có 5111, Có 3331) và giá vốn (Nợ 632 / Có 156) khi đơn hàng hoàn tất.
- Viết hàm `postWithdrawalJournalEntries(withdrawal)` tự động hạch toán khi giải ngân tiền rút ví thành công (Nợ 3388 / Có 1121).

---

### Database Write Protection

#### [MODIFY] [dbService.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/services/dbService.ts)
- Tích hợp hàm `checkIfPeriodLocked` vào `saveJournalEntry` để chặn mọi lệnh ghi sổ vào kỳ kế toán đã đóng ở tầng Database Adapter.

---

### Order Lifecycle Hook

#### [MODIFY] [Orders.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/Orders.tsx)
- Khi cập nhật trạng thái đơn hàng thành `completed`, gọi hàm `postOrderJournalEntries(order)` để hạch toán sổ kép.

---

### Unit Verification Tests

#### [NEW] [accounting_closing.test.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/__tests__/accounting_closing.test.ts)
- Viết các test case kiểm tra:
  - Chặn sửa đổi/ghi sổ chứng từ trước/bằng ngày khóa sổ kế toán.
  - Hạch toán doanh thu và giá vốn hàng bán đúng tỷ lệ tài khoản kế toán.

## Verification Plan

### Automated Tests
- Chạy test: `npx vitest run src/__tests__/accounting_closing.test.ts`.
- Chạy `npm run build` để kiểm tra độ tin cậy tĩnh.
