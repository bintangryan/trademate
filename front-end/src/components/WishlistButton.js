// src/components/WishlistButton.js
'use client';

import { useState, useEffect, useRef } from 'react'; // <-- Tambahkan useEffect dan useRef
import { useWishlist } from '@/context/WishlistContext';
import { Heart } from 'lucide-react'; 

// Custom Hook untuk "mengingat" nilai dari render sebelumnya
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export default function WishlistButton({ productId }) {
    const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();
    const isLiked = isWishlisted(productId);
    
    const [animationClass, setAnimationClass] = useState('');
    
    // Gunakan custom hook untuk melacak perubahan pada isLiked
    const prevIsLiked = usePrevious(isLiked);

    // useEffect ini akan berjalan SETELAH state 'isLiked' diperbarui oleh context
    useEffect(() => {
        // Hanya jalankan animasi jika 'isLiked' benar-benar berubah (bukan saat render awal)
        if (prevIsLiked !== undefined && prevIsLiked !== isLiked) {
            if (isLiked) {
                setAnimationClass('animate-heart-fill'); // Baru saja di-like
            } else {
                setAnimationClass('animate-heart-unfill'); // Baru saja di-unlike
            }

            // Hapus kelas animasi setelah selesai agar bisa diputar lagi
            setTimeout(() => {
                setAnimationClass('');
            }, 600); // Durasi animasi 0.6s
        }
    }, [isLiked, prevIsLiked]); // Dijalankan setiap kali 'isLiked' berubah


    const handleToggleWishlist = (e) => {
        e.preventDefault(); 
        e.stopPropagation();
        
        // Handler sekarang HANYA bertugas memanggil fungsi dari context
        // Tanpa mengatur animasi secara langsung
        if (isLiked) {
            removeFromWishlist(productId);
        } else {
            addToWishlist(productId);
        }
    };
    
    return (
        <button
            onClick={handleToggleWishlist}
            // Mencegah klik ganda saat animasi berjalan
            disabled={!!animationClass} 
            className="group p-2 rounded-full bg-white/70 backdrop-blur-sm transition-all duration-300 ease-in-out hover:bg-white hover:scale-110 focus:outline-none disabled:pointer-events-none"
            aria-label="Toggle Wishlist"
        >
            <Heart 
                size={20} 
                className={`
                    ${animationClass} 
                    ${isLiked 
                        ? 'text-[var(--color-danger)] fill-[var(--color-danger)]' 
                        : 'text-gray-800 fill-none'
                    }
                    group-hover:text-[var(--color-danger)]
                `} 
            />
        </button>
    );
}