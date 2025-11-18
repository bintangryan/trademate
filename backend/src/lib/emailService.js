// src/lib/emailService.js
import * as Brevo from '@getbrevo/brevo';

// --- INI BAGIAN PERBAIKANNYA ---

// 1. Dapatkan 'ApiClient' default (singleton)
const defaultClient = Brevo.ApiClient.instance;

// 2. Konfigurasi autentikasi 'api-key' pada default client
// Pastikan variabel 'BREVO_API_KEY' sudah Anda set di Environment Variables Render
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

// 3. SEKARANG baru buat instance-nya
const apiInstance = new Brevo.TransactionalEmailsApi();

// --- AKHIR PERBAIKAN ---

// 4. Buat objek email (ini sudah benar dari sebelumnya)
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
    // 5. Konfigurasi detail email
    sendSmtpEmail.to = [{ email: toEmail }]; // Penerima (bisa siapa saja)
    sendSmtpEmail.subject = 'Verifikasi Akun Trademate Anda';
    sendSmtpEmail.htmlContent = htmlContent;
    
    // PENTING: 'sender' HARUS SAMA PERSIS dengan yang Anda verifikasi di Brevo
    sendSmtpEmail.sender = { 
      email: 'noreply.trademate@gmail.com', // Ganti jika Anda memverifikasi email lain
      name: 'Trademate' 
    };

    // 6. Kirim email
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log('Verification email sent to:', toEmail);
  
  } catch (error) {
    // Jika 'BREVO_API_KEY' Anda salah, error-nya akan tertangkap di sini
    console.error('Error sending email via Brevo:', error);
    throw new Error('Failed to send verification email');
  }
};