import express from 'express';
import upload from '../middlewares/uploadMiddleware.js';
import { 
    addProductImage, 
    deleteProductImage, 
    createCategory, 
    linkCategoryToProduct,
    unlinkCategoryFromProduct,
    getAllCategories 
} from '../controllers/assetController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/upload', authMiddleware, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Tidak ada file yang diupload.' });
    }
    // Jika berhasil, Cloudinary akan memberikan URL di req.file.path
    res.status(200).json({ 
        message: 'Gambar berhasil diupload', 
        url: req.file.path 
    });
});

// ======================================
// MANAJEMEN GAMBAR PRODUK
// ======================================

// Menambahkan URL gambar ke produk tertentu
router.post('/products/:productId/images', authMiddleware, addProductImage);
// Menghapus gambar berdasarkan ID entri gambar
router.delete('/images/:imageId', authMiddleware, deleteProductImage);


// ======================================
// MANAJEMEN KATEGORI
// ======================================
router.get('/categories', getAllCategories); 
// Membuat kategori baru (Hanya Seller/Admin)
router.post('/categories', authMiddleware, createCategory);

// Menautkan kategori ke produk (Hanya Seller pemilik produk)
router.post('/products/:productId/categories', authMiddleware, linkCategoryToProduct);

// Menghapus tautan kategori dari produk
router.delete('/products/:productId/categories/:categoryId', authMiddleware, unlinkCategoryFromProduct);


export default router;