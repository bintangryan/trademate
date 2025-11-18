// src/components/ProductCard.js
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import WishlistButton from './WishlistButton';
import { ShieldCheck, Clock, History, ShoppingCart, Loader2 } from 'lucide-react';

// --- Komponen Timer Lelang (Tidak Berubah) ---
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
                           new Date(product.endTime) > new Date();
                           
  const isAuctionEnded = isAuction && 
                         (product.auctionStatus === 'ended' || 
                          product.status === 'cancelled_by_buyer' || 
                          (product.endTime && new Date(product.endTime) <= new Date()));

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
        className="group relative border border-gray-200 bg-white rounded-xl overflow-hidden shadow-md transition-all duration-300 flex flex-col 
                   hover:shadow-xl transform hover:-translate-y-1"
    >
      <div className="absolute top-3 right-3 z-20">
        <WishlistButton productId={product.id} />
      </div>
      
      <Link href={`/products/${product.id}`} className="flex flex-col h-full">
        {/* Wrapper flex-grow agar footer selalu di bawah */}
        <div className="flex-grow">
            <div className="relative w-full pt-[100%] bg-gray-100"> 
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'cover' }}
                className="absolute inset-0" // <-- Animasi zoom gambar dihilangkan
              />
            </div>
            
            <div className="p-4"> 
              <h3 className="text-md font-semibold text-gray-800 leading-snug line-clamp-2 mb-2">
                {product.name}
              </h3>
              
              {/* Info Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium text-gray-700 uppercase"> {/* <-- UPPERCASE DITAMBAHKAN */}
                    <ShieldCheck size={12} className={`mr-1 ${infoColor}`} />
                    {product.condition?.replace(/_/g, ' ') || 'N/A'}
                </span>
                {product.usagePeriod && (
                    <span className="flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium text-gray-700 uppercase"> {/* <-- UPPERCASE DITAMBAHKAN */}
                        <History size={12} className={`mr-1 ${infoColor}`} />
                        {product.usagePeriod}
                    </span>
                )}
              </div>
            </div>
        </div>
        
        {/* Footer */}
        <div className="mt-auto">
            <div className="flex justify-between border-t border-gray-200">
                
                {/* 1. BAGIAN HARGA (Kiri) */}
                <div className="p-4">
                    {isAuction ? (
                        <div>
                            <p className="text-xs text-gray-500">Harga Awal</p>
                            <p className={`text-lg font-bold ${priceColor}`}>{formatRupiah(product.startingPrice)}</p>
                        </div>
                    ) : (
                        <p className={`text-lg font-bold ${priceColor}`}>{formatRupiah(product.price)}</p>
                    )}
                </div>

                {/* 2. BAGIAN AKSI (Kanan) */}
                {isAuction ? (
                    <div className="p-4 flex items-center justify-center">
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
                    // Tombol Add to Cart
                    <div className="flex items-center justify-center bg-[var(--color-tawar-light)] p-4">
                        <button
                            onClick={handleAddToCartClick}
                            disabled={isAdding}
                            className="text-[var(--color-tawar-dark)] transition-transform duration-200 ease-in-out hover:scale-110 focus:outline-none disabled:cursor-not-allowed disabled:text-gray-400"
                            aria-label="Tambah ke keranjang"
                        >
                            {isAdding ? (
                            <Loader2 size={24} className="animate-spin" />
                            ) : (
                            <ShoppingCart size={24} />
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
      </Link>
    </div>
  );
}