'use client';

import { useState, useEffect } from 'react'; // Pastikan useEffect di-import
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams
import { useAuth } from '@/context/AuthContext'; 
import Link from 'next/link'; 
import { Mail, Lock, Gavel, ArrowRight } from 'lucide-react'; 

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false); // State baru untuk melacak tipe pesan
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth(); 

  // --- useEffect YANG DIPERBARUI ---
  useEffect(() => {
    const verified = searchParams.get('verified');
    const error = searchParams.get('error');

    if (verified === 'true') {
        setMessage('Verifikasi email berhasil! Silakan login.');
        setIsError(false);
        router.replace('/auth/login', { scroll: false }); 
    } else if (error) {
        if (error === 'invalid_token') {
            setMessage('Tautan verifikasi tidak valid atau sudah digunakan.');
        } else if (error === 'token_expired') {
            setMessage('Tautan verifikasi telah kedaluwarsa. Silakan daftar ulang.');
        } else {
            setMessage('Verifikasi email gagal. Silakan coba lagi.');
        }
        setIsError(true);
        router.replace('/auth/login', { scroll: false }); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);
  // --- AKHIR PERUBAHAN ---

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsError(false);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
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
      setIsError(false);
      router.push('/');

    } catch (error) {
      let userMessage = error.message;
      if (userMessage.includes('Kredensial')) {
          userMessage = 'Email atau password salah. Coba lagi.';
      } else if (userMessage.includes('belum diverifikasi')) {
          userMessage = 'Akun Anda belum diverifikasi. Cek email Anda.';
      } else {
          userMessage = 'Gagal terhubung ke server. Coba lagi.';
      }
      setMessage(userMessage);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main 
      className="flex min-h-screen items-center justify-center p-6"
      style={{
        background: `linear-gradient(120deg, var(--color-lelang) 10%, var(--color-tawar) 100%)`
      }}
    >
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl shadow-2xl border border-gray-100">
        <div className="w-full">
          
          <div className="text-center mb-12">            
            <h1 className="text-5xl font-extrabold text-gray-900 leading-none">
                Welcome
            </h1>
            <p className="text-lg text-gray-600 mt-2">
                Silakan masuk ke akun Kamu
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 sr-only" htmlFor="email">Email</label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-tawar)]"/>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl bg-gray-50 focus:border-[var(--color-tawar)] focus:outline-none focus:ring-0 transition-colors placeholder:text-gray-500 text-gray-900"
                  placeholder="Email Address"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 sr-only" htmlFor="password">Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-tawar)]"/>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl bg-gray-50 focus:border-[var(--color-lelang)] focus:outline-none focus:ring-0 transition-colors placeholder:text-gray-500 text-gray-900"
                  placeholder="Password"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-[var(--color-lelang)] text-white py-3.5 rounded-xl font-bold hover:bg-[var(--color-lelang-dark)] transition-colors disabled:bg-gray-400 mt-8 flex items-center justify-center shadow-lg hover:shadow-xl"
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : 'Login'}
              <ArrowRight size={20} className="ml-2"/>
            </button>
          </form>
          
          {/* Pesan dinamis untuk sukses atau error */}
          {message && (
            <p className={`mt-4 text-center text-sm font-semibold ${isError ? 'text-red-500' : 'text-green-600'}`}>
              {message}
            </p>
          )}

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