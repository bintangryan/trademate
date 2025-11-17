// src/app/cart/page.js
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import CountdownTimer from '@/components/CountdownTimer';
import toast from 'react-hot-toast';
import { Trash2, ShoppingBag, Gavel, Tag, TrendingDown } from 'lucide-react';

// Komponen Badge untuk Info Akuisisi Produk
const AcquisitionInfo = ({ item }) => {
    const formatRupiah = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

    const { product, agreedPrice } = item;
    const isAuctionWinner = product.saleType === 'auction' && product.status === 'reserved';
    
    const isAcceptedOffer = product.saleType === 'buy_now' && parseFloat(agreedPrice) < parseFloat(product.price);
    
    const priceDifference = isAcceptedOffer ? parseFloat(product.price) - parseFloat(agreedPrice) : 0;

    if (isAuctionWinner) {
        return (
            <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold rounded-full w-fit bg-[var(--color-lelang)] text-[var(--color-tawar-light)]">
                <Gavel size={12} />
                <span>Pemenang Lelang</span>
            </div>
        );
    }

    if (isAcceptedOffer) {
        return (
            <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold rounded-full w-fit bg-[var(--color-success)] text-green-100">
                <TrendingDown size={12} />
                <span>Tawaran Diterima (Hemat {formatRupiah(priceDifference)})</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold rounded-full w-fit bg-[var(--color-tawar-light)] text-[var(--color-lelang)]">
            <Tag size={12} />
            <span>Beli Langsung</span>
        </div>
    );
};


export default function CartPage() {
  const { user } = useAuth();
  const { cartItems, isLoading, removeFromCart, fetchCart } = useCart(); 
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    if(user) {
      fetchCart();
    }
  }, [user, fetchCart]);

  const handleRemoveItem = async (itemId) => {
    setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
    });
    await removeFromCart(itemId);
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        return newSet;
    });
  };
  
  const handleSelectAll = () => {
      if (selectedItems.size === cartItems.length) {
          setSelectedItems(new Set());
      } else {
          setSelectedItems(new Set(cartItems.map(item => item.id)));
      }
  };

  const selectedItemsDetails = useMemo(() => {
    if (!cartItems) return [];
    return cartItems.filter(item => selectedItems.has(item.id));
  }, [cartItems, selectedItems]);

  const totalPrice = useMemo(() => {
    return selectedItemsDetails.reduce((total, item) => total + parseFloat(item.agreedPrice), 0);
  }, [selectedItemsDetails]);

  const handleCheckout = () => {
      if (selectedItems.size === 0) {
          toast.error("Pilih setidaknya satu produk untuk checkout.");
          return;
      }
      const itemIds = Array.from(selectedItems).join(',');
      router.push(`/checkout?items=${itemIds}`);
  };

  const formatRupiah = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  if (isLoading) return <div className="p-8 text-center">Memuat keranjang Anda...</div>;

  return (
    <div className="bg-gray-50 min-h-[80vh]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Keranjang Belanja</h1>
        
        {!cartItems || cartItems.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-lg shadow-md border border-gray-200">
            <ShoppingBag className="mx-auto h-16 w-16 text-gray-300" strokeWidth={1.5} />
            <h2 className="mt-4 text-xl font-semibold text-gray-800">Keranjang Anda kosong</h2>
            <p className="mt-2 text-gray-500">Sepertinya Anda belum menambahkan apa pun. Mari kita cari sesuatu!</p>
            <Link href="/" className="mt-6 inline-block bg-[var(--color-lelang)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--color-lelang-dark)] transition-transform hover:scale-105">
                Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
            
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <input 
                        type="checkbox"
                        id="select-all"
                        className="h-5 w-5 rounded border-gray-300 text-[var(--color-lelang)] focus:ring-[var(--color-lelang)]"
                        checked={selectedItems.size === cartItems.length && cartItems.length > 0}
                        onChange={handleSelectAll}
                    />
                    <label htmlFor="select-all" className="ml-3 text-sm font-medium text-gray-700">Pilih Semua ({cartItems.length} produk)</label>
                  </div>
              </div>

              {cartItems.map(item => {
                const imageUrl = item.product.images?.[0]?.url || '/placeholder.svg';
                const isReservedAuction = item.product.status === 'reserved' && item.product.saleType === 'auction';
                let expiryTime;
                if (isReservedAuction && item.product.reservedAt) {
                    expiryTime = new Date(new Date(item.product.reservedAt).getTime() + 720 * 60 * 1000);
                }
                const priceColor = item.product.saleType === 'auction' ? 'text-[var(--color-lelang)]' : 'text-[var(--color-tawar)]';

                // Cek apakah ada perbedaan harga untuk menampilkan harga coret
                const showOriginalPrice = parseFloat(item.agreedPrice) < parseFloat(item.product.price);

                return (
                  <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 flex justify-center">
                        <input 
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-[var(--color-lelang)] focus:ring-[var(--color-lelang)]"
                            checked={selectedItems.has(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                        />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                        <div className="aspect-square relative bg-gray-100 rounded-md overflow-hidden">
                            <Image src={imageUrl} alt={item.product.name} fill sizes="100px" style={{ objectFit: 'cover' }} />
                        </div>
                    </div>
                    <div className="col-span-8 sm:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        <div className="sm:col-span-2 space-y-1.5">
                            <h2 className="font-semibold text-gray-800 leading-tight">{item.product.name}</h2>
                            <AcquisitionInfo item={item} />
                            {expiryTime && (
                              <div className="text-xs p-2 bg-red-50 text-red-700 border border-red-200 rounded-md w-fit">
                                Waktu checkout: <CountdownTimer expiryTimestamp={expiryTime} onExpire={() => handleRemoveItem(item.id)} />
                              </div>
                            )}
                        </div>
                        <div className="flex sm:flex-col sm:items-end justify-between items-center">
                            {/* --- PERBAIKAN DI SINI --- */}
                            <div className="flex flex-col sm:items-end">
                                <p className={`font-bold text-xl ${priceColor}`}>{formatRupiah(item.agreedPrice)}</p>
                                {showOriginalPrice && (
                                    <p className="text-s text-gray-500 line-through">{formatRupiah(item.product.price)}</p>
                                )}
                            </div>
                            <button onClick={() => handleRemoveItem(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                <Trash2 size={18} />
                                <span className="sr-only">Hapus item</span>
                            </button>
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-4">Ringkasan Pesanan</h2>
                <div className="space-y-2">
                    <div className="flex justify-between text-gray-600">
                        <span>Harga ({selectedItems.size} produk)</span>
                        <span className="font-medium text-gray-800">{formatRupiah(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>Biaya Pengiriman</span>
                        <span className="font-medium text-gray-800">-</span>
                    </div>
                </div>
                <div className={`flex justify-between font-bold text-lg text-gray-900 border-t pt-4 mt-4`}>
                  <span>Total</span>
                  <span>{formatRupiah(totalPrice)}</span>
                </div>
                <button 
                  onClick={handleCheckout} 
                  disabled={selectedItems.size === 0}
                  className="block text-center w-full mt-6 bg-[var(--color-tawar)] text-white py-3 rounded-lg font-semibold hover:bg-[var(--color-lelang)] transition-transform hover:scale-105 disabled:bg-gray-300 disabled:scale-100 disabled:cursor-not-allowed">
                  Lanjut ke Checkout ({selectedItems.size})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}