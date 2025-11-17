// src/app/dashboard/my-orders/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { Settings, ListOrdered, Calendar, Package, Store, Gavel, Tag } from 'lucide-react';

// Komponen Badge Status Pesanan (tidak berubah)
const OrderStatusBadge = ({ status }) => {
    const statusMap = {
        payment_pending: { text: 'Menunggu Pembayaran', class: 'bg-[var(--color-warning)]/40 text-yellow-800' },
        paid: { text: 'Dibayar', class: 'bg-[var(--color-lelang)]/40 text-blue-800' },
        shipped: { text: 'Dikirim', class: 'bg-indigo-100 text-indigo-800' },
        completed: { text: 'Selesai', class: 'bg-[var(--color-success)]/40 text-green-800' },
        cancelled: { text: 'Dibatalkan', class: 'bg-[var(--color-danger)]/40 text-red-800' },
    };
    const currentStatus = statusMap[status] || { text: status.replace('_', ' '), class: 'bg-gray-100 text-gray-800' };

    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full w-fit ${currentStatus.class}`}>
            {currentStatus.text}
        </span>
    );
};

// Komponen Badge Tipe Pembelian (tidak berubah)
const SaleTypeBadge = ({ saleType }) => {
    const isAuction = saleType === 'auction';
    const bgColor = isAuction ? 'bg-[var(--color-lelang)]' : 'bg-[var(--color-tawar-light)]';
    const textColor = isAuction ? 'text-[var(--color-tawar-light)]' : 'text-[var(--color-lelang-dark)]';
    const Icon = isAuction ? Gavel : Tag;
    
    return (
        <span className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold rounded-full w-fit ${bgColor} ${textColor}`}>
            <Icon size={12} />
            {isAuction ? 'Lelang' : 'Beli & Tawar'}
        </span>
    );
};


export default function MyOrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMyOrders = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/my-orders`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Gagal memuat riwayat pesanan.');
            const data = await res.json();
            setOrders(data.orders || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMyOrders();
    }, [fetchMyOrders]);

    const formatRupiah = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

    if (isLoading) return <div className="p-8 text-center">Memuat pesanan Anda...</div>;

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto p-4 sm:p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold text-gray-800">Riwayat Pesanan</h1>
                    </div>
                     <Link href="/dashboard/settings" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                        <Settings size={16} />
                        Pengaturan Akun
                    </Link>
                </div>

                {orders.length > 0 ? (
                    <div className="space-y-6">
                        {orders.map(order => (
                            <div key={order.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                                {/* === CARD HEADER === */}
                                <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                    <div className="flex items-center gap-4">
                                        <div className="font-bold text-gray-800">Order #{order.id}</div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar size={14} />
                                            {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                    </div>
                                    <OrderStatusBadge status={order.status} />
                                </div>

                                {/* === CARD BODY: DAFTAR ITEM === */}
                                <div className="divide-y divide-gray-100">
                                    {order.items.map(item => {
                                        const imageUrl = item.product.images?.[0]?.url || '/placeholder.svg';
                                        return (
                                            <div key={item.id} className="p-4 flex gap-4">
                                                <div className="flex-shrink-0 w-20 h-20 relative bg-gray-100 rounded-md overflow-hidden">
                                                    <Image
                                                        src={imageUrl}
                                                        alt={item.product.name}
                                                        fill
                                                        sizes="80px"
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                </div>
                                                <div className="flex-grow flex flex-col sm:flex-row justify-between gap-2">
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{item.product.name}</p>
                                                        <p className="text-xs text-gray-500 mt-1">Penjual: {item.product.seller.profile?.storeName || item.product.seller.email}</p>
                                                        <div className="mt-2">
                                                            <SaleTypeBadge saleType={item.product.saleType} />
                                                        </div>
                                                    </div>
                                                    <div className="sm:text-right">
                                                        <p className="font-semibold text-gray-900">{formatRupiah(item.agreedPrice)}</p>
                                                        <p className="text-sm text-gray-500">x{item.quantity} barang</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                
                                {/* === CARD FOOTER: TOTAL === */}
                                <div className="p-4 bg-gray-50/70 border-t border-gray-200 flex justify-end items-center gap-4">
                                    <span className="font-semibold">Total Pesanan</span>
                                    <span className="font-bold text-lg text-gray-900">{formatRupiah(order.finalAmount)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center bg-white p-12 rounded-lg shadow-md border border-gray-200">
                        <Package className="mx-auto h-16 w-16 text-gray-300" strokeWidth={1.5} />
                        <h2 className="mt-4 text-xl font-semibold text-gray-800">Belum Ada Pesanan</h2>
                        <p className="mt-2 text-gray-500">Semua pesanan yang Anda buat akan muncul di sini.</p>
                        <Link href="/" className="mt-6 inline-block bg-[var(--color-lelang)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--color-lelang-dark)] transition-transform hover:scale-105">
                            Mulai Belanja
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}