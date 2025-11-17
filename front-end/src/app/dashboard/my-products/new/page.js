// src/app/dashboard/my-products/new/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Save, Info, Tag, DollarSign, Gavel, CheckSquare, Clock, UploadCloud, X as IconX, Image as ImageIcon, Loader2 } from 'lucide-react';

// Komponen Pratinjau Gambar (tidak berubah)
const ImagePreviewItem = ({ previewUrl, onRemove }) => (
    <div className="relative w-20 h-20 border rounded-md overflow-hidden group">
        <Image src={previewUrl} alt="Pratinjau Upload" fill style={{ objectFit: 'cover' }} />
        <button
            type="button"
            onClick={onRemove}
            className="absolute top-0 right-0 p-0.5 bg-red-600 text-white rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Hapus gambar"
        >
            <IconX size={14} />
        </button>
    </div>
);


export default function NewProductPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        saleType: 'buy_now',
        startingPrice: '',
        durationValue: '1',
        durationUnit: 'days',
        bidIncrement: '',
        condition: '',
        // --- PERUBAHAN STATE ---
        usagePeriodValue: '',
        usagePeriodUnit: 'hari', // Default
        // -----------------------
        categoryIds: [],
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const MAX_IMAGES = 5;
    const [allCategories, setAllCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assets/categories`);
                const data = await res.json();
                setAllCategories(data.categories || []);
            } catch (error) {
                toast.error('Gagal memuat kategori.');
            }
        };
        fetchCategories();
    }, []);

    // --- PERUBAHAN: VALIDASI INPUT NAMA ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'name') {
            // Regex: Hanya izinkan huruf, angka, spasi, dan .,-'
            const sanitizedValue = value.replace(/[^a-zA-Z0-9\s.,'-]/g, '');
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    // ------------------------------------
    
    const handleCategoryChange = (e) => {
        setFormData(prev => ({ ...prev, categoryIds: [e.target.value] }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const newFiles = [];
        const newPreviews = [];

        if (imageFiles.length + files.length > MAX_IMAGES) {
            toast.error(`Anda hanya dapat mengupload maksimal ${MAX_IMAGES} gambar.`);
            files.splice(MAX_IMAGES - imageFiles.length);
        }

        files.forEach(file => {
            if (file.size > 2 * 1024 * 1024) {
                 toast.error(`Gambar "${file.name}" terlalu besar (Maks 2MB).`);
                 return;
            }
            newFiles.push(file);
            newPreviews.push(URL.createObjectURL(file));
        });

        if (newFiles.length > 0) {
            setImageFiles(prev => [...prev, ...newFiles]);
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
        
        e.target.value = null;
    };

    const handleRemovePreview = (indexToRemove) => {
        URL.revokeObjectURL(imagePreviews[indexToRemove]);
        setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
        setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (imageFiles.length === 0) {
            toast.error('Silakan upload setidaknya satu gambar produk.');
            return;
        }
        
        // --- VALIDASI TAMBAHAN SEBELUM KIRIM ---
        if (formData.saleType === 'buy_now' && parseFloat(formData.price) <= 0) {
             toast.error("Harga Jual harus lebih besar dari 0.");
             return;
        }
        if (formData.saleType === 'auction' && parseFloat(formData.startingPrice) <= 0) {
             toast.error("Harga Awal harus lebih besar dari 0.");
             return;
        }
        if (formData.saleType === 'auction' && parseFloat(formData.bidIncrement) <= 0) {
             toast.error("Kelipatan Bid harus lebih besar dari 0.");
             return;
        }
        // ---------------------------------------

        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            
            // 1. Upload Gambar (di-parallelize)
            const uploadPromises = imageFiles.map(file => {
                const formData = new FormData();
                formData.append('image', file);
                return fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assets/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                }).then(res => res.ok ? res.json() : Promise.reject(new Error(`Gagal upload ${file.name}`)));
            });
            const uploadResults = await Promise.all(uploadPromises);
            const imageUrls = uploadResults.map(result => result.url);

            // 2. Siapkan Data Produk (dengan data usagePeriod baru)
             const productPayload = {
                 name: formData.name,
                 description: formData.description,
                 saleType: formData.saleType,
                 condition: formData.condition,
                 // --- PERUBAHAN PAYLOAD ---
                 usagePeriodValue: formData.usagePeriodValue || null,
                 usagePeriodUnit: formData.usagePeriodUnit,
                 // -------------------------
                 categoryIds: formData.categoryIds, 
                 price: formData.saleType === 'buy_now' ? parseFloat(formData.price) : null,
                 startingPrice: formData.saleType === 'auction' ? parseFloat(formData.startingPrice) : null,
                 bidIncrement: formData.saleType === 'auction' ? parseFloat(formData.bidIncrement) : null,
                 durationValue: formData.saleType === 'auction' ? formData.durationValue : null,
                 durationUnit: formData.saleType === 'auction' ? formData.durationUnit : null,
             };


            // 3. Buat Produk
            const productRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(productPayload),
            });
            const productData = await productRes.json();
            if (!productRes.ok) throw new Error(productData.message || 'Gagal membuat produk.');
            const productId = productData.product.id;

            // 4. Tautkan Gambar (di-parallelize)
            const linkPromises = imageUrls.map(url => {
                 return fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assets/products/${productId}/images`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ url }),
                }).then(res => res.ok ? true : Promise.reject(new Error(`Gagal tautkan gambar ${url}`)));
            });
            await Promise.all(linkPromises);


            toast.success('Produk berhasil ditambahkan!');
            router.push('/dashboard/my-products');

        } catch (error) {
            toast.error(error.message || "Terjadi kesalahan saat membuat produk.");
        } finally {
            setIsLoading(false);
            // Bersihkan URL preview setelah selesai
            imagePreviews.forEach(URL.revokeObjectURL);
        }
    };

    const isAuction = formData.saleType === 'auction';

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto p-4 sm:p-8">
                <div className="mb-8">
                    <Link href="/dashboard/my-products" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 w-fit">
                        <ArrowLeft size={16}/> Kembali ke Produk Saya
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">Jual Barang Baru</h1>
                    <p className="text-gray-600 mt-1">Isi detail produk yang ingin Anda jual.</p>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 sticky top-24 space-y-4">
                            <label className="block text-lg font-semibold text-gray-700">Gambar Produk (Maks {MAX_IMAGES}) *</label>
                            {imagePreviews.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {imagePreviews.map((previewUrl, index) => (
                                        <ImagePreviewItem key={index} previewUrl={previewUrl} onRemove={() => handleRemovePreview(index)}/>
                                    ))}
                                </div>
                            )}
                            {imageFiles.length < MAX_IMAGES && (
                                <label htmlFor="file-upload" className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-[var(--color-lelang-light)] transition-colors bg-white">
                                    <div className="space-y-1 text-center">
                                        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" strokeWidth={1} />
                                        <div className="flex text-sm text-gray-600 justify-center">
                                            <span className="relative cursor-pointer bg-white rounded-md font-medium text-[var(--color-lelang-light)] hover:text-[var(--color-lelang)] focus-within:outline-none">
                                                <span>Pilih file</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg, image/jpg" multiple />
                                            </span>
                                            <p className="pl-1">atau tarik dan lepas</p>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG, JPEG (Maks 2MB per file)</p>
                                    </div>
                                </label>
                            )}
                             {imageFiles.length >= MAX_IMAGES && (
                                <p className="text-sm text-center text-gray-500">Batas maksimal {MAX_IMAGES} gambar tercapai.</p>
                             )}
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <div className="bg-[var(--color-tawar-light)] p-6 sm:p-8 rounded-lg shadow-md border border-[var(--color-tawar)] space-y-8">
                            <fieldset>
                                <legend className="text-lg font-semibold text-[var(--color-lelang)] mb-4 flex items-center gap-2"><Info size={18}/> Informasi Dasar</legend>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-800">Nama Produk *</label>
                                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full input-style-tawar" required />
                                        <p className="text-xs text-gray-500 mt-1">Hanya huruf, angka, spasi, dan simbol</p>
                                    </div>
                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-800">Deskripsi</label>
                                        <textarea name="description" id="description" rows="4" value={formData.description} onChange={handleChange} className="mt-1 block w-full input-style-tawar" placeholder="Jelaskan kondisi, fitur, atau minus produk..."></textarea>
                                    </div>
                                    <div>
                                        <label htmlFor="categoryIds" className="block text-sm font-medium text-gray-800">Kategori *</label>
                                        <select
                                            name="categoryIds"
                                            id="categoryIds"
                                            value={(formData.categoryIds && formData.categoryIds.length > 0) ? formData.categoryIds[0] : ''}
                                            onChange={handleCategoryChange}
                                            className="mt-1 block w-full input-style"
                                            required
                                        >
                                            <option value="">Pilih Kategori</option>
                                            {allCategories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </fieldset>

                           <fieldset>
                                <legend className="text-lg font-semibold text-[var(--color-lelang)] mb-4 flex items-center gap-2"><Tag size={18}/> Tipe Penjualan & Harga</legend>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="saleType" className="block text-sm font-medium text-gray-800">Tipe Penjualan</label>
                                        <select name="saleType" id="saleType" value={formData.saleType} onChange={handleChange} className="mt-1 block w-full input-style-tawar">
                                            <option value="buy_now">Beli Langsung</option>
                                            <option value="auction">Lelang</option>
                                        </select>
                                    </div>
                                    {isAuction ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border border-[var(--color-tawar)] rounded-md bg-[var(--color-tawar)]/30 bg">
                                            <div>
                                                <label htmlFor="startingPrice" className="block text-xs font-medium text-gray-800">Harga Awal (Rp)*</label>
                                                {/* --- VALIDASI HARGA > 0 --- */}
                                                <input type="number" name="startingPrice" id="startingPrice" value={formData.startingPrice} onChange={handleChange} className="mt-1 block w-full input-style-tawar" required min="1"/>
                                            </div>
                                            <div>
                                                <label htmlFor="bidIncrement" className="block text-xs font-medium text-gray-800">Kelipatan Bid (Rp)*</label>
                                                <input type="number" name="bidIncrement" id="bidIncrement" value={formData.bidIncrement} onChange={handleChange} className="mt-1 block w-full input-style-tawar" required min="1"/>
                                            </div>
                                            <div>
                                                <label htmlFor="durationValue" className="block text-xs font-medium text-gray-800">Durasi Lelang *</label>
                                                <div className="flex space-x-2">
                                                    <input type="number" name="durationValue" id="durationValue" value={formData.durationValue} onChange={handleChange} className="mt-1 block w-full input-style-tawar" required min="1"/>
                                                    <select name="durationUnit" value={formData.durationUnit} onChange={handleChange} className="mt-1 block w-full input-style-tawar">
                                                        <option value="days">Hari</option>
                                                        <option value="hours">Jam</option>
                                                        <option value="minutes">Menit</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label htmlFor="price" className="block text-sm font-medium text-gray-800">Harga Jual (Rp)*</label>
                                            {/* --- VALIDASI HARGA > 0 --- */}
                                            <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} className="mt-1 block w-full input-style-tawar" required min="1" />
                                        </div>
                                    )}
                                </div>
                            </fieldset>

                            <fieldset>
                                <legend className="text-lg font-semibold text-[var(--color-lelang)] mb-4 flex items-center gap-2"><CheckSquare size={18}/> Kondisi & Pemakaian</legend>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="condition" className="block text-sm font-medium text-gray-800">Kondisi *</label>
                                        <select name="condition" id="condition" value={formData.condition} onChange={handleChange} className="mt-1 block w-full input-style-tawar" required >
                                            <option value="">Pilih Kondisi</option>
                                            <option value="like_new">Seperti Baru</option>
                                            <option value="good_condition">Kondisi Baik</option>
                                            <option value="minor_defects">Cacat Minor</option>
                                        </select>
                                    </div>
                                    {/* --- PERUBAHAN: INPUT PERIODE PEMAKAIAN --- */}
                                    <div>
                                        <label htmlFor="usagePeriodValue" className="block text-sm font-medium text-gray-800">Periode Pemakaian</label>
                                        <div className="flex space-x-2 mt-1">
                                            <input 
                                                type="number" 
                                                name="usagePeriodValue" 
                                                id="usagePeriodValue"
                                                value={formData.usagePeriodValue} 
                                                onChange={handleChange} 
                                                className="input-style-tawar w-1/2" 
                                                placeholder="Contoh: 3"
                                                min="0"
                                            />
                                            <select 
                                                name="usagePeriodUnit" 
                                                value={formData.usagePeriodUnit} 
                                                onChange={handleChange} 
                                                className="input-style-tawar w-1/2"
                                            >
                                                <option value="hari">Hari</option>
                                                <option value="minggu">Minggu</option>
                                                <option value="bulan">Bulan</option>
                                                <option value="tahun">Tahun</option>
                                            </select>
                                        </div>
                                    </div>
                                    {/* -------------------------------------- */}
                                </div>
                            </fieldset>

                            <div className="flex justify-end pt-6 border-t border-gray-200">
                                <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-lelang)] text-white font-semibold rounded-lg hover:bg-[var(--color-lelang-dark)] disabled:bg-gray-400 transition-colors">
                                    <Save size={16}/>
                                    {isLoading ? 'Menyimpan...' : 'Upload Produk'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}