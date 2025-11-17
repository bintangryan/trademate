// src/components/Navbar.js
'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import { useNotification } from '@/context/NotificationContext'; 
import { useRouter, usePathname } from 'next/navigation'; 
import { useState } from 'react';
import { 
  User, Heart, Gavel, Settings, Package, DollarSign, LogOut, 
  TrendingUp, Tag, ListOrdered, Store, ShoppingCart,
  Bell, ShoppingBag, Handbag
} from 'lucide-react';

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
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const router = useRouter();
  const pathname = usePathname(); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const getNavLinkClasses = (href, options = { withUnderline: true }) => {
    const isActive = pathname === href || (pathname.startsWith(href) && href !== '/');
    let classes = "transition-colors flex items-center font-semibold relative py-1";
    if (options.withUnderline) classes += " nav-link";
    classes += " text-[var(--color-lelang)]";
    if (isActive) classes += " text-[var(--color-tawar)] active"; 
    else classes += " hover:text-[var(--color-tawar)]";
    return classes;
  };

  const handleNotifClick = (notification) => {
    markAsRead(notification.id);
    setIsNotifOpen(false);
    router.push(notification.link);
  };

  const isCartActive = pathname === '/cart' || pathname.startsWith('/checkout');

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40 border-b border-gray-100">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">

        {/* LOGO & NAVIGATION */}
        <div className="flex items-center space-x-8">
          <Link 
            href="/" 
            className="text-2xl font-black text-[var(--color-lelang)] tracking-wide transition-colors hover:text-[var(--color-lelang-light)]"
          >
            <Image
                src="/logo-tm.png"
                alt="Trademate Logo"
                width={150} 
                height={40} 
                priority 
            />
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/shop/auction" className={getNavLinkClasses("/shop/auction")}>
              Lelang
            </Link>
            <Link href="/shop/buy-now" className={getNavLinkClasses("/shop/buy-now")}>
              Beli & Tawar
            </Link>
          </div>
        </div>

        {/* ALL ICONS (BELL, CART, USER) IN ONE FLEX */}
        <div className="flex items-center space-x-2 sm:space-x-6">

          {/* NOTIFICATION ICON */}
          {user && (
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsDropdownOpen(false);
                }}
                // --- PERBAIKAN 1: Logika className diubah ---
                className={`relative p-2 rounded-full transition-colors ${
                  isNotifOpen ? '' : 'hover:bg-[var(--color-tawar-light)]'
                }`}
                // --- AKHIR PERBAIKAN 1 ---
                aria-label="Notifikasi"
              >
                <Bell 
                  size={24} 
                  className={`text-[var(--color-lelang)] transition-all ${
                    isNotifOpen ? 'fill-[var(--color-lelang)]' : 'fill-none'
                  }`} 
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-danger)] text-xs font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Notifikasi (Tidak berubah) */}
              {isNotifOpen && (
                <div 
                  className="absolute right-0 mt-3 w-80 max-h-[80vh] overflow-y-auto bg-white rounded-xl shadow-2xl z-20 border border-gray-200" 
                  onMouseLeave={() => setIsNotifOpen(false)}
                >
                    <div className="p-3 flex justify-between items-center border-b sticky top-0 bg-white">
                        <h3 className="font-bold text-lg">Notifikasi</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead} 
                                className="text-xs font-medium text-[var(--color-lelang)] hover:underline"
                            >
                                Tandai semua dibaca
                            </button>
                        )}
                    </div>
                    <div className="divide-y divide-gray-100">
                        {notifications.length > 0 ? notifications.map(notif => (
                            <button
                                key={notif.id}
                                onClick={() => handleNotifClick(notif)}
                                className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    {!notif.isRead && (
                                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" aria-label="Belum dibaca"></div>
                                    )}
                                    <p className={`text-sm ${notif.isRead ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                                        {notif.message}
                                    </p>
                                </div>
                                <p className={`text-xs mt-1 ${notif.isRead ? 'text-gray-400' : 'text-blue-600 font-medium'} ${!notif.isRead && 'ml-[17px]'}`}>
                                    {new Date(notif.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </button>
                        )) : (
                            <p className="p-4 text-center text-sm text-gray-500">
                                Belum ada notifikasi.
                            </p>
                        )}
                    </div>
                </div>
              )}
            </div>
          )}

          {/* CART ICON */}
          <Link 
            href="/cart" 
            // --- PERBAIKAN 2: Logika className diubah ---
            className={`relative p-2 rounded-full transition-colors ${
              isCartActive ? '' : 'hover:bg-[var(--color-tawar-light)]'
            }`}
            // --- AKHIR PERBAIKAN 2 ---
            aria-label="Keranjang"
          >
            <ShoppingCart 
              size={24} 
              className={`text-[var(--color-lelang)] transition-all ${
                isCartActive ? 'fill-[var(--color-lelang)]' : 'fill-none'
              }`}
            />
            {user && cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-warning)] text-xs font-bold text-white">
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* USER ICON (Tidak berubah) */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  setIsNotifOpen(false);
                }}
                className="flex items-center space-x-2 bg-[var(--color-tawar-light)] text-[var(--color-lelang)] hover:text-white p-2 rounded-full hover:bg-[var(--color-lelang)] border-2 border-transparent hover:border-[var(--color-lelang)] focus:outline-none transition-all duration-200"
                aria-expanded={isDropdownOpen}
              >
                <User size={18} />
                <span className="font-semibold text-sm pr-1 hidden sm:block">
                  Hi, {user.fullName || user.email.split('@')[0]}
                </span>
              </button>

              {/* Dropdown user (Tidak berubah) */}
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