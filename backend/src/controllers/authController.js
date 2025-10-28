import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; 
import prisma from '../lib/prisma.js';

export const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
      },
    });

    const { password_hash, ...userWithoutPassword } = newUser;
    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const loginUser = async (req, res) => {
  try {
    // 1. Ambil email dan password dari body
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: {
        profile: true, // Sertakan data dari UserProfile
      }
    });

    if (!user) {
      // Jika user tidak ditemukan
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Bandingkan password yang dikirim dengan hash di database
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      // Jika password salah
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        fullName: user.profile?.fullName || null // Ambil fullName, atau null jika tidak ada
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 5. Kirim token sebagai respons sukses
    res.status(200).json({
      message: 'Login successful',
      token: token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};