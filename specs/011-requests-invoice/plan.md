# Implementation Plan: Duyệt đề xuất đa cấp & Hóa đơn (Phase 5)

**Branch**: `011-requests-invoice` | **Date**: 2026-07-06 | **Spec**: [spec.md](./spec.md)

## Summary
Kế hoạch này triển khai:
1. **Kiểm soát hạn mức tài chính phê duyệt**: Thêm phân quyền kiểm tra hạn mức cho `Trưởng phòng` (tối đa 20Mđ) và `Giám đốc` (vô hạn) đối với các đề xuất có ghi nhận tiền.
2. **Cập nhật & đồng bộ hóa dữ liệu duyệt đa cấp**: Cải tiến `handleStatusChange` trong `RequestHub.tsx` để lưu đầy đủ các trạng thái `currentLevel`, `approvalLog` vào database Supabase khi đề xuất được duyệt từng cấp.
3. **Tự động hóa thông báo Zalo ZNS**: Kích hoạt gửi tin nhắn ZNS báo trạng thái đề xuất khi được phê duyệt thành công hoặc bị từ chối.

## Proposed Changes

### UI & Workflow Logic

#### [MODIFY] [RequestHub.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/RequestHub.tsx)
- Cập nhật hàm `handleStatusChange` để kiểm tra phân quyền tài chính của user hiện tại (ví dụ: `role` từ `useAuth`). Nếu đề xuất yêu cầu thanh toán/tạm ứng vượt quá hạn mức vai trò của user, chặn duyệt và thông báo lỗi.
- Đảm bảo cuộc gọi `updateDoc` khi duyệt cấp trung gian hoặc cấp cuối cập nhật đầy đủ: `status`, `currentLevel`, `approvalLog`, và `updatedAt`.
- Gửi thông báo ZNS báo duyệt đề xuất hoàn tất bằng cách gọi `sendZnsNotification` từ `znsService`.

---

### Unit Verification Tests

#### [NEW] [requests_multi_level.test.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/__tests__/requests_multi_level.test.ts)
- Viết các test case xác thực quy trình phân cấp duyệt đề xuất, kiểm soát hạn mức tài chính phê duyệt và đồng bộ hóa database.

## Verification Plan

### Automated Tests
- Chạy test case: `npx vitest run src/__tests__/requests_multi_level.test.ts`.
- Chạy build kiểm tra lỗi tĩnh: `npm run build`.
