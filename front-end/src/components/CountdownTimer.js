// src/components/CountdownTimer.js
'use client';

import { useState, useEffect, useCallback } from 'react'; // Impor useCallback

export default function CountdownTimer({ expiryTimestamp, onExpire }) {
    // 1. Bungkus fungsi dengan useCallback agar tidak dibuat ulang di setiap render
    const calculateTimeLeft = useCallback(() => {
        const difference = +new Date(expiryTimestamp) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                menit: Math.floor((difference / 1000 / 60) % 60),
                detik: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    }, [expiryTimestamp]); // Fungsi ini hanya akan dibuat ulang jika expiryTimestamp berubah

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        // Set interval untuk update timer setiap detik
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);

            // Jika waktu habis, bersihkan interval dan panggil onExpire
            if (Object.keys(newTimeLeft).length === 0) {
                clearInterval(timer);
                onExpire();
            }
        }, 1000);

        // Fungsi cleanup untuk membersihkan interval saat komponen dilepas
        return () => clearInterval(timer);
    }, [calculateTimeLeft, onExpire]); // 2. Daftarkan dependensi yang benar

    const formatTime = (time) => String(time).padStart(2, '0');

    return (
        <span className="font-bold text-red-600">
            {timeLeft.menit !== undefined ? `${formatTime(timeLeft.menit)}:${formatTime(timeLeft.detik)}` : '00:00'}
        </span>
    );
}