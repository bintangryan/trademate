// src/components/ProductFilters.js
'use client';

import { useState, useEffect } from 'react';
// 1. Impor hook dari next/navigation
import { useRouter, usePathname, useSearchParams } from 'next/navigation'; 
import { Search, ChevronDown, CheckCircle } from 'lucide-react';

// ... (Daftar Opsi Kondisi dan Sorting tetap sama) ...
const CONDITION_OPTIONS = [
    { value: '', label: 'Semua Kondisi' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good_condition', label: 'Good Condition' },
    { value: 'minor_defects', label: 'Minor Deffects' },
];

const SORT_OPTIONS = [
    { value: 'createdAt_desc', label: 'Terbaru (Default)' },
    { value: 'price_desc', label: 'Harga Tertinggi' },
    { value: 'price_asc', label: 'Harga Terendah' },
];


// 2. Hapus prop 'onFilterChange'
export default function ProductFilters({ initialFilters = {} }) {    // 3. Inisialisasi router, pathname, dan searchParams
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // 4. Gunakan 'initialFilters' (dari searchParams) untuk mengisi state awal
    const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(initialFilters.categoryId || '');
    const [selectedCondition, setSelectedCondition] = useState(initialFilters.condition || '');
    const [selectedSort, setSelectedSort] = useState(
        `${initialFilters.sortBy || 'createdAt'}_${initialFilters.sortOrder || 'desc'}`
    );
    
    const [categories, setCategories] = useState([]); 

    // Ambil kategori (ini tetap di client, tidak apa-apa)
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('http://localhost:3110/api/assets/categories');
                const data = await res.json();
                setCategories(data.categories || []);
            } catch (error) {
                console.error("Gagal memuat kategori:", error);
            }
        };
        fetchCategories();
    }, []);

    // 5. Ganti 'handleFilterUpdate' dengan 'useEffect' yang meng-update URL
    useEffect(() => {
        const [sortBy, sortOrder] = selectedSort.split('_');
        
        // Buat objek URLSearchParams baru dari searchParams saat ini
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));

        // Fungsi helper untuk set/delete param
        const updateParam = (key, value) => {
            if (value) {
                currentParams.set(key, value);
            } else {
                currentParams.delete(key);
            }
        };

        // Update params berdasarkan state filter
        updateParam('search', searchTerm);
        updateParam('categoryId', selectedCategory);
        updateParam('condition', selectedCondition);
        updateParam('sortBy', sortBy);
        updateParam('sortOrder', sortOrder);

        // Gunakan 'setTimeout' untuk debounce (agar tidak ganti URL di setiap ketikan)
        const handler = setTimeout(() => {
             // 6. Ganti URL menggunakan router.push
             // 'scroll: false' agar halaman tidak lompat ke atas
             router.push(`${pathname}?${currentParams.toString()}`, { scroll: false });
        }, 300); // Debounce ringan

        return () => clearTimeout(handler);

    }, [searchTerm, selectedCategory, selectedCondition, selectedSort, pathname, router, searchParams]);
    
    // 7. Hapus 'handleFilterUpdate' dan 'useEffect' lama yang memanggilnya


    return (
        <div className="space-y-6">
            
            {/* 1. SORTING DROPDOWN */}
            <div>
                <label htmlFor="sort" className="block text-sm font-semibold text-gray-700 mb-2">Urutkan Berdasarkan</label>
                <div className="relative">
                    <select
                        id="sort"
                        value={selectedSort}
                        onChange={(e) => setSelectedSort(e.target.value)} // State di-update
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--color-lelang)]"
                    >
                        {SORT_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
            </div>

            {/* 2. SEARCH INPUT */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cari Nama Barang</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari di etalase..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} // State di-update
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-tawar)]"
                    />
                </div>
            </div>

            {/* 3. CATEGORY DROPDOWN */}
            <div>
                <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">Kategori</label>
                <div className="relative">
                    <select
                        id="category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)} // State di-update
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--color-tawar)]"
                    >
                        <option value="">Semua Kategori</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
            </div>
            
            {/* 4. CONDITION FILTER */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kondisi Barang</label>
                <div className="space-y-3">
                    {CONDITION_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center">
                            <input
                                type="radio"
                                id={`condition-${option.value || 'all'}`}
                                name="condition"
                                value={option.value}
                                checked={selectedCondition === option.value}
                                onChange={(e) => setSelectedCondition(e.target.value)} // State di-update
                                className="sr-only"
                            />
                            <label 
                                htmlFor={`condition-${option.value || 'all'}`}
                                className={`flex items-center cursor-pointer w-full p-2 rounded-lg transition-colors 
                                            ${selectedCondition === option.value 
                                                ? 'bg-[var(--color-tawar-light)] text-[var(--color-lelang)] font-medium border border-[var(--color-tawar)]' 
                                                : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                            >
                                <CheckCircle size={18} className={`mr-3 ${selectedCondition === option.value ? 'text-[var(--color-tawar)] fill-white' : 'text-gray-300'}`} />
                                {option.label}
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}