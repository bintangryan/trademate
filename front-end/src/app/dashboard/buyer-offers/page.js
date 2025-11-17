// src/app/dashboard/buyer-offers/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Tag, Check, X, Hourglass, CheckCircle, XCircle, ShoppingBag, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Komponen Badge Status (tidak berubah)
const OfferStatusBadge = ({ status }) => {
    const statusMap = {
        pending: { text: 'Menunggu Respon', icon: <Hourglass size={12} />, class: 'bg-[var(--color-warning)]/50 text-yellow-800' },
        accepted: { text: 'Diterima!', icon: <CheckCircle size={12} />, class: 'bg-[var(--color-success)]/50 text-green-800' },
        countered: { text: 'Ada Tawaran Balik', icon: <ShoppingBag size={12} />, class: 'bg-[var(--color-tawar-light)] text-[var(--color-tawar-dark)] font-bold' },
        declined: { text: 'Ditolak', icon: <XCircle size={12} />, class: 'bg-[var(--color-danger)]/50 text-red-800' },
    };
    const currentStatus = statusMap[status] || { text: status, icon: null, class: 'bg-gray-100 text-gray-800' };

    return (
        // --- PERBAIKAN DI SINI: Tambahkan 'w-fit' ---
        <span className={`flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full w-fit ${currentStatus.class}`}>
            {currentStatus.icon}
            {currentStatus.text}
        </span>
    );
};


export default function MyOffersPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionOfferId, setActionOfferId] = useState(null);

  const fetchMyOffers = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/offers/buyer`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat tawaran.');
      const data = await res.json();
      setOffers(data.offers || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyOffers();
  }, [fetchMyOffers]);
  
  const handleBuyerResponse = async (offerId, action) => {
    setActionOfferId(offerId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/offers/${offerId}/buyer-response`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      toast.success(data.message);
      await fetchMyOffers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionOfferId(null);
    }
  };

  const formatRupiah = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  if (isLoading) return <div className="p-8 text-center">Memuat tawaran Anda...</div>;

  return (
    <div className="container mx-auto p-4 sm:p-8 bg-gray-50">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Pengajuan Tawaran Saya</h1>
      </div>
      
      {offers.length > 0 ? (
        <div className="space-y-6">
          {offers.map(offer => {
            const imageUrl = offer.product.images?.[0]?.url || '/placeholder.svg';
            const priceDifference = parseFloat(offer.product.price) - parseFloat(offer.offerPrice);
            
            return (
            <div key={offer.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              {/* === CARD HEADER === */}
              <div className="p-4 flex gap-4 items-start bg-white border-b border-gray-100">
                  <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 relative bg-gray-100 rounded-md overflow-hidden">
                      <Image
                          src={imageUrl}
                          alt={offer.product.name}
                          fill
                          sizes="80px"
                          style={{ objectFit: 'cover' }}
                      />
                  </div>
                  <div className="flex-grow">
                      <h2 className="font-semibold text-lg text-gray-800 leading-tight mb-2">{offer.product.name}</h2>
                      <OfferStatusBadge status={offer.status} />
                  </div>
              </div>

              {/* === CARD BODY: DETAIL HARGA === */}
              <div className="p-4 space-y-3 bg-gray-50">
                  <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Harga Asli Produk</span>
                      <span className="font-medium text-gray-600 line-through">{formatRupiah(offer.product.price)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">{offer.status === 'countered' ? "Tawaran Balik Penjual" : "Tawaranmu"}</span>
                      <span className="font-bold text-xl text-[var(--color-tawar)]">{formatRupiah(offer.offerPrice)}</span>
                  </div>
                  {/* Tampilkan penghematan jika ada */}
                  {priceDifference > 0 && offer.status !== 'countered' && (
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed">
                        <span className="font-semibold text-green-600 flex items-center gap-2"><TrendingDown size={14}/>Kamu Lebih Hemat</span>
                        <span className="font-bold text-base text-green-600">{formatRupiah(priceDifference)}</span>
                    </div>
                  )}
              </div>

              {/* === CARD FOOTER: AKSI === */}
              {offer.status === 'countered' && (
                <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                    <p className="text-center text-sm font-medium text-gray-700 mb-3">Penjual memberikan penawaran balik. Apa respon Anda?</p>
                    <div className="flex justify-center space-x-4">
                        <button 
                        onClick={() => handleBuyerResponse(offer.id, 'decline')}
                        disabled={actionOfferId === offer.id}
                        className="flex items-center gap-2 px-6 py-2 bg-[var(--color-danger)] text-white rounded-lg font-semibold hover:bg-red-600 disabled:bg-gray-400 transition-colors"
                        >
                            <X size={16} />
                            Tolak
                        </button>
                        <button 
                        onClick={() => handleBuyerResponse(offer.id, 'accept')}
                        disabled={actionOfferId === offer.id}
                        className="flex items-center gap-2 px-6 py-2 bg-[var(--color-success)] text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                        >
                            <Check size={16} />
                            Terima
                        </button>
                    </div>
                </div>
              )}
            </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center bg-white p-12 rounded-lg shadow-md border border-gray-200">
            <Tag className="mx-auto h-16 w-16 text-gray-300" strokeWidth={1.5} />
            <h2 className="mt-4 text-xl font-semibold text-gray-800">Anda belum membuat tawaran</h2>
            <p className="mt-2 text-gray-500">Jelajahi produk Beli & Tawar dan ajukan harga terbaik Anda!</p>
            <Link href="/shop/buy-now" className="mt-6 inline-block bg-[var(--color-tawar)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--color-tawar-dark)] transition-transform hover:scale-105">
                Jelajahi Produk
            </Link>
        </div>
      )}
    </div>
  );
}