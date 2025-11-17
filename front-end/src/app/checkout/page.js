// src/app/checkout/page.js
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Truck, Warehouse, Landmark, Wallet, CheckCircle } from 'lucide-react';

// Komponen SelectionCard (tidak berubah)
function SelectionCard({ icon, label, value, name, selectedValue, onChange, disabled = false, children }) {
    const isSelected = value === selectedValue;

    return (
        <label className={`
            p-5 border-2 rounded-lg flex items-start gap-5 transition-all
            ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'cursor-pointer bg-white'}
            ${isSelected ? 'border-[var(--color-tawar-dark)] shadow-md ring-2 ring-[var(--color-tawar-dark)]' : 'border-gray-200 hover:border-gray-400'}
        `}>
            <input
                type="radio"
                name={name}
                value={value}
                checked={isSelected}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="sr-only"
            />
            <div className={`mt-1 flex-shrink-0 ${isSelected ? 'text-[var(--color-lelang)]' : 'text-gray-500'}`}>
                {icon}
            </div>
            <div className="flex-grow">
                <span className={`font-bold ${disabled ? 'text-gray-400' : 'text-gray-800'}`}>{label}</span>
                {children}
            </div>
           
        </label>
    );
}

export default function CheckoutPage() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [selectedItems, setSelectedItems] = useState([]);
    const [sellerAddress, setSellerAddress] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    
    const [shippingMethod, setShippingMethod] = useState('courier');
    const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

    // --- PERBAIKAN PADA useCallback ---
    // Tambahkan dependency array yang benar
    const fetchData = useCallback(async () => {
        if (!user) return;
        const itemIdsParam = searchParams.get('items');
        if (!itemIdsParam) {
            toast.error("Tidak ada produk yang dipilih.");
            router.push('/cart');
            return;
        }
        const selectedIds = itemIdsParam.split(',').map(id => parseInt(id));

        const token = localStorage.getItem('token');
        try {
            const cartRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const cartData = await cartRes.json();
            if (!cartRes.ok || !cartData.cart) throw new Error('Gagal memuat keranjang.');

            const itemsToCheckout = cartData.cart.items.filter(item => selectedIds.includes(item.id));
            if (itemsToCheckout.length === 0) {
                throw new Error('Produk yang dipilih tidak ditemukan di keranjang.');
            }
            setSelectedItems(itemsToCheckout);

            const firstProductId = itemsToCheckout[0].productId;
            const productRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${firstProductId}`);
            if(!productRes.ok) throw new Error('Gagal mengambil detail produk.');
            
            const productData = await productRes.json();
            setSellerAddress(productData.seller?.profile?.address || 'Penjual belum mengatur alamat.');

        } catch (error) {
            toast.error(error.message);
            router.push('/cart');
        } finally {
            setIsLoading(false);
        }
    }, [user, router, searchParams]); // <-- Dependency array yang benar

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (shippingMethod !== 'pickup' && paymentMethod === 'cod') {
            setPaymentMethod('bank_transfer');
        }
    }, [shippingMethod, paymentMethod]);
    
    const handleCreateOrder = async () => {
        if (selectedItems.length === 0) {
            toast.error('Tidak ada produk untuk di-checkout.');
            return;
        }
        setIsPlacingOrder(true);
        try {
            const token = localStorage.getItem('token');
            const itemIds = selectedItems.map(item => item.id);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ itemIds, shippingMethod, paymentMethod }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            toast.success('Pesanan berhasil dibuat!');
            router.push('/dashboard/my-orders');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsPlacingOrder(false);
        }
    };

    // --- PERBAIKAN PADA useMemo ---
    // Dependency array ini sudah benar, linter-nya yang keliru.
    // Kode ini tidak perlu diubah, tapi saya sertakan untuk kelengkapan.
    const totalPrice = useMemo(() => {
        return selectedItems.reduce((total, item) => total + parseFloat(item.agreedPrice), 0);
    }, [selectedItems]);

    const formatRupiah = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

    if (isLoading) return <div className="p-8 text-center">Memuat...</div>;

return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto p-4 sm:p-8">
                <h1 className="text-3xl font-bold mb-8">Checkout</h1>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12 items-start">
                    
                    {/* Kolom Kiri: Pilihan Pengiriman & Pembayaran */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Pilihan Pengiriman */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h2 className="text-xl font-bold mb-5">Metode Pengiriman</h2>
                            <div className="space-y-4">
                                <SelectionCard
                                    icon={<Truck size={24} />}
                                    label="Kurir Online"
                                    name="shippingMethod"
                                    value="courier"
                                    selectedValue={shippingMethod}
                                    onChange={setShippingMethod}
                                >
                                  <p className="text-sm text-gray-600">Dikirim menggunakan GoSend, GrabExpress, dll.</p>
                                </SelectionCard>

                                <SelectionCard
                                    icon={<Warehouse size={24} />}
                                    label="Ambil di Tempat (Pickup)"
                                    name="shippingMethod"
                                    value="pickup"
                                    selectedValue={shippingMethod}
                                    onChange={setShippingMethod}
                                >
                                    <p className="text-sm text-gray-600">Ambil langsung di lokasi penjual.</p>
                                    {shippingMethod === 'pickup' && (
                                        <div className="mt-2 ml-1 p-3 bg-gray-100 border rounded-md text-sm text-gray-700">
                                            <p className="font-semibold">Alamat Penjual:</p>
                                            <p>{sellerAddress}</p>
                                        </div>
                                    )}
                                </SelectionCard>
                            </div>
                        </div>

                        {/* Pilihan Pembayaran */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h2 className="text-xl font-bold mb-5">Metode Pembayaran</h2>
                            <div className="space-y-4">
                                <SelectionCard
                                    icon={<Landmark size={24} />}
                                    label="Transfer Bank"
                                    name="paymentMethod"
                                    value="bank_transfer"
                                    selectedValue={paymentMethod}
                                    onChange={setPaymentMethod}
                                >
                                     <p className="text-sm text-gray-600">Transfer manual ke rekening yang dituju.</p>
                                </SelectionCard>
                                
                                <SelectionCard
                                    icon={<Wallet size={24} />}
                                    label="Bayar Tunai di Tempat (COD)"
                                    name="paymentMethod"
                                    value="cod"
                                    selectedValue={paymentMethod}
                                    onChange={setPaymentMethod}
                                    disabled={shippingMethod !== 'pickup'}
                                >
                                    <p className="text-sm">Hanya tersedia jika Anda memilih Ambil di Tempat.</p>
                                </SelectionCard>
                            </div>
                        </div>
                    </div>
                    
                    {/* Kolom Kanan: Ringkasan Pesanan */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 sticky top-24">
                            <h2 className="text-xl font-bold mb-4">Ringkasan Pesanan</h2>
                            <div className="space-y-2 mb-4 border-b pb-4">
                                {selectedItems.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm items-start gap-4">
                                        <span className="flex-1 pr-2 text-gray-800">{item.product.name}</span>
                                        <span className="font-medium text-gray-900">{formatRupiah(item.agreedPrice)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{formatRupiah(totalPrice)}</span>
                            </div>
                            <button 
                                onClick={handleCreateOrder} 
                                disabled={isPlacingOrder || isLoading} 
                                className="w-full mt-6 bg-[var(--color-tawar)] text-white py-3 rounded-lg font-semibold hover:bg-[var(--color-lelang)]  transition-transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100"
                            >
                                {isPlacingOrder ? 'Memproses...' : 'Buat Pesanan'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Salin fungsi-fungsi handler yang tidak diubah agar kode tetap lengkap
const tempFetchData = async () => {};
const tempHandleCreateOrder = async () => {};

Object.assign(CheckoutPage, {
  defaultProps: {
    fetchData: tempFetchData,
    handleCreateOrder: tempHandleCreateOrder,
    totalPrice: 0,
    formatRupiah: () => ''
  }
});