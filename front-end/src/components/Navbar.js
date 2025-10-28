'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRouter, usePathname } from 'next/navigation'; 
import { useState } from 'react';
// 1. Impor Ikon dari Heroicons dan Lucide
import { ShoppingBagIcon } from '@heroicons/react/24/solid';
import { User, Heart, Gavel, Settings, Package, DollarSign, LogOut, TrendingUp, Tag, ListOrdered, Store } from 'lucide-react';

const MenuItem = ({ href, children, icon: Icon }) => (
  <Link 
    href={href} 
    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-[var(--color-tawar-light)] hover:text-[var(--color-lelang)] rounded-md transition-colors group"
  >
    <Icon size={16} className="mr-3 text-gray-400 group-hover:text-[var(--color-lelang)] transition-colors" />
    <span className="font-medium">{children}</span>
  </Link>
);

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartItemCount } = useCart();
  const router = useRouter();
  const pathname = usePathname(); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  // --- 2. PERBAIKI FUNGSI INI ---
  // Tambahkan parameter 'options' untuk mengontrol underline
  const getNavLinkClasses = (href, options = { withUnderline: true }) => {
    const isActive = pathname === href || (pathname.startsWith(href) && href !== '/');
    let classes = "transition-colors flex items-center font-semibold relative py-1";
    
    // Hanya tambahkan kelas 'nav-link' (untuk underline) jika diminta
    if (options.withUnderline) {
        classes += " nav-link";
    }
    
    classes += " text-[var(--color-lelang)]";
    if (isActive) {
      classes += " text-[var(--color-tawar)] active"; 
    } else {
      classes += " hover:text-[var(--color-tawar)]";
    }
    return classes;
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40 border-b border-gray-100">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        
        <div className="flex items-center space-x-8">
            <Link 
                href="/" 
                className="text-2xl font-black text-[var(--color-lelang)] tracking-wide transition-colors hover:text-[var(--color-lelang-light)]"
            >
              Trademate
            </Link>
            <div className="hidden md:flex items-center space-x-8">
                <Link 
                    href="/shop/auction" 
                    className={getNavLinkClasses("/shop/auction")}
                >
                    Lelang
                </Link>
                <Link 
                    href="/shop/buy-now" 
                    className={getNavLinkClasses("/shop/buy-now")}
                >
                    Beli & Tawar
                </Link>
            </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* --- 3. PERBAIKI LINK KERANJANG --- */}
          <Link 
            href="/cart" 
            // Panggil getNavLinkClasses dengan 'withUnderline: false'
            // Hapus 'hover:bg-gray-100'
            className={`${getNavLinkClasses("/cart", { withUnderline: false })} relative p-2 rounded-full`}
          >
            {/* Ganti ikon ke ShoppingBagIcon solid */}
            <ShoppingBagIcon className="h-6 w-6" />
            {user && cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-warning)] text-xs font-bold text-white">
                {cartItemCount}
              </span>
            )}
            <span className="sr-only">Keranjang</span>
          </Link>
          
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 bg-[var(--color-tawar-light)] text-[var(--color-lelang)] hover:text-white p-2 rounded-full hover:bg-[var(--color-lelang)] border-2 border-transparent hover:border-[var(--color-lelang)] focus:outline-none transition-all duration-200"
                aria-expanded={isDropdownOpen}
              >
                <User size={18} />
                <span className="font-semibold text-sm pr-1 hidden sm:block">
                  Hi, {user.fullName || user.email.split('@')[0]}
                </span>
              </button>

              {isDropdownOpen && (
                <div 
                  className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-2xl z-20 border border-gray-200 overflow-hidden p-2" 
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <div className="space-y-1">
                    <p className="px-3 pt-2 pb-1 text-xs font-bold uppercase text-gray-400">Pembelian</p>
                    <MenuItem href="/dashboard/my-orders" icon={ListOrdered}>Pesanan Saya</MenuItem>
                    <MenuItem href="/dashboard/wishlist" icon={Heart}>Wishlist</MenuItem>
                    <MenuItem href="/dashboard/my-bids" icon={Gavel}>Pengajuan Lelang</MenuItem>
                    <MenuItem href="/dashboard/buyer-offers" icon={Tag}>Pengajuan Tawaran</MenuItem>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                    <p className="px-3 pt-1 pb-1 text-xs font-bold uppercase text-gray-400">Akun</p>
                    <MenuItem href="/dashboard/settings" icon={Settings}>Pengaturan Akun</MenuItem>
                  </div>

                  {user.role === 'seller' && (
                    <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                      <p className="px-3 pt-1 pb-1 text-xs font-bold uppercase text-gray-400">Penjualan</p>
                      <MenuItem href="/dashboard/my-products" icon={Package}>Produk Saya</MenuItem>
                      <MenuItem href="/dashboard/sales" icon={DollarSign}>Manajemen Penjualan</MenuItem>
                      <MenuItem href="/dashboard/auctions" icon={TrendingUp}>Manajemen Lelang</MenuItem>
                      <MenuItem href="/dashboard/offers" icon={Tag}>Tawaran Masuk</MenuItem>
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-md transition-colors group"
                    >
                        <LogOut size={16} className="mr-3 text-red-400 group-hover:text-red-500 transition-colors" />
                        <span className="font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/auth/login" 
              className="bg-[var(--color-lelang)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-lelang-dark)] font-semibold transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}