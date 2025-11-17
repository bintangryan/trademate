// src/routes/notificationRoutes.js
import express from 'express';
import { 
    getNotifications, 
    markAllAsRead,
    markAsRead
} from '../controllers/notificationController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Semua rute di file ini WAJIB login
router.use(authMiddleware);

// GET /api/notifications
router.get('/', getNotifications);

// PUT /api/notifications/read-all
router.put('/read-all', markAllAsRead);

// PUT /api/notifications/:id/read
router.put('/:id/read', markAsRead);

export default router;