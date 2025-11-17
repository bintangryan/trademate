// src/app/dashboard/offers/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Image from 'next/image'; // <-- Impor Image
import Link from 'next/link';
import { Tag, Check, X, MessageSquare, RefreshCw, Hourglass, CheckCircle, XCircle, ShoppingBag, Loader2, Inbox } from 'lucide-react'; // <-- Impor Ikon

// Komponen Badge Status Tawaran (Konsisten dengan buyer-offers)
const OfferStatusBadge = ({ status }) => {
    const statusMap = {
        pending: { text: 'Menunggu Respon', icon: <Hourglass size={12} />, class: 'bg-yellow-100 text-yellow-800' },
        accepted: { text: 'Diterima Pembeli', icon: <CheckCircle size={12} />, class: 'bg-green-100 text-green-800' }, // Teks disesuaikan
        countered: { text: 'Anda Tawar Balik', icon: <RefreshCw size={12}/>, class: 'bg-indigo-100 text-indigo-800' }, // Teks disesuaikan
        declined: { text: 'Ditolak Pembeli', icon: <XCircle size={12} />, class: 'bg-red-100 text-red-800' }, // Teks disesuaikan
    };
    // Jika backend mengirim status 'accepted' dari SELLER, tampilkan ini
    if (status === 'accepted') {
         statusMap['accepted'] = { text: 'Anda Terima', icon: <CheckCircle size={12} />, class: 'bg-blue-100 text-blue-800' };
    }
     // Jika backend mengirim status 'declined' dari SELLER, tampilkan ini
    if (status === 'declined') {
         statusMap['declined'] = { text: 'Anda Tolak', icon: <XCircle size={12} />, class: 'bg-gray-100 text-gray-500' };
    }

    const currentStatus = statusMap[status] || { text: status, icon: null, class: 'bg-gray-100 text-gray-800' };

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full w-fit ${currentStatus.class}`}>
            {currentStatus.icon}
            {currentStatus.text}
        </span>
    );
};

export default function OffersPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionOfferId, setActionOfferId] = useState(null); // ID tawaran yg sedang diproses

  const fetchOffers = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setActionOfferId(null); // Reset loading state
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/offers/seller`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat tawaran.');
      const data = await res.json();
      setProducts(data.productsWithOffers || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);
  
  const handleResponse = async (offerId, action) => {
    let counterPrice = null;
    if (action === 'counter') {
      const priceInput = window.prompt("Masukkan harga penawaran balik Anda (contoh: 150000):");
      if (priceInput === null) return; // Batal jika user klik cancel
      const price = parseFloat(priceInput);
      if (isNaN(price) || price <= 0) {
           toast.error("Harga penawaran balik tidak valid.");
           return;
      }
      counterPrice = price;
    }

    setActionOfferId(offerId); // Mulai loading untuk tawaran ini
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/offers/${offerId}/seller-response`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action, counterPrice }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success(data.message || `Tawaran berhasil di-${action}.`);
      await fetchOffers(); // Refresh data
    } catch (error) {
      toast.error(error.message);
      setActionOfferId(null); // Hentikan loading jika error
    } 
    // Jangan set null di finally agar loading tetap sampai fetch selesai
  };

  const formatRupiah = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  if (isLoading) return <div className="p-8 text-center">Memuat tawaran masuk...</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto p-4 sm:p-8">
            {/* Header Halaman */}
            <div className="flex items-center gap-4 mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Manajemen Tawaran Masuk</h1>
            </div>

            {products.length > 0 ? (
            <div className="space-y-8">
                {products.map(product => {
                    const imageUrl = product.images?.[0]?.url || '/placeholder.svg';
                    return (
                        <div key={product.id} className="rounded-lg shadow-md border border-gray-200 overflow-hidden">
                            {/* Header Kartu Produk */}
                            <div className="p-4 flex gap-4 items-start bg-[var(--color-tawar-light)] border-b border-gray-100">
                                <div className="flex-shrink-0 w-20 h-20 relative bg-gray-100 rounded-md overflow-hidden">
                                    <Image src={imageUrl} alt={product.name} fill sizes="80px" style={{ objectFit: 'cover' }}/>
                                </div>
                                <div className="flex-grow">
                                    <Link href={`/products/${product.id}`} className="font-semibold text-lg text-gray-800 hover:text-blue-600 hover:underline">{product.name}</Link>
                                    <p className="text-sm text-gray-500 mt-1">Harga Asli Anda: <span className="font-medium text-gray-700">{formatRupiah(product.price)}</span></p>
                                </div>
                            </div>

                            {/* Daftar Tawaran untuk Produk Ini */}
                            <div className="divide-y divide-gray-100 bg bg-white ">
                                {product.offers.map(offer => {
                                    const isThisLoading = actionOfferId === offer.id;
                                    return (
                                        // --- PERBAIKAN STRUKTUR LAYOUT BARIS TAWARAN ---
                                        <div key={offer.id} className="p-4 flex flex-col md:flex-row gap-4 md:items-center">
                                            {/* Bagian Kiri/Tengah: Info Pembeli & Status */}
                                            <div className="flex-grow space-y-1">
                                                <p className="text-sm text-gray-500">
                                                     Dari: <span className="font-medium text-gray-700">{offer.buyer.profile?.fullName || offer.buyer.email}</span>
                                                </p>
                                                <OfferStatusBadge status={offer.status} />
                                            </div>

                                            {/* Bagian Kanan: Harga & Aksi */}
                                            <div className="flex-shrink-0 flex flex-col md:items-end w-full md:w-auto">
                                                <div className="mb-2 text-left md:text-right">
                                                    <p className="font-semibold text-xl text-[var(--color-tawar)]">{formatRupiah(offer.offerPrice)}</p>
                                                    <p className="text-xs text-[var(--color-danger)] font-medium">
                                                         Selisih: {formatRupiah(offer.priceDifference)}
                                                     </p>
                                                </div>
                                                <div className="flex flex-wrap justify-start md:justify-end gap-2">
                                                    {offer.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleResponse(offer.id, 'decline')} disabled={isThisLoading} className="btn-action-sm bg-[var(--color-danger)] hover:bg-[var(--color-danger-dark)] disabled:bg-gray-400">
                                                            {isThisLoading ? <Loader2 className="animate-spin" size={14}/> : <X size={14}/>} Tolak
                                                        </button>
                                                        <button onClick={() => handleResponse(offer.id, 'counter')} disabled={isThisLoading} className="btn-action-sm bg-[var(--color-warning)] hover:bg-[var(--color-warning-dark)] disabled:bg-gray-400">
                                                            {isThisLoading ? <Loader2 className="animate-spin" size={14}/> : <RefreshCw size={14}/>} Tawar Balik
                                                        </button>
                                                        <button onClick={() => handleResponse(offer.id, 'accept')} disabled={isThisLoading} className="btn-action-sm bg-[var(--color-success)] hover:bg-[var(--color-success-dark)] disabled:bg-gray-400">
                                                            {isThisLoading ? <Loader2 className="animate-spin" size={14}/> : <Check size={14}/>} Terima
                                                        </button>
                                                    </>
                                                    )}
                                                    {offer.status !== 'pending' && (
                                                        <p className="text-sm text-gray-500 italic">Tawaran sudah direspon.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
            ) : (
                <div className="text-center bg-white p-12 rounded-lg shadow-md border border-gray-200">
                    <Inbox className="mx-auto h-16 w-16 text-gray-300" strokeWidth={1.5} />
                    <h2 className="mt-4 text-xl font-semibold text-gray-800">Tidak Ada Tawaran Masuk</h2>
                    <p className="mt-2 text-gray-500">Tawaran dari pembeli untuk produk Anda akan muncul di sini.</p>
                </div>
            )}
        </div>
        {/* Tambahkan CSS helper untuk tombol aksi kecil */}
        <style jsx>{`
            .btn-action-sm {
                display: inline-flex;
                align-items: center;
                gap: 0.375rem; /* 6px */
                padding: 0.375rem 0.75rem; /* 6px 12px */
                font-size: 0.75rem; /* 12px */
                font-weight: 600;
                color: white;
                border-radius: 0.375rem; /* 6px */
                transition: background-color 0.2s;
            }
        `}</style>
    </div>
  );
}