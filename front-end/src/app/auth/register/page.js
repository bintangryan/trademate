'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; 
import toast from 'react-hot-toast';
import { Mail, Lock, UserPlus, ArrowRight } from 'lucide-react'; 

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (password !== confirmPassword) {
      setMessage('Password dan Konfirmasi Password tidak cocok.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mendaftar. Silakan coba lagi.');
      }

      toast.success('Akun berhasil dibuat! Cek Email dan Verfifikasi akun Kamu.');
      router.push('/auth/login');
      
    } catch (error) {
      // Clean error message for display in Indonesian
      const userMessage = error.message.includes('exists') ? 'Email sudah terdaftar.' : error.message;
      setMessage(userMessage);
      toast.error(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Main Layout: Single Column, Centered, Full Height, menggunakan gradasi background yang sama dengan Login
    <main 
      className="flex min-h-screen items-center justify-center p-6"
      style={{
        // Gradasi Background dari Lelang ke Tawar
        background: `linear-gradient(135deg, var(--color-tawar) 10%, var(--color-lelang) 100%)`
      }}
    >
      
      {/* Form Card Container (Pusat perhatian) */}
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl shadow-2xl border border-gray-100 transform transition duration-500 hover:scale-[1.02]">
        <div className="w-full">
          
          {/* Header & Branding */}
          <div className="text-center mb-12"> 
            <h1 className="text-5xl font-extrabold text-gray-900 leading-none">
                Registrasi
            </h1>
            <p className="text-lg text-gray-600 mt-2">
                Daftarkan akun Anda dengan Email
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Input Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 sr-only" htmlFor="email">Email</label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-tawar)]"/>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  // Styling: Full Border, Background Abu-abu Muda
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl bg-gray-50 focus:border-[var(--color-tawar)] focus:outline-none focus:ring-0 transition-colors placeholder:text-gray-500 text-gray-900"
                  placeholder="Email Address"
                  required
                />
              </div>
            </div>
            
            {/* Input Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 sr-only" htmlFor="password">Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-tawar)]"/>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  // Styling: Full Border, Background Abu-abu Muda
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl bg-gray-50 focus:border-[var(--color-tawar)] focus:outline-none focus:ring-0 transition-colors placeholder:text-gray-500 text-gray-900"
                  placeholder="Password (Min. 8 Karakter)"
                  minLength="8"
                  required
                />
              </div>
            </div>

            {/* Input Konfirmasi Password (BARU) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 sr-only" htmlFor="confirm-password">Konfirmasi Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-tawar)]"/>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  // Styling: Full Border, Background Abu-abu Muda
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl bg-gray-50 focus:border-[var(--color-tawar)] focus:outline-none focus:ring-0 transition-colors placeholder:text-gray-500 text-gray-900"
                  placeholder="Konfirmasi Password"
                  minLength="8"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              // Button dengan warna Lelang, shadow untuk kedalaman
              className="w-full bg-[var(--color-lelang)] text-white py-3.5 rounded-xl font-bold hover:bg-[var(--color-lelang-dark)] transition-colors disabled:bg-gray-400 mt-8 flex items-center justify-center shadow-lg hover:shadow-xl"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Daftar Akun'}
              <ArrowRight size={20} className="ml-2"/>
            </button>
          </form>
          
          {message && <p className={`mt-4 text-center text-sm font-semibold ${message.includes('Gagal') || message.includes('terdaftar') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}

          {/* Link Login */}
          <p className="mt-10 text-center text-sm text-gray-600 pt-4 border-t border-gray-200">
            Sudah memiliki akun?{' '}
            <Link href="/auth/login" className="font-bold text-[var(--color-tawar)] hover:text-[var(--color-tawar-dark)] transition-colors hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
