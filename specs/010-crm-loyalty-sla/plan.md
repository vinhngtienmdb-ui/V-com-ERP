# Implementation Plan: CRM, CSKH & Điểm Loyalty (Phase 4)

**Branch**: `010-crm-loyalty-sla` | **Date**: 2026-07-06 | **Spec**: [spec.md](./spec.md)

## Summary
Kế hoạch này triển khai:
1. **Ví điểm Loyalty Ledger**: Tạo bảng `loyalty_points_ledger` trong database. Tự động tích lũy điểm khi đơn hàng hoàn thành (10k doanh số = 1 điểm).
2. **Hệ thống phân hạng RFM**: Tự động tính toán các chỉ số RFM (Recency, Frequency, Monetary) khi đơn hàng chuyển sang `completed`, đồng thời cập nhật hạng của khách hàng.
3. **Quản lý Khiếu nại & SLA CSKH**: Tạo và cập nhật trạng thái support ticket, tự động xác định hạn hoàn thành (Urgent = 1h, High = 4h, Medium = 24h, Low = 48h) và cảnh báo vi phạm SLA.

## Proposed Changes

### CRM & Loyalty Service

#### [NEW] [crmService.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/services/crmService.ts)
- Viết hàm `calculateRfmScores(customerId)` quét lịch sử đơn hàng để cập nhật RFM score và tự động phân hạng khách hàng (Đồng, Bạc, Vàng, Bạch Kim, Kim Cương).
- Viết hàm `addLoyaltyPoints(customerId, pointsChange, type, description, refType, refId)` để thực hiện ghi nhận giao dịch ví điểm và cập nhật số dư điểm của khách hàng.
- Viết hàm `createSupportTicket(customerId, subject, priority, type)` để khởi tạo ticket, tự động tính toán deadline SLA (Low: 48h, Medium: 24h, High: 4h, Urgent: 1h).

---

### Database Configurations

#### [MODIFY] [dbService.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/services/dbService.ts)
- Đăng ký các bảng `'loyalty_points_ledger'` và `'support_tickets'` vào `RELATIONAL_TABLES`.
- Cấu hình các thuộc tính cột tương ứng.

---

### Order Completion Integration

#### [MODIFY] [Orders.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/Orders.tsx)
- Khi đơn hàng hoàn tất, tự động gọi `calculateRfmScores(customerId)` và `addLoyaltyPoints(customerId, Math.round(order.total / 10000), 'earn', ...)` để cập nhật dữ liệu CRM của khách hàng.

---

### UI Integration

#### [MODIFY] [CustomerService.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/CustomerService.tsx)
- Liên kết giao diện quản lý khiếu nại CSKH hiển thị cảnh báo quá hạn SLA dựa trên thời gian hiện tại và `slaDeadline`.

---

### Unit Verification Tests

#### [NEW] [crm_loyalty_sla.test.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/__tests__/crm_loyalty_sla.test.ts)
- Viết các test case xác thực công thức tích điểm loyalty, phân khúc khách hàng RFM, và thời hạn SLA.

## Verification Plan

### Automated Tests
- Chạy test case: `npx vitest run src/__tests__/crm_loyalty_sla.test.ts`.
- Chạy build kiểm tra lỗi tĩnh: `npm run build`.
