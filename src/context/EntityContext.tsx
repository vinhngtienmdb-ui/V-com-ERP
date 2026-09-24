import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export type EntityType = 'customer' | 'order' | 'employee' | 'asset' | 'invoice' | 'ticket';

export interface EntityReference {
  type: EntityType;
  id: string;
  title?: string;
  subtitle?: string;
  metadata?: Record<string, any>;
}

interface EntityContextType {
  activeEntity: EntityReference | null;
  isOpen: boolean;
  openPeek: (type: EntityType, id: string, extra?: Partial<EntityReference>) => void;
  closePeek: () => void;
  navigateToEntityApp: (type: EntityType, id: string) => void;
}

const EntityContext = createContext<EntityContextType | undefined>(undefined);

export function EntityProvider({ children }: { children: React.ReactNode }) {
  const [activeEntity, setActiveEntity] = useState<EntityReference | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const openPeek = useCallback((type: EntityType, id: string, extra?: Partial<EntityReference>) => {
    setActiveEntity({
      type,
      id,
      ...extra,
    });
    setIsOpen(true);
  }, []);

  const closePeek = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setActiveEntity(null), 300);
  }, []);

  const navigateToEntityApp = useCallback((type: EntityType, id: string) => {
    closePeek();
    switch (type) {
      case 'customer':
        navigate(`/customers?search=${encodeURIComponent(id)}`);
        break;
      case 'order':
        navigate(`/orders?orderId=${encodeURIComponent(id)}`);
        break;
      case 'employee':
        navigate(`/hr?search=${encodeURIComponent(id)}`);
        break;
      case 'asset':
        navigate(`/assets?search=${encodeURIComponent(id)}`);
        break;
      case 'invoice':
        navigate(`/invoices?search=${encodeURIComponent(id)}`);
        break;
      case 'ticket':
        navigate(`/cskh?ticketId=${encodeURIComponent(id)}`);
        break;
    }
  }, [navigate, closePeek]);

  return (
    <EntityContext.Provider
      value={{
        activeEntity,
        isOpen,
        openPeek,
        closePeek,
        navigateToEntityApp,
      }}
    >
      {children}
    </EntityContext.Provider>
  );
}

export function useEntityPeek() {
  const context = useContext(EntityContext);
  if (!context) {
    throw new Error('useEntityPeek must be used within an EntityProvider');
  }
  return context;
}
