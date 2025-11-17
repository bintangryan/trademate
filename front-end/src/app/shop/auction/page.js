// src/app/shop/auction/page.js

// 1. HAPUS 'use client'
// import { useState, useEffect, useCallback } from 'react'; // <-- HAPUS
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import { Gavel, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

// Parameter saleType yang spesifik untuk Lelang
const SALE_TYPE = 'auction'; 

// 2. Buat fungsi fetch data terpisah
async function fetchAuctionProducts(searchParams) {
    const params = new URLSearchParams();
    params.append('saleType', SALE_TYPE); 
    
    // 3. Ambil filter dari searchParams (bukan state)
    if (searchParams.search) {
        params.append('search', searchParams.search);
    }
    if (searchParams.categoryId) {
        params.append('categoryId', searchParams.categoryId);
    }
    if (searchParams.condition) { 
        params.append('condition', searchParams.condition); 
    }
    
    // 4. Logika Sorting dari searchParams
    const sortBy = searchParams.sortBy || 'createdAt';
    const sortOrder = searchParams.sortOrder || 'desc';

    const apiSortBy = sortBy.includes('price') ? 'startingPrice' : sortBy;
    params.append('sortBy', apiSortBy);
    params.append('sortOrder', sortOrder);

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?` + params.toString(), {
            cache: 'no-store', // Data lelang harus selalu fresh
        });
        if (!res.ok) throw new Error('Gagal mengambil data lelang');
        return await res.json();
    } catch (error) {
        console.error(error);
        return []; // Kembalikan array kosong jika gagal
    }
}


// 5. Ubah komponen utama menjadi 'async' dan terima 'searchParams'
export default async function AuctionShopPage(props) {
    const { searchParams } = props;
    // 6. HAPUS SEMUA useState dan useEffect untuk data fetching
    // const [products, setProducts] = useState([]);
    // const [isLoading, setIsLoading] = useState(true);
    // const [filters, setFilters] = useState(...);
    // const [isFilterOpen, setIsFilterOpen] = useState(false); // <-- Kita sederhanakan ini
    
    // 7. Panggil fetch data langsung di server
    const products = await fetchAuctionProducts(searchParams);

    // Kita tidak perlu 'handleFilterChange' lagi
    // 'ProductFilters' akan menangani perubahannya sendiri
    
    // Sederhanakan logika mobile filter:
    // Kita akan buat komponen toggle terpisah di step berikutnya jika diperlukan.
    // Untuk saat ini, kita biarkan filter selalu terlihat.

    return (
        <div className="container mx-auto px-6 py-8">
            
            {/* 1. HERO BANNER/HEADER (Tidak berubah) */}
            <div className="p-8 rounded-2xl mb-10 shadow-xl" style={{backgroundColor: 'var(--color-lelang-dark)', color: 'white'}}>
                <h1 className="text-4xl font-extrabold mb-2 flex items-center text-[var(--color-tawar)]">
                    Lelang Produk Incaranmu !
                </h1>
                <p className="text-lg opacity-90">
                    Ajukan dan pantau bid kamu secara real-time untuk dapatkan barang incaranmu sebelum lelang berakhir dan dimenangkan pembeli lain!
                </p>
                <Link href="/dashboard/my-bids" className="mt-3 inline-flex items-center text-sm font-semibold text-[var(--color-tawar)] hover:underline">
                    Lihat Bid Saya →
                </Link>
            </div>

            {/* 2. MOBILE FILTER TOGGLE (Kita hapus untuk sementara) */}
            {/* <div className="md:hidden mb-4">
                ... (Tombol toggle dihapus untuk menyederhanakan migrasi RSC) ...
            </div>
            */}

            {/* 3. MAIN LAYOUT: Grid 1/4 (Filter Sidebar) + 3/4 (Products) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                
                {/* FILTER COLUMN (Sticky Sidebar) */}
                {/* 8. Hapus logic 'isFilterOpen' */}
                <div className={`md:col-span-1 block`}>
                    <div className="sticky top-24 bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Filter & Urutkan</h2>
                        {/* 9. Berikan 'searchParams' ke ProductFilters */}
                        <ProductFilters initialFilters={searchParams} />
                    </div>
                </div>

                {/* PRODUCT LISTING COLUMN */}
                <main className="md:col-span-3">
                    <p className="text-sm text-gray-500 mb-4">Menampilkan <strong>{products.length}</strong> produk lelang aktif</p>
                    
                    {/* 10. Hapus 'isLoading' logic */}
                    {products.length === 0 ? (
                        <p className="text-center bg-white p-8 rounded-xl shadow-md border border-gray-200">
                            Tidak ada produk lelang yang cocok dengan filter
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