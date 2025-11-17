'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; 
import Link from 'next/link'; 
import { Mail, Lock, Gavel, ArrowRight } from 'lucide-react'; 

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth(); 

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch('${process.env.NEXT_PUBLIC_API_URL}/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Kredensial yang Anda masukkan salah.');
      }

      login(data.token); 

      setMessage('Login successful! Redirecting to home...');
      router.push('/');
    } catch (error) {
      // Clean error message for display in Indonesian
      const userMessage = error.message.includes('kredensial') ? 'Email atau password salah. Coba lagi.' : 'Gagal terhubung ke server. Coba lagi.';
      setMessage(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Main Layout: Single Column, Centered, Full Height
    <main 
      className="flex min-h-screen items-center justify-center p-6"
      style={{
        // Gradasi Background dari Lelang ke Tawar
        background: `linear-gradient(120deg, var(--color-lelang) 10%, var(--color-tawar) 100%)`
      }}
    >
      
      {/* Form Card Container (Pusat perhatian) */}
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl shadow-2xl border border-gray-100 transform transition duration-500 hover:scale-[1.02]">
        <div className="w-full">
          
          {/* Header & Branding */}
          <div className="text-center mb-12">            
            <h1 className="text-5xl font-extrabold text-gray-900 leading-none">
                Welcome
            </h1>
            <p className="text-lg text-gray-600 mt-2">
                Silakan masuk ke akun Kamu
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
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl bg-gray-50 focus:border-[var(--color-lelang)] focus:outline-none focus:ring-0 transition-colors placeholder:text-gray-500 text-gray-900"
                  placeholder="Password"
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
              {isLoading ? 'Memproses...' : 'Login'}
              <ArrowRight size={20} className="ml-2"/>
            </button>
          </form>
          
          {message && <p className={`mt-4 text-center text-sm font-semibold ${message.includes('Gagal') || message.includes('salah') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}

          {/* Link Pendaftaran */}
          <p className="mt-10 text-center text-sm text-gray-600 pt-4 border-t border-gray-200">
            Belum memiliki akun?{' '}
            <Link href="/auth/register" className="font-bold text-[var(--color-tawar)] hover:text-[var(--color-tawar-dark)] transition-colors hover:underline">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
