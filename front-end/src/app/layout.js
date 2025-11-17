// src/app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartProvider } from "@/context/CartContext"; // <-- 1. Impor CartProvider
import { NotificationProvider } from "@/context/NotificationContext"; 
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Trademate - Jual Beli Barang Bekas",
  description: "Platform jual beli dan lelang barang bekas.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider> {/* <-- 2. Bungkus di sini */}
              <NotificationProvider>
                <Toaster position="top-center" reverseOrder={false} />
                <Navbar />
                <main>{children}</main>
              </NotificationProvider>
            </CartProvider> {/* <-- 3. Tutup di sini */}
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}