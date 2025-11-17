// src/controllers/offerController.js
import prisma from '../lib/prisma.js';
// --- 1. Impor fungsi createNotification ---
import { createNotification } from './notificationController.js';

// ... (createCartItemFromOffer tetap sama) ...
const createCartItemFromOffer = async (offer, product, finalPrice) => {
  let cart = await prisma.cart.findUnique({ where: { userId: offer.buyerId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: offer.buyerId } });
  }
  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
      productId: product.id,
    },
  });
  const cartItem = await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: product.id,
      quantity: 1,
      agreedPrice: finalPrice,
    },
  });
  return cartItem;
};


// --- API FUNCTIONS ---

export const createOffer = async (req, res) => {
  try {
    const { productId, offerPrice } = req.body;
    const buyerId = req.user.userId;

    if (!productId || !offerPrice) {
      return res.status(400).json({ message: 'Product ID and offer price are required' });
    }

    const price = parseFloat(offerPrice);
    if (isNaN(price) || price <= 0) {
        return res.status(400).json({ message: 'Invalid offer price' });
    }

    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      // --- Ambil 'name' dan 'sellerId' untuk notifikasi ---
      select: { id: true, sellerId: true, status: true, name: true }
    });

    if (!product || product.status !== 'available') {
      return res.status(404).json({ message: 'Product not found or unavailable for offer' });
    }

    if (product.sellerId === buyerId) {
        return res.status(400).json({ message: 'Cannot make an offer on your own product' });
    }
    
    const existingOffer = await prisma.offer.findFirst({
        where: {
            productId: product.id,
            buyerId,
            status: { in: ['pending', 'countered', 'accepted'] }
        }
    });

    if (existingOffer) {
        if (existingOffer.status === 'accepted') {
             return res.status(400).json({ message: 'Tawaran Anda sudah diterima dan produk ada di keranjang. Segera Checkout !' });
        }
        return res.status(400).json({ message: 'Kamu sudah mengajukan tawaran' });
    }

    const newOffer = await prisma.offer.create({
      data: {
        productId: product.id,
        buyerId,
        offerPrice: price,
        status: 'pending',
      },
    });

    // --- 2. BUAT NOTIFIKASI UNTUK SELLER ---
    const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
    await createNotification(
      product.sellerId,
      'offer_new',
      `Terdapat tawaran baru ${formattedPrice} untuk "${product.name}"`,
      '/dashboard/offers'
    );
    // ------------------------------------

    res.status(201).json({ message: 'Offer created successfully', offer: newOffer });

  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ... (getOffersForSeller tetap sama) ...
