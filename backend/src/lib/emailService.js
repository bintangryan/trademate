// src/lib/emailService.js
import { Resend } from 'resend';

// 1. Inisialisasi Resend dengan API Key Anda dari .env
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (toEmail, token) => {
  
  const verificationLink = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify/${token}`;

  // 2. Siapkan konten email (HTML-nya tetap sama)
  const htmlContent = `
    <h2>Selamat datang di Trademate!</h2>
    <p>Terima kasih telah mendaftar. Silakan klik tautan di bawah untuk memverifikasi email Anda:</p>
    <a href="${verificationLink}" style="padding: 10px 20px; background-color: #003F91; color: white; text-decoration: none; border-radius: 5px;">
      Verifikasi Email Saya
    </a>
    <p>Jika Anda tidak mendaftar, abaikan email ini.</p>
  `;

  try {
    // 3. Kirim email menggunakan 'resend' (bukan 'transporter')
    await resend.emails.send({
      // PENTING: Untuk free tier, 'from' HARUS 'onboarding@resend.dev'
      from: 'Trademate <onboarding@resend.dev>',
      to: [toEmail], // Resend menggunakan array
      subject: 'Verifikasi Akun Trademate Anda',
      html: htmlContent,
    });
    
    console.log('Verification email sent to:', toEmail);
  
  } catch (error) {
    // Ini akan menangkap error jika API key Anda salah
    console.error('Error sending email via Resend:', error);
    throw new Error('Failed to send verification email');
  }
};