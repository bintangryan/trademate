// src/components/AuctionTimer.js
'use client';

import { useState, useEffect } from 'react';
import { FaClock } from 'react-icons/fa';

export default function AuctionTimer({ endTime }) {
    // State sekarang akan menyimpan objek, bukan string
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(endTime) - +new Date();

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);
                
                setTimeLeft({ days, hours, minutes, seconds });
                setIsExpired(false);
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                setIsExpired(true);
            }
        };

        // Panggil sekali di awal
        calculateTimeLeft();

        // Set interval untuk update setiap detik
        const timer = setInterval(calculateTimeLeft, 1000);

        // Bersihkan interval saat komponen dilepas
        return () => clearInterval(timer);
    }, [endTime]);

    // Fungsi helper untuk format dua digit (misal: 7 -> "07")
    const pad = (num) => String(num).padStart(2, '0');

    // Tampilan saat lelang telah berakhir
    if (isExpired) {
         return (
            <div className="flex items-center space-x-2 text-gray-600 font-semibold bg-gray-200 rounded-lg px-3 py-2">
                <FaClock />
                <span>Lelang telah berakhir</span>
            </div>
         );
    }

    // Tampilan timer yang sedang berjalan
    return (
        <div className="flex items-center space-x-2 text-red-600 font-semibold bg-red-100 rounded-lg px-3 py-2">
            <FaClock />
            <span className="font-mono tracking-wider">
                {/* Tampilkan hari hanya jika lebih dari 0 */}
                {timeLeft.days > 0 && `${timeLeft.days} hari `}
                {`${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`}
            </span>
        </div>
    );
}