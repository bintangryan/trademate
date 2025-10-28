// src/components/ProductInteraction.js
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import OfferModal from '@/components/OfferModal';
import BidModal from '@/components/BidModal';
import { ShoppingBagIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import AuctionTimer from './AuctionTimer';
import { ShoppingCart } from 'lucide-react';

const formatRupiah = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(price);
};

export default function ProductInteraction({ product, initialBids = [] }) {
    const { user } = useAuth();
    const { addToCart } = useCart();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [isBidModalOpen, setIsBidModalOpen] = useState(false);
    const [bids, setBids] = useState(initialBids);

    const isAuction = product.saleType === 'auction';
    const bidCount = bids?.length || 0;
    
    const currentHighestBid = bids.length > 0 ? bids[0].amount : product.startingPrice;

    const colorPalette = {
        main: isAuction ? 'var(--color-lelang)' : 'var(--color-tawar)',
        dark: isAuction ? 'var(--color-lelang-dark)' : 'var(--color-tawar-dark)',
        light: isAuction ? 'var(--color-lelang-light)' : 'var(--color-tawar-light)',
    };
    
    const handleAddToCart = async () => {
        setIsLoading(true);
        const success = await addToCart(product.id, product.price);
        if (!success && !user) {
            router.push('/auth/login');
        }
        setIsLoading(false);
    };

    // --- PERBAIKAN UTAMA DI FUNGSI INI ---
    // Fungsi ini sekarang hanya fokus pada API call dan melempar error jika gagal.
    const handleSendOffer = async (offerPrice) => {
        if (!user) {
            // Kita lempar error agar bisa ditangkap oleh OfferModal
            throw new Error('Silakan login untuk menawar harga.');
        }
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3110/api/offers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ productId: product.id, offerPrice }),
        });
        const data = await response.json();
        
        // Jika response GAGAL, lempar error dengan pesan dari backend.
        if (!response.ok) {
            throw new Error(data.message || 'Gagal mengirim penawaran');
        }
        
        // Jika berhasil, tidak perlu melakukan apa-apa. 
        // OfferModal akan menangani feedback sukses dan menutup dirinya sendiri.
        toast.success("Tawaran berhasil diajukan!"); // Toast ini bisa kita pindahkan jika mau
    };
    // --- AKHIR PERBAIKAN ---

    const handlePlaceBid = async (bidAmount) => {
        if (!user) {
             toast.error('Silakan login untuk ikut lelang.');
            throw new Error('Silakan login untuk ikut lelang.');
        }
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3110/api/bids', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ productId: product.id, amount: bidAmount }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Gagal mengajukan bid');
        
        toast.success('Bid berhasil diajukan!');
        
        const newBid = data.bid;
        setBids(prevBids => [newBid, ...prevBids]);
        
        setIsBidModalOpen(false);
    };

    return (
        <>
            <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-lg mb-8">
                <div className="mb-4">
                    {isAuction ? (
                        <div className="space-y-3">
                            <p className="text-lg text-gray-500 font-medium">Harga Tertinggi Saat Ini ({bidCount} Tawaran)</p>
                            <p className="text-5xl font-black" style={{ color: colorPalette.main }}>{formatRupiah(currentHighestBid)}</p>
                            <p className="text-sm text-gray-500">Minimal Kenaikan Bid: {formatRupiah(product.bidIncrement)}</p>
                            {product.endTime && <div className="pt-2"><AuctionTimer endTime={product.endTime} /></div>}
                        </div>
                    ) : (
                        <div>
                            <p className="text-lg text-gray-500 font-medium">Harga Jual</p>
                            <p className="text-5xl font-black" style={{ color: colorPalette.main }}>{formatRupiah(product.price)}</p>
                        </div>
                    )}
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                    {isAuction ? (
                        <button
                            onClick={() => setIsBidModalOpen(true)}
                            style={{ backgroundColor: colorPalette.main }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = colorPalette.dark}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = colorPalette.main}
                            className="w-full py-3 text-white rounded-lg font-semibold transition-colors"
                        >
                            Ajukan Bid
                        </button>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setIsOfferModalOpen(true)}
                                style={{ color: colorPalette.main, borderColor: colorPalette.main }}
                                className="w-full py-3 bg-white border-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                            >
                                Tawar Harga
                            </button>
                            <button
                                onClick={handleAddToCart}
                                style={{ backgroundColor: colorPalette.main }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = colorPalette.dark}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = colorPalette.main}
                                className="w-full py-3 text-white rounded-lg font-semibold transition-colors flex items-center justify-center"
                                disabled={isLoading}
                            >
                                {isLoading ? '...' : <><span>+</span> <ShoppingBagIcon className="h-6 w-6" /></>}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isOfferModalOpen && <OfferModal product={product} onClose={() => setIsOfferModalOpen(false)} onSubmit={handleSendOffer} />}
            {isBidModalOpen && <BidModal product={product} bids={bids} onClose={() => setIsBidModalOpen(false)} onSubmit={handlePlaceBid} />}
        </>
    );
}