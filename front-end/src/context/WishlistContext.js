// src/context/WishlistContext.js
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
    const { user } = useAuth();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [wishlistIds, setWishlistIds] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);

    const fetchWishlist = useCallback(async () => {
        if (!user) {
            setWishlistItems([]);
            setWishlistIds(new Set());
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3110/api/wishlist', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                const products = data.wishlist.map(item => item.product);
                const productIds = products.map(p => p.id);
                setWishlistItems(products);
                setWishlistIds(new Set(productIds));
            } else {
                setWishlistItems([]);
                setWishlistIds(new Set());
            }
        } catch (error) {
            console.error("Gagal memuat wishlist:", error);
            setWishlistItems([]);
            setWishlistIds(new Set());
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    const addToWishlist = async (productId) => {
        const id = parseInt(productId);
        const originalIds = new Set(wishlistIds);

        setWishlistIds(prev => {
            const newIds = new Set(prev);
            newIds.add(id);
            return newIds;
        });

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3110/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ productId }),
            });
            if (!res.ok) throw new Error("Gagal menambahkan ke wishlist.");
            // Refresh data produk lengkap di background setelah sukses
            fetchWishlist();
        } catch (error) {
            console.error("Gagal menambah ke wishlist:", error);
            setWishlistIds(originalIds);
        }
    };

    // --- PERBAIKAN UTAMA DI FUNGSI INI ---
    const removeFromWishlist = async (productId) => {
        const id = parseInt(productId);
        
        // Simpan state awal dari KEDUA state untuk jaga-jaga jika API gagal
        const originalItems = [...wishlistItems];
        const originalIds = new Set(wishlistIds);

        // 1. Update KEDUA state secara optimis (langsung hapus dari state)
        setWishlistItems(prev => prev.filter(item => item.id !== id));
        setWishlistIds(prev => {
            const newIds = new Set(prev);
            newIds.delete(id);
            return newIds;
        });

        // 2. Lakukan panggilan API
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3110/api/wishlist/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) {
                // Jika gagal, kembalikan KEDUA state ke semula (rollback)
                throw new Error("Gagal menghapus dari wishlist.");
            }
            // Jika berhasil, tidak perlu melakukan apa-apa, UI sudah benar.
        } catch (error) {
            console.error(error.message);
            // Jika gagal, kembalikan KEDUA state ke semula (rollback)
            setWishlistItems(originalItems);
            setWishlistIds(originalIds);
        }
    };

    const isWishlisted = (productId) => wishlistIds.has(parseInt(productId));
    
    const value = { wishlistItems, isLoading, isWishlisted, addToWishlist, removeFromWishlist };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    return useContext(WishlistContext);
};