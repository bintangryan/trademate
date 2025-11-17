// src/app/page.js
'use client';

import Link from 'next/link';
import { Gavel, Tag, Zap, Wallet, Scale } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="container mx-auto px-6 py-16 min-h-[80vh]">
            
            {/* 1. HERO SECTION - Menggunakan Grid 2 Kolom untuk Layout Kiri-Kanan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-20">
                
                {/* KOLOM KIRI: Judul dan Deskripsi */}
                <div className="text-center md:text-left">
                    <h1 className="text-12xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight leading-snug"> 
                        <span className="text-[var(--color-lelang)]">Solusi Mudah</span>
                        <br />
                        <span className="text-[var(--color-tawar)]">Jual Beli Barang Bekas</span><br/>
                    </h1>
                    <p className="text-xl text-gray-700 max-w-lg md:max-w-none mx-auto md:mx-0 font-medium">
                        Temukan barang impianmu atau ubah aset lama menjadi uang. TradeMate memberikan kendali penuh untuk kamu menentukan harga
                    </p>
                </div>
                
                {/* KOLOM KANAN: Tombol CTA (Tersusun Vertikal) */}
                <div className="flex flex-col space-y-8 items-center md:items-end">
                    
                    {/* CTA 1: LELANG (DOMINASI LELANG COLOR) */}
                    <Link 
                        href="/shop/auction" 
                        className="block p-8 w-full max-w-md rounded-3xl shadow-[0_20px_50px_rgba(0,63,145,0.2)] transition-all duration-300 transform hover:scale-[1.03] bg-white border-4 border-[var(--color-lelang)]" 
                    >
                        <div className="flex items-center space-x-6">
                            <Gavel size={48} className="text-[var(--color-lelang)] flex-shrink-0" />
                            <div className="text-left">
                                <h2 className="text-3xl font-bold text-gray-900 mb-1">Menangkan Lelang</h2>
                                <p className="text-sm text-gray-600">Temukan produk incaranmu dan menangkan kesempatan lelang!</p>
                            </div>
                        </div>
                        <button className="mt-5 w-full py-3 bg-[var(--color-lelang)] text-white font-bold rounded-xl hover:bg-[var(--color-lelang-dark)] transition-colors text-lg">
                            Temukan Produk Lelang
                        </button>
                    </Link>

                    {/* CTA 2: BELI & TAWAR (DOMINASI TAWAR COLOR) */}
                    <Link href="/shop/buy-now" className="block p-8 w-full max-w-md rounded-3xl shadow-[0_20px_50px_rgba(93,169,233,0.3)] transition-all duration-300 transform hover:scale-[1.03] bg-white border-4 border-[var(--color-tawar)]">
                        <div className="flex items-center space-x-6">
                            <Tag size={48} className="text-[var(--color-tawar)] flex-shrink-0" />
                            <div className="text-left">
                                <h2 className="text-3xl font-bold text-gray-900 mb-1">Tawar Harga</h2>
                                <p className="text-sm text-gray-600">Temukan produk dengan harga terbaik melalui fitur tawar harga</p>
                            </div>
                        </div>
                        <button className="mt-5 w-full py-3 bg-[var(--color-tawar)] text-white font-bold rounded-xl hover:bg-[var(--color-tawar-dark)] transition-colors text-lg">
                            Ajukan Penawaranmu
                        </button>
                    </Link>
                </div>
            </div>
            
            {/* 2. FEATURE HIGHLIGHTS SECTION - VISUAL YANG LEBIH TERSTRUKTUR */}
            <div className="mt-20 pt-16 border-t-2 border-gray-100 text-center bg-white p-12 rounded-3xl shadow-xl">
                <h3 className="text-4xl font-extrabold text-gray-800 mb-12">Fleksibel, Cepat, dan Transparan</h3>
                <div className="flex flex-col md:flex-row justify-center space-y-10 md:space-y-0 md:space-x-12">
                    
                    <div className="flex flex-col items-center max-w-xs">
                         <Wallet size={40} className="text-white bg-[var(--color-tawar)] p-3 rounded-full mb-4 shadow-md" />
                        <h4 className="font-bold text-xl text-gray-900 mb-2">Fleksibilitas Harga</h4>
                        <p className="text-md text-gray-600">Kamu bebas menawarkan harga semaumu. Trademate memberikan akses negosiasi yang fleksibel dan terbuka</p>
                    </div>

                    {/* Benefit 1: Aksi Cepat */}
                    <div className="flex flex-col items-center max-w-xs">
                        <Zap size={40} className="text-white bg-[var(--color-tawar)] p-3 rounded-full mb-4 shadow-md" />
                        <h4 className="font-bold text-xl text-gray-900 mb-2">Proses Instan</h4>
                        <p className="text-md text-gray-600">Proses bid dan tawar dilakukan secara real-time, memastikan pengalaman jual beli yang cepat dan efisien</p>
                    </div>

                
                    
                    {/* Benefit 3: Lelang Transparan */}
                    <div className="flex flex-col items-center max-w-xs">
                        <Scale size={40} className="text-white bg-[var(--color-tawar)] p-3 rounded-full mb-4 shadow-md" />
                        <h4 className="font-bold text-xl text-gray-900 mb-2">Transparansi Penuh</h4>
                        <p className="text-md text-gray-600">Setiap bid tercatat, setiap tawaran terlihat. Kamu selalu tahu posisi dan peluang kemenanganmu</p>
                    </div>

                </div>
            </div>

        </div>
    );
}