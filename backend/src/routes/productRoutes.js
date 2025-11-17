// src/routes/productRoutes.js

import express from 'express';
// Impor semua fungsi controller produk, TERMASUK reAuctionProduct
import { 
  createProduct, 
  getAllProducts, 
  getProductById,
  updateProduct,
  getMyProducts,
  deleteProduct,
  reAuctionProduct,
  cancelAuctionBySeller // <-- Pastikan ini diimpor
} from '../controllers/productController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// CREATE
router.post('/', authMiddleware, createProduct);

// READ
router.get('/', getAllProducts);
router.get('/my-products', authMiddleware, getMyProducts);
router.get('/:id', getProductById);

// UPDATE
router.put('/:id', authMiddleware, updateProduct);

// DELETE
router.delete('/:id', authMiddleware, deleteProduct);

// POST
router.post('/:id/re-auction', authMiddleware, reAuctionProduct); // <-- Pastikan route ini ada
router.post('/:id/cancel-auction', authMiddleware, cancelAuctionBySeller);

export default router;