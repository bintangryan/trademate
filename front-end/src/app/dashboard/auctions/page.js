// src/app/dashboard/auctions/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import ReAuctionModal from '@/components/ReAuctionModal';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, Gavel, Clock, RefreshCw, CheckCircle, Package, Loader2, Hourglass, XCircle } from 'lucide-react';

// --- Komponen Badge Status Lelang ---
const AuctionStatusBadge = ({ status, endTime }) => {
    const isTimeExpired = endTime ? new Date() > new Date(endTime) : false;

    let badgeInfo = { text: status.replace(/_/g, ' '), icon: <Package size={12}/>, class: 'bg-gray-100 text-gray-800' }; // Default

    if (status === 'available' && !isTimeExpired) {
         badgeInfo = { text: 'Sedang Berjalan', icon: <Hourglass size={12}/>, class: 'bg-blue-100 text-blue-800 animate-pulse' };
    } else if (status === 'available' && isTimeExpired) {
         badgeInfo = { text: 'Berakhir (Belum Final)', icon: <Clock size={12}/>, class: 'bg-yellow-100 text-yellow-800' };
    } else if (status === 'reserved') {
         badgeInfo = { text: 'Menunggu Checkout', icon: <Package size={12}/>, class: 'bg-purple-100 text-purple-800' };
    } else if (status === 'cancelled_by_buyer') {
         badgeInfo = { text: 'Dibatalkan Pemenang', icon: <XCircle size={12}/>, class: 'bg-orange-100 text-orange-800' };
    } else if (status === 'sold') {
         badgeInfo = { text: 'Terjual', icon: <CheckCircle size={12}/>, class: 'bg-green-100 text-green-800' };
    }

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full w-fit ${badgeInfo.class}`}>
            {badgeInfo.icon}
            {badgeInfo.text}
        </span>
    );
};


// --- Komponen Kartu Lelang ---
function AuctionCard({ product, onFinalize, onReAuction, isActionLoading, actionProductId }) {
  const formatRupiah = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  const winningBid = product.bids && product.bids.length > 0 ? product.bids[0] : null;
  const imageUrl = product.images?.[0]?.url || '/placeholder.svg';

  const isSold = product.status === 'sold';
  const isReserved = product.status === 'reserved';
  const isCancelled = product.status === 'cancelled_by_buyer';
  const isTimeExpired = product.endTime ? new Date() > new Date(product.endTime) : false;

  const showActionButtons = !isSold && !isReserved && (isTimeExpired || isCancelled);
  const canReAuction = showActionButtons;
  const canFinalize = showActionButtons && winningBid && !isCancelled;

  // Tentukan apakah tombol INI sedang loading
  const isThisLoading = isActionLoading && actionProductId === product.id;

  // --- Definisikan Kelas Tombol Aksi Langsung di Sini ---
  const baseButtonClasses = "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors min-w-[140px]";
  // ----------------------------------------------------

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <Link href={`/products/${product.id}`} className="font-bold text-lg text-gray-800 hover:text-[var(--color-lelang)] hover:underline">
                {product.name}
            </Link>
             <AuctionStatusBadge status={product.status} endTime={product.endTime} />
        </div>

        <div className="p-4 flex flex-col sm:flex-row gap-4 items-start">
             <div className="flex-shrink-0 w-24 h-24 relative bg-gray-100 rounded-md overflow-hidden">
                 <Image
                     src={imageUrl}
                     alt={product.name}
                     fill
                     sizes="100px"
                     style={{ objectFit: 'cover' }}
                 />
             </div>
             <div className="flex-grow space-y-2 text-sm">
                 <div>
                     <p className="text-gray-500">Harga Awal</p>
                     <p className="font-semibold text-gray-700">{formatRupiah(product.startingPrice)}</p>
                 </div>
                 <div>
                     <p className="text-gray-500">Bid Tertinggi Saat Ini</p>
                     <p className="font-bold text-lg text-[var(--color-lelang-light)]">
                         {winningBid ? formatRupiah(winningBid.amount) : 'Belum ada bid'}
                     </p>
                 </div>
                 {!isTimeExpired && product.endTime && (
                    <div className="flex items-center gap-2 text-red-600">
                        <Clock size={14} />
                        <span>Berakhir: {new Date(product.endTime).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                 )}
                  {isTimeExpired && (
                     <p className="text-gray-500 italic">Lelang telah berakhir.</p>
                  )}
             </div>
        </div>

        {showActionButtons && (
          <div className="p-4 bg-gray-50/70 border-t border-gray-200 flex justify-end items-center gap-3">
              <span className="text-sm font-medium text-gray-600 mr-auto">Aksi Lelang Berakhir:</span>
              {canReAuction && (
              <button
                  onClick={() => onReAuction(product)}
                  disabled={isActionLoading} // Disable jika ADA aksi lain yang berjalan
                  className={`${baseButtonClasses} bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400`} // Gunakan kelas Tailwind
              >
                  {isThisLoading ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
                  Lelang Ulang
              </button>
              )}
              {canFinalize && (
              <button
                  onClick={() => onFinalize(product.id)}
                  disabled={isActionLoading} // Disable jika ADA aksi lain yang berjalan
                  className={`${baseButtonClasses} bg-green-500 hover:bg-green-600 disabled:bg-gray-400`} // Gunakan kelas Tailwind
              >
                  {isThisLoading ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>}
                  Finalisasi Pemenang
              </button>
              )}
          </div>
        )}
    </div>
  );
}

// --- Komponen Utama Halaman ---
export default function AuctionManagementPage() {
    const { user } = useAuth();
    const [auctions, setAuctions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionProductId, setActionProductId] = useState(null); // ID produk yg sedang diproses
    const [productToReAuction, setProductToReAuction] = useState(null);

    const fetchAuctions = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        // Jangan reset actionProductId di sini
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3110/api/products/my-products?saleType=auction`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Gagal memuat data lelang.');

            const sortedAuctions = (data.products || []).sort((a, b) => {
                 const statusOrder = { 'available': 1, 'reserved': 2, 'cancelled_by_buyer': 3, 'sold': 4 };
                 return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
            });
            setAuctions(sortedAuctions);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchAuctions();
    }, [fetchAuctions]);

    const handleFinalizeAuction = async (productId) => {
        setActionProductId(productId);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3110/api/bids/${productId}/finalize`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            toast.success('Lelang difinalisasi! Item dipindahkan ke keranjang pemenang.');
            await fetchAuctions(); // Refresh
        } catch (error) {
            toast.error(error.message);
            setActionProductId(null); // Hentikan loading jika error
        } finally {
             // Cek lagi sebelum set null
             if (actionProductId === productId) {
                 setTimeout(() => setActionProductId(null), 300);
             }
        }
    };

    const handleOpenReAuctionModal = (product) => {
         setProductToReAuction(product);
     };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto p-4 sm:p-8">
                <div className="flex items-center gap-4 mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Manajemen Lelang</h1>
                </div>

                {isLoading ? <p className="text-center py-10 text-gray-500">Memuat data lelang...</p> : (
                    <div className="space-y-6">
                        {auctions.length > 0 ? auctions.map(product => (
                            <AuctionCard
                              key={product.id}
                              product={product}
                              onFinalize={handleFinalizeAuction}
                              onReAuction={handleOpenReAuctionModal}
                              isActionLoading={!!actionProductId}
                              actionProductId={actionProductId}
                            />
                        )) : (
                            <div className="text-center bg-white p-12 rounded-lg shadow-md border border-gray-200">
                                <Gavel className="mx-auto h-16 w-16 text-gray-300" strokeWidth={1.5} />
                                <h2 className="mt-4 text-xl font-semibold text-gray-800">Tidak Ada Lelang</h2>
                                <p className="mt-2 text-gray-500">Anda belum membuat produk lelang apa pun.</p>
                                <Link href="/dashboard/my-products/new" className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-transform hover:scale-105">
                                    Mulai Jual Barang Lelang
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {productToReAuction && (
                    <ReAuctionModal
                        product={productToReAuction}
                        onClose={() => setProductToReAuction(null)}
                        onAuctionRestarted={() => {
                            setProductToReAuction(null);
                            fetchAuctions();
                        }}
                    />
                )}
            </div>
            {/* Tidak perlu <style jsx> lagi */}
        </div>
    );
}