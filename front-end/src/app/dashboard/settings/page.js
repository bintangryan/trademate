'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { User, Store, Settings, Save, Edit, X } from 'lucide-react';

// Komponen untuk Tombol Tab Navigasi
const TabButton = ({ label, icon: Icon, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left font-semibold rounded-lg transition-colors ${
                isActive 
                ? 'bg-[var(--color-tawar-light)] text-[var(--color-lelang)]' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
            <Icon size={20} />
            <span>{label}</span>
        </button>
    );
};

export default function SettingsPage() {
    const { user, login } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [formData, setFormData] = useState({
        fullName: '',
        storeName: '',
        address: '',
        phoneNumber: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            // --- PERBAIKAN DI SINI: Ganti URL ---
            const res = await fetch('http://localhost:3110/api/users/me', { // <-- URL diubah ke '/me'
                headers: { 'Authorization': `Bearer ${token}` },
            });
            // --- AKHIR PERBAIKAN ---
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    fullName: data.profile?.fullName || '',
                    storeName: data.profile?.storeName || '',
                    address: data.profile?.address || '',
                    phoneNumber: data.profile?.phoneNumber || '',
                });
            } else {
                console.log("Profil belum ada, menampilkan form kosong.");
            }
        } catch (error) {
            toast.error("Gagal memuat profil.");
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            // URL untuk PUT sudah benar, tidak perlu diubah
            const res = await fetch('http://localhost:3110/api/users/profile', { 
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            toast.success('Profil berhasil diperbarui!');
            
            if (data.token) {
                login(data.token);
            }

            setFormData({
                fullName: data.profile?.fullName || '',
                storeName: data.profile?.storeName || '',
                address: data.profile?.address || '',
                phoneNumber: data.profile?.phoneNumber || '',
            });

            setIsEditing(false);
            
            if(data.message.includes('role successfully updated')) {
                toast('Peran Anda telah diubah menjadi Penjual.', { duration: 5000, icon: '🎉' });
            }

        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCancel = () => {
        setIsEditing(false);
        fetchProfile();
    };

    if (isLoading && !formData.fullName && !formData.storeName) return <p className="p-8 text-center">Memuat pengaturan...</p>;

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto p-4 sm:p-8">
                <div className="flex items-center gap-4 mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Pengaturan Akun</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <aside className="md:col-span-1">
                        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 space-y-2">
                            <TabButton label="Profil Pengguna" icon={User} isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                            <TabButton label="Informasi Toko" icon={Store} isActive={activeTab === 'store'} onClick={() => setActiveTab('store')} />
                        </div>
                    </aside>

                    <main className="md:col-span-3">
                        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200">
                            {activeTab === 'profile' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">Profil Pengguna</h2>
                                        <p className="text-gray-500 mt-1">Informasi ini akan ditampilkan di profilmu</p>
                                    </div>
                                    <div className="border-t border-gray-200 pt-6 space-y-6">
                                        <div>
                                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                                            <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleChange} className="mt-1 input-style" disabled={!isEditing} />
                                        </div>
                                        <div>
                                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Nomor Telepon</label>
                                            <input type="tel" name="phoneNumber" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="mt-1 input-style" disabled={!isEditing} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'store' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">Informasi Toko</h2>
                                        <p className="text-gray-500 mt-1">Lengkapi info ini untuk mulai berjualan di Trademate</p>
                                    </div>
                                    <div className="border-t border-gray-200 pt-6 space-y-6">
                                        <div>
                                            <label htmlFor="storeName" className="block text-sm font-medium text-gray-700">Nama Toko</label>
                                            <input type="text" name="storeName" id="storeName" value={formData.storeName} onChange={handleChange} className="mt-1 input-style" disabled={!isEditing} />
                                            <p className="text-xs text-gray-500 mt-1">Mengisi nama toko akan mengubah status akunmu menjadi <span className="font-semibold">Penjual</span></p>
                                        </div>
                                        <div>
                                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Alamat Toko / Lokasi Pickup</label>
                                            <textarea name="address" id="address" rows="3" value={formData.address} onChange={handleChange} className="mt-1 input-style" placeholder="Contoh: Jl. Pahlawan No. 10, Surabaya" disabled={!isEditing}></textarea>
                                            <p className="text-xs text-gray-500 mt-1">Alamat ini akan digunakan pembeli untuk opsi <strong>Pick-Up</strong></p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="border-t border-gray-200 mt-8 pt-6 flex justify-end gap-3">
                                {isEditing ? (
                                    <>
                                        <button type="button" onClick={handleCancel} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                                            <X size={16} /> Batal
                                        </button>
                                        <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-lelang)] text-white font-semibold rounded-lg hover:bg-[var(--color-lelang-dark)] disabled:bg-gray-400 transition-colors">
                                            <Save size={16} /> {isLoading ? 'Menyimpan...' : 'Simpan'}
                                        </button>
                                    </>
                                ) : (
                                    <button type="button" onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors">
                                        <Edit size={16} /> Edit Profil
                                    </button>
                                )}
                            </div>
                        </form>
                    </main>
                </div>
            </div>
        </div>
    );
}