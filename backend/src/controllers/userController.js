// src/controllers/userController.js
import prisma from '../lib/prisma.js';
import jwt from 'jsonwebtoken';
// Pastikan Anda sudah menerapkan singleton, jika belum, baris di bawah ini akan bekerja
// --- FUNGSI getMyProfile YANG DIPERBAIKI ---
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    // WAJIB: Ambil data profil TERBARU langsung dari database
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    // Kirim kembali data profil dari database, bukan dari token
    res.status(200).json({
      message: 'Profile fetched successfully',
      profile: profile, // Ini mengirim objek profile yang sebenarnya
      user: req.user
    });
  } catch (error) {
     console.error('Get user profile error:', error);
     res.status(500).json({ message: 'Internal server error' });
  }
};

// --- FUNGSI updateUserProfile YANG DIPERBAIKI ---
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      fullName, 
      storeName, 
      address, 
      phoneNumber,
    } = req.body;

    const dataToUpdate = { fullName, storeName, address, phoneNumber };
    Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    let userUpdated = false;
    if (user.role === 'buyer' && storeName) {
        await prisma.user.update({
            where: { id: userId },
            data: { role: 'seller' }
        });
        userUpdated = true;
    }

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: dataToUpdate,
      create: { userId, ...dataToUpdate },
    });

    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    const newFullName = updatedProfile.fullName;

    // WAJIB: Buat token baru dengan info fullName yang sudah diupdate
    const newToken = jwt.sign(
      { 
        userId: updatedUser.id, 
        email: updatedUser.email, 
        role: updatedUser.role,
        fullName: newFullName || null
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: userUpdated ? 'Profile and role successfully updated.' : 'Profile updated successfully.',
      profile: updatedProfile,
      token: newToken // WAJIB: Kirim token baru ke frontend
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};