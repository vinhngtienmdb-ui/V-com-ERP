-- 006_harden_domain_events_rls.sql
-- ===========================================================================
-- M2 (audit, 2026-09-09): Thu hẹp chính sách RLS quá lỏng trên bảng domain_events.
--
-- Bối cảnh:
--   Chính sách cũ (002_outbox_domain_events.sql:112) dùng:
--     USING (tenant_id = (auth.jwt() ->> 'tenant_id') OR tenant_id = 'tenant-vcomm-prod-01')
--   Cụm `OR tenant_id = 'tenant-vcomm-prod-01'` khiến BẤT KỲ ai có anon key
--   (kể cả CHƯA đăng nhập) đều đọc/ghi được nhật ký kiểm toán của tenant mặc định.
--
-- Tại sao KHÔNG xóa hẳn cụm mặc định:
--   - Worker outbox CHÍNH chạy ở TRÌNH DUYỆT (App.tsx:103 -> startClientOutboxWorker)
--     bằng anon client + phiên người dùng (outboxWorker.ts yêu cầu "ĐÃ ĐĂNG NHẬP").
--   - JWT trình duyệt KHÔNG mang claim `tenant_id` -> auth.jwt() ->> 'tenant_id' = NULL.
--   - Toàn bộ sự kiện publish dưới tenant mặc định (publishDomainEvent mặc định
--     DEFAULT_TENANT_ID; anon client không có tenant_id). Worker cần SELECT/UPDATE/
--     DELETE hàng default-tenant để claim/ack. Nếu bỏ hẳn cụm mặc định, worker
--     (anon) sẽ KHÔNG thấy sự kiện nào -> outbox kẹt -> không hạch toán (tệ hơn).
--
-- Hướng xử lý an toàn (không phá worker):
--   Giữ quyền truy cập tenant mặc định NHƯNG bắt buộc ĐÃ ĐĂNG NHẬP
--   (auth.uid() IS NOT NULL). Như vậy:
--     · Kẻ tấn công CHỈ có anon key, CHƯA đăng nhập -> BỊ CHẶN (đóng lỗ hổng lớn nhất).
--     · Worker trình duyệt (đã đăng nhập) -> vẫn claim được sự kiện bình thường.
--     · Nếu sau này JWT mang claim tenant_id -> điều kiện đầu tiên đã cách ly đúng.
--
-- Lỗ hổng CÒN LẠI (ghi rõ để xử lý tiếp, thêm vào Checklist M2.1):
--   Người dùng ĐÃ đăng nhập nào cũng đọc được tenant mặc định. Sửa triệt để bằng:
--     (a) phát hành JWT mang claim tenant_id (Supabase custom claims), hoặc
--     (b) chỉ cho phép service_role (worker server-side OUTBOX_WORKER=1) truy cập
--         domain_events, chuyển publish/claim sang service-role.
-- ===========================================================================

BEGIN;

-- 1. Gỡ policy cũ (quá lỏng, cho phép anon chưa đăng nhập truy cập tenant mặc định).
DROP POLICY IF EXISTS domain_events_tenant_isolation ON public.domain_events;

-- 2. Policy mới: cách ly theo tenant; tenant mặc định chỉ cho phép khi ĐÃ đăng nhập.
CREATE POLICY domain_events_tenant_isolation ON public.domain_events
  FOR ALL
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')
    OR (tenant_id = 'tenant-vcomm-prod-01' AND auth.uid() IS NOT NULL)
  );

COMMENT ON POLICY domain_events_tenant_isolation ON public.domain_events IS
  'M2 hardening: tenant isolation; default-tenant access requires an authenticated session (auth.uid() IS NOT NULL) so an unauthenticated anon key cannot read/write the audit log. Full fix needs tenant_id JWT claims or service-role-only worker.';

COMMIT;
