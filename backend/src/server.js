// src/server.js
import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import bidRoutes from './routes/bidRoutes.js'; 
import auctionRoutes from './routes/auctionRoutes.js'; // <-- IMPORT BARU
import orderRoutes from './routes/orderRoutes.js';
import assetRoutes from './routes/assetRoutes.js'; 
import wishlistRoutes from './routes/wishlistRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3110;

app.use(cors()); 
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes); 
app.use('/api/offers', offerRoutes);
app.use('/api/bids', bidRoutes); 
app.use('/api/auctions', auctionRoutes); // <-- GUNAKAN ROUTE BARU
app.use('/api/orders', orderRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/wishlist', wishlistRoutes); 
app.use('/api/notifications', notificationRoutes); 


app.get('/', (req, res) => {
  res.send('API Trademate Berhasil Terhubung!');
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});