export const getOffersForSeller = async (req, res) => {
    try {
        const sellerId = req.user.userId;

        const productsWithOffers = await prisma.product.findMany({
            where: {
                sellerId: sellerId,
                status: { not: 'sold' }, 
                offers: {
                    some: {
                        status: { not: 'declined' } 
                    },
                },
            },
            include: {
                images: { 
                    take: 1
                },
                offers: {
                    where: {
                        status: { not: 'declined' },
                    },
                    include: {
                        buyer: { select: { email: true, profile: { select: { fullName: true } } } },
                    },
                    orderBy: {
                        offerPrice: 'desc',
                    },
                },
            },
        });

        const processedProducts = productsWithOffers.map(product => {
            const offersWithDifference = product.offers.map(offer => {
                const priceDifference = parseFloat(product.price) - parseFloat(offer.offerPrice);
                return { ...offer, priceDifference };
            });
            return { ...product, offers: offersWithDifference };
        });

        res.status(200).json({ productsWithOffers: processedProducts });

    } catch (error) {
        console.error('Get offers for seller error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const sellerRespondToOffer = async (req, res) => {
    try {
        const { offerId } = req.params;
        const sellerId = req.user.userId;
        const { action, counterPrice } = req.body;
        
        // --- Ambil 'name' dari produk dan 'buyerId' dari tawaran ---
        const offer = await prisma.offer.findUnique({
            where: { id: parseInt(offerId) },
            include: { product: { select: { id: true, name: true, sellerId: true, status: true } } }
        });

        if (!offer || offer.product.sellerId !== sellerId) return res.status(404).json({ message: 'Offer not found' });
        
        if (offer.product.status === 'sold') {
             return res.status(400).json({ message: `Product is already ${offer.product.status}` });
        }
        
        if (offer.status !== 'pending') {
             return res.status(400).json({ message: `Offer is already ${offer.status}` });
        }
        
        let updatedOffer;
        switch (action) {
            case 'accept':
                updatedOffer = await prisma.offer.update({
                    where: { id: offer.id },
                    data: { status: 'accepted' },
                });
                await createCartItemFromOffer(offer, offer.product, offer.offerPrice);

                // --- 3. BUAT NOTIFIKASI UNTUK BUYER (ACCEPTED) ---
                await createNotification(
                  offer.buyerId,
                  'offer_accepted',
                  `Selamat! Tawaran Anda untuk "${offer.product.name}" diterima. Segera Checkout !`,
                  '/cart' // Arahkan ke keranjang
                );
                // ---------------------------------------------
                
                return res.status(200).json({ message: 'Offer accepted and item added to cart.', offer: updatedOffer });

            case 'decline':
                updatedOffer = await prisma.offer.update({ where: { id: offer.id }, data: { status: 'declined' } });
                
                // --- 3. BUAT NOTIFIKASI UNTUK BUYER (DECLINED) ---
                await createNotification(
                  offer.buyerId,
                  'offer_declined',
                  `Tawaran Anda untuk "${offer.product.name}" ditolak.`,
                  '/dashboard/buyer-offers'
                );
                // ---------------------------------------------

                return res.status(200).json({ message: 'Offer declined', offer: updatedOffer });

            case 'counter':
                if (!counterPrice) return res.status(400).json({ message: 'Counter price is required' });
                const price = parseFloat(counterPrice);
                if (isNaN(price) || price <= 0) return res.status(400).json({ message: 'Invalid counter price' });
                updatedOffer = await prisma.offer.update({ where: { id: offer.id }, data: { status: 'countered', offerPrice: price } });
                
                // --- 3. BUAT NOTIFIKASI UNTUK BUYER (COUNTERED) ---
                const formattedCounterPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
                await createNotification(
                  offer.buyerId,
                  'offer_countered',
                  `Ada tawaran balik ${formattedCounterPrice} untuk "${offer.product.name}"`,
                  '/dashboard/buyer-offers'
                );
                // ----------------------------------------------

                return res.status(200).json({ message: 'Offer countered', offer: updatedOffer });
                
            default:
                return res.status(400).json({ message: 'Invalid action' });
        }
    } catch (error) {
        console.error('Seller response error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const buyerRespondToCounter = async (req, res) => {
    try {
        const { offerId } = req.params;
        const buyerId = req.user.userId;
        const { action } = req.body;
        
        // --- Ambil 'name' dan 'sellerId' ---
        const offer = await prisma.offer.findUnique({
            where: { id: parseInt(offerId) },
            include: { product: { select: { id: true, name: true, sellerId: true, status: true } } }
        });

        if (!offer || offer.buyerId !== buyerId) {
            return res.status(404).json({ message: 'Offer not found or not yours' });
        }
        if (offer.status !== 'countered') {
            return res.status(400).json({ message: `Cannot respond to an offer that is currently ${offer.status}` });
        }
        
        if (offer.product.status === 'sold') {
            return res.status(400).json({ message: 'Maaf, produk ini sudah terjual oleh penawar lain.' });
        }
        
        let updatedOffer;
        switch (action) {
            case 'accept':
                updatedOffer = await prisma.offer.update({
                    where: { id: offer.id },
                    data: { status: 'accepted' },
                });
                await createCartItemFromOffer(offer, offer.product, offer.offerPrice);
                
                // --- 4. BUAT NOTIFIKASI UNTUK SELLER (BUYER ACCEPTED COUNTER) ---
                await createNotification(
                  offer.product.sellerId,
                  'offer_accepted', // Kita bisa pakai ulang tipe 'offer_accepted'
                  `Pembeli menerima tawaran balik Anda untuk "${offer.product.name}"`,
                  '/dashboard/sales' // Arahkan seller ke penjualan
                );
                // -----------------------------------------------------------

                return res.status(200).json({ message: 'Counter-offer accepted and added to cart', offer: updatedOffer });

            case 'decline':
                updatedOffer = await prisma.offer.update({
                    where: { id: offer.id },
                    data: { status: 'declined' },
                });
                
                // --- (Opsional) Notif ke seller bahwa buyer menolak counter ---
                await createNotification(
                  offer.product.sellerId,
                  'offer_declined',
                  `Pembeli menolak tawaran balik Anda untuk "${offer.product.name}"`,
                  '/dashboard/offers'
                );
                // --------------------------------------------------------

                return res.status(200).json({ message: 'Counter-offer declined', offer: updatedOffer });

            default:
                return res.status(400).json({ message: 'Invalid action' });
        }
    } catch (error) {
        console.error('Buyer response error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ... (getOffersByBuyer tetap sama) ...
export const getOffersByBuyer = async (req, res) => {
    try {
        const buyerId = req.user.userId;
        const offers = await prisma.offer.findMany({
            where: { buyerId: buyerId },
            include: {
                    product: {
                        include: {
                            images: {
                                take: 1
                            }
                        }
                    }
                },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({ offers });
    } catch (error) {
        console.error('Get offers by buyer error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};