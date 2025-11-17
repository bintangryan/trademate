import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import bidRoutes from './routes/bidRoutes.js'; 
import auctionRoutes from './routes/auctionRoutes.js'; 
import orderRoutes from './routes/orderRoutes.js';
import assetRoutes from './routes/assetRoutes.js'; 
import wishlistRoutes from './routes/wishlistRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3110;

const whitelist = [
  'http://localhost:3000',               
  'https://trademateweb.netlify.app'    
];

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes); 
app.use('/api/offers', offerRoutes);
app.use('/api/bids', bidRoutes); 
app.use('/api/auctions', auctionRoutes); 
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