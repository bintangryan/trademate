// src/app/dashboard/wishlist/page.js
'use client';

import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

export default function WishlistPage() {
    // Ambil data dan status loading langsung dari context
    const { wishlistItems, isLoading } = useWishlist();

    if (isLoading) return <p className="p-8">Memuat wishlist...</p>;

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Wishlist Saya</h1>
            {wishlistItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {/* Mapping langsung dari state context */}
                    {wishlistItems.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="text-center bg-white p-8 rounded-lg shadow-md">
                    <p>Anda belum menyukai produk apa pun.</p>
                     <Link href="/" className="mt-4 inline-block bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
                        Mulai Jelajahi
                    </Link>
                </div>
            )}
        </div>
    );
}