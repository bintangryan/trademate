// file: src/context/AuthContext.js
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedUser = jwtDecode(token);

        // --- PERBAIKAN DI SINI: Cek Waktu Kedaluwarsa Token ---
        // 'decodedUser.exp' adalah waktu kedaluwarsa dalam detik.
        // Kita kalikan 1000 untuk mengubahnya menjadi milidetik.
        if (decodedUser.exp * 1000 < Date.now()) {
          // Jika token sudah kedaluwarsa, hapus dari storage
          console.log("Token kedaluwarsa, melakukan logout otomatis.");
          localStorage.removeItem('token');
          setUser(null); // Pastikan state user juga di-reset
        } else {
          // Jika token masih valid, set user
          setUser(decodedUser);
        }
        // --- AKHIR PERBAIKAN ---

      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    const decodedUser = jwtDecode(token);
    setUser(decodedUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};