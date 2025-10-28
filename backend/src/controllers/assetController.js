import prisma from '../lib/prisma.js';

// Fungsi Internal: Memastikan User adalah Seller dari Produk
const checkProductOwnership = async (productId, userId) => {
    const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) },
        select: { sellerId: true }
    });

    if (!product || product.sellerId !== userId) {
        return false;
    }
    return true;
};

// ======================================
// A. MANAJEMEN GAMBAR PRODUK
// ======================================

// POST /api/assets/products/:productId/images
export const addProductImage = async (req, res) => {
    try {
        const { productId } = req.params;
        const { url } = req.body; // URL diasumsikan sudah diupload ke storage
        const userId = req.user.userId;

        if (!url) {
            return res.status(400).json({ message: 'Image URL is required.' });
        }

        // 1. Otorisasi & Validasi Produk
        if (req.user.role !== 'seller') {
            return res.status(403).json({ message: 'Forbidden: Only sellers can add images.' });
        }
        if (!await checkProductOwnership(productId, userId)) {
            return res.status(403).json({ message: 'Forbidden: You do not own this product.' });
        }
        
        // 2. Simpan URL ke database
        const newImage = await prisma.productImage.create({
            data: {
                productId: parseInt(productId),
                url,
            },
        });

        res.status(201).json({ message: 'Image URL added successfully.', image: newImage });
    } catch (error) {
        console.error('Add image error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// DELETE /api/assets/images/:imageId
export const deleteProductImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        const userId = req.user.userId;

        // 1. Cari gambar dan produk terkait
        const image = await prisma.productImage.findUnique({
            where: { id: parseInt(imageId) },
            include: { product: { select: { sellerId: true } } }
        });

        if (!image) {
            return res.status(404).json({ message: 'Image not found.' });
        }

        // 2. Otorisasi
        if (req.user.role !== 'seller' || image.product.sellerId !== userId) {
            return res.status(403).json({ message: 'Forbidden: You do not own this image.' });
        }

        // 3. Hapus entri gambar
        await prisma.productImage.delete({
            where: { id: parseInt(imageId) },
        });

        res.status(200).json({ message: 'Image successfully deleted.' });
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};


// ======================================
// B. MANAJEMEN KATEGORI
// ======================================

// POST /api/assets/categories
export const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        // KRUSIAL: Hanya izinkan role 'admin'
        if (req.user.role !== 'admin') {
             return res.status(403).json({ message: 'Forbidden: Only admins can create categories.' });
        }

        if (!name) {
            return res.status(400).json({ message: 'Category name is required.' });
        }

        // Pastikan nama kategori unik (sudah diatur di Prisma schema)
        const newCategory = await prisma.category.create({
            data: { name },
        });

        res.status(201).json({ message: 'Category created successfully.', category: newCategory });
    } catch (error) {
        // P2002: Unique constraint failed (kategori sudah ada)
        if (error.code === 'P2002') {
             return res.status(400).json({ message: 'Category name already exists.' });
        }
        console.error('Create category error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};


// POST /api/assets/products/:productId/categories
export const linkCategoryToProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { categoryId } = req.body;
        const userId = req.user.userId;

        if (!categoryId) {
            return res.status(400).json({ message: 'Category ID is required.' });
        }
        
        // 1. Otorisasi & Validasi Produk
        if (req.user.role !== 'seller') {
            return res.status(403).json({ message: 'Forbidden: Only sellers can link categories.' });
        }
        if (!await checkProductOwnership(productId, userId)) {
            return res.status(403).json({ message: 'Forbidden: You do not own this product.' });
        }

        // 2. Buat tautan di join table ProductCategory
        const link = await prisma.productCategory.create({
            data: {
                productId: parseInt(productId),
                categoryId: parseInt(categoryId),
            },
        });

        res.status(201).json({ message: 'Category linked to product successfully.', link });
    } catch (error) {
        // P2002: Tautan sudah ada (duplicate entry)
        if (error.code === 'P2002') {
             return res.status(400).json({ message: 'This category is already linked to the product.' });
        }
         // P2003: Foreign key constraint failed (ID kategori/produk tidak ada)
        if (error.code === 'P2003') {
             return res.status(404).json({ message: 'Category or Product ID not found.' });
        }
        console.error('Link category error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// DELETE /api/assets/products/:productId/categories/:categoryId
export const unlinkCategoryFromProduct = async (req, res) => {
    try {
        const { productId, categoryId } = req.params;
        const userId = req.user.userId;

        // 1. Otorisasi & Validasi Produk
        if (req.user.role !== 'seller') {
            return res.status(403).json({ message: 'Forbidden: Only sellers can unlink categories.' });
        }
        if (!await checkProductOwnership(productId, userId)) {
            return res.status(403).json({ message: 'Forbidden: You do not own this product.' });
        }

        // 2. Hapus tautan
        const result = await prisma.productCategory.delete({
            where: {
                productId_categoryId: {
                    productId: parseInt(productId),
                    categoryId: parseInt(categoryId),
                },
            },
        });

        res.status(200).json({ message: 'Category unlinked successfully.', result });
    } catch (error) {
        // P2025: Item not found (tautan tidak ada)
        if (error.code === 'P2025') {
             return res.status(404).json({ message: 'Category link not found for this product.' });
        }
        console.error('Unlink category error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

export const getAllCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
        });
        res.status(200).json({ categories });
    } catch (error) {
        console.error('Get all categories error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};