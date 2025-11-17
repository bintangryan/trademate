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
const AuctionStatusBadge = ({ status, auctionStatus, endTime }) => {
    const isTimeExpired = endTime ? new Date() > new Date(endTime) : false;

    let badgeInfo = { text: status.replace(/_/g, ' '), icon: <Package size={12}/>, class: 'bg-gray-100 text-gray-800' }; // Default

    // --- PERBAIKAN LOGIKA BADGE ---
    if (auctionStatus === 'running' && status === 'available' && !isTimeExpired) {
         badgeInfo = { text: 'Sedang Berjalan', icon: <Hourglass size={12}/>, class: 'bg-blue-100 text-blue-800 animate-pulse' };
    } else if (auctionStatus === 'running' && status === 'available' && isTimeExpired) {
         badgeInfo = { text: 'Berakhir (Belum Final)', icon: <Clock size={12}/>, class: 'bg-yellow-100 text-yellow-800' };
    } else if (status === 'reserved') {
         badgeInfo = { text: 'Menunggu Checkout', icon: <Package size={12}/>, class: 'bg-purple-100 text-purple-800' };
    } else if (status === 'cancelled_by_buyer') {
         // Teks ini lebih netral, cocok untuk pembatalan oleh buyer ATAU seller
         badgeInfo = { text: 'Dibatalkan/Berakhir', icon: <XCircle size={12}/>, class: 'bg-orange-100 text-orange-800' };
    } else if (status === 'sold') {
         badgeInfo = { text: 'Terjual', icon: <CheckCircle size={12}/>, class: 'bg-green-100 text-green-800' };
    } else if (auctionStatus === 'ended' && status === 'available') {
        // Ini adalah kasus di mana waktu berakhir tapi belum difinalisasi
         badgeInfo = { text: 'Berakhir (Belum Final)', icon: <Clock size={12}/>, class: 'bg-yellow-100 text-yellow-800' };
    }
    // --- AKHIR PERBAIKAN LOGIKA BADGE ---

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full w-fit ${badgeInfo.class}`}>
            {badgeInfo.icon}
            {badgeInfo.text}
        </span>
    );
};


// --- Komponen Kartu Lelang ---
function AuctionCard({ product, onFinalize, onReAuction, onCancel, isActionLoading, actionProductId }) {
  const formatRupiah = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  const winningBid = product.bids && product.bids.length > 0 ? product.bids[0] : null;
  const imageUrl = product.images?.[0]?.url || '/placeholder.svg';

  const isSold = product.status === 'sold';
  const isReserved = product.status === 'reserved';
  const isCancelledByBuyer = product.status === 'cancelled_by_buyer'; // Ini sekarang mencakup "cancelled_by_seller"
  const isTimeExpired = product.endTime ? new Date() > new Date(product.endTime) : false;
  
  // --- PERBAIKAN LOGIKA STATUS ---
  // Lelang berjalan jika status 'running' DAN 'available' DAN waktu belum berakhir
  const isRunning = product.auctionStatus === 'running' && product.status === 'available' && !isTimeExpired;
  
  // --- INI DIA PERBAIKANNYA ---
  // Lelang berakhir jika: (waktu sudah habis) ATAU (statusnya 'ended') ATAU (statusnya 'cancelled')
  const isEnded = isTimeExpired || product.auctionStatus === 'ended' || isCancelledByBuyer;
  // -----------------------------

  // 1. Bisa finalisasi KAPAN SAJA jika ada bid dan belum terjual/reservasi
  const canFinalize = !isSold && !isReserved && winningBid;
  
  // 2. Bisa batal HANYA JIKA sedang berjalan
  const canCancel = isRunning;
  
  // 3. Bisa lelang ulang HANYA JIKA sudah berakhir (dan belum terjual/reservasi)
  const canReAuction = isEnded && !isSold && !isReserved;

  const showActionButtons = canFinalize || canCancel || canReAuction;

  const isThisLoading = isActionLoading && actionProductId === product.id;
  const baseButtonClasses = "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors min-w-[140px]";

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <Link href={`/products/${product.id}`} className="font-bold text-lg text-[var(--color-lelang)] hover:text-[var(--color-lelang-dark)] hover:underline">
                {product.name}
            </Link>
             {/* --- Kirim kedua status ke badge --- */}
             <AuctionStatusBadge 
                status={product.status} 
                auctionStatus={product.auctionStatus} 
                endTime={product.endTime} 
             />
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
                     <p className="font-bold text-lg text-[var(--color-lelang)]">
                         {winningBid ? formatRupiah(winningBid.amount) : 'Belum ada bid'}
                     </p>
                 </div>
                 {isRunning && product.endTime && (
                    <div className="flex items-center gap-2 text-red-600">
                        <Clock size={14} />
                        <span>Berakhir: {new Date(product.endTime).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                 )}
                  {isEnded && (
                     <p className="text-gray-500 italic">Lelang telah berakhir atau dibatalkan.</p>
                  )}
             </div>
        </div>

        {showActionButtons && (
          <div className="p-4 bg-gray-50/70 border-t border-gray-200 flex flex-wrap justify-end items-center gap-3">
              <span className="text-sm font-medium text-gray-600 mr-auto">Aksi:</span>
              
              {canCancel && (
              <button
                  onClick={() => onCancel(product.id)}
                  disabled={isActionLoading}
                  className={`${baseButtonClasses} bg-red-500 hover:bg-red-600 disabled:bg-gray-400`}
              >
                  {isThisLoading ? <Loader2 size={14} className="animate-spin"/> : <XCircle size={14}/>}
                  Batal Lelang
              </button>
              )}

              {canReAuction && (
              <button
                  onClick={() => onReAuction(product)}
                  disabled={isActionLoading} 
                  className={`${baseButtonClasses} bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400`}
              >
                  {isThisLoading ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
                  Lelang Ulang
              </button>
              )}

              {canFinalize && (
              <button
                  onClick={() => onFinalize(product.id)}
                  disabled={isActionLoading} 
                  className={`${baseButtonClasses} bg-green-500 hover:bg-green-600 disabled:bg-gray-400`}
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
    const [actionProductId, setActionProductId] = useState(null); 
    const [productToReAuction, setProductToReAuction] = useState(null);

    const fetchAuctions = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3110/api/products/my-products?saleType=auction`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Gagal memuat data lelang.');
            
            // --- Logika sorting (ini sudah benar) ---
            const sortedAuctions = (data.products || []).sort((a, b) => {
                 const statusOrder = { 
                     'running': 1, 
                     'reserved': 2, 
                     'ended': 3, // (ended but not finalized)
                     'cancelled': 4,
                     'sold': 5 
                 };

                 const getStatusKey = (p) => {
                     if (p.auctionStatus === 'running' && p.status === 'available' && new Date(p.endTime) > new Date()) return 'running';
                     if (p.status === 'reserved') return 'reserved';
                     if (p.status === 'sold') return 'sold';
                     if (p.status === 'cancelled_by_buyer') return 'cancelled';
                     return 'ended'; // Default untuk yang sudah berakhir/available
                 };
                 
                 return (statusOrder[getStatusKey(a)] || 99) - (statusOrder[getStatusKey(b)] || 99);
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
            await fetchAuctions(); 
        } catch (error) {
            toast.error(error.message);
        } finally {
             setTimeout(() => setActionProductId(null), 300);
        }
    };
    
    // --- Handler untuk cancel (ini sudah benar) ---
    const handleCancelAuction = async (productId) => {
        if (!window.confirm("Yakin ingin membatalkan lelang ini? Semua bid akan dihapus.")) {
            return;
        }
        setActionProductId(productId);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3110/api/products/${productId}/cancel-auction`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            toast.success('Lelang berhasil dibatalkan.');
            await fetchAuctions(); // Refresh
        } catch (error) {
            toast.error(error.message);
        } finally {
             setTimeout(() => setActionProductId(null), 300);
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
                              onCancel={handleCancelAuction}
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
        </div>
    );
}