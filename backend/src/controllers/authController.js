// backend/src/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; 
import prisma from '../lib/prisma.js';
import { sendVerificationEmail } from '../lib/emailService.js';
import crypto from 'crypto';

export const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const emailString = email.toLowerCase();
    if (!emailString.endsWith('.ac.id') && !emailString.endsWith('.edu')) {
        return res.status(400).json({ 
          message: 'Registrasi gagal. Hanya email dengan domain .ac.id atau .edu yang diizinkan.' 
        });
     }
    

    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: 'Email sudah terdaftar dan terverifikasi.' });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 1. Buat atau Update user (tapi belum terverifikasi)
    const user = await prisma.user.upsert({
        where: { email },
        update: { password_hash: hashedPassword, isVerified: false },
        create: {
            email,
            password_hash: hashedPassword,
            isVerified: false,
        },
    });

    // 2. Buat token verifikasi
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 jam

    await prisma.verificationToken.upsert({
        where: { userId: user.id },
        create: {
            userId: user.id,
            token: token,
            expiresAt: expires,
        },
        update: {
            token: token,
            expiresAt: expires,
        }
    });

    // 3. Kirim email
    await sendVerificationEmail(user.email, token);

    res.status(201).json({
      message: 'Registrasi berhasil. Silakan cek email Anda untuk verifikasi.',
    });

  } catch (error) {
    console.error('Error in registerUser:', error); // Log error yang lebih spesifik
    res.status(500).json({ message: 'Gagal mengirim email verifikasi. Coba lagi nanti.' });
  }
};

// --- CONTROLLER UNTUK MENANGANI VERIFIKASI ---
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // 1. Cari token di database
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token },
        });

        // --- PENANGANAN ERROR 1: TOKEN TIDAK DITEMUKAN ---
        if (!verificationToken) {
            return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=invalid_token`);
        }

        // --- PENANGANAN ERROR 2: TOKEN KEDALUWARSA ---
        if (new Date() > new Date(verificationToken.expiresAt)) {
            await prisma.verificationToken.delete({ where: { token } }); // Hapus token lama
            return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=token_expired`);
        }

        // 3. Jika valid, update user
        await prisma.user.update({
            where: { id: verificationToken.userId },
            data: { isVerified: true },
        });

        // 4. Hapus token yang sudah dipakai
        await prisma.verificationToken.delete({
            where: { token },
        });

        // Alihkan ke halaman login di frontend dengan pesan sukses
        res.redirect(`${process.env.FRONTEND_URL}/auth/login?verified=true`);

    } catch (error) {
        console.error('Error in verifyEmail:', error);
        res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=verification_failed`);
    }
};

// --- FUNGSI loginUser YANG LENGKAP ---
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // --- LOGIKA LENGKAP UNTUK MENCARI USER ---
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: {
        profile: true, 
      }
    });
    // --- AKHIR LOGIKA LENGKAP ---

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // --- CEK VERIFIKASI BARU ---
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Akun Anda belum diverifikasi. Silakan cek email Anda untuk tautan verifikasi.' 
      });
    }
    // --- AKHIR CEK VERIFIKASI ---

    // --- LOGIKA LENGKAP UNTUK MEMBUAT TOKEN ---
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        fullName: user.profile?.fullName || null 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    // --- AKHIR LOGIKA LENGKAP ---
    
    res.status(200).json({
      message: 'Login successful',
      token: token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};