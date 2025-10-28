// src/routes/orderRoutes.js

import express from 'express';
// <-- 1. Impor fungsi baru
import { createOrder, getOrdersBySeller, getOrdersByBuyer, updateOrderStatus } from '../controllers/orderController.js'; 
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// BUYER: Membuat order baru dari item di cart
router.post('/', authMiddleware, createOrder);

// BUYER: Mendapatkan riwayat pesanannya sendiri <-- 2. TAMBAHKAN ROUTE INI
router.get('/my-orders', authMiddleware, getOrdersByBuyer);

// SELLER: Mendapatkan daftar order
router.get('/seller', authMiddleware, getOrdersBySeller);

// SELLER: Mengubah status order
router.put('/:orderId/status', authMiddleware, updateOrderStatus);

export default router;