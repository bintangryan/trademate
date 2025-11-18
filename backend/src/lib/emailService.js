// src/lib/emailService.js
import * as Brevo from '@getbrevo/brevo';

// 1. Inisialisasi API Brevo
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.apiClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

// 2. Buat objek email yang akan dikirim
const sendSmtpEmail = new Brevo.SendSmtpEmail();

export const sendVerificationEmail = async (toEmail, token) => {
  
  const verificationLink = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify/${token}`;

  const htmlContent = `
    <h2>Selamat datang di Trademate!</h2>
    <p>Terima kasih telah mendaftar. Silakan klik tautan di bawah untuk memverifikasi email Anda:</p>
    <a href="${verificationLink}" style="padding: 10px 20px; background-color: #003F91; color: white; text-decoration: none; border-radius: 5px;">
      Verifikasi Email Saya
    </a>
    <p>Jika Anda tidak mendaftar, abaikan email ini.</p>
  `;

  try {
    // 3. Konfigurasi detail email
    sendSmtpEmail.to = [{ email: toEmail }]; // Penerima (bisa siapa saja)
    sendSmtpEmail.subject = 'Verifikasi Akun Trademate Anda';
    sendSmtpEmail.htmlContent = htmlContent;
    
    // PENTING: 'sender' HARUS SAMA PERSIS dengan yang Anda verifikasi di Brevo
    sendSmtpEmail.sender = { 
      email: 'trademate.verify@gmail.com', 
      name: 'Trademate' 
    };

    // 4. Kirim email
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log('Verification email sent to:', toEmail);
  
  } catch (error) {
    console.error('Error sending email via Brevo:', error);
    throw new Error('Failed to send verification email');
  }
};