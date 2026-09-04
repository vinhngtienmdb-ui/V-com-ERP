import { useCallback } from 'react';
import { auth } from '../services/dbService';
// GĐ 2.6 — audit trail: một writer, một định dạng.
import { logActivity } from '../services/auditTrailService';

export type AuditAction =
  | 'order.status_changed' | 'order.created' | 'order.deleted'
  | 'finance.transaction_created' | 'finance.transaction_deleted'
  | 'product.created' | 'product.updated' | 'product.deleted'
  | 'customer.created' | 'customer.updated'
  | 'hr.staff_created' | 'hr.staff_updated'
  | 'settings.updated' | 'site_config.updated'
  | 'request.submitted' | 'request.approved' | 'request.rejected'
  | string;

interface AuditEntry {
  action: AuditAction;
  targetId?: string;
  targetLabel?: string;
  meta?: Record<string, unknown>;
}

export function useAuditLog() {
  const log = useCallback(async ({ action, targetId, targetLabel, meta }: AuditEntry) => {
    const user = auth.currentUser;

    // ⚠️ Thay đổi hành vi so với bản cũ: bản cũ `if (!user) return;` → mọi thao
    // tác của phiên chưa đăng nhập (hoặc worker nền) BIẾN MẤT khỏi audit mà
    // không để lại dấu vết. Audit trail mà tự quyết định "người này không quan
    // trọng" thì không còn là audit.
    // → Vẫn ghi, với actor rỗng và status đánh dấu rõ.
    const actor = user
      ? {
          uid: user.uid,
          email: user.email ?? null,
          name: (user as { displayName?: string | null }).displayName ?? user.email ?? null,
        }
      : { uid: null, email: null, name: null };

    // Non-blocking — lỗi ghi audit không được phép chặn luồng nghiệp vụ.
    // `logActivity` đã tự fail-soft; `.catch` ở đây chỉ để tránh unhandled rejection.
    logActivity({
      action,
      actor,
      targetId: targetId ?? null,
      targetLabel: targetLabel ?? null,
      details: meta ?? null,
    }).catch(() => {
      /* đã được log bên trong auditTrailService */
    });
  }, []);

  return { log };
}
