// src/app/dashboard/my-products/edit/[id]/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, ArrowLeft, Save, Info, Tag, DollarSign, Gavel, CheckSquare, Clock, UploadCloud, X as IconX, Image as ImageIcon, Trash2 } from 'lucide-react';

// Komponen Pratinjau Gambar Upload Baru
const NewImagePreviewItem = ({ previewUrl, onRemove }) => (
    <div className="relative w-20 h-20 border border-dashed border-blue-400 rounded-md overflow-hidden group">
        <Image src={previewUrl} alt="Pratinjau Upload Baru" fill style={{ objectFit: 'cover' }} />
        <button type="button" onClick={onRemove} className="absolute top-0 right-0 p-0.5 bg-red-600 text-white rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Hapus gambar baru"><IconX size={14} /></button>
    </div>
);

// Komponen Gambar yang Sudah Ada
const ExistingImageItem = ({ image, onDelete, isDeleting }) => (
    <div className="relative w-20 h-20 border rounded-md overflow-hidden group">
        <Image src={image.url} alt="Gambar Produk" fill style={{ objectFit: 'cover' }} />
        <button
            type="button"
            onClick={() => onDelete(image.id)}
            disabled={isDeleting}
            className="absolute top-0 right-0 p-0.5 bg-red-600 text-white rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            aria-label="Hapus gambar ini"
        >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
    </div>
);

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const [formData, setFormData] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [existingImages, setExistingImages] = useState([]);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const MAX_IMAGES = 5;

  const fetchData = useCallback(async () => {
        if (!params.id) return;
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');

            const productRes = await fetch(`http://localhost:3110/api/products/${params.id}`, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!productRes.ok) throw new Error('Produk tidak ditemukan atau Anda tidak berhak mengaksesnya.');
            const productData = await productRes.json();

            const categoriesRes = await fetch(`http://localhost:3110/api/assets/categories`);
            const categoriesData = await categoriesRes.json();

            // --- PERUBAHAN: Parsing usagePeriod ---
            let usageVal = '';
            let usageUnit = 'hari'; // default
            if (productData.usagePeriod) {
                const parts = productData.usagePeriod.split(' '); // e.g., ["3", "bulan"]
                if (parts.length === 2) {
                    usageVal = parts[0];
                    // Validasi unit (termasuk "minggu")
                    if (['hari', 'minggu', 'bulan', 'tahun'].includes(parts[1].toLowerCase())) {
                        usageUnit = parts[1].toLowerCase();
                    }
                }
            }
            // --- AKHIR PERUBAHAN ---

            setFormData({
                ...productData,
                price: productData.price !== null ? String(productData.price) : '',
                startingPrice: productData.startingPrice !== null ? String(productData.startingPrice) : '',
                bidIncrement: productData.bidIncrement !== null ? String(productData.bidIncrement) : '',
                categoryIds: productData.categories?.length > 0 ? [productData.categories[0].categoryId.toString()] : [], 
                // --- PERUBAHAN: Set state baru ---
                usagePeriodValue: usageVal,
                usagePeriodUnit: usageUnit
            });
            setExistingImages(productData.images || []);
            setAllCategories(categoriesData.categories || []);

        } catch (error) {
            toast.error(error.message || 'Gagal memuat data produk.');
            setFormData(null); 
        } finally {
            setIsLoading(false);
        }
  }, [params.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const handleAddImage = (e) => {
    const currentCount = existingImages.length + newImagePreviews.length; 
    const files = Array.from(e.target.files);
    const availableSlots = MAX_IMAGES - currentCount;

    if (files.length > availableSlots) {
        toast.error(`Anda hanya bisa menambahkan ${availableSlots} gambar lagi.`);
        files.splice(availableSlots);
    }

    const newlyAddedFiles = [];
    const newlyAddedPreviews = [];

    files.forEach(file => {
        if (file.size > 2 * 1024 * 1024) {
            toast.error(`Gambar "${file.name}" terlalu besar (Maks 2MB).`);
            return;
        }
        newlyAddedFiles.push(file);
        newlyAddedPreviews.push(URL.createObjectURL(file));
    });

    if (newlyAddedFiles.length > 0) {
        setNewImageFiles(prev => [...prev, ...newlyAddedFiles]);
        setNewImagePreviews(prev => [...prev, ...newPreviews]);
    }
    e.target.value = null;
  };

  const handleRemoveNewPreview = (indexToRemove) => {
    URL.revokeObjectURL(newImagePreviews[indexToRemove]);
    setNewImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setNewImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDeleteExistingImage = async (imageId) => {
    const currentCount = existingImages.length + newImagePreviews.length; 
    if (currentCount <= 1) { 
        toast.error("Produk harus memiliki setidaknya satu gambar.");
        return;
    }
    if (!window.confirm("Yakin ingin menghapus gambar ini?")) return;

    setDeletingImageId(imageId);
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3110/api/assets/images/${imageId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'Gagal menghapus gambar.');
        }
        setExistingImages(prev => prev.filter(img => img.id !== imageId));
        toast.success("Gambar berhasil dihapus.");
    } catch (error) {
        toast.error(error.message);
    } finally {
        setDeletingImageId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentCount = existingImages.length + newImageFiles.length; 
     if (currentCount === 0) {
         toast.error('Produk harus memiliki setidaknya satu gambar.');
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

    setIsSaving(true);
    try {
        const token = localStorage.getItem('token');

        // 1. Update Detail Produk
         const productUpdateData = {
             name: formData.name,
             description: formData.description,
             condition: formData.condition,
             // --- PERUBAHAN PAYLOAD ---
             usagePeriodValue: formData.usagePeriodValue || null,
             usagePeriodUnit: formData.usagePeriodUnit,
             // -------------------------
             categoryIds: formData.categoryIds,
             price: formData.saleType === 'buy_now' ? parseFloat(formData.price) : null,
             startingPrice: formData.saleType === 'auction' ? parseFloat(formData.startingPrice) : null,
             bidIncrement: formData.saleType === 'auction' ? parseFloat(formData.bidIncrement) : null,
         };
        const productRes = await fetch(`http://localhost:3110/api/products/${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(productUpdateData),
        });
        const productResult = await productRes.json();
        if (!productRes.ok) throw new Error(productResult.message || 'Gagal update detail produk.');

        // 2. Upload dan Link Gambar Baru
        let uploadErrors = 0;
        if (newImageFiles.length > 0) {
             const uploadPromises = newImageFiles.map(file => {
                 const imageUploadData = new FormData();
                 imageUploadData.append('image', file);
                 return fetch('http://localhost:3110/api/assets/upload', {
                     method: 'POST',
                     headers: { 'Authorization': `Bearer ${token}` },
                     body: imageUploadData,
                 }).then(res => res.ok ? res.json() : Promise.reject(new Error(`Gagal upload ${file.name}`)));
             });
             const uploadResults = await Promise.all(uploadPromises);
             const imageUrls = uploadResults.map(result => result.url);

             const linkPromises = imageUrls.map(url => {
                  return fetch(`http://localhost:3110/api/assets/products/${params.id}/images`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                     body: JSON.stringify({ url }),
                 }).then(res => !res.ok ? Promise.reject(new Error(`Gagal tautkan gambar ${url.substring(url.lastIndexOf('/') + 1)}`)) : true );
             });

             const linkResults = await Promise.allSettled(linkPromises);
             linkResults.forEach(result => {
                 if (result.status === 'rejected') {
                     console.error("Link image error:", result.reason);
                     toast.error(result.reason?.message || "Gagal menautkan salah satu gambar.");
                     uploadErrors++;
                 }
             });
        }

        if (uploadErrors > 0) {
            toast.error(`${uploadErrors} gambar baru gagal diproses, namun detail produk berhasil disimpan.`);
        } else {
            toast.success('Produk berhasil diperbarui!');
        }
        
        setTimeout(() => router.push('/dashboard/my-products'), 1500);

    } catch (error) {
        toast.error(error.message || 'Gagal memperbarui produk.');
        setIsSaving(false);
    }
  };

  if (isLoading && !formData) return <div className="p-8 text-center">Memuat data produk...</div>;

  if (!formData) return (
      <div className="container mx-auto p-8 text-center text-red-600">
          <p>Produk tidak ditemukan atau gagal dimuat.</p>
          <Link href="/dashboard/my-products" className="mt-4 inline-block text-blue-600 hover:underline">
              Kembali ke Produk Saya
          </Link>
      </div>
  );

  const isAuction = formData.saleType === 'auction';
  const currentImageCount = existingImages.length + newImagePreviews.length; 

