// src/controllers/bidController.js
import prisma from '../lib/prisma.js';
// --- 1. Impor fungsi createNotification ---
import { createNotification } from './notificationController.js';

// ... (createCartItemFromAuction tetap sama) ...
const createCartItemFromAuction = async (winnerId, product, winningPrice) => {
    let cart = await prisma.cart.findUnique({ where: { userId: winnerId } });
    if (!cart) {
        cart = await prisma.cart.create({ data: { userId: winnerId } });
    }
    await prisma.cartItem.create({
        data: {
            cartId: cart.id,
            productId: product.id,
            quantity: 1,
            agreedPrice: winningPrice,
        },
    });
};


export const createBid = async (req, res) => {
  try {
    const { productId, amount } = req.body;
    const userId = req.user.userId;

    if (!productId || !amount) {
      return res.status(400).json({ message: 'Product ID and bid amount are required.' });
    }

    const bidAmount = parseFloat(amount);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      return res.status(400).json({ message: 'Invalid bid amount.' });
    }

    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      // --- Ambil 'name' dan 'sellerId' untuk notifikasi ---
      select: { 
          id: true, 
          name: true, 
          sellerId: true, 
          saleType: true, 
          auctionStatus: true, 
          endTime: true, 
          startingPrice: true, 
          bidIncrement: true, 
          bids: { orderBy: { amount: 'desc' }, take: 1 } // Hanya ambil bid tertinggi sebelumnya
      }
    });

    if (!product) return res.status(404).json({ message: 'Product not found.' });
    if (product.sellerId === userId) return res.status(403).json({ message: 'You cannot bid on your own product.' });
    if (product.saleType !== 'auction' || product.auctionStatus !== 'running') {
      return res.status(400).json({ message: 'This product is not currently in an active auction.' });
    }
    if (product.endTime && new Date(product.endTime) < new Date()) {
      return res.status(400).json({ message: 'The auction for this product has ended.' });
    }

    const highestBid = product.bids.length > 0 ? product.bids[0] : null;
    const highestBidValue = highestBid ? parseFloat(highestBid.amount) : null;
    const bidIncrementValue = parseFloat(product.bidIncrement);
    const startingPriceValue = parseFloat(product.startingPrice);
    const requiredMinimum = highestBidValue ? highestBidValue + bidIncrementValue : startingPriceValue; 

    if (bidAmount < requiredMinimum) { 
      return res.status(400).json({ 
        message: `Bid must be at least ${requiredMinimum.toFixed(2)}.` 
      });
    }

    const newBid = await prisma.bid.create({
      data: { productId: product.id, userId: userId, amount: bidAmount },
    });
    
    // --- 2. BUAT NOTIFIKASI ---
    const formattedBid = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(bidAmount);
    
    // 2a. Notif untuk Seller
    await createNotification(
      product.sellerId,
      'bid_new',
      `Bid baru ${formattedBid} untuk "${product.name}"`,
      '/dashboard/auctions'
    );
    
    // 2b. Notif untuk Buyer yang Dikalahkan (jika ada DAN bukan user yang sama)
    if (highestBid && highestBid.userId !== userId) {
        await createNotification(
          highestBid.userId,
          'bid_outbid',
          `Bid Anda untuk "${product.name}" telah dikalahkan. Segera ajukan bid yang lebih tinggi !`,
          '/dashboard/my-bids'
        );
    }
    // -------------------------

    res.status(201).json({ message: 'Bid placed successfully', bid: newBid, currentHighestBid: bidAmount });
  } catch (error) {
    console.error('Create bid error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const finalizeAuction = async (req, res) => {
    try {
        const { productId } = req.params;
        const sellerId = req.user.userId;

        const product = await prisma.product.findUnique({
            where: { id: parseInt(productId) },
            // --- Ambil 'name' dan SEMUA bid untuk notifikasi ---
            select: {
                id: true,
                name: true,
                sellerId: true,
                status: true,
                bids: { 
                    orderBy: { amount: 'desc' } // Ambil SEMUA bid, diurutkan
                }
            }
        });

        if (!product || product.sellerId !== sellerId) {
            return res.status(404).json({ message: 'Product not found or you are not the owner.' });
        }
        
        if (product.status === 'cancelled_by_buyer') {
            return res.status(400).json({ message: 'Cannot finalize a cancelled auction. Please re-auction it instead.' });
        }

        if (product.status === 'sold') {
             return res.status(400).json({ message: 'This product has already been sold.' });
        }
        if (product.bids.length === 0) {
            return res.status(400).json({ message: 'Cannot finalize auction with no bids. You can re-auction it instead.' });
        }
        
        const winningBid = product.bids[0]; // Bid tertinggi adalah pemenangnya
        const winningPrice = parseFloat(winningBid.amount);

        const updatedProduct = await prisma.product.update({
            where: { id: product.id },
            data: {
                auctionWinnerId: winningBid.userId,
                status: 'reserved',
                auctionStatus: 'ended',
                reservedAt: new Date(),
            },
        });

        await createCartItemFromAuction(winningBid.userId, product, winningPrice);
        
        // --- 3. BUAT NOTIFIKASI UNTUK PEMENANG & KALAH ---
        
        // 3a. Notif untuk Pemenang
        await createNotification(
            winningBid.userId,
            'auction_won',
            `Selamat ! Anda memenangkan lelang "${product.name}". Segera checkout !`,
            '/cart'
        );
            
        // 3b. Notif untuk yang Kalah (semua bidder unik selain pemenang)
        const bidderIds = product.bids.map(b => b.userId);
        const uniqueBidderIds = [...new Set(bidderIds)]; // Dapat [userA, userB, userC]
        const losingBidderIds = uniqueBidderIds.filter(id => id !== winningBid.userId);
        
        for (const loserId of losingBidderIds) {
             await createNotification(
                loserId,
                'auction_lost',
                `Periode lelang untuk "${product.name}" telah berakhir.`,
                '/dashboard/my-bids'
             );
        }
        // ------------------------------------------------

        res.status(200).json({
            message: 'Auction finalized! Item added to winner\'s cart.',
            product: updatedProduct
        });

    } catch (error)
    {
        console.error('Finalize auction error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};