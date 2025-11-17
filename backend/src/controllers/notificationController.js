// src/controllers/notificationController.js
import prisma from '../lib/prisma.js';

/**
 * FUNGSI INTERNAL (Untuk dipanggil oleh controller lain)
 * Ini adalah fungsi 'pemicu' yang akan kita gunakan nanti.
 */
export const createNotification = async (userId, type, message, link) => {
  try {
    // Pastikan kita tidak mencoba membuat notif untuk user yang tidak ada
    if (!userId) {
        console.warn(`Peringatan: Mencoba membuat notifikasi untuk userId null. Pesan: ${message}`);
        return;
    }
    
    await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        link,
      },
    });
    console.log(`Notifikasi dibuat untuk user ${userId}: ${message}`);
  } catch (error) {
    // Kita log error tapi tidak menghentikan proses utama (misal, proses createOffer)
    console.error(`Gagal membuat notifikasi untuk user ${userId}:`, error);
  }
};

// --- FUNGSI API (Untuk dipanggil oleh frontend) ---

/**
 * GET /api/notifications
 * Mengambil semua notifikasi untuk user yang login
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Batasi 50 notif terbaru
    });

    // Hitung juga jumlah yang belum dibaca
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * PUT /api/notifications/read-all
 * Menandai semua notifikasi user sebagai 'terbaca'
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    res.status(200).json({ message: 'Semua notifikasi ditandai terbaca' });
  } catch (error)
  {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * PUT /api/notifications/:id/read
 * Menandai satu notifikasi spesifik sebagai 'terbaca'
 */
export const markAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const notification = await prisma.notification.findUnique({
            where: { id: parseInt(id) }
        });

        // Validasi kepemilikan notifikasi
        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ message: 'Notifikasi tidak ditemukan' });
        }

        // Update jika belum dibaca
        if (!notification.isRead) {
            await prisma.notification.update({
                where: { id: parseInt(id) },
                data: { isRead: true }
            });
        }
        
        res.status(200).json({ message: 'Notifikasi ditandai terbaca' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}