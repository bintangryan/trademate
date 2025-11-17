// src/controllers/auctionController.js
import prisma from '../lib/prisma.js';
// --- 1. Impor createNotification ---
import { createNotification } from './notificationController.js';

// FUNGSI BARU: Untuk halaman "Lelang Saya" di sisi pembeli
export const getBuyerAuctions = async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. Dapatkan semua ID produk unik yang pernah di-bid oleh user
        const userBids = await prisma.bid.findMany({
            where: { userId },
            distinct: ['productId'],
            select: { productId: true },
        });

        if (userBids.length === 0) {
            return res.status(200).json({ auctions: [] });
        }

        const productIds = userBids.map(bid => bid.productId);

        // 2. Ambil detail lengkap untuk produk-produk tersebut
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            include: {
                images: { take: 1 }, // Ambil satu gambar saja untuk preview
                bids: {
                    orderBy: { amount: 'desc' }, // Urutkan semua bid dari tertinggi
                },
            },
            orderBy: { endTime: 'desc' }
        });

        // 3. Proses data untuk dikirim ke frontend
        const auctions = products.map(product => {
            const highestBid = product.bids[0] || null;
            const userHighestBid = product.bids.find(b => b.userId === userId); // Bid tertinggi user ini di produk ini
            
            return {
                ...product,
                highestBid,
                userHighestBid,
            };
        });

        res.status(200).json({ auctions });

    } catch (error) {
        console.error('Get buyer auctions error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};


// FUNGSI BARU: Untuk memeriksa timeout (dipindahkan dari auctionFinalizer)
export const checkReservedTimeout = async (req, res) => {
    try {
        const TIMEOUT_MINUTES = 720; 
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - (TIMEOUT_MINUTES * 60 * 1000));
        
        // 1. Cari produk 'reserved' dari lelang yang waktunya sudah lewat
        const timedOutProducts = await prisma.product.findMany({
            where: {
                status: 'reserved',
                saleType: 'auction', // Hanya targetkan produk lelang
                reservedAt: { 
                    lt: cutoffTime
                }
            },
            // --- 2. Ambil 'name' dan 'sellerId' ---
            select: { id: true, auctionWinnerId: true, name: true, sellerId: true }
        });

        if (timedOutProducts.length === 0) {
            const message = `Timeout check complete at ${now.toLocaleTimeString()}: No timed-out products found.`;
            console.log(message);
            if (res) return res.status(200).json({ message, resetCount: 0 });
            return;
        }

        let resetCount = 0;
        await prisma.$transaction(async (tx) => {
            for (const product of timedOutProducts) {
                // Hapus item dari keranjang pemenang
                await tx.cartItem.deleteMany({
                    where: {
                        productId: product.id,
                        cart: { userId: product.auctionWinnerId }
                    }
                });

                // Reset status produk
                await tx.product.update({
                    where: { id: product.id },
                    data: {
                        status: 'cancelled_by_buyer', 
                        auctionStatus: 'ended',
                        reservedAt: null,
                        auctionWinnerId: null
                    }
                });
                
                // --- 3. KIRIM NOTIFIKASI KE SELLER ---
                await createNotification(
                    product.sellerId,
                    'auction_failed_buyer',
                    `Pemenang lelang "${product.name}" kehabisan waktu checkout. Lelang ulang produk Anda !`,
                    '/dashboard/auctions'
                );
                // ------------------------------------
                
                resetCount++;
            }
        });

        const message = `Timeout check complete. ${resetCount} product(s) have been reset.`;
        console.log(message);
        if (res) {
            return res.status(200).json({ message, resetCount });
        }
        
    } catch (error) {
        console.error('Timeout checker error:', error);
        if (res) {
            res.status(500).json({ message: 'Internal server error during timeout check.' });
        }
    }
};