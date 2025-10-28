// src/app/shop/buy-now/page.js
// 1. HAPUS 'use client'

// import { useState, useEffect, useCallback } from 'react'; // <-- HAPUS
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import { Tag, Filter } from 'lucide-react';
import Link from 'next/link';

// Parameter saleType yang spesifik untuk Beli Langsung/Tawar
const SALE_TYPE = 'buy_now'; 

// 2. Buat fungsi fetch data terpisah
async function fetchBuyNowProducts(searchParams) {
    const params = new URLSearchParams();
    params.append('saleType', SALE_TYPE);
    
    // Ambil filter dari searchParams (bukan state)
    if (searchParams.search) {
        params.append('search', searchParams.search);
    }
    if (searchParams.categoryId) {
        params.append('categoryId', searchParams.categoryId);
    }
    if (searchParams.condition) { 
        params.append('condition', searchParams.condition); 
    }
    
    // Logika Sorting dari searchParams
    const sortBy = searchParams.sortBy || 'createdAt';
    const sortOrder = searchParams.sortOrder || 'desc';
    
    // PENTING: Gunakan 'price' untuk buy_now, bukan 'startingPrice'
    const apiSortBy = sortBy.includes('price') ? 'price' : sortBy;
    params.append('sortBy', apiSortBy);
    params.append('sortOrder', sortOrder);

    try {
        const res = await fetch('http://localhost:3110/api/products?' + params.toString(), {
            cache: 'no-store',
        });
        if (!res.ok) throw new Error('Gagal mengambil data beli langsung');
        
        return await res.json();
    } catch (error) {
        console.error(error);
        return []; 
    }
}

// 3. Ubah komponen utama menjadi 'async' dan terima 'searchParams'
export default async function BuyNowShopPage(props) {
    const { searchParams } = props;    
    // 4. HAPUS SEMUA useState dan useEffect untuk data fetching
    // const [products, setProducts] = useState([]);
    // const [isLoading, setIsLoading] = useState(true);
    // const [filters, setFilters] = useState(...);
    // const [isFilterOpen, setIsFilterOpen] = useState(false); 
    
    // 5. Panggil fetch data langsung di server
    const products = await fetchBuyNowProducts(searchParams);
    
    // const handleFilterChange = useCallback(...); // <-- HAPUS

    return (
        <div className="container mx-auto px-6 py-8">
            
            {/* 1. HERO BANNER/HEADER (Tidak berubah) */}
            <div className="p-8 rounded-2xl mb-10 shadow-md" style={{backgroundColor: 'var(--color-tawar-light)'}}>
                <h1 className="text-4xl font-extrabold mb-2 flex items-center text-[var(--color-lelang)]">
                    Beli atau Tawar Sesukamu
                </h1>
                <p className="text-lg text-gray-700">
                    Dapatkan barang bekas terbaik secara instan, atau kirim <strong className="font-extrabold">Tawaran Harga</strong> kamu langsung kepada penjual!
                </p>
                <Link href="/dashboard/buyer-offers" className="mt-3 inline-flex items-center text-sm font-semibold text-[var(--color-lelang)] hover:underline">
                    Lihat Tawaran Saya →
                </Link>
            </div>

            {/* 2. MOBILE FILTER TOGGLE (Kita hapus untuk sementara) */}
            {/* <div className="md:hidden mb-4">
                ... (Tombol toggle dihapus) ...
            </div>
            */}

            {/* 3. MAIN LAYOUT: Grid 1/4 (Filter Sidebar) + 3/4 (Products) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                
                {/* FILTER COLUMN (Sticky Sidebar) */}
                <div className={`md:col-span-1 block`}>
                    <div className="sticky top-24 bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Filter & Urutkan</h2>
                        {/* 6. Berikan 'searchParams' ke ProductFilters */}
                        <ProductFilters initialFilters={searchParams} />
                    </div>
                </div>

                {/* PRODUCT LISTING COLUMN */}
                <main className="md:col-span-3">
                    <p className="text-sm text-gray-500 mb-4">Menampilkan <strong>{products.length}</strong> produk</p>
                    
                    {/* 7. Hapus 'isLoading' logic */}
                    {products.length === 0 ? (
                        <p className="text-center bg-white p-8 rounded-xl shadow-md border border-gray-200">
                            Tidak ada produk yang cocok dengan filter
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}