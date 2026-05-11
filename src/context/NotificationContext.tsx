import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { db, auth } from '../lib/firebase';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, limit, serverTimestamp, where
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  timestamp: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (title: string, message: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: '1', title: 'Đơn hàng mới', message: 'Bạn có 12 đơn hàng mới chờ xử lý từ Shopee.', isRead: false, timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: '2', title: 'Cảnh báo tồn kho', message: 'Sản phẩm "iPhone 15 Pro Max" sắp hết hàng.', isRead: false, timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: '3', title: 'Cập nhật hệ thống', message: 'Sàn thương mại điện tử đã cập nhật mức phí mới.', isRead: true, timestamp: new Date(Date.now() - 1000 * 3600 * 2).toISOString() },
];

function loadLocalNotifications(): AppNotification[] {
  try {
    const saved = localStorage.getItem('app_notifications');
    if (!saved) return MOCK_NOTIFICATIONS;
    const parsed = JSON.parse(saved) as unknown;
    if (!Array.isArray(parsed)) return MOCK_NOTIFICATIONS;
    return parsed as AppNotification[];
  } catch {
    return MOCK_NOTIFICATIONS;
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(loadLocalNotifications);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId) {
      const saved = localStorage.getItem('app_notifications');
      if (saved) {
        try { setNotifications(JSON.parse(saved)); } catch { /* ignore */ }
      }
      return;
    }

    const q = query(
      collection(db, 'notifications', userId, 'items'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      const items: AppNotification[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title ?? '',
          message: data.message ?? '',
          isRead: data.isRead ?? false,
          timestamp: data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
        };
      });
      setNotifications(items.length > 0 ? items : MOCK_NOTIFICATIONS);
    }, (err) => {
      console.error('Notifications snapshot error:', err);
    });

    return () => unsub();
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      localStorage.setItem('app_notifications', JSON.stringify(notifications));
    }
  }, [notifications, userId]);

  const addNotification = (title: string, message: string) => {
    if (userId) {
      addDoc(collection(db, 'notifications', userId, 'items'), {
        title,
        message,
        isRead: false,
        createdAt: serverTimestamp(),
      }).catch(err => console.error('addNotification error:', err));
    } else {
      const newNotif: AppNotification = {
        id: Date.now().toString(),
        title,
        message,
        isRead: false,
        timestamp: new Date().toISOString(),
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const markAsRead = (id: string) => {
    if (userId) {
      updateDoc(doc(db, 'notifications', userId, 'items', id), { isRead: true })
        .catch(err => console.error('markAsRead error:', err));
    } else {
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    }
  };

  const markAllAsRead = () => {
    if (userId) {
      notifications.filter(n => !n.isRead).forEach(n => {
        updateDoc(doc(db, 'notifications', userId!, 'items', n.id), { isRead: true })
          .catch(err => console.error('markAllAsRead error:', err));
      });
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const clearAll = () => {
    if (userId) {
      notifications.forEach(n => {
        deleteDoc(doc(db, 'notifications', userId!, 'items', n.id))
          .catch(err => console.error('clearAll error:', err));
      });
    } else {
      setNotifications([]);
    }
  };

  const value = useMemo(() => ({
    notifications,
    unreadCount: notifications.filter(n => !n.isRead).length,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  }), [notifications, userId]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}
