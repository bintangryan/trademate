// src/components/ProductInfoTabs.js
'use client';

import { useState } from 'react';
import { FaStore, FaInfoCircle, FaGavel, FaClipboardList } from 'react-icons/fa';

// Fungsi format Rupiah (bisa juga di-import dari file utils)
const formatRupiah = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(price);
};

/**
 * Komponen Pembantu untuk Tombol Tab
 */
function TabButton({ title, isActive, onClick, icon }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center space-x-2 px-3 py-3 font-semibold text-sm transition-colors whitespace-nowrap ${
                isActive
                    ? 'border-b-2 border-[var(--color-lelang)] text-[var(--color-lelang)]'
                    : 'text-gray-500 hover:text-gray-800 border-b-2 border-transparent'
            }`}
        >
            {icon}
            <span>{title}</span>
        </button>
    );
}

/**
 * Komponen Pembantu untuk Baris Detail di Tab Spesifikasi
 */
function DetailRow({ label, value }) {
    return (
        <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">{label}</span>
            <span className="font-semibold text-gray-800 capitalize text-right">{value}</span>
        </div>
    );
}

export default function ProductInfoTabs({ product, initialBids = [] }) {
    const [activeTab, setActiveTab] = useState('description');
    const isAuction = product.saleType === 'auction';
    const bidCount = initialBids?.length || 0;

    return (
        <div className="mt-8">
            {/* Tab Buttons */}
            <div className="border-b border-gray-200 mb-4">
                <nav className="flex space-x-1 md:space-x-4 overflow-x-auto">
                    <TabButton icon={<FaInfoCircle />} title="Deskripsi" isActive={activeTab === 'description'} onClick={() => setActiveTab('description')} />
                    <TabButton icon={<FaClipboardList />} title="Spesifikasi" isActive={activeTab === 'specs'} onClick={() => setActiveTab('specs')} />
                    <TabButton icon={<FaStore />} title="Info Penjual" isActive={activeTab === 'seller'} onClick={() => setActiveTab('seller')} />
                    {isAuction && (
                        <TabButton icon={<FaGavel />} title="Riwayat Bid" isActive={activeTab === 'bids'} onClick={() => setActiveTab('bids')} />
                    )}
                </nav>
            </div>
            
            {/* Tab Content */}
            <div className="py-4">
                {activeTab === 'description' && (
                    <div className="text-gray-700 whitespace-pre-wrap prose prose-sm max-w-none">
                        <p>{product.description || 'Penjual tidak memberikan deskripsi'}</p>
                    </div>
                )}
                
                {activeTab === 'specs' && (
                    <div className="space-y-3">
                        <DetailRow label="Kondisi" value={product.condition?.replace('_', ' ') || '-'} />
                        <DetailRow label="Masa Pakai" value={product.usagePeriod || '-'} />
                    </div>
                )}
                
                {activeTab === 'seller' && (
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <FaStore className="text-gray-500 text-xl" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">{product.seller?.profile?.storeName || product.seller.email}</p>
                            <p className="text-sm text-gray-500">Bergabung Sejak: {new Date(product.seller.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}</p>
                        </div>
                    </div>
                )}
                
                {activeTab === 'bids' && isAuction && (
                    <div>
                        {bidCount > 0 ? (
                            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {initialBids.map((bid, index) => (
                                    <li key={bid.id} className={`flex justify-between p-3 rounded-lg border ${index === 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                                        <span className={`font-semibold ${index === 0 ? 'text-green-700' : 'text-gray-700'}`}>
                                            {index === 0 ? 'Tawaran Tertinggi' : `Tawaran #${bidCount - index}`}
                                        </span>
                                        <span className={`font-bold ${index === 0 ? 'text-green-800' : 'text-gray-900'}`}>{formatRupiah(bid.amount)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-center py-4">Belum ada tawaran untuk produk ini. Jadilah yang pertama!</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}