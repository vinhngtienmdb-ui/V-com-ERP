import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, handleFirestoreError } from '../../lib/firebase';
import { sellersRepo } from './index';
import type { SellerInput, KycDoc } from './schemas';

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || '';

async function bearer(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  return { Authorization: `Bearer ${await user.getIdToken()}` };
}

/**
 * Tạo seller mới ở trạng thái 'pending_docs'.
 */
export async function createSeller(input: Omit<SellerInput, 'id' | 'status'> & { id?: string }): Promise<string> {
  const id = input.id ?? `SELL_${Date.now()}`;
  await sellersRepo.create({
    ...input,
    id,
    status: 'pending_docs',
    joinedAt: serverTimestamp() as any,
  } as any);
  return id;
}

/**
 * Upload 1 KYC doc lên Storage + append vào seller.kycDocs (atomic).
 * Đường dẫn: sellers/{sellerId}/kyc/{type}_{timestamp}
 */
export async function uploadKycDoc(
  sellerId: string,
  type: KycDoc['type'],
  file: File | Blob,
): Promise<KycDoc> {
  const user = auth.currentUser;
  if (!user) throw new Error('Chưa đăng nhập');

  const storage = getStorage();
  const path = `sellers/${sellerId}/kyc/${type}_${Date.now()}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  const url = await getDownloadURL(ref);

  const newDoc: KycDoc = { type, url, uploadedAt: serverTimestamp() as any };

  try {
    await runTransaction(db, async (tx) => {
      const sellerRef = doc(db, 'sellers', sellerId);
      const snap = await tx.get(sellerRef);
      if (!snap.exists()) throw new Error(`Seller ${sellerId} không tồn tại`);
      const docs = (snap.data().kycDocs as KycDoc[] | undefined) ?? [];
      // Loại bỏ doc cùng type cũ (nếu re-upload)
      const filtered = docs.filter((d) => d.type !== type);
      tx.update(sellerRef, {
        kycDocs: [...filtered, newDoc],
        updatedAt: serverTimestamp(),
      });
    });
    return newDoc;
  } catch (err) {
    handleFirestoreError(err, 'update', `sellers/${sellerId}`);
    throw err;
  }
}

/**
 * Seller submit hồ sơ KYC → đẩy status 'pending_docs' → 'pending_verification'.
 * Yêu cầu tối thiểu có CCCD/CMND (front + back) hoặc GPKD.
 */
export async function submitKyc(sellerId: string): Promise<void> {
  try {
    await runTransaction(db, async (tx) => {
      const sellerRef = doc(db, 'sellers', sellerId);
      const snap = await tx.get(sellerRef);
      if (!snap.exists()) throw new Error(`Seller ${sellerId} không tồn tại`);
      const seller = snap.data() as SellerInput;
      if (seller.status !== 'pending_docs') {
        throw new Error(`Seller đang ở ${seller.status} — không thể submit`);
      }

      const docs = seller.kycDocs ?? [];
      const types = new Set(docs.map((d) => d.type));
      const hasIndividualKyc = types.has('cccd_front') && types.has('cccd_back');
      const hasBusinessKyc = types.has('gpkd');
      if (!hasIndividualKyc && !hasBusinessKyc) {
        throw new Error('Cần upload CCCD (front + back) hoặc GPKD');
      }

      tx.update(sellerRef, {
        status: 'pending_verification',
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    handleFirestoreError(err, 'update', `sellers/${sellerId}`);
    throw err;
  }
}

/**
 * KYC team duyệt — gọi Cloud Function `sellerVerifyKyc` (server validate + tạo wallet).
 */
export async function verifyKyc(
  sellerId: string,
  approved: boolean,
  reason?: string,
): Promise<{ newStatus: string }> {
  const res = await fetch(`${API_BASE}/api/sellers/verify-kyc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await bearer()) },
    body: JSON.stringify({ sellerId, approved, reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown' }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Manager+ activate seller (sau khi verified) → có thể list sản phẩm.
 */
export async function activateSeller(sellerId: string): Promise<void> {
  try {
    await runTransaction(db, async (tx) => {
      const sellerRef = doc(db, 'sellers', sellerId);
      const snap = await tx.get(sellerRef);
      if (!snap.exists()) throw new Error(`Seller ${sellerId} không tồn tại`);
      const seller = snap.data() as SellerInput;
      if (seller.status !== 'verified') {
        throw new Error(`Seller phải ở trạng thái 'verified' (hiện: ${seller.status})`);
      }
      tx.update(sellerRef, {
        status: 'active',
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    handleFirestoreError(err, 'update', `sellers/${sellerId}`);
    throw err;
  }
}
