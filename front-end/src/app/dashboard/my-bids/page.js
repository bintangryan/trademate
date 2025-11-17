// src/app/dashboard/my-bids/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import BidModal from '@/components/BidModal';
// --- PERBAIKAN: Impor XCircle ---
import { Gavel, Trophy, TrendingUp, TrendingDown, ShoppingBag, XCircle } from 'lucide-react';

// --- PERBAIKAN: Komponen Status diperbarui ---
function BidStatus({ product, userId }) {
    const highestBid = product.highestBid;
    const isWinner = product.auctionWinnerId === userId;
    const isHighestBidder = highestBid?.userId === userId;

    // --- TAMBAHKAN INI: Cek status dibatalkan ---
    // (Kita gunakan 'cancelled_by_buyer' karena itu status yang di-set oleh seller)
    if (product.status === 'cancelled_by_buyer') {
        return <div className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-white bg-gray-500 rounded-full"><XCircle size={14} /> DIBATALKAN</div>;
    }
    // ------------------------------------------

    if (product.status === 'sold' && isWinner) {
        return <div className="flex items-center gap-2 px-3 py-1 text-xs font-bold text-white bg-[var(--color-success)] rounded-full"><Trophy size={14} /> MENANG</div>;
    }
    if (product.status === 'reserved' && isWinner) {
        return <div className="flex items-center gap-2 px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded-full"><ShoppingBag size={14} /> DI KERANJANG</div>;
    }

    // --- PERBAIKAN: Jangan tampilkan status jika lelang sudah berakhir/batal ---
    if (product.auctionStatus === 'ended' || product.status === 'cancelled_by_buyer') {
        return <div className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-full"><TrendingDown size={14} /> KALAH</div>;
    }
    
    if (isHighestBidder) {
        return <div className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-white bg-[var(--color-lelang)] rounded-full"><TrendingUp size={14} /> TERTINGGI</div>;
    }
    
    return <div className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-white bg-[var(--color-danger)] rounded-full"><TrendingDown size={14} /> KALAH</div>;
}

export default function MyBidsPage() {
    const { user } = useAuth();
    const [auctions, setAuctions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isBidModalOpen, setIsBidModalOpen] = useState(false);
    const [selectedAuction, setSelectedAuction] = useState(null);

    const fetchMyBids = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            setAuctions([]);
            return;
        };
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('${process.env.NEXT_PUBLIC_API_URL}/api/auctions/my-bids', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setAuctions(data.auctions || []);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMyBids();
    }, [fetchMyBids]);

    const handleOpenBidModal = (auction) => {
        setSelectedAuction(auction);
        setIsBidModalOpen(true);
    };

    const handlePlaceBid = async (bidAmount) => {
        if (!selectedAuction) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('${process.env.NEXT_PUBLIC_API_URL}/api/bids', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ productId: selectedAuction.id, amount: bidAmount }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Gagal menempatkan bid');
            
            toast.success('Bid berhasil diajukan!');
            setIsBidModalOpen(false); // Tutup modal
            fetchMyBids(); // Refresh data untuk menampilkan tawaran baru Anda!
        } catch (error) {
            // Error akan ditangani oleh BidModal, kita hanya perlu memastikan modal tidak tertutup
            throw error; // Lempar lagi error agar BidModal bisa menangkapnya
        }
    };

    const formatRupiah = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

    if (!user) {
        return <div className="p-8 text-center">Memuat data pengguna... Silakan login jika belum</div>;
    }

    if (isLoading) return <div className="p-8 text-center">Memuat lelang yang kamu ikuti...</div>;

    return (
        <div className="container mx-auto p-4 sm:p-8 bg-gray-50">
            <div className="flex items-center gap-4 mb-8">
                <h1 className="text-3xl font-bold">Pengajuan Lelang Saya</h1>
            </div>

            {auctions.length > 0 ? (
                <div className="space-y-6">
                    {auctions.map(auction => (
                        <div key={auction.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 grid grid-cols-12 gap-4 items-center">
                            {/* Kolom Gambar */}
                            <div className="col-span-3 lg:col-span-2">
                                <Link href={`/products/${auction.id}`}>
                                    <div className="aspect-square relative bg-gray-100 rounded-md overflow-hidden">
                                        <Image
                                            src={auction.images[0]?.url || '/placeholder.svg'}
                                            alt={auction.name}
                                            fill
                                            sizes="150px"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </div>
                                </Link>
                            </div>

                            {/* Kolom Detail */}
                            <div className="col-span-9 lg:col-span-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="font-semibold text-lg leading-tight">{auction.name}</h2>
                                        <BidStatus product={auction} userId={user.userId} />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 text-sm">
                                        <div>
                                            <p className="text-gray-500">Bid Kamu</p>
                                            <p className="font-bold text-green-600 ">{formatRupiah(auction.userHighestBid?.amount || 0)}</p>
                                        </div>
                                        <div className="mt-2 sm:mt-0">
                                            <p className="text-gray-500">Bid Tertinggi</p>
                                            <p className="font-bold text-gray-800">{formatRupiah(auction.highestBid?.amount || 0)}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Kolom Aksi */}
                                <div className="flex-shrink-0 w-full sm:w-auto">
                                    {/* --- PERBAIKAN LOGIKA TOMBOL --- */}
                                    {(auction.auctionStatus === 'running' && auction.status !== 'cancelled_by_buyer') ? (
                                        <button 
                                            onClick={() => handleOpenBidModal(auction)}
                                            className="w-full sm:w-auto text-center px-4 py-2 bg-transparent border-2 border-[var(--color-warning)] text-[var(--color-warning)] text-sm font-semibold rounded-lg hover:bg-[var(--color-warning)] hover:text-white transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Gavel size={16} />
                                            Ajukan Lagi
                                        </button>
                                    ) : (
                                        <span className="w-full sm:w-auto text-center px-4 py-2 bg-gray-200 text-gray-500 text-sm font-semibold rounded-lg">
                                            {/* Teks dinamis berdasarkan status */}
                                            {auction.status === 'cancelled_by_buyer' ? 'Dibatalkan' : 'Lelang Berakhir'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center bg-white p-12 rounded-lg shadow-md border border-gray-200">
                    <Gavel className="mx-auto h-16 w-16 text-gray-300" strokeWidth={1.5} />
                    <h2 className="mt-4 text-xl font-semibold text-gray-800">Kamu belum mengikuti lelang</h2>
                    <p className="mt-2 text-gray-500">Cari produk lelang yang menarik dan jadilah pemenangnya!</p>
                    <Link href="/shop/auction" className="mt-6 inline-block bg-[var(--color-lelang)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--color-lelang-dark)] transition-transform hover:scale-105">
                        Cari Produk Lelang
                    </Link>
                </div>
            )}

            {isBidModalOpen && selectedAuction && (
                <BidModal
                    product={selectedAuction}
                    bids={selectedAuction.bids || []}
                    onClose={() => setIsBidModalOpen(false)}
                    onSubmit={handlePlaceBid}
                />
            )}
        </div>
    );
}