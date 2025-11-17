// src/components/ProductCard.js
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingBagIcon } from '@heroicons/react/24/solid';            

import WishlistButton from './WishlistButton';
import { ShieldCheck, Clock, History, ShoppingCart, Loader2 } from 'lucide-react';

// --- Komponen Timer Lelang (INI TETAP SAMA, SUDAH DENGAN BG MERAH) ---
const AuctionTimer = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  useEffect(() => {
    const calculateTimeLeft = () => {
        const difference = +new Date(endTime) - +new Date();
        if (difference > 0) {
            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            });
            setIsExpired(false);
        } else {
            setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            setIsExpired(true);
        }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endTime]);
  const pad = (num) => String(num).padStart(2, '0');
  
  if (isExpired) {
    return (
        <div className="flex items-center text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg w-fit">
            <Clock size={16} className="mr-2" />
            <span>Lelang berakhir!</span>
        </div>
    );
  }

  return (
    <div className="flex items-center text-sm font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-lg w-fit">
      <Clock size={16} className="mr-2" />
      <span className="font-mono tracking-tighter">
          {timeLeft.days > 0 && `${timeLeft.days}h `}
          {`${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`}
      </span>
    </div>
  );
};
// --- AKHIR KOMPONEN TIMER ---

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const formatRupiah = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(price);
  };

  const isAuction = product.saleType === 'auction';
  const imageUrl = product.images?.[0]?.url || '/placeholder.svg';
  const priceColor = isAuction ? 'text-[var(--color-lelang)]' : 'text-[var(--color-tawar)]';
  const infoColor = isAuction ? 'text-[var(--color-lelang)]' : 'text-[var(--color-tawar)]';

  const isAuctionRunning = isAuction && 
                           product.auctionStatus === 'running' && 
                           product.status === 'available' && 
                           product.endTime;
                           
  const isAuctionEnded = isAuction && 
                         (product.auctionStatus === 'ended' || product.status === 'cancelled_by_buyer');

  const handleAddToCartClick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsAdding(true);
      try {
          await addToCart(product.id, product.price);
      } finally {
          setIsAdding(false);
      }
  };

  return (
    <div 
        className="group relative border border-neutral-300 bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col 
                   hover:shadow-xl transform hover:-translate-y-2"
    >
      <div className="absolute top-3 right-3 z-20">
        <WishlistButton productId={product.id} />
      </div>
      
      <Link href={`/products/${product.id}`} className="flex flex-col h-full">
        <div className="flex-grow">
            <div className="relative w-full pt-[100%] bg-neutral-100"> 
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'cover' }}
                className="rounded-t-xl absolute inset-0 transition-transform duration-300" 
              />
            </div>
            
            <div className="p-4 text-gray-900"> 
              <h3 className="text-lg font-extrabold leading-snug line-clamp-2 mb-2">
                {product.name}
              </h3>
              <div className="flex flex-wrap items-center text-xs text-neutral-700 mb-2 gap-2">
                <span className="flex items-center">
                    <ShieldCheck size={14} className={`mr-1.5 ${infoColor}`} />
                    <span className="uppercase font-medium text-gray-700">{product.condition?.replace(/_/g, ' ') || 'N/A'}</span>
                </span>
                {product.usagePeriod && (
                    <span className="flex items-center">
                        <span className="text-gray-300 ml-1">|</span>
                        <History size={14} className={`ml-2 mr-1.5 ${infoColor}`} />
                        <span className="uppercase font-medium text-gray-700">{product.usagePeriod}</span>
                    </span>
                )}
              </div>
            </div>
        </div>
        
        {/* --- PERBAIKAN UTAMA DI SINI --- */}
        <div className="mt-auto">
            {/* SECTION 1: Timestamp (DIHAPUS DARI SINI)
              Kita tidak lagi merender timer di sini.
            */}
            
            {/* SECTION 2: Harga & Aksi
              Kita pindahkan timer ke dalam section ini.
              Border-t sekarang diletakkan di sini secara permanen.
            */}
            <div className="flex justify-between items-center border-t border-gray-300">
                
                {/* 1. BAGIAN HARGA (Kiri) */}
                <div className="p-4 flex items-center">
                    {isAuction ? (
                        <div>
                            <p className="text-xs text-neutral-600">Harga Awal</p>
                            <p className={`text-xl font-black ${priceColor}`}>{formatRupiah(product.startingPrice)}</p>
                        </div>
                    ) : (
                        <p className={`text-xl font-black ${priceColor}`}>{formatRupiah(product.price)}</p>
                    )}
                </div>

                {/* 2. BAGIAN AKSI (Kanan) - Tampilkan Timer atau Tombol Add */}
                {isAuction ? (
                    // --- JIKA LELANG: Tampilkan Timestamp di sini ---
                    <div className="p-4"> {/* Tambahkan padding agar sejajar */}
                        {isAuctionRunning ? (
                            <AuctionTimer endTime={product.endTime} />
                        ) : isAuctionEnded ? (
                            <div className="flex items-center text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg w-fit">
                                <Clock size={16} className="mr-2" />
                                <span>Lelang berakhir</span>
                            </div>
                        ) : null}
                    </div>
                ) : (
                    // --- JIKA BUKAN LELANG: Tampilkan Tombol Add ---
                    <div className="flex items-center bg-[var(--color-tawar-light)]">
                        <button
                            onClick={handleAddToCartClick}
                            disabled={isAdding}
                            className="p-4 text-[var(--color-tawar-dark)] transition-transform duration-200 ease-in-out hover:scale-110 focus:outline-none disabled:cursor-not-allowed disabled:text-gray-400"
                            aria-label="Tambah ke keranjang"
                        >
                            {isAdding ? (
                            <Loader2 size={24} className="animate-spin" />
                            ) : (
                            <ShoppingBagIcon className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                )}

            </div>
        </div>
        {/* --- AKHIR PERBAIKAN --- */}
      </Link>
    </div>
  );
}