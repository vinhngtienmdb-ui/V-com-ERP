import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { auth, db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export interface StoreNode {
  id: string;
  name: string;
  address: string;
  phone?: string;
  domain?: string;
  companyId?: string;
  companyName?: string;
}

interface StoreContextType {
  activeStore: StoreNode | null;
  setActiveStore: (store: StoreNode | null) => void;
  availableStores: StoreNode[];
  loading: boolean;
}

const StoreContext = createContext<StoreContextType>({
  activeStore: null,
  setActiveStore: () => {},
  availableStores: [],
  loading: false,
});

/**
 * Đọc stores user có quyền truy cập:
 * - Admin: tất cả stores.
 * - Khác: chỉ stores mà `request.auth.token.storeIds` chứa.
 *
 * Logic phân quyền thật ở firestore.rules — context này chỉ là UX layer.
 */
export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [activeStore, setActiveStore] = useState<StoreNode | null>(null);
  const [availableStores, setAvailableStores] = useState<StoreNode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setAvailableStores([]);
      setActiveStore(null);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const tokenResult = await auth.currentUser!.getIdTokenResult();
        const storeIds = (tokenResult.claims.storeIds as string[] | undefined) ?? [];

        if (isAdmin) {
          const snap = await getDocs(collection(db, 'stores'));
          if (!cancelled) {
            setAvailableStores(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
          }
        } else if (storeIds.length > 0) {
          // Firestore không cho query `in` quá 10 phần tử — nếu nhiều store thì
          // duyệt từng store theo doc id (acceptable cho người dùng phổ thông).
          const chunks: string[][] = [];
          for (let i = 0; i < storeIds.length; i += 10) chunks.push(storeIds.slice(i, i + 10));
          const all: StoreNode[] = [];
          for (const chunk of chunks) {
            const snap = await getDocs(query(collection(db, 'stores'), where('__name__', 'in', chunk)));
            snap.forEach((d) => all.push({ id: d.id, ...(d.data() as any) }));
          }
          if (!cancelled) setAvailableStores(all);
        } else {
          if (!cancelled) setAvailableStores([]);
        }
      } catch (err) {
        console.warn('[StoreContext] load stores failed:', err);
        if (!cancelled) setAvailableStores([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, isAdmin]);

  return (
    <StoreContext.Provider value={{ activeStore, setActiveStore, availableStores, loading }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
