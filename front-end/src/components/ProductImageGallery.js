// src/components/ProductImageGallery.js
'use client';

import { useState } from 'react';
import Image from 'next/image';
import WishlistButton from './WishlistButton';

export default function ProductImageGallery({ product }) {
    const [selectedImage, setSelectedImage] = useState(0);

    const images = product.images && product.images.length > 0 
        ? product.images 
        : [{ id: 'placeholder', url: '/placeholder.svg' }];
        
    const mainImageUrl = images[selectedImage]?.url;
    
    // Tentukan warna border
    const activeBorderColor = product.saleType === 'auction' 
        ? 'var(--color-lelang)' 
        : 'var(--color-tawar)';

    return (
        <div className="md:sticky md:top-24 h-fit">
            <div className="relative w-full h-120 bg-gray-100 rounded-2xl overflow-hidden shadow-xl">
                <div className="absolute top-3 right-3 z-20">
                    <WishlistButton productId={product.id} />
                </div>
                <Image
                    src={mainImageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ objectFit: 'contain' }}
                    priority={true}
                />
            </div>
            
            {images.length > 1 && (
                <div className="flex space-x-2 mt-4 overflow-x-auto p-2">
                    {images.map((image, index) => (
                        <button
                            key={image.id}
                            onClick={() => setSelectedImage(index)}
                            // Gunakan inline style untuk border dinamis
                            style={{ borderColor: selectedImage === index ? activeBorderColor : 'transparent' }}
                            className="flex-shrink-0 w-20 h-20 relative rounded-lg overflow-hidden border-2 transition-all duration-200 hover:border-gray-300"
                        >
                            <Image
                                src={image.url}
                                alt={`Thumbnail ${index + 1}`}
                                fill
                                sizes="80px"
                                style={{ objectFit: 'cover' }}
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}