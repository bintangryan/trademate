import prisma from '../lib/prisma.js';

// POST /api/wishlist
export const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user.userId;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required.' });
        }

        const product = await prisma.product.findUnique({ 
            where: { id: parseInt(productId) }
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Cek apakah item sudah ada di wishlist
        const existingItem = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId: product.id,
                },
            },
        });

        if (existingItem) {
            return res.status(400).json({ message: 'Product is already in your wishlist.' });
        }

        // Tambahkan ke Wishlist
        const newItem = await prisma.wishlist.create({
            data: {
                userId,
                productId: product.id,
            },
        });

        res.status(201).json({ message: 'Product added to wishlist successfully.', wishlist: newItem });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// GET /api/wishlist
export const getWishlist = async (req, res) => {
    try {
        const userId = req.user.userId;

        const wishlist = await prisma.wishlist.findMany({
            where: { 
                userId,
                // --- PERBAIKAN DI SINI ---
                // Tambahkan filter untuk hanya menyertakan produk yang BELUM terjual
                product: {
                    status: {
                        not: 'sold'
                    }
                }
            },
            include: {
                product: {
                    include: { 
                        images: true,
                        seller: { select: { id: true, email: true } }
                    }
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({ message: 'Wishlist fetched successfully.', wishlist });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// DELETE /api/wishlist/:productId
export const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.userId;

        const deletedItem = await prisma.wishlist.delete({
            where: {
                userId_productId: {
                    userId,
                    productId: parseInt(productId),
                },
            },
        });

        res.status(200).json({ message: 'Product removed from wishlist successfully.', deletedItem });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Product not found in your wishlist.' });
        }
        console.error('Remove from wishlist error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};