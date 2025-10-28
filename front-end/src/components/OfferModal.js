// src/components/OfferModal.js
'use client';

import { useState, useMemo } from 'react';
import { X, ArrowDown, Tag, CheckCircle, AlertTriangle } from 'lucide-react';

export default function OfferModal({ product, onClose, onSubmit }) {
  const [offerPrice, setOfferPrice] = useState('');
  // Ganti isLoading dengan 'status' untuk menangani lebih banyak state
  const [status, setStatus] = useState('idle'); // 'idle', 'submitting', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const formatRupiah = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const priceDifference = useMemo(() => {
    const original = parseFloat(product.price);
    const offer = parseFloat(offerPrice);
    if (!isNaN(original) && !isNaN(offer) && offer > 0 && offer < original) {
      return original - offer;
    }
    return null;
  }, [offerPrice, product.price]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'submitting') return;

    setStatus('submitting');
    setErrorMessage('');
    try {
      await onSubmit(offerPrice);
      // Jika berhasil, ubah status ke 'success'
      setStatus('success');
      // Tutup modal setelah jeda singkat
      setTimeout(() => {
        onClose();
      }, 1500); // Tunggu 1.5 detik
    } catch (error) {
      // Jika gagal, ubah status ke 'error' dan simpan pesan
      setStatus('error');
      setErrorMessage(error.message || 'Gagal mengirim tawaran.');
    }
  };

  const isSubmitting = status === 'submitting';
  const isSuccess = status === 'success';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        // Tambahkan kelas 'animate-shake' jika status error
        className={`bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all animate-scale-up ${status === 'error' ? 'animate-shake' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-block p-3 bg-[var(--color-tawar-light)] rounded-full mb-3">
            <Tag size={28} className="text-[var(--color-tawar)]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Tawar Harga</h2>
          <p className="text-gray-500 mt-1">Produk: <span className="font-semibold text-gray-700">{product.name}</span></p>
        </div>

        <div className="text-center bg-gray-50 p-3 rounded-lg border border-gray-200 mb-6">
          <p className="text-sm text-gray-600">Harga Asli Produk</p>
          <p className="text-2xl font-bold text-gray-800 line-through">{formatRupiah(product.price)}</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="offerPrice" className="block text-sm font-medium text-gray-700 mb-2 text-center">Harga Tawaran</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-gray-500">Rp</span>
              <input
                type="number"
                id="offerPrice"
                value={offerPrice}
                onChange={(e) => {
                    setOfferPrice(e.target.value);
                    // Reset status error saat pengguna mulai mengetik lagi
                    if (status === 'error') setStatus('idle'); 
                }}
                className={`w-full pl-12 pr-4 py-3 text-center text-xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    status === 'error' 
                    ? 'border-red-500 ring-red-200' 
                    : 'border-gray-300 focus:ring-[var(--color-tawar)] focus:border-[var(--color-tawar)]'
                }`}
                placeholder=""
                required
              />
            </div>

            {priceDifference !== null && (
              <div className="mt-3 flex items-center justify-center gap-2 text-green-600 bg-green-50 p-2 rounded-lg">
                <ArrowDown size={16} />
                <p className="text-sm font-semibold">
                  Kamu lebih hemat {formatRupiah(priceDifference)}!
                </p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="w-full px-4 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || isSuccess || !offerPrice} 
              className={`w-full px-4 py-3 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center ${
                  isSuccess 
                  ? 'bg-green-500' // Warna tombol saat sukses
                  : 'bg-[var(--color-tawar)] hover:bg-[var(--color-tawar-dark)]'
              } disabled:bg-gray-300 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? 'Memproses...' : isSuccess ? <CheckCircle size={24} /> : 'Ajukan Tawaran'}
            </button>
          </div>
        </form>

        {/* Tampilkan pesan error jika ada */}
        {status === 'error' && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-red-500">
                <AlertTriangle size={16} />
                <span>{errorMessage}</span>
            </div>
        )}
      </div>
    </div>
  );
}