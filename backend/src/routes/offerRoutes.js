import express from 'express';
import { 
  createOffer, 
  sellerRespondToOffer,
  buyerRespondToCounter,
  getOffersForSeller,
  getOffersByBuyer  
} from '../controllers/offerController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Membuat tawaran baru
router.post('/', authMiddleware, createOffer);
router.get('/seller', authMiddleware, getOffersForSeller);
router.get('/buyer', authMiddleware, getOffersByBuyer);

// Seller merespons tawaran (accept, counter, decline)
router.put('/:offerId/seller-response', authMiddleware, sellerRespondToOffer);

// Buyer merespons counter-offer dari seller (accept, decline)
router.put('/:offerId/buyer-response', authMiddleware, buyerRespondToCounter);

export default router;