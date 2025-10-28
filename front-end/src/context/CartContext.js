// src/context/CartContext.js
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCart = useCallback(async () => {
        if (!user) {
            setCartItems([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3110/api/cart', {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store', // Selalu ambil data cart terbaru
            });
            if (!res.ok) throw new Error('Gagal memuat keranjang.');
            const data = await res.json();
            setCartItems(data.cart?.items || []);
        } catch (error) {
            console.error("Gagal memuat keranjang:", error);
            setCartItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const addToCart = async (productId, agreedPrice) => {
        if (!user) {
            toast.error('Silakan login terlebih dahulu');
            return false; // Gagal
        }
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3110/api/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ productId, agreedPrice }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Gagal menambahkan ke keranjang');
            
            toast.success('Produk berhasil ditambahkan!');
            await fetchCart(); // Ambil ulang data cart untuk update state
            return true; // Sukses
        } catch (error) {
            toast.error(error.message);
            return false; // Gagal
        }
    };

    const removeFromCart = async (itemId) => {
        // Optimistic UI update
        setCartItems(prev => prev.filter(item => item.id !== itemId));
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3110/api/cart/items/${itemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Gagal menghapus item.');
            toast.success('Item dihapus dari keranjang.');
            // Jika sukses, state sudah benar. Tidak perlu fetch ulang.
        } catch (error) {
            toast.error(error.message);
            fetchCart(); // Jika gagal, sinkronkan kembali dengan server
        }
    };

    const cartItemCount = cartItems.length;
    
    const value = { cartItems, isLoading, fetchCart, addToCart, removeFromCart, cartItemCount };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    return useContext(CartContext);
};