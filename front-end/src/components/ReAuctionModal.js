// src/components/ReAuctionModal.js
'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, X, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'; // Impor Ikon

export default function ReAuctionModal({ product, onClose, onAuctionRestarted }) {
    const [formData, setFormData] = useState({
        // Ambil nilai awal dari produk, tapi pastikan string untuk input
        startingPrice: product.startingPrice !== null ? String(product.startingPrice) : '',
        bidIncrement: product.bidIncrement !== null ? String(product.bidIncrement) : '',
        durationValue: '1',
        durationUnit: 'days',
    });
    // Ganti isLoading dengan status
    const [status, setStatus] = useState('idle'); // 'idle', 'submitting', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (status === 'error') setStatus('idle'); // Reset error state on change
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (status === 'submitting') return;

        setStatus('submitting');
        setErrorMessage('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${product.id}/re-auction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                // Pastikan data dikirim sebagai angka
                body: JSON.stringify({
                    startingPrice: parseFloat(formData.startingPrice),
                    bidIncrement: parseFloat(formData.bidIncrement),
                    durationValue: formData.durationValue,
                    durationUnit: formData.durationUnit,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Gagal memulai lelang ulang.');
            
            setStatus('success');
            toast.success('Lelang berhasil dimulai ulang!');
            setTimeout(() => {
                onAuctionRestarted(); // Panggil callback setelah sukses
                // onClose(); // onClose akan dipanggil oleh onAuctionRestarted di page
            }, 1500); // Jeda untuk feedback
        } catch (error) {
            setStatus('error');
            setErrorMessage(error.message);
        }
        // Jangan setStatus('idle') di finally agar feedback terlihat
    };

    const isSubmitting = status === 'submitting';
    const isSuccess = status === 'success';

    return (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in"
          onClick={onClose}
        >
            <div 
              className={`bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-lg transform transition-all animate-scale-up ${status === 'error' ? 'animate-shake' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={24} />
                </button>

                {/* Header Modal */}
                <div className="text-center mb-6">
                  <div className="inline-block p-3 bg-yellow-100 rounded-full mb-3">
                    <RefreshCw size={28} className="text-yellow-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Mulai Lelang Ulang</h2>
                  <p className="text-gray-500 mt-1">Produk: <span className="font-semibold text-gray-700">{product.name}</span></p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="startingPrice" className="block text-sm font-medium text-gray-700">Harga Awal Baru (Rp)</label>
                        <input 
                            type="number" 
                            name="startingPrice" 
                            id="startingPrice"
                            value={formData.startingPrice} 
                            onChange={handleChange} 
                            className={`mt-1 input-style ${status === 'error' ? 'border-red-500 ring-red-200' : ''}`} 
                            required 
                            min="0"
                        />
                    </div>
                    <div>
                        <label htmlFor="bidIncrement" className="block text-sm font-medium text-gray-700">Kelipatan Bid Baru (Rp)</label>
                        <input 
                            type="number" 
                            name="bidIncrement" 
                            id="bidIncrement"
                            value={formData.bidIncrement} 
                            onChange={handleChange} 
                            className={`mt-1 input-style ${status === 'error' ? 'border-red-500 ring-red-200' : ''}`} 
                            required 
                            min="1" // Kelipatan bid minimal 1
                        />
                    </div>
                    <div>
                        <label htmlFor="durationValue" className="block text-sm font-medium text-gray-700">Durasi Lelang Baru</label>
                        <div className="flex space-x-2 mt-1">
                            <input 
                                type="number" 
                                name="durationValue" 
                                id="durationValue"
                                value={formData.durationValue} 
                                onChange={handleChange} 
                                className={`input-style w-1/2 ${status === 'error' ? 'border-red-500 ring-red-200' : ''}`} 
                                required 
                                min="1"
                            />
                            <select 
                                name="durationUnit" 
                                value={formData.durationUnit} 
                                onChange={handleChange} 
                                className={`input-style w-1/2 ${status === 'error' ? 'border-red-500 ring-red-200' : ''}`}
                            >
                                <option value="days">Hari</option>
                                <option value="hours">Jam</option>
                                <option value="minutes">Menit</option>
                            </select>
                        </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 mt-8">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={isSubmitting || isSuccess} 
                            className="w-full px-4 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting || isSuccess} 
                            className={`w-full px-4 py-3 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center ${
                                isSuccess 
                                ? 'bg-green-500' 
                                : 'bg-yellow-500 hover:bg-yellow-600'
                            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : isSuccess ? <CheckCircle size={24} /> : 'Mulai Lelang Ulang'}
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