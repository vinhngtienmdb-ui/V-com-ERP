import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import admin from 'firebase-admin';
import { REGION } from './config.js';

/**
 * Ghi audit log immutable mỗi khi có thay đổi ở collection nhạy cảm.
 * Logs lưu tại /audit_logs/{auto-id} — client deny write (chỉ Admin SDK ghi).
 *
 * Nguyên tắc:
 *  - Lưu cả before + after (rút gọn) để có thể truy vết.
 *  - Lưu actor uid (request.auth.uid) — extracted từ resource.data nếu app gắn
 *    `updatedBy` field; nếu thiếu thì lưu 'system' (vd: server-side import).
 *  - KHÔNG lưu mật khẩu/PII chi tiết — chỉ field thay đổi.
 */

interface LogEntry {
  collection: string;
  docId: string;
  action: 'create' | 'update' | 'delete';
  actorUid: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  changedKeys: string[];
  timestamp: FirebaseFirestore.FieldValue;
}

function deriveActor(after: Record<string, unknown> | null, before: Record<string, unknown> | null): string {
  const a = (after?.updatedBy ?? after?.staffId ?? after?.uid) as string | undefined;
  const b = (before?.updatedBy ?? before?.staffId ?? before?.uid) as string | undefined;
  return a ?? b ?? 'system';
}

function diffKeys(a: Record<string, unknown> | null, b: Record<string, unknown> | null): string[] {
  const all = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
  const changed: string[] = [];
  for (const k of all) {
    if (JSON.stringify((a ?? {})[k]) !== JSON.stringify((b ?? {})[k])) changed.push(k);
  }
  return changed;
}

function makeTrigger(collection: string) {
  return onDocumentWritten(
    { region: REGION, document: `${collection}/{docId}` },
    async (event) => {
      const before = (event.data?.before.data() ?? null) as Record<string, unknown> | null;
      const after = (event.data?.after.data() ?? null) as Record<string, unknown> | null;
      const docId = event.params.docId;

      let action: LogEntry['action'];
      if (!before && after) action = 'create';
      else if (before && !after) action = 'delete';
      else action = 'update';

      const entry: LogEntry = {
        collection,
        docId,
        action,
        actorUid: deriveActor(after, before),
        before,
        after,
        changedKeys: diffKeys(before, after),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };

      try {
        await admin.firestore().collection('audit_logs').add(entry);
      } catch (err) {
        // Log nhưng KHÔNG throw — audit log thất bại không nên block business write.
        console.error(`[auditLog/${collection}] failed:`, err);
      }
    },
  );
}

// Các collection nhạy cảm cần audit:
export const auditProducts     = makeTrigger('products');
export const auditOrders       = makeTrigger('orders');
export const auditTransactions = makeTrigger('transactions');
export const auditStaff        = makeTrigger('staff');
export const auditStores       = makeTrigger('stores');
export const auditCustomers    = makeTrigger('customers');
export const auditSepayEvents  = makeTrigger('sepay_events');
