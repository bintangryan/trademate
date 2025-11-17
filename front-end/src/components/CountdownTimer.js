// src/components/CountdownTimer.js
'use client';

import { useState, useEffect, useCallback } from 'react';

export default function CountdownTimer({ expiryTimestamp, onExpire }) {
    
    // --- 1. PERBAIKI FUNGSI KALKULASI ---
    const calculateTimeLeft = useCallback(() => {
        const difference = +new Date(expiryTimestamp) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                // Tambahkan kalkulasi JAM
                jam: Math.floor((difference / (1000 * 60 * 60))),
                menit: Math.floor((difference / 1000 / 60) % 60),
                detik: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    }, [expiryTimestamp]); 
    // -------------------------------------

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        // Set interval untuk update timer setiap detik
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);

            // Jika waktu habis, bersihkan interval dan panggil onExpire
            if (Object.keys(newTimeLeft).length === 0) {
                clearInterval(timer);
                if (onExpire) { // Pastikan onExpire ada
                    onExpire();
                }
            }
        }, 1000);

        // Fungsi cleanup
        return () => clearInterval(timer);
    }, [calculateTimeLeft, onExpire]); // Dependensi sudah benar

    const formatTime = (time) => String(time).padStart(2, '0');

    // --- 2. PERBAIKI TAMPILAN (RENDER) ---
    return (
        <span className="font-bold text-red-600">
            {timeLeft.jam !== undefined 
                ? `${formatTime(timeLeft.jam)}:${formatTime(timeLeft.menit)}:${formatTime(timeLeft.detik)}` 
                : '00:00:00'
            }
        </span>
    );
    // -----------------------------------
}