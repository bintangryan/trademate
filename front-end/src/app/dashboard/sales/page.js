// src/app/dashboard/sales/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import { DollarSign, Calendar, Package, User, MapPin, Gavel, Tag, Check, Send, CircleCheck } from 'lucide-react'; // Impor Ikon

const OrderStatusBadge = ({ status }) => {
    const statusMap = {
        payment_pending: { text: 'Menunggu Pembayaran', class: 'bg-[var(--color-warning)]/40 text-yellow-800' },
        paid: { text: 'Dibayar', class: 'bg-[var(--color-lelang)] text-white ' },
        shipped: { text: 'Dikirim', class: 'bg-indigo-100 text-indigo-800' },
        completed: { text: 'Selesai', class: 'bg-[var(--color-success)] text-white' },
        cancelled: { text: 'Dibatalkan', class: 'bg-[var(--color-danger)] text-white' },
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


export default function SalesManagementPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingOrderId, setUpdatingOrderId] = useState(null); // State untuk loading tombol

    const fetchSales = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3110/api/orders/seller', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Gagal memuat data penjualan.');
            setOrders(data.orders || []);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);
    
    const formatRupiah = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

    const handleUpdateStatus = async (orderId, newStatus) => {
        setUpdatingOrderId(orderId); // Mulai loading
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3110/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            toast.success(`Status pesanan #${orderId} diubah menjadi ${newStatus}.`);
            fetchSales(); // Refresh data
        } catch (error) {
            toast.error(error.message);
        } finally {
             setUpdatingOrderId(null); // Hentikan loading
        }
    };

    if (isLoading) return <div className="p-8 text-center">Memuat data penjualan...</div>;

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto p-4 sm:p-8">
                {/* Header Halaman */}
                <div className="flex items-center gap-4 mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Manajemen Penjualan</h1>
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
                                
                                {/* === INFO PEMBELI === */}
                                <div className="p-4 border-b border-gray-100">
                                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><User size={14}/> Info Pembeli:</p>
                                    <p className="text-sm text-gray-600">{order.buyer.profile?.fullName || order.buyer.email}</p>
                                    {order.buyer.profile?.address && (
                                        <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                                            <MapPin size={12} className="mt-0.5 flex-shrink-0"/> 
                                            <span>{order.buyer.profile.address}</span>
                                        </p>
                                    )}
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
                                                        <div className="mt-1">
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
                                
                                {/* === CARD FOOTER: AKSI PENJUAL & TOTAL === */}
                                <div className="p-4 bg-gray-50/70 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                                    {/* Tombol Aksi */}
                                    <div className="flex items-center space-x-2">
                                        {order.status === 'payment_pending' && (
                                            <button onClick={() => handleUpdateStatus(order.id, 'paid')} disabled={updatingOrderId === order.id} className="btn-action bg-[var(--color-lelang)]  hover:bg-[var(--color-lelang-dark)]  disabled:bg-gray-400">
                                                <Check size={14}/> Konfirmasi Bayar
                                            </button>
                                        )}
                                        {order.status === 'paid' && (
                                            <button onClick={() => handleUpdateStatus(order.id, 'shipped')} disabled={updatingOrderId === order.id} className="btn-action bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400">
                                                <Send size={14}/> Tandai Dikirim
                                            </button>
                                        )}
                                        {order.status === 'shipped' && (
                                            <button onClick={() => handleUpdateStatus(order.id, 'completed')} disabled={updatingOrderId === order.id} className="btn-action bg-[var(--color-success)]  hover:bg-[var(--color-success-dark)] disabled:bg-gray-400">
                                               <CircleCheck size={14}/> Selesaikan
                                            </button>
                                        )}
                                        {/* Tampilkan pesan jika sudah Selesai/Batal */}
                                        {(order.status === 'completed' || order.status === 'cancelled') && (
                                            <span className="text-sm font-medium text-gray-500 italic">Pesanan {order.status === 'completed' ? 'selesai' : 'dibatalkan'}</span>
                                        )}
                                    </div>
                                    {/* Total */}
                                    <div className="flex items-center gap-4 self-end sm:self-center">
                                        <span className="font-semibold text-sm">Total Penjualan</span>
                                        <span className="font-bold text-lg text-gray-900">{formatRupiah(order.finalAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center bg-white p-12 rounded-lg shadow-md border border-gray-200">
                        <Package className="mx-auto h-16 w-16 text-gray-300" strokeWidth={1.5} />
                        <h2 className="mt-4 text-xl font-semibold text-gray-800">Belum Ada Penjualan</h2>
                        <p className="mt-2 text-gray-500">Pesanan yang masuk akan muncul di sini.</p>
                        <Link href="/dashboard/my-products/new" className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-transform hover:scale-105">
                            Mulai Jual Barang
                        </Link>
                    </div>
                )}
            </div>
            {/* Tambahkan CSS helper untuk tombol aksi */}
            <style jsx>{`
                .btn-action {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem; /* 8px */
                    padding: 0.5rem 1rem; /* 8px 16px */
                    font-size: 0.875rem; /* 14px */
                    font-weight: 600;
                    color: white;
                    border-radius: 0.5rem; /* 8px */
                    transition: background-color 0.2s;
                }
            `}</style>
        </div>
    );
}