// src/app/products/[id]/page.js

// 1. HAPUS 'use client' dan semua import hook client
// import { useState, useEffect, useCallback } from 'react'; // HAPUS
// import { useAuth } from '@/context/AuthContext'; // HAPUS
// import { useParams } from 'next/navigation'; // HAPUS
// import OfferModal from '@/components/OfferModal'; // HAPUS
// import BidModal from '@/components/BidModal'; // HAPUS
// import toast from 'react-hot-toast'; // HAPUS

// 2. Impor 'notFound' dari next/navigation
import { notFound } from 'next/navigation';
// 3. Impor komponen 'use client' baru kita
import ProductImageGallery from '@/components/ProductImageGallery';
import ProductInteraction from '@/components/ProductInteraction';
import ProductInfoTabs from '@/components/ProductInfoTabs';

// 4. Impor ikon (ini aman di server component)
import {ChevronRight} from 'lucide-react';
// 5. Buat fungsi fetch data terpisah
async function getProduct(id) {
    try {
        const res = await fetch(`http://localhost:3110/api/products/${id}`, {
            cache: 'no-store', // Data produk harus selalu fresh
        });
        
        if (!res.ok) {
            // Jika res.status adalah 404, panggil notFound()
            if (res.status === 404) {
                notFound();
            }
            // Lemparkan error untuk status lain (misal 500)
            throw new Error('Gagal memuat produk');
        }
        
        const data = await res.json();
        return data;
    } catch (error) {
        // Jika fetch gagal (misal server down)
        console.error(error);
        // Kita bisa panggil notFound() atau lempar error
        throw error;
    }
}


// 6. HAPUS Komponen Skeleton dan Timer (AuctionTimer akan diimpor di dalam ProductInteraction)
// function ProductDetailSkeleton() { ... } // HAPUS
// function AuctionTimer({ endTime }) { ... } // HAPUS


// 7. Ubah komponen utama menjadi 'async' dan terima 'params'
export default async function ProductDetailPage({ params }) {
    
    // 8. HAPUS semua state dan useEffect
    // const { user } = useAuth();
    // const [product, setProduct] = useState(null);
    // const [isLoading, setIsLoading] = useState(true);
    // ... dan semua handler (handleAddToCart, handleSendOffer, dll) ...

    
    // 9. Ambil data produk di server
    let product;
    try {
        product = await getProduct(params.id);
    } catch (error) {
        // Jika getProduct melempar error (misal 500), Next.js akan menangkapnya
        // dan menampilkan halaman error.js
        // Jika getProduct memanggil notFound(), Next.js akan menampilkan not-found.js
        // Ini sudah ditangani di dalam getProduct()
        
        // Fallback jika notFound() tidak tertangkap
        if (!product) notFound();
    }


    // 10. HAPUS 'if (isLoading && !product)' dan 'if (!product)'
    // Jika kita sampai di sini, 'product' dijamin ada.

    
    // 11. HAPUS helper (formatRupiah, isAuction, dll)
    // Logika tersebut sudah dipindahkan ke komponen client


    // --- RENDER JSX (Sangat Disederhanakan) ---
    return (
        <div className="container mx-auto px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                
                {/* === Kolom Gambar (GALERI) === */}
                {/* 12. Gunakan Komponen Client baru */}
                <ProductImageGallery product={product} />

                {/* === Kolom Detail & Aksi === */}
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{product.name}</h1>
                    <p className="text-sm text-gray-600 mb-6 flex items-center space-x-2">
                        <ChevronRight className="text-gray-600" /> 
                        {/* 13. Ambil kategori langsung dari data */}
                        <span className="font-medium">{product.categories?.[0]?.category?.name || 'Belum ada kategori'}</span>
                    </p>

                    {/* === BOX HARGA DAN AKSI === */}
                    {/* 14. Gunakan Komponen Client baru */}
                    {/* Berikan 'bids' sebagai prop agar client component bisa mengelolanya */}
                    <ProductInteraction product={product} initialBids={product.bids || []} />
                    
                    
                    {/* === TAB INFORMASI === */}
                    {/* 15. Gunakan Komponen Client baru */}
                    {/* Berikan 'bids' juga ke tabs untuk 'Riwayat Bid' */}
                    <ProductInfoTabs product={product} initialBids={product.bids || []} />

                </div>
            </div>

            {/* --- RENDER MODAL (HAPUS) --- */}
            {/* Semua modal sekarang dikelola di dalam ProductInteraction */}
            
        </div>
    );
}

// 16. HAPUS Komponen helper TabButton dan DetailRow
// Mereka sudah dipindahkan ke dalam ProductInfoTabs.js
// function TabButton({ title, isActive, onClick, icon }) { ... } // HAPUS
// function DetailRow({ label, value }) { ... } // HAPUS