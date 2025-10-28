import express from 'express';
import { addToCart, getCart, removeFromCart } from '../controllers/cartController.js'; // <-- Impor removeFromCart
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Menambah item ke keranjang
router.post('/add', authMiddleware, addToCart);

// Melihat isi keranjang
router.get('/', authMiddleware, getCart);

// Menghapus item dari keranjang
router.delete('/items/:itemId', authMiddleware, removeFromCart); // <-- Tambahkan rute ini

export default router;