// src/components/Navbar.js
'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import { useNotification } from '@/context/NotificationContext'; 
import { useRouter, usePathname } from 'next/navigation'; 
import { useState, useEffect } from 'react';
import { 
  User, Heart, Gavel, Settings, Package, DollarSign, LogOut, 
  TrendingUp, Tag, ListOrdered, Store, ShoppingCart,
  Bell
} from 'lucide-react';

// --- Komponen Avatar Pengguna ---
const UserAvatar = ({ name }) => {
    const getInitials = (name) => {
        if (!name) return <User size={18} />;
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div 
            className="w-8 h-8 rounded-full bg-[var(--color-lelang)] text-white 
                       flex items-center justify-center text-xs font-semibold 
                       border-2 border-white/50"
        >
            {getInitials(name)}
        </div>
    );
};
// ------------------------------------


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
  const [isScrolled, setIsScrolled] = useState(false);
  const [animateNotif, setAnimateNotif] = useState(false);
  const [animateCart, setAnimateCart] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const getNavLinkClasses = (href) => {
    const isActive = pathname === href || (pathname.startsWith(href) && href !== '/');
    let classes = "transition-colors flex items-center font-semibold relative py-1 nav-link";
    
    // Gunakan text-gray-800 sebagai warna dasar (non-aktif)
    classes += " text-[var(--color-lelang)]";
    
    // --- PERUBAHAN DI SINI ---
    // Ganti 'tawar' menjadi 'lelang' untuk state aktif dan hover
    if (isActive) classes += " text-[var(--color-tawar)] active"; 
    else classes += " hover:text-[var(--color-tawar)]";
    // --- AKHIR PERUBAHAN ---

    return classes;
  };

  const handleNotifClick = (notification) => {
    markAsRead(notification.id);
    setIsNotifOpen(false);
    router.push(notification.link);
  };
  
  const isCartActive = pathname.startsWith('/cart') || pathname.startsWith('/checkout');

  return (
    <nav 
        className={`sticky top-0 z-40 transition-all duration-300 
            ${isScrolled 
                ? 'bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-200' 
                : 'bg-white'
            }`
        }
    >
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
        <div className="flex items-center space-x-2 sm:space-x-4">

          {/* NOTIFICATION ICON */}
          {user && (
            <div className="relative">
              <button
                onClick={() => {
                  setAnimateNotif(true);
                  setIsNotifOpen(!isNotifOpen);
                  setIsDropdownOpen(false);
                }}
                onAnimationEnd={() => setAnimateNotif(false)}
                className={`relative p-2 rounded-full transition-all duration-200 hover:text-[var(--color-tawar)] hover:scale-115
                  ${isNotifOpen ? 'text-[var(--color-tawar)]' : 'text-[var(--color-lelang)]'}
                  ${animateNotif ? 'animate-jump' : ''}
                `}
                aria-label="Notifikasi"
              >
                <Bell 
                  size={24} 
                  className={`transition-all ${
                    isNotifOpen ? 'fill-[var(--color-tawar)]' : 'fill-none'
                  }`} 
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--color-danger)] text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Notifikasi */}
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
                                // --- PERUBAHAN DI SINI ---
                                className="text-xs font-medium text-[var(--color-tawar)] hover:text-[var(--color-tawar-dark)] hover:underline"
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
                                // --- PERUBAHAN DI SINI ---
                                className="w-full text-left p-4 hover:bg-[var(--color-tawar-light)] transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    {!notif.isRead && (
                                        // --- PERUBAHAN DI SINI ---
                                        <div className="w-2.5 h-2.5 bg-[var(--color-tawar)] rounded-full mt-1.5 flex-shrink-0" aria-label="Belum dibaca"></div>
                                    )}
                                    <p className={`text-sm ${notif.isRead ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                                        {notif.message}
                                    </p>
                                </div>
                                {/* --- PERUBAHAN DI SINI --- */}
                                <p className={`text-xs mt-1 ${notif.isRead ? 'text-gray-400' : 'text-[var(--color-tawar)] font-medium'} ${!notif.isRead && 'ml-[17px]'}`}>
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
            onClick={() => setAnimateCart(true)}
            onAnimationEnd={() => setAnimateCart(false)}
            className={`relative p-2 rounded-full transition-all duration-200 hover:text-[var(--color-tawar)] hover:scale-115
              ${isCartActive ? 'text-[var(--color-tawar)]' : 'text-[var(--color-lelang)]'}
              ${animateCart ? 'animate-jump' : ''}
            `}
            aria-label="Keranjang"
          >
            <ShoppingCart 
              size={24} 
              className={`transition-all ${
                isCartActive ? 'fill-[var(--color-tawar)]' : 'fill-none'
              }`}
            />
            {user && cartItemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h3.5 w-3.5 items-center justify-center rounded-full bg-[var(--color-warning)] text-[10px] font-bold text-white">
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* USER ICON */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  setIsNotifOpen(false);
                }}
                className={`flex items-center space-x-2 rounded-full transition-all duration-200 p-1.5
                  hover:scale-115
                `}
                aria-expanded={isDropdownOpen}
              >
                <UserAvatar name={user.fullName} />
              </button>

              {/* Dropdown user */}
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