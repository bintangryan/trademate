import prisma from '../lib/prisma.js';

// Fungsi untuk membuat keranjang jika belum ada
const getOrCreateCart = async (userId) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
    });
  }
  return cart;
};

// --- API FUNCTIONS ---

export const addToCart = async (req, res) => {
  try {
    const { productId, agreedPrice } = req.body; 
    const userId = req.user.userId;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const product = await prisma.product.findUnique({ 
        where: { id: parseInt(productId) },
        select: { id: true, status: true, saleType: true, price: true }
    });

    if (!product || product.status !== 'available' || product.saleType !== 'buy_now') {
      return res.status(404).json({ message: 'Product not found, unavailable, or not eligible for cart purchase.' });
    }

    let finalPrice;
    if (agreedPrice) {
        finalPrice = parseFloat(agreedPrice);
    } else if (product.price) {
        finalPrice = product.price;
    } else {
        return res.status(400).json({ message: 'Product price cannot be determined.' });
    }
    
    if (isNaN(finalPrice)) {
        return res.status(400).json({ message: 'Format harga invalid' });
    }

    const cart = await getOrCreateCart(userId);

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: product.id },
    });

    if (existingItem) {
      return res.status(400).json({ message: 'Produk sudah ditambahkan sebelumnya' });
    }

    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity: 1, 
        agreedPrice: finalPrice,
      },
    });

    res.status(200).json({ message: 'Produk berhasil ditambahkan', cartItem });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true, // <-- TAMBAHKAN BARIS INI
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return res.status(200).json({ message: 'Cart is empty', cart: null });
    }

    res.status(200).json({ message: 'Cart fetched successfully', cart });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.userId;

    await prisma.$transaction(async (tx) => {
      const itemInCart = await tx.cartItem.findFirst({
        where: { id: parseInt(itemId), cart: { userId } },
        include: { product: true },
      });

      if (!itemInCart) {
        throw new Error('Item not found in your cart');
      }

      const { product } = itemInCart;

      if (product.status === 'reserved') {
        let newStatus = 'available';
        
        // --- PERBAIKAN UTAMA DI SINI ---
        if (product.saleType === 'buy_now') {
          const acceptedOffer = await tx.offer.findFirst({
            where: {
              productId: product.id,
              buyerId: userId,
              status: 'accepted',
            },
          });

          // Jika ditemukan, HAPUS tawaran tersebut
          if (acceptedOffer) {
            await tx.offer.delete({
              where: { id: acceptedOffer.id },
            });
          }
        } 
        // --- AKHIR PERBAIKAN ---
        else if (product.saleType === 'auction') {
          newStatus = 'cancelled_by_buyer';
        }

        await tx.product.update({
          where: { id: product.id },
          data: {
            status: newStatus,
            reservedAt: null,
            auctionWinnerId: null,
          },
        });
      }

      await tx.cartItem.delete({
        where: { id: parseInt(itemId) },
      });
    });

    res.status(200).json({ message: 'Item removed from cart and statuses updated.' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    if (error.message === 'Item not found in your cart') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};