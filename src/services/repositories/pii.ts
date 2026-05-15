import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../lib/firebase';
import { CustomerPIISchema, type CustomerPIIInput } from './schemas';

/**
 * PII operations cho /customers/{customerId}/pii/main.
 * Chỉ admin/director được rule cho phép (kiểm tra ở firestore.rules).
 *
 * Helper masking: dùng cho hiển thị non-admin (vd '*****6789').
 */

export function maskPhone(phone: string | undefined): string {
  if (!phone) return '';
  if (phone.length <= 4) return phone;
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}

export function maskEmail(email: string | undefined): string {
  if (!email || !email.includes('@')) return email ?? '';
  const [local, domain] = email.split('@');
  if (local.length <= 1) return '*@' + domain;
  return local[0] + '*'.repeat(Math.min(5, local.length - 1)) + '@' + domain;
}

export function maskIdentityCard(id: string | undefined): string {
  if (!id) return '';
  if (id.length <= 4) return id;
  return id.slice(0, 3) + '*'.repeat(id.length - 6) + id.slice(-3);
}

/**
 * Đọc PII của 1 customer. Trả null nếu không có quyền hoặc không tồn tại.
 */
export async function getCustomerPII(customerId: string): Promise<CustomerPIIInput | null> {
  try {
    const snap = await getDoc(doc(db, 'customers', customerId, 'pii', 'main'));
    if (!snap.exists()) return null;
    const parsed = CustomerPIISchema.safeParse({ customerId, ...snap.data() });
    return parsed.success ? parsed.data : null;
  } catch (err) {
    handleFirestoreError(err, 'get', `customers/${customerId}/pii/main`);
    return null;
  }
}

/**
 * Ghi/update PII (admin/director only — rule enforce).
 * Tự cập nhật mask vào customer doc cha (denormalized cho UI thường).
 */
export async function upsertCustomerPII(input: Omit<CustomerPIIInput, 'customerId'> & { customerId: string }): Promise<void> {
  try {
    await setDoc(
      doc(db, 'customers', input.customerId, 'pii', 'main'),
      { ...input, updatedAt: serverTimestamp() },
      { merge: true },
    );
    // Update masked fields lên customer parent doc (UI thường đọc)
    await setDoc(
      doc(db, 'customers', input.customerId),
      {
        phoneMasked: maskPhone(input.fullPhone),
        emailMasked: input.fullEmail ? maskEmail(input.fullEmail) : '',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (err) {
    handleFirestoreError(err, 'write', `customers/${input.customerId}/pii/main`);
    throw err;
  }
}
