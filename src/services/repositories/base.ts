import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp,
  QueryConstraint, DocumentData,
} from 'firebase/firestore';
import { ZodSchema } from 'zod';
import { db, handleFirestoreError } from '../../lib/firebase';

/**
 * Repository "khung" — đóng gói thao tác Firestore với schema validation.
 * Mọi truy cập Firestore trong feature code phải đi qua repository, không
 * import trực tiếp `firebase/firestore` ở component.
 */
export function makeRepository<T extends { id: string }>(opts: {
  collectionName: string;
  schema: ZodSchema<T>;
}) {
  const { collectionName, schema } = opts;

  function parse(docId: string, raw: DocumentData): T {
    const parsed = schema.safeParse({ id: docId, ...raw });
    if (!parsed.success) {
      console.warn(`[${collectionName}/${docId}] schema mismatch:`, parsed.error.flatten());
      return { id: docId, ...raw } as T;
    }
    return parsed.data;
  }

  async function getById(id: string): Promise<T | null> {
    try {
      const snap = await getDoc(doc(db, collectionName, id));
      return snap.exists() ? parse(snap.id, snap.data()) : null;
    } catch (err) {
      handleFirestoreError(err, 'get', `${collectionName}/${id}`);
      return null;
    }
  }

  async function list(constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const q = constraints.length ? query(collection(db, collectionName), ...constraints) : collection(db, collectionName);
      const snap = await getDocs(q as any);
      return snap.docs.map((d) => parse(d.id, d.data()));
    } catch (err) {
      handleFirestoreError(err, 'list', collectionName);
      return [];
    }
  }

  async function create(data: Omit<T, 'id'>): Promise<string> {
    try {
      const ref = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return ref.id;
    } catch (err) {
      handleFirestoreError(err, 'create', collectionName);
      throw err;
    }
  }

  async function update(id: string, patch: Partial<Omit<T, 'id'>>): Promise<void> {
    try {
      await updateDoc(doc(db, collectionName, id), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, 'update', `${collectionName}/${id}`);
      throw err;
    }
  }

  async function remove(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err) {
      handleFirestoreError(err, 'delete', `${collectionName}/${id}`);
      throw err;
    }
  }

  function subscribe(constraints: QueryConstraint[], cb: (items: T[]) => void): () => void {
    const q = constraints.length ? query(collection(db, collectionName), ...constraints) : collection(db, collectionName);
    return onSnapshot(q as any, (snap) => {
      cb(snap.docs.map((d) => parse(d.id, d.data())));
    });
  }

  return { getById, list, create, update, remove, subscribe, where, orderBy, limit };
}
