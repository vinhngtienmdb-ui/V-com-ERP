import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface StoreNode {
  id: string;
  name: string;
  address: string;
  domain: string;
  companyId: string;
  companyName: string;
}

interface StoreContextType {
  activeStore: StoreNode | null;
  setActiveStore: (store: StoreNode | null) => void;
  availableStores: StoreNode[];
}

const StoreContext = createContext<StoreContextType>({
  activeStore: null,
  setActiveStore: () => {},
  availableStores: [],
});

const DEMO_STORES: StoreNode[] = [
  { id: 'STORE_001', name: 'Chi nhánh Quận 1', address: '123 Lê Lợi, Q.1, TP.HCM', domain: 'sg1.v-erp.com', companyId: 'COMP_001', companyName: 'Cửa hàng Cà phê A' },
  { id: 'STORE_002', name: 'Chi nhánh Cầu Giấy', address: '45 Xuân Thủy, Cầu Giấy, HN', domain: 'hn1.v-erp.com', companyId: 'COMP_001', companyName: 'Cửa hàng Cà phê A' },
  { id: 'STORE_003', name: 'Chi nhánh Hải Châu', address: '99 Bạch Đằng, Đà Nẵng', domain: 'dn.v-erp.com', companyId: 'COMP_002', companyName: 'Trà Sữa B' },
];

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeStore, setActiveStore] = useState<StoreNode | null>(null);

  // In a real app, availableStores would depend on the user's role and assignments fetched from Firestore.
  const availableStores = DEMO_STORES; 

  useEffect(() => {
    if (!user) {
      setActiveStore(null);
    }
  }, [user]);

  return (
    <StoreContext.Provider value={{ activeStore, setActiveStore, availableStores }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
