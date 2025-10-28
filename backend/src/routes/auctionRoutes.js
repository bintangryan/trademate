// src/routes/auctionRoutes.js
import express from 'express';
import { getBuyerAuctions, checkReservedTimeout } from '../controllers/auctionController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rute untuk halaman "Lelang Saya" di sisi pembeli
router.get('/my-bids', authMiddleware, getBuyerAuctions);

// Rute untuk menjalankan pengecekan timeout secara manual (untuk testing/cron job)
router.post('/check-timeouts', checkReservedTimeout);

export default router;