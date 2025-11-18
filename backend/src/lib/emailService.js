// src/lib/emailService.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Email Anda
    pass: process.env.EMAIL_PASS, // Sandi Aplikasi 16 digit Anda
  },
});

export const sendVerificationEmail = async (toEmail, token) => {
  
  // --- PERUBAHAN PENTING DI SINI ---
  // Tautan ini harus mengarah ke rute API backend Anda
  const verificationLink = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify/${token}`;
  // --- AKHIR PERUBAHAN ---

  const mailOptions = {
    from: `"Trademate" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Verifikasi Akun Trademate Anda',
    html: `
      <h2>Selamat datang di Trademate!</h2>
      <p>Terima kasih telah mendaftar. Silakan klik tautan di bawah untuk memverifikasi email Anda:</p>
      <a href="${verificationLink}" style="padding: 10px 20px; background-color: #003F91; color: white; text-decoration: none; border-radius: 5px;">
        Verifikasi Email Saya
      </a>
      <p>Jika Anda tidak mendaftar, abaikan email ini.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent to:', toEmail);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
};