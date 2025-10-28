// src/components/BidModal.js
'use client';

import { useState, useEffect } from 'react';
import { X, Gavel, CheckCircle, AlertTriangle } from 'lucide-react'; // Impor ikon

export default function BidModal({ product, bids, onClose, onSubmit }) {
  const [bidAmount, setBidAmount] = useState('');
  // Ganti isLoading dengan 'status' untuk menangani lebih banyak state
  const [status, setStatus] = useState('idle'); // 'idle', 'submitting', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const highestBidValue = bids && bids.length > 0
    ? parseFloat(bids[0].amount)
    : parseFloat(product.startingPrice);

  const bidIncrementValue = parseFloat(product.bidIncrement);
  const minimumBidValue = highestBidValue + bidIncrementValue;

  useEffect(() => {
    // Set nilai awal input ke bid minimum yang disarankan
    setBidAmount(minimumBidValue.toString());
  }, [minimumBidValue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'submitting') return;

    setStatus('submitting');
    setErrorMessage('');
    try {
      await onSubmit(bidAmount);
      setStatus('success');
      // Tutup modal setelah jeda singkat untuk menampilkan feedback
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message || 'Gagal mengajukan bid.');
    }
  };

  const formatRupiah = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const isSubmitting = status === 'submitting';
  const isSuccess = status === 'success';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className={`bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all animate-scale-up ${status === 'error' ? 'animate-shake' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-block p-3 bg-[var(--color-lelang-light)] rounded-full mb-3">
            <Gavel size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Pengajuan Bid</h2>
          <p className="text-gray-500 mt-1">Produk: <span className="font-semibold text-gray-700">{product.name}</span></p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center bg-gray-50 p-3 rounded-lg border border-gray-200 mb-6">
            <div>
                <p className="text-sm text-gray-600">Harga Tertinggi</p>
                <p className="text-lg font-bold text-green-600">{formatRupiah(highestBidValue)}</p>
            </div>
            <div>
                <p className="text-sm text-gray-600">Minimal Kenaikan Bid</p>
                <p className="text-lg font-bold text-gray-800">{formatRupiah(bidIncrementValue)}</p>
            </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Bid (Minimal: {formatRupiah(minimumBidValue)})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-[var(--color-lelang-light)]">Rp</span>
              <input
                type="number"
                id="bidAmount"
                value={bidAmount}
                onChange={(e) => {
                    setBidAmount(e.target.value);
                    if (status === 'error') setStatus('idle');
                }}
                min={minimumBidValue}
                className={`w-full pl-12 pr-4 py-3 text-center text-[var(--color-lelang-light)] text-xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    status === 'error' 
                    ? 'border-red-500 ring-red-200' 
                    : 'border-gray-300 focus:ring-[var(--color-lelang-light)] focus:border-[var(--color-lelang-light)]'
                }`}
                placeholder=""
                required
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="w-full px-4 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || isSuccess || !bidAmount} 
              className={`w-full px-4 py-3 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center ${
                  isSuccess 
                  ? 'bg-green-500' 
                  : 'bg-[var(--color-lelang-light)] hover:bg-[var(--color-lelang)]'
              } disabled:bg-gray-300 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? 'Memproses...' : isSuccess ? <CheckCircle size={24} /> : 'Ajukan Bid'}
            </button>
          </div>
        </form>

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