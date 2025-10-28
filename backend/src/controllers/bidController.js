import prisma from '../lib/prisma.js';

// Fungsi Internal: Memindahkan Produk ke Cart setelah Lelang Sukses
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
      include: {
        bids: { orderBy: { amount: 'desc' }, take: 1 },
        seller: { select: { id: true } }
      },
    });

    if (!product) return res.status(404).json({ message: 'Product not found.' });
    if (product.seller.id === userId) return res.status(403).json({ message: 'You cannot bid on your own product.' });
    if (product.saleType !== 'auction' || product.auctionStatus !== 'running') {
      return res.status(400).json({ message: 'This product is not currently in an active auction.' });
    }
    if (product.endTime && new Date(product.endTime) < new Date()) {
      return res.status(400).json({ message: 'The auction for this product has ended.' });
    }

    const highestBidValue = product.bids.length > 0 ? parseFloat(product.bids[0].amount) : null;
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
            include: { bids: { orderBy: { amount: 'desc' }, take: 1 } },
        });

        if (!product || product.sellerId !== sellerId) {
            return res.status(404).json({ message: 'Product not found or you are not the owner.' });
        }
        
        // --- PERBAIKAN DI SINI ---
        if (product.status === 'cancelled_by_buyer') {
            return res.status(400).json({ message: 'Cannot finalize a cancelled auction. Please re-auction it instead.' });
        }
        // --- AKHIR PERBAIKAN ---

        if (product.status === 'sold') {
             return res.status(400).json({ message: 'This product has already been sold.' });
        }
        if (product.bids.length === 0) {
            return res.status(400).json({ message: 'Cannot finalize auction with no bids. You can re-auction it instead.' });
        }
        
        const winningBid = product.bids[0];
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