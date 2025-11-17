// src/controllers/productController.js
import prisma from '../lib/prisma.js';
import { createNotification } from './notificationController.js';

// ... (Semua fungsi dari createProduct hingga reAuctionProduct tetap sama persis)
const calculateEndTime = (value, unit) => {
    const durationValue = parseFloat(value);
    
    if (isNaN(durationValue) || durationValue <= 0) {
        throw new Error("Invalid duration value.");
    }

    const endTime = new Date();
    
    switch (unit.toLowerCase()) {
        case 'minutes':
        case 'menit':
            endTime.setMinutes(endTime.getMinutes() + durationValue);
            break;
        case 'hours':
        case 'jam':
            const totalMilliseconds = durationValue * 60 * 60 * 1000;
            endTime.setTime(endTime.getTime() + totalMilliseconds);
            break;
        case 'days':
        case 'hari':
            endTime.setDate(endTime.getDate() + durationValue);
            break;
        default:
            throw new Error("Invalid duration unit. Use minutes, hours, or days.");
    }
    return endTime;
};

export const createProduct = async (req, res) => {
    try {
        if (req.user.role !== 'seller') {
            return res.status(403).json({ message: 'Forbidden: Only sellers can create products' });
        }

        const {
            name,
            description,
            price,
            saleType = 'buy_now',
            startingPrice,
            durationValue, 
            durationUnit, 
            bidIncrement,
            condition,
            // --- PERUBAHAN INPUT ---
            usagePeriodValue,
            usagePeriodUnit,
            // -----------------------
            categoryIds
        } = req.body;

        // --- VALIDASI NAMA & KONDISI ---
        if (!name || !condition) {
            return res.status(400).json({ message: 'Nama dan kondisi wajib diisi' });
        }
        
        // --- VALIDASI NAMA (Regex: hanya huruf, angka, spasi, dan .,-') ---
        const nameRegex = /^[a-zA-Z0-9\s.,'-]+$/;
        if (!nameRegex.test(name)) {
            return res.status(400).json({ message: 'Nama produk hanya boleh berisi huruf, angka, spasi, dan simbol dasar (.,-\').' });
        }
        
        if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length !== 1) {
            return res.status(400).json({ message: 'Product must be assigned to exactly one category ID.' });
        }
        
        // --- PERUBAHAN: Menggabungkan usagePeriod ---
        let usagePeriodString = null;
        if (usagePeriodValue && usagePeriodUnit) {
            // Pastikan value adalah angka
            const periodVal = parseInt(usagePeriodValue);
            if (!isNaN(periodVal) && periodVal > 0) {
                 usagePeriodString = `${periodVal} ${usagePeriodUnit}`;
            }
        }
        
        let productData = {
            name,
            description,
            saleType,
            condition,
            usagePeriod: usagePeriodString, // <-- Disimpan sebagai string gabungan
            sellerId: req.user.userId,
            stock: 1,
        };
        // ----------------------------------------

        if (saleType === 'buy_now') {
            // --- VALIDASI HARGA > 0 ---
            if (!price || parseFloat(price) <= 0) {
                return res.status(400).json({ message: 'Harga harus diisi dan lebih besar dari 0' });
            }
            productData.price = parseFloat(price);
        } else if (saleType === 'auction') {
            // --- VALIDASI HARGA > 0 ---
            if (!startingPrice || parseFloat(startingPrice) <= 0) {
                 return res.status(400).json({ message: 'Harga awal harus lebih besar dari 0' });
            }
            if (!bidIncrement || parseFloat(bidIncrement) <= 0) {
                 return res.status(400).json({ message: 'Kelipatan bid harus lebih besar dari 0' });
            }
            if (!durationValue || !durationUnit) {
                return res.status(400).json({ message: 'Durasi lelang wajib diisi' });
            }
            // ---------------------------
            
            try {
                const auctionEndTime = calculateEndTime(durationValue, durationUnit);
                productData.endTime = auctionEndTime; 
            } catch (e) {
                return res.status(400).json({ message: e.message });
            }

            productData.startingPrice = parseFloat(startingPrice);
            productData.bidIncrement = parseFloat(bidIncrement);
            productData.status = 'available'; 
            productData.auctionStatus = 'running';
        } else {
            return res.status(400).json({ message: 'Invalid saleType' });
        }
        
        const categoryId = parseInt(categoryIds[0]);
        
        productData.categories = {
            create: [{
                category: {
                    connect: { id: categoryId } 
                }
            }]
        };

        const newProduct = await prisma.product.create({ data: productData });

        res.status(201).json({ message: 'Product created successfully', product: newProduct });
    } catch (error) {
        console.error('Create product error:', error);
        if (error.code === 'P2003') { 
            return res.status(400).json({ message: 'The selected Category ID is invalid or does not exist.' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAllProducts = async (req, res) => {
    try {
        const { saleType, categoryId, search, condition, sortBy, sortOrder } = req.query;

        let whereFilter = {
            status: { notIn: ['sold', 'unavailable', 'cancelled_by_buyer'] }
        };

        // --- FILTERING ---
        if (saleType) {
            whereFilter.saleType = saleType;

            // --- PERBAIKAN UTAMA DI SINI ---
            // Jika yang diminta adalah halaman lelang (shop/auction)
            if (saleType === 'auction') {
                // 1. Hanya tampilkan lelang yang waktunya BELUM berakhir
                whereFilter.endTime = {
                    gt: new Date() // gt = greater than (lebih besar dari)
                };
                // 2. Dan pastikan status lelangnya 'running'
                whereFilter.auctionStatus = 'running';
            }
            // --- AKHIR PERBAIKAN ---
        }
        
        if (condition) { 
            whereFilter.condition = condition;
        }
        
        if (categoryId) {
            const id = parseInt(categoryId);
            if (!isNaN(id)) {
                whereFilter.categories = {
                    some: { categoryId: id }
                };
            }
        }
        if (search) {
            whereFilter.name = {
                contains: search,
                mode: 'insensitive', 
            };
        }

        // --- SORTING LOGIC ---
        let orderByClause = { createdAt: 'desc' }; // Default sort
        
        if (sortBy === 'price' || sortBy === 'startingPrice') {
            const field = saleType === 'auction' ? 'startingPrice' : 'price';
            const order = (sortOrder && sortOrder.toLowerCase() === 'asc') ? 'asc' : 'desc';
            orderByClause = { [field]: order };
        } 
        
        const products = await prisma.product.findMany({
            where: whereFilter,
            orderBy: orderByClause, 
            include: {
                images: true, 
                categories: { include: { category: true } }, 
            },
        });
        res.status(200).json(products);
    } catch (error) {
        console.error('Get all products error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: {
                images: {
                    orderBy: { id: 'asc' } // Urutkan gambar berdasarkan ID
                },
                categories: { include: { category: true } },
                seller: { include: { profile: true } }, 
                bids: {
                orderBy: {
                amount: 'desc',
                },
            },
            },
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error('Get product by ID error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getMyProducts = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const { status: statusFilter, search, saleType: saleTypeFilter, status_ne } = req.query; // Ambil juga status_ne

    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Forbidden' });

    // 1. Hitung counts (tidak berubah)
    const [allCount, auctionCount, buyNowCount, soldCount] = await Promise.all([
        prisma.product.count({ where: { sellerId, status: { notIn: ['sold'] } } }),
        prisma.product.count({ where: { sellerId, saleType: 'auction', status: { notIn: ['sold'] } } }),
        prisma.product.count({ where: { sellerId, saleType: 'buy_now', status: { notIn: ['sold'] } } }),
        prisma.product.count({ where: { sellerId, status: 'sold' } })
    ]);
    const counts = { all: allCount, auction: auctionCount, buy_now: buyNowCount, sold: soldCount };

    // 2. Siapkan klausa 'where' (tidak berubah)
    let whereClause = { sellerId };
    if (statusFilter) {
        whereClause.status = statusFilter;
    }
    // Handle status_ne (not equal) from frontend filter 'all', 'auction', 'buy_now'
    if (status_ne) {
        whereClause.status = { not: status_ne };
    }
    if (search) whereClause.name = { contains: search, mode: 'insensitive' };
    if (saleTypeFilter) whereClause.saleType = saleTypeFilter;

    // 3. Fetch produk dari DB, tetap urutkan berdasarkan tanggal terbaru
    const productsFromDb = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }, // Urutan dasar tetap tanggal
      include: {
        images: { take: 1 },
        bids: { orderBy: { amount: 'desc' }, take: 1 }
      },
    });

    // --- 4. SORTING TAMBAHAN DI SINI ---
    // Hanya lakukan sorting tambahan jika filter BUKAN 'sold'
    let sortedProducts = productsFromDb;
    if (statusFilter !== 'sold') {
        sortedProducts = productsFromDb.sort((a, b) => {
            // Prioritaskan 'available'
            if (a.status === 'available' && b.status !== 'available') {
                return -1; // a comes first
            }
            if (a.status !== 'available' && b.status === 'available') {
                return 1; // b comes first
            }
            // Jika status sama, biarkan urutan createdAt (sudah di-sort oleh DB)
            return 0;
        });
    }
    // --- AKHIR SORTING TAMBAHAN ---


    // 5. Kirim kembali produk yang SUDAH DI-SORTING dan jumlahnya
    res.status(200).json({ products: sortedProducts, counts });

  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productDataToUpdate = req.body;
        const userId = req.user.userId;

        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.sellerId !== userId) {
            return res.status(403).json({ message: 'Forbidden: You can only edit your own products' });
        }

        const allowedUpdates = { ...productDataToUpdate };
        
        // --- VALIDASI NAMA & HARGA SAAT UPDATE ---
        if (allowedUpdates.name) {
            const nameRegex = /^[a-zA-Z0-9\s.,'-]+$/;
            if (!nameRegex.test(allowedUpdates.name)) {
                return res.status(400).json({ message: 'Nama produk hanya boleh berisi huruf, angka, dan spasi.' });
            }
        }
        if (allowedUpdates.price && parseFloat(allowedUpdates.price) <= 0) {
             return res.status(400).json({ message: 'Harga harus lebih besar dari 0.' });
        }
        if (allowedUpdates.startingPrice && parseFloat(allowedUpdates.startingPrice) <= 0) {
             return res.status(400).json({ message: 'Harga awal harus lebih besar dari 0.' });
        }
        // ----------------------------------------

        delete allowedUpdates.id;
        delete allowedUpdates.sellerId;
        delete allowedUpdates.createdAt;
        delete allowedUpdates.images;
        delete allowedUpdates.seller;
        delete allowedUpdates.bids;
        delete allowedUpdates.categories;

        if (allowedUpdates.price) allowedUpdates.price = parseFloat(allowedUpdates.price);
        if (allowedUpdates.startingPrice) allowedUpdates.startingPrice = parseFloat(allowedUpdates.startingPrice);
        if (allowedUpdates.bidIncrement) allowedUpdates.bidIncrement = parseFloat(allowedUpdates.bidIncrement);

        // --- PERUBAHAN: Menggabungkan usagePeriod saat UPDATE ---
        if (allowedUpdates.usagePeriodValue && allowedUpdates.usagePeriodUnit) {
            const periodVal = parseInt(allowedUpdates.usagePeriodValue);
            if (!isNaN(periodVal) && periodVal > 0) {
                allowedUpdates.usagePeriod = `${periodVal} ${allowedUpdates.usagePeriodUnit}`;
            } else {
                 allowedUpdates.usagePeriod = null; // Hapus jika valuenya 0 atau tidak valid
            }
        } else {
            allowedUpdates.usagePeriod = null; // Hapus jika salah satu tidak diisi
        }
        delete allowedUpdates.usagePeriodValue;
        delete allowedUpdates.usagePeriodUnit;
        // ----------------------------------------------------

        if (allowedUpdates.categoryIds && Array.isArray(allowedUpdates.categoryIds) && allowedUpdates.categoryIds.length === 1) {
            const categoryId = parseInt(allowedUpdates.categoryIds[0]);

            await prisma.$transaction([
                prisma.productCategory.deleteMany({
                    where: { productId: parseInt(id) },
                }),
                prisma.productCategory.create({
                    data: {
                        productId: parseInt(id),
                        categoryId: categoryId,
                    },
                }),
            ]);
        }
        delete allowedUpdates.categoryIds;

        const updatedProduct = await prisma.product.update({
            where: { id: parseInt(id) },
            data: allowedUpdates,
        });

        res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });

    } catch (error) {
        console.error('Update product error:', error);
        if (error.code === 'P2003') {
             return res.status(400).json({ message: 'The selected Category ID is invalid or does not exist.' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.sellerId !== userId) {
            return res.status(403).json({ message: 'Forbidden: You can only delete your own products' });
        }

        await prisma.product.delete({
            where: { id: parseInt(id) },
        });

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const reAuctionProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const sellerId = req.user.userId;
        const { startingPrice, bidIncrement, durationValue, durationUnit } = req.body;
        if (!startingPrice || !bidIncrement || !durationValue || !durationUnit) {
            return res.status(400).json({ message: 'All new auction details are required.' });
        }
        
        // --- Ambil 'status' dan 'auctionStatus' ---
        const product = await prisma.product.findFirst({ 
            where: { id: parseInt(id), sellerId: sellerId },
            select: { status: true, auctionStatus: true, endTime: true } // Ambil semua yang kita butuhkan
        });

        if (!product) return res.status(404).json({ message: 'Product not found or you are not the owner.' });
        
        const isTimeExpired = new Date() > new Date(product.endTime);
        
        // --- PERBAIKAN LOGIKA 'canReAuction' ---
        // 1. Cek apakah dibatalkan oleh buyer
        const isCancelledByBuyer = product.status === 'cancelled_by_buyer';
        // 2. Cek apakah dibatalkan oleh seller (state yang kita atur)
        const isCancelledBySeller = product.status === 'available' && product.auctionStatus === 'ended';
        
        // 3. Bisa lelang ulang jika salah satu dari 3 kondisi ini benar
        const canReAuction = isCancelledByBuyer || isTimeExpired || isCancelledBySeller;
        // ------------------------------------

        if (!canReAuction) {
            if (product.auctionStatus === 'running') {
                return res.status(400).json({ message: 'Cannot re-auction a running auction. Please cancel it first.' });
            }
            // Pesan error yang lebih spesifik
            return res.status(400).json({ message: `Cannot re-auction. Status: ${product.status}, AuctionStatus: ${product.auctionStatus}` });
        }
        
        const newEndTime = calculateEndTime(durationValue, durationUnit);
        await prisma.$transaction(async (tx) => {
            // Hapus bid lama
            await tx.bid.deleteMany({ where: { productId: parseInt(id) } });
            
            // Update produk ke state 'running' baru
            await tx.product.update({
                where: { id: parseInt(id) },
                data: {
                    status: 'available',
                    auctionStatus: 'running',
                    startingPrice: parseFloat(startingPrice),
                    bidIncrement: parseFloat(bidIncrement),
                    endTime: newEndTime,
                    auctionWinnerId: null,
                    reservedAt: null,
                }
            });
        });
        res.status(200).json({ message: 'Product has been re-auctioned successfully!' });
    } catch (error) {
        console.error('Re-auction error:', error);
        res.status(500).json({ message: 'Failed to re-auction the product.' });
    }
};

// --- FUNGSI cancelAuctionBySeller YANG DIPERBAIKI ---
export const cancelAuctionBySeller = async (req, res) => {
    try {
        const { id } = req.params; // ID Produk
        const sellerId = req.user.userId;

        const product = await prisma.product.findFirst({
            where: { id: parseInt(id), sellerId: sellerId },
            // --- 2. Ambil 'name' untuk notifikasi ---
            select: { id: true, sellerId: true, auctionStatus: true, name: true }
        });

        if (!product) {
            return res.status(404).json({ message: 'Produk tidak ditemukan atau Anda bukan pemiliknya.' });
        }

        if (product.auctionStatus !== 'running') {
             return res.status(400).json({ message: 'Hanya lelang yang sedang berjalan yang bisa dibatalkan.' });
        }
        
        await prisma.$transaction(async (tx) => {
            
            // --- 3. Ambil semua bidder UNIK (sebelum bid dihapus, jika Anda menghapusnya) ---
            // Kode Anda saat ini tidak menghapus bid, jadi ini aman.
            const bids = await tx.bid.findMany({
                where: { productId: parseInt(id) },
                select: { userId: true },
                distinct: ['userId'] // Hanya ambil user unik
            });
            const bidderIds = bids.map(b => b.userId);
            // ----------------------------------------------------

            await tx.product.update({
                where: { id: parseInt(id) },
                data: {
                    status: 'available', 
                    auctionStatus: 'ended',
                    auctionWinnerId: null,
                    reservedAt: null,
                }
            });
            
            // --- 4. KIRIM NOTIFIKASI KE SEMUA BIDDER ---
            for (const bidderId of bidderIds) {
                // Jangan kirim notif ke seller jika dia ikut bid (walaupun sudah dicegah)
                if (bidderId !== sellerId) {
                    await createNotification(
                        bidderId,
                        'auction_cancelled_seller',
                        `Lelang untuk "${product.name}" telah dibatalkan oleh penjual.`,
                        '/dashboard/my-bids'
                    );
                }
            }
            // -----------------------------------------
        });

        res.status(200).json({ message: 'Lelang berhasil dibatalkan.' });

    } catch (error) {
        console.error('Cancel auction error:', error);
        res.status(500).json({ message: 'Gagal membatalkan lelang.' });
    }
};
// --- AKHIR FUNGSI BARU ---