return (
  <div className="bg-gray-50 min-h-screen">
    <div className="container mx-auto p-4 sm:p-8">
      <div className="mb-8">
        <Link
          href="/dashboard/my-products"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 w-fit"
        >
          <ArrowLeft size={16} /> Kembali ke Produk Saya
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Edit Produk</h1>
        <p className="text-gray-600 mt-1">
          Perbarui detail untuk produk:{" "}
          <span className="font-semibold">{formData.name}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Kolom Kiri: Gambar Produk */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 sticky top-24 space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">
              Gambar Produk (Maks {MAX_IMAGES})
            </h2>
            <div className="flex flex-wrap gap-2">
              {existingImages.map((img) => (
                <ExistingImageItem
                  key={img.id}
                  image={img}
                  onDelete={handleDeleteExistingImage}
                  isDeleting={deletingImageId === img.id}
                />
              ))}
            </div>

            {newImagePreviews.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Gambar Baru:
                </p>
                <div className="flex flex-wrap gap-2">
                  {newImagePreviews.map((previewUrl, index) => (
                    <NewImagePreviewItem
                      key={`new-${index}`}
                      previewUrl={previewUrl}
                      onRemove={() => handleRemoveNewPreview(index)}
                    />
                  ))}
                </div>
              </div>
            )}

            {currentImageCount < MAX_IMAGES && (
              <div className="border-t pt-4 mt-4">
                <label
                  htmlFor="file-upload"
                  className="mt-1 flex justify-center px-6 py-4 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-[var(--color-lelang-light)] transition-colors bg-white"
                >
                  <div className="space-y-1 text-center">
                    <UploadCloud
                      className="mx-auto h-10 w-10 text-gray-400"
                      strokeWidth={1}
                    />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <span className="relative cursor-pointer bg-white rounded-md font-medium text-[var(--color-lelang-light)] hover:text-[var(--color-lelang)]">
                        <span>
                          Tambah Gambar ({MAX_IMAGES - currentImageCount} tersisa)
                        </span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleAddImage}
                          accept="image/png, image/jpeg, image/jpg"
                          multiple
                        />
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, JPEG (Maks 2MB)
                    </p>
                  </div>
                </label>
              </div>
            )}

            {currentImageCount >= MAX_IMAGES && (
              <p className="text-sm text-center text-gray-500 border-t pt-4 mt-4">
                Batas maksimal {MAX_IMAGES} gambar tercapai.
              </p>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Detail Produk */}
        <div className="md:col-span-2">
          <div className="bg-[var(--color-tawar-light)] p-6 sm:p-8 rounded-lg shadow-md border border-[var(--color-tawar)] space-y-8">
            {/* Informasi Dasar */}
            <fieldset>
              <legend className="text-lg font-semibold text-[var(--color-lelang)] mb-4 flex items-center gap-2">
                <Info size={18} /> Informasi Dasar
              </legend>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-800"
                  >
                    Nama Produk
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full input-style-tawar"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Hanya huruf, angka, spasi, dan simbol
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-800"
                  >
                    Deskripsi
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows="4"
                    value={formData.description || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full input-style-tawar"
                  ></textarea>
                </div>
                <div>
                  <label
                    htmlFor="categoryIds"
                    className="block text-sm font-medium text-gray-800"
                  >
                    Kategori
                  </label>
                  <select
                    name="categoryIds"
                    id="categoryIds"
                    value={
                      formData.categoryIds && formData.categoryIds.length > 0
                        ? formData.categoryIds[0]
                        : ""
                    }
                    onChange={handleCategoryChange}
                    className="mt-1 block w-full input-style-tawar"
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {allCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Harga & Tipe */}
            <fieldset>
              <legend className="text-lg font-semibold text-[var(--color-lelang)] mb-4 flex items-center gap-2">
                {isAuction ? (
                  <>
                    <Gavel size={18} /> Detail Lelang
                  </>
                ) : (
                  <>
                    <DollarSign size={18} /> Harga Jual
                  </>
                )}
              </legend>

              <div className="space-y-4">
                {isAuction ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border border-[var(--color-tawar)] rounded-md bg-[var(--color-tawar)]/30">
                    <div>
                      <label
                        htmlFor="startingPrice"
                        className="block text-xs font-medium text-gray-800"
                      >
                        Harga Awal (Rp)
                      </label>
                      <input
                        type="number"
                        name="startingPrice"
                        id="startingPrice"
                        value={formData.startingPrice || ""}
                        onChange={handleChange}
                        className="mt-1 block w-full input-style-tawar"
                        required
                        min="1"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="bidIncrement"
                        className="block text-xs font-medium text-gray-800"
                      >
                        Kelipatan Bid (Rp)
                      </label>
                      <input
                        type="number"
                        name="bidIncrement"
                        id="bidIncrement"
                        value={formData.bidIncrement || ""}
                        onChange={handleChange}
                        className="mt-1 block w-full input-style-tawar"
                        required
                        min="1"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="price"
                      className="block text-sm font-medium text-gray-800"
                    >
                      Harga Jual (Rp)
                    </label>
                    <input
                      type="number"
                      name="price"
                      id="price"
                      value={formData.price || ""}
                      onChange={handleChange}
                      className="mt-1 block w-full input-style-tawar"
                      required
                      min="1"
                    />
                  </div>
                )}
              </div>
            </fieldset>

            {/* Kondisi & Pemakaian */}
            <fieldset>
              <legend className="text-lg font-semibold text-[var(--color-lelang)] mb-4 flex items-center gap-2">
                <CheckSquare size={18} /> Kondisi & Pemakaian
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="condition"
                    className="block text-sm font-medium text-gray-800"
                  >
                    Kondisi
                  </label>
                  <select
                    name="condition"
                    id="condition"
                    value={formData.condition || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full input-style-tawar"
                    required
                  >
                    <option value="">Pilih Kondisi</option>
                    <option value="like_new">Seperti Baru</option>
                    <option value="good_condition">Kondisi Baik</option>
                    <option value="minor_defects">Cacat Minor</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="usagePeriodValue"
                    className="block text-sm font-medium text-gray-800"
                  >
                    Periode Pemakaian
                  </label>
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
              </div>
            </fieldset>

            {/* Tombol Simpan */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSaving || isLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-lelang)] text-white font-semibold rounded-lg hover:bg-[var(--color-lelang-dark)] disabled:bg-gray-400 transition-colors"
              >
                <Save size={16} />
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
);
}