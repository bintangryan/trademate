import prisma from '../lib/prisma.js';

// --- PERBAIKAN DI FUNGSI INI ---
const createCartItemFromOffer = async (offer, product, finalPrice) => {
  // 1. Dapatkan atau Buat Cart Buyer
  let cart = await prisma.cart.findUnique({ where: { userId: offer.buyerId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: offer.buyerId } });
  }

  // 2. HAPUS ITEM LAMA (JIKA ADA) DARI KERANJANG
  // Ini akan menghapus produk yang sama yang mungkin sudah ditambahkan sebelumnya dengan harga normal
  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
      productId: product.id,
    },
  });

  // 3. Tambahkan item BARU dengan harga yang disepakati
  const cartItem = await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: product.id,
      quantity: 1,
      agreedPrice: finalPrice,
    },
  });
  
  // 4. Ubah status produk menjadi reserved
  await prisma.product.update({
    where: { id: product.id },
    data: { 
      status: 'reserved'
    },
  });

  return cartItem;
};


// --- API FUNCTIONS (Tidak ada perubahan di bawah ini) ---

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
      select: { id: true, sellerId: true, status: true }
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
            status: { in: ['pending', 'countered'] }
        }
    });

    if (existingOffer) {
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

    res.status(201).json({ message: 'Offer created successfully', offer: newOffer });

  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getOffersForSeller = async (req, res) => {
    try {
        const sellerId = req.user.userId;

        // 1. Ambil produk milik seller yang tidak terjual & punya tawaran yang tidak ditolak
        const productsWithOffers = await prisma.product.findMany({
            where: {
                sellerId: sellerId,
                status: { not: 'sold' }, // Jangan tampilkan produk yang sudah terjual
                offers: {
                    some: {
                        status: { not: 'declined' } // Tampilkan selama ada tawaran yg belum ditolak
                    },
                },
            },
            include: {
                images: { // <-- TAMBAHKAN INI
                    take: 1 // Ambil 1 gambar
                },      // <-- TAMBAHKAN INI
                offers: {
                    where: {
                        status: { not: 'declined' },
                    },
                    include: {
                        buyer: { select: { email: true, profile: { select: { fullName: true } } } }, // Ambil juga fullName jika ada
                    },
                    orderBy: {
                        offerPrice: 'desc',
                    },
                },
            },
        });

        // 3. Proses data untuk menambahkan selisih harga
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
        const offer = await prisma.offer.findUnique({
            where: { id: parseInt(offerId) },
            include: { product: true }
        });
        if (!offer || offer.product.sellerId !== sellerId) return res.status(404).json({ message: 'Offer not found' });
        if (offer.product.status !== 'available' && offer.product.status !== 'in_negotiation') return res.status(400).json({ message: `Product is already ${offer.product.status}` });
        if (offer.status !== 'pending') return res.status(400).json({ message: `Offer is already ${offer.status}` });
        
        let updatedOffer;
        switch (action) {
            case 'accept':
                // HANYA update tawaran yang ini menjadi 'accepted'
                updatedOffer = await prisma.offer.update({
                    where: { id: offer.id },
                    data: { status: 'accepted' },
                });
                await createCartItemFromOffer(offer, offer.product, offer.offerPrice);
                return res.status(200).json({ message: 'Offer accepted and item added to cart.', offer: updatedOffer });

            case 'decline':
                updatedOffer = await prisma.offer.update({ where: { id: offer.id }, data: { status: 'declined' } });
                return res.status(200).json({ message: 'Offer declined', offer: updatedOffer });

            case 'counter':
                if (!counterPrice) return res.status(400).json({ message: 'Counter price is required' });
                const price = parseFloat(counterPrice);
                if (isNaN(price) || price <= 0) return res.status(400).json({ message: 'Invalid counter price' });
                updatedOffer = await prisma.offer.update({ where: { id: offer.id }, data: { status: 'countered', offerPrice: price } });
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
        
        const offer = await prisma.offer.findUnique({
            where: { id: parseInt(offerId) },
            include: { product: true }
        });

        if (!offer || offer.buyerId !== buyerId) {
            return res.status(404).json({ message: 'Offer not found or not yours' });
        }
        if (offer.status !== 'countered') {
            return res.status(400).json({ message: `Cannot respond to an offer that is currently ${offer.status}` });
        }
        
        let updatedOffer;

        switch (action) {
            case 'accept':
                updatedOffer = await prisma.offer.update({
                    where: { id: offer.id },
                    data: { status: 'accepted' },
                });
                await createCartItemFromOffer(offer, offer.product, offer.offerPrice);
                return res.status(200).json({ message: 'Counter-offer accepted and added to cart', offer: updatedOffer });

            case 'decline':
                updatedOffer = await prisma.offer.update({
                    where: { id: offer.id },
                    data: { status: 'declined' },
                });
                return res.status(200).json({ message: 'Counter-offer declined', offer: updatedOffer });

            default:
                return res.status(400).json({ message: 'Invalid action' });
        }
    } catch (error) {
        console.error('Buyer response error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getOffersByBuyer = async (req, res) => {
    try {
        const buyerId = req.user.userId;
        const offers = await prisma.offer.findMany({
            where: { buyerId: buyerId },
            include: {
                    product: {
                        include: {
                            images: {
                                take: 1 // Kita hanya butuh 1 gambar untuk preview
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