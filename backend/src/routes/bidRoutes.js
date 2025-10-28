// src/routes/bidRoutes.js
import express from 'express';
import { createBid, finalizeAuction } from '../controllers/bidController.js'; // <-- Impor finalizeAuction
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// POST /api/bids - Membuat penawaran baru
router.post('/', authMiddleware, createBid);

// POST /api/bids/:productId/finalize - Seller memfinalisasi lelang
router.post('/:productId/finalize', authMiddleware, finalizeAuction);

export default router;