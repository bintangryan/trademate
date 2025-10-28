import express from 'express';
import { 
    addToWishlist, 
    getWishlist, 
    removeFromWishlist 
} from '../controllers/wishlistController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// POST /api/wishlist - Menambah item ke wishlist
router.post('/', authMiddleware, addToWishlist);

// GET /api/wishlist - Melihat seluruh wishlist
router.get('/', authMiddleware, getWishlist);

// DELETE /api/wishlist/:productId - Menghapus item dari wishlist
router.delete('/:productId', authMiddleware, removeFromWishlist);

export default router;