import { useCallback } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
    if (!user) return;
    try {
      await addDoc(collection(db, 'audit_logs'), {
        action,
        targetId: targetId ?? null,
        targetLabel: targetLabel ?? null,
        meta: meta ?? null,
        actorUid: user.uid,
        actorEmail: user.email,
        actorName: user.displayName ?? user.email,
        timestamp: serverTimestamp(),
        path: window.location.pathname,
      });
    } catch {
      // Non-blocking — audit failures must not interrupt UX
    }
  }, []);

  return { log };
}
