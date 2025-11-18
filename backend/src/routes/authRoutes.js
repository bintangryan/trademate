import express from 'express';
// --- IMPORT FUNGSI BARU ---
import { registerUser, loginUser, verifyEmail } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// --- ROUTE BARU UNTUK VERIFIKASI SAAT LINK DI KLIK ---
router.get('/verify/:token', verifyEmail);

export default router;