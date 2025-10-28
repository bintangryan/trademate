import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  // 1. Ambil header 'Authorization'
  const authHeader = req.headers['authorization'];

  // 2. Cek apakah header ada, jika tidak, tolak akses
  if (!authHeader) {
    return res.status(403).json({ message: 'Forbidden: No token provided' });
  }

  // 3. Ambil token dari header (formatnya: "Bearer <token>")
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(403).json({ message: 'Forbidden: Malformed token' });
  }

  try {
    // 4. Verifikasi token menggunakan kunci rahasia
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Jika valid, simpan data user ke dalam objek request
    req.user = decoded;

    // 6. Lanjutkan ke proses selanjutnya (controller)
    next();
  } catch (error) {
    // Jika token tidak valid (kadaluarsa, salah, dll)
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};