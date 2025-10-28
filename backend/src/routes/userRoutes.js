import express from 'express';
import { getMyProfile, updateUserProfile } from '../controllers/userController.js'; // <-- Tambahkan updateUserProfile
import { authMiddleware } from '../middlewares/authMiddleware.js'; // <-- 1. IMPORT SATPAM

const router = express.Router();

// GET /api/users/me
router.get('/me', authMiddleware, getMyProfile); 

// PUT /api/users/profile - Membuat atau mengupdate UserProfile
// Rute ini akan dijaga oleh authMiddleware
router.put('/profile', authMiddleware, updateUserProfile); // <-- RUTE BARU

export default router;