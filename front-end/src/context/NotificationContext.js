// src/context/NotificationContext.js
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store', // Selalu ambil data notifikasi terbaru
            });
            if (!res.ok) throw new Error('Gagal memuat notifikasi.');
            const data = await res.json();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (error) {
            console.error("Gagal memuat notifikasi:", error);
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Ambil notifikasi saat user login
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Fungsi untuk menandai satu notif sebagai terbaca
    const markAsRead = async (notificationId) => {
        // Cek apakah sudah dibaca
        const isAlreadyRead = notifications.find(n => n.id === notificationId)?.isRead;
        if (isAlreadyRead) return; // Jangan lakukan apa-apa

        // Update UI secara optimis (langsung)
        setNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        // Panggil API di background
        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            // Jika sukses, UI sudah benar.
        } catch (error) {
            toast.error('Gagal menandai notifikasi');
            fetchNotifications(); // Rollback (ambil ulang data) jika API gagal
        }
    };

    // Fungsi untuk menandai SEMUA sebagai terbaca
    const markAllAsRead = async () => {
        if (unreadCount === 0) return;
        
        // Update UI secara optimis
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        // Panggil API di background
        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
            });
        } catch (error) {
            toast.error('Gagal menandai semua notifikasi');
            fetchNotifications(); // Rollback jika gagal
        }
    };

    const value = { 
        notifications, 
        unreadCount, 
        isLoading, 
        fetchNotifications, 
        markAsRead, 
        markAllAsRead 
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    return useContext(NotificationContext);
};