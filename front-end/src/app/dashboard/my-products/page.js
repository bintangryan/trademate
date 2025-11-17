// src/app/dashboard/my-products/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Eye, Tag, Gavel, Edit, Trash2, PackagePlus, Search, ListFilter, Package, Loader2 } from 'lucide-react'; // <-- Pastikan Loader2 diimpor


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

// --- Komponen Kartu Produk untuk Dashboard Penjual ---
function MyProductCard({ product, onDelete, isActionLoading }) {
  const imageUrl = product.images?.[0]?.url || '/placeholder.svg';
  
  // --- PERUBAHAN LOGIKA DIMULAI DI SINI ---
  const isSold = product.status === 'sold'; // Ini tetap sama
  
  const formatRupiah = (price) => {
    if (price === null || price === undefined) return 'N/A'; // Tambahkan pengecekan null/undefined
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  }
  const priceDisplay = product.saleType === 'auction' ? product.startingPrice : product.price;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col">
      {/* Bagian Gambar */}
      <div className="relative w-full pt-[100%] bg-gray-100">
        {/* Gambar diposisikan absolut di dalam wadah 1:1 */}
        <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            className="absolute inset-0" // Pastikan gambar mengisi wadah
        />
        {/* Badge Status */}
        <span className={`absolute top-2 left-2 px-2 py-0.5 text-xs font-semibold rounded ${
            isSold ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        } capitalize z-10`}>
            
            {/* INI ADALAH PERUBAHAN YANG ANDA MINTA */}
            {isSold ? 'Terjual' : 'Tersedia'}
            {/* ----------------------------------- */}

        </span>
      </div>

      {/* Bagian Detail */}
      <div className="p-4 flex-grow flex flex-col">
        <h2 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">{product.name}</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
          <SaleTypeBadge saleType={product.saleType} />
          {priceDisplay !== null && priceDisplay !== undefined && (
            <>
              <span className="text-gray-300">|</span>
              <span className="font-bold text-gray-700">{formatRupiah(priceDisplay)}</span>
            </>
          )}
        </div>
        
        {/* Tombol Aksi */}
        <div className="mt-auto border-t border-gray-100 pt-3 flex justify-end space-x-2">
            <Link 
              href={`/products/${product.id}`} 
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Lihat Produk"
            >
                <Eye size={18} />
            </Link>
            {!isSold && (
            <>
                <Link 
                  href={`/dashboard/my-products/edit/${product.id}`} 
                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                  title="Edit Produk"
                >
                    <Edit size={18} />
                </Link>
                <button 
                  onClick={() => onDelete(product.id)}
                  disabled={isActionLoading} 
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:text-gray-400 disabled:bg-transparent disabled:cursor-not-allowed"
                  title="Hapus Produk"
                >
                    {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </button>
            </>
            )}
        </div>
      </div>
    </div>
  );
}
// --- AKHIR DARI MyProductCard ---


// --- Komponen Utama Halaman (Tidak berubah) ---
export default function MyProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [counts, setCounts] = useState(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [actionProductId, setActionProductId] = useState(null); // State untuk loading hapus
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchMyProducts = useCallback(async () => {
    if (!user) return;
    setIsPageLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      if (activeFilter === 'auction') params.append('saleType', 'auction');
      else if (activeFilter === 'buy_now') params.append('saleType', 'buy_now');
      else if (activeFilter === 'sold') params.append('status', 'sold');
      
      // Filter 'sold' hanya diterapkan jika filter 'sold' aktif
      if (activeFilter !== 'sold') {
          params.append('status_ne', 'sold'); 
      }

      const url = `http://localhost:3110/api/products/my-products?${params.toString()}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Gagal memuat produk.');
      
      const data = await res.json();
      setProducts(data.products || []); // Pastikan selalu array
      setCounts(data.counts || {}); // Pastikan selalu objek

    } catch (error) {
      toast.error(error.message || "Terjadi kesalahan saat memuat produk.");
      setProducts([]); // Set ke array kosong jika error
      setCounts({}); // Set ke objek kosong jika error
    } finally {
      setIsPageLoading(false);
    }
  }, [user, activeFilter, searchTerm]);

  useEffect(() => {
    fetchMyProducts();
  }, [fetchMyProducts]);

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Apakah kamu yakin ingin menghapus produk ini? Aksi ini tidak dapat dibatalkan.")) return;
    setActionProductId(productId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3110/api/products/${productId}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success(data.message || 'Produk berhasil dihapus.');
      await fetchMyProducts(); // Muat ulang data setelah berhasil
    } catch (error) {
      toast.error(error.message || 'Gagal menghapus produk.');
    } finally {
      setActionProductId(null);
    }
  };

  const FilterButton = ({ filterKey, label, count }) => (
    <button
      onClick={() => setActiveFilter(filterKey)}
      className={`w-full text-left px-4 py-2 rounded flex justify-between items-center transition-colors ${activeFilter === filterKey ? 'bg-[var(--color-tawar)] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
    >
      <span>{label}</span>
      {count !== undefined && count !== null && ( // Tambah pengecekan null
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${activeFilter === filterKey ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>{count}</span>
      )}
    </button>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div className='flex items-center gap-3'>
            <h1 className="text-3xl font-bold text-gray-800">Etalase Produk Saya</h1>
          </div>
          <Link href="/dashboard/my-products/new" className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-[var(--color-tawar)] text-white rounded-lg hover:bg-[var(--color-tawar-dark)] font-semibold transition-colors">
              <PackagePlus size={18}/>
              Jual Barang Baru
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Filter */}
          <aside className="md:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 sticky top-24">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700"><ListFilter size={18}/> Filter Etalase</h2>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari produk..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <nav className="space-y-1">
                <FilterButton filterKey="all" label="Semua Aktif" count={counts?.all} />
                <FilterButton filterKey="auction" label="Lelang" count={counts?.auction} />
                <FilterButton filterKey="buy_now" label="Beli & Tawar" count={counts?.buy_now} />
                <FilterButton filterKey="sold" label="Terjual" count={counts?.sold} />
              </nav>
            </div>
          </aside>
          
          {/* Grid Produk */}
          <main className="md:col-span-3">
            {isPageLoading ? (
              <p className="text-center py-10 text-gray-500">Memuat produk...</p>
            ) : (
              <>
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(product => 
                      <MyProductCard 
                        key={product.id} 
                        product={product} 
                        onDelete={handleDeleteProduct}
                        isActionLoading={actionProductId === product.id} 
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-center bg-white p-12 rounded-lg shadow-md border border-gray-200">
                    <Package className="mx-auto h-16 w-16 text-gray-300" strokeWidth={1.5} />
                    <h2 className="mt-4 text-xl font-semibold text-gray-800">Etalase Kosong</h2>
                    <p className="mt-2 text-gray-500">Belum ada produk yang cocok dengan filter atau kamu belum menambahkan produk</p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}