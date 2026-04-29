import React, { createContext, useContext, useState, useEffect } from 'react';

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

export function NotificationProvider({ children }: { children: React.ReactNode }) {
 const [notifications, setNotifications] = useState<AppNotification[]>(() => {
 const saved = localStorage.getItem('app_notifications');
 return saved ? JSON.parse(saved) : MOCK_NOTIFICATIONS;
 });

 useEffect(() => {
 localStorage.setItem('app_notifications', JSON.stringify(notifications));
 }, [notifications]);

 const addNotification = (title: string, message: string) => {
 const newNotif: AppNotification = {
 id: Date.now().toString(),
 title,
 message,
 isRead: false,
 timestamp: new Date().toISOString()
 };
 setNotifications(prev => [newNotif, ...prev]);
 };

 const markAsRead = (id: string) => {
 setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
 };

 const markAllAsRead = () => {
 setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
 };

 const clearAll = () => {
 setNotifications([]);
 };

 const unreadCount = notifications.filter(n => !n.isRead).length;

 return (
 <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll }}>
 {children}
 </NotificationContext.Provider>
 );
}

export function useNotifications() {
 const context = useContext(NotificationContext);
 if (!context) {
 throw new Error('useNotifications must be used within a NotificationProvider');
 }
 return context;
}
