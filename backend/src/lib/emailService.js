import brevo from "@getbrevo/brevo";

// Instance Transactional Email API
const apiInstance = new brevo.TransactionalEmailsApi();

// SET API KEY (format SDK baru)
apiInstance.authentications["apiKey"].apiKey = process.env.BREVO_API_KEY;

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
    // Buat object email setiap request
    const email = new brevo.SendSmtpEmail();

    email.sender = {
      name: "Trademate",
      email: "trademate.verify@gmail.com",
    };

    email.to = [{ email: toEmail }];
    email.subject = "Verifikasi Akun Trademate Anda";
    email.htmlContent = htmlContent;

    await apiInstance.sendTransacEmail(email);

    console.log("Verification email sent to:", toEmail);

  } catch (err) {
    console.error("Brevo Email Error:", err);
    throw new Error("Failed to send verification email");
  }
};
