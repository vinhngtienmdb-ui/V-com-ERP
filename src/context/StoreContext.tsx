import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db, collection, getDocs, query, where, setDoc, doc, DEMO_MODE } from '../services/dbService';
import { safeLocalStorage } from '../lib/storage';

export interface StoreNode {
 id: string;
 name: string;
 address: string;
 phone?: string;
 domain: string;
 companyId: string;
 companyName: string;
 tenantId?: string;
}

interface StoreContextType {
 activeStore: StoreNode | null;
 setActiveStore: (store: StoreNode | null) => void;
 availableStores: StoreNode[];
 loadingStores: boolean;
 // Central cash-flow metrics to consolidate local iPOS state conflicts
 iposCartCount: number;
 iposCartSubtotal: number;
 iposCartDiscount: number;
 iposCartTotal: number;
 setIposCartCount: (count: number) => void;
 setIposCartSubtotal: (subtotal: number) => void;
 setIposCartDiscount: (discount: number) => void;
 setIposCartTotal: (total: number) => void;
}

const StoreContext = createContext<StoreContextType>({
 activeStore: null,
 setActiveStore: () => {},
 availableStores: [],
 loadingStores: false,
 iposCartCount: 0,
 iposCartSubtotal: 0,
 iposCartDiscount: 0,
 iposCartTotal: 0,
 setIposCartCount: () => {},
 setIposCartSubtotal: () => {},
 setIposCartDiscount: () => {},
 setIposCartTotal: () => {},
});

const SEED_STORES: StoreNode[] = [
 { id: 'STORE_001', name: 'Chi nhánh Quận 1 (SaaS)', address: '123 Lê Lợi, Q.1, TP.HCM', domain: 'sg1.v-erp.com', companyId: 'tenant-vcomm-prod-01', companyName: 'VComm Group', tenantId: 'tenant-vcomm-prod-01' },
 { id: 'STORE_002', name: 'Chi nhánh Cầu Giấy (SaaS)', address: '45 Xuân Thủy, Cầu Giấy, HN', domain: 'hn1.v-erp.com', companyId: 'tenant-vcomm-prod-01', companyName: 'VComm Group', tenantId: 'tenant-vcomm-prod-01' },
 { id: 'STORE_003', name: 'Chi nhánh Hải Châu (SaaS)', address: '99 Bạch Đằng, Đà Nẵng', domain: 'dn.v-erp.com', companyId: 'tenant-vcomm-prod-01', companyName: 'VComm Group', tenantId: 'tenant-vcomm-prod-01' },
];

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const { user, staffInfo } = useAuth();
 const [activeStore, setActiveStore] = useState<StoreNode | null>(null);
 const [availableStores, setAvailableStores] = useState<StoreNode[]>([]);
 const [loadingStores, setLoadingStores] = useState(false);

 // Central iPOS cart totals for cash flow consistency
 const [iposCartCount, setIposCartCount] = useState(0);
 const [iposCartSubtotal, setIposCartSubtotal] = useState(0);
 const [iposCartDiscount, setIposCartDiscount] = useState(0);
 const [iposCartTotal, setIposCartTotal] = useState(0);

 useEffect(() => {
   if (!user) {
     setActiveStore(null);
     setAvailableStores([]);
     return;
   }

   const loadStores = async () => {
     setLoadingStores(true);
     try {
       const userTenantId = staffInfo?.tenantId || 'tenant-vcomm-prod-01';
       
       // Query branches on Firestore filtered dynamically by tenantId
       const q = query(collection(db, 'ipos_stores'), where('tenantId', '==', userTenantId));
       const snap = await getDocs(q);

       let stores: StoreNode[] = [];
       
       if (snap.empty && DEMO_MODE) {
         // Seed default stores to Firestore for this tenant under ipos_stores
         const seedPromises = SEED_STORES.map(async (st) => {
           const tenantStore = { ...st, companyId: userTenantId, tenantId: userTenantId };
           await setDoc(doc(db, 'ipos_stores', st.id), tenantStore);
           return tenantStore;
         });
         stores = await Promise.all(seedPromises);
       } else if (snap.empty) {
         stores = [];
       } else {
         stores = snap.docs.map(doc => ({
           id: doc.id,
           ...doc.data()
         } as StoreNode));
       }

       setAvailableStores(stores);

       // Set active store to previously or first available
       if (stores.length > 0) {
         const savedActiveId = safeLocalStorage.getItem('ipos_active_store_id');
         const matched = stores.find(s => s.id === savedActiveId);
         setActiveStore(matched || stores[0]);
       } else {
         setActiveStore(null);
       }
     } catch (err) {
       console.error('Error loading tenant stores from Firestore:', err);
       // Fallback offline tolerance with seed stores
       setAvailableStores(SEED_STORES);
       setActiveStore(SEED_STORES[0]);
     } finally {
       setLoadingStores(false);
     }
   };

   loadStores();
 }, [user, staffInfo]);

 // Save selected store to localStorage
 const handleSetActiveStore = (store: StoreNode | null) => {
   setActiveStore(store);
   if (store) {
     safeLocalStorage.setItem('ipos_active_store_id', store.id);
   } else {
     safeLocalStorage.removeItem('ipos_active_store_id');
   }
 };

 return (
  <StoreContext.Provider value={{ 
    activeStore, 
    setActiveStore: handleSetActiveStore, 
    availableStores, 
    loadingStores,
    iposCartCount,
    iposCartSubtotal,
    iposCartDiscount,
    iposCartTotal,
    setIposCartCount,
    setIposCartSubtotal,
    setIposCartDiscount,
    setIposCartTotal
  }}>
  {children}
  </StoreContext.Provider>
 );
};

export const useStore = () => useContext(StoreContext);
