'use client';

import Link from 'next/link';
import { Gavel, ShoppingBag, ShieldCheck, Zap, Store, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  const sellerLinkDestination = user ? "/dashboard/settings" : "/auth/register";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* --- 1. HERO SECTION --- */}
      <section className="flex-grow flex items-center justify-center px-4 py-12 relative overflow-hidden
        bg-gradient-to-br from-[var(--color-lelang)]/20 via-white to-[var(--color-tawar)]/20
        border-b border-gray-100"
      >
        <div className="text-center max-w-3xl mx-auto space-y-8 relative z-10">
          
          <h1 className="text-4xl md:text-6xl font-black text-[var(--color-tawar)] leading-tight">
            Satu Platform, <br />
            <span className="text-[var(--color-lelang)]">Dua Cara Belanja.</span>
          </h1>
          
          <p className="text-lg text-gray-600 md:px-12 font-medium">
            Pilih cara yang kamu suka. Ikuti keseruan <b>Lelang</b> atau nikmati kemudahan <b>Beli Langsung & Tawar</b>.
          </p>

          {/* TOMBOL PILIHAN UTAMA */}
          {/* PERUBAHAN DI SINI: Menggunakan 'grid grid-cols-2' untuk HP */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row items-center justify-center gap-4 w-full pt-4">
            
            {/* Tombol Lelang */}
            <Link 
              href="/shop/auction" 
              // Hapus w-full di sini agar grid yang mengontrol lebar di mobile
              className="group w-full sm:w-1/2 p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300
                border-2 border-[var(--color-lelang)] 
                bg-[var(--color-lelang)]/5 text-[var(--color-lelang)] 
                hover:bg-[var(--color-lelang)] hover:text-white"
            >
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform border border-[var(--color-lelang)]/20">
                    <Gavel size={24} className="text-[var(--color-lelang)] sm:w-8 sm:h-8" /> {/* Ukuran icon responsif */}
                </div>
                <div className="text-center">
                    <span className="block text-lg sm:text-2xl font-bold">Lelang</span>
                    <span className="text-xs sm:text-sm font-medium opacity-80 group-hover:text-blue-100 group-hover:opacity-100 leading-tight hidden sm:block"> {/* Teks kecil sembunyi di HP jika terlalu sempit, atau biarkan block */}
                        Tawar harga terbaikmu
                    </span>
                </div>
              </div>
            </Link>

            {/* Tombol Beli & Tawar */}
            <Link 
              href="/shop/buy-now" 
              className="group w-full sm:w-1/2 p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300
                border-2 border-[var(--color-tawar)] 
                bg-[var(--color-tawar)]/5 text-[var(--color-tawar)]
                hover:bg-[var(--color-tawar)] hover:text-white"
            >
               <div className="flex flex-col items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform border border-[var(--color-tawar)]/20">
                    <ShoppingBag size={24} className="text-[var(--color-tawar)] sm:w-8 sm:h-8" />
                </div>
                <div className="text-center">
                    <span className="block text-lg sm:text-2xl font-bold">Beli & Tawar</span>
                    <span className="text-xs sm:text-sm font-medium opacity-80 group-hover:text-blue-100 group-hover:opacity-100 leading-tight hidden sm:block">
                        Negosiasi langsung penjual
                    </span>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* --- 2. KEUNGGULAN TRADEMATE --- */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="bg-[var(--color-success-light)] p-3 rounded-lg text-[var(--color-success)] flex-shrink-0">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Transaksi Aman</h3>
                        <p className="text-gray-600 text-sm mt-1">Dana ditahan di sistem sampai barang sampai ke tangan kamu</p>
                    </div>
                </div>
                <div className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="bg-[var(--color-tawar-light)] p-3 rounded-lg text-[var(--color-lelang)] flex-shrink-0">
                        <Gavel size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Sistem Lelang Adil</h3>
                        <p className="text-gray-600 text-sm mt-1">Real-time bidding tanpa bot. Menangkan barang impian dengan harga terbaik</p>
                    </div>
                </div>
                <div className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="bg-[var(--color-warning-light)] p-3 rounded-lg text-[var(--color-warning)] flex-shrink-0">
                        <Zap size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Nego & Deal Cepat</h3>
                        <p className="text-gray-600 text-sm mt-1">Ajukan tawaran hargamu langsung ke penjual untuk kesepakatan harga yang pas</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- 3. INGIN MENJADI PENJUAL (CTA) --- */}
      <section className="py-12 bg-[var(--color-lelang-dark)] text-white">
        <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/10 rounded-full border border-white/20">
                        <Store size={32} className="text-[var(--color-tawar-light)]" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Punya barang nganggur?</h2>
                        <p className="text-white/90">Jadilah penjual dan mulai hasilkan uang di Trademate!</p>
                    </div>
                </div>
                
                <Link 
                    href={sellerLinkDestination} 
                    className="w-full md:w-auto px-8 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                    Daftar Jadi Penjual <ArrowRight size={18} />
                </Link>
            </div>
        </div>
      </section>

    </div>
  );
}