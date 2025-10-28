import prisma from '../lib/prisma.js';

// ... (fungsi calculateEndTime, createProduct, getAllProducts, getProductById tetap sama)
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
            usagePeriod,
            categoryIds
        } = req.body;

        if (!name || !condition) {
            return res.status(400).json({ message: 'Name and condition are required' });
        }
        
        if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length !== 1) {
            return res.status(400).json({ message: 'Product must be assigned to exactly one category ID.' });
        }
        
        let productData = {
            name,
            description,
            saleType,
            condition,
            usagePeriod,
            sellerId: req.user.userId,
            stock: 1,
        };

        if (saleType === 'buy_now') {
            if (!price) {
                return res.status(400).json({ message: 'Price is required for buy_now sale type' });
            }
            productData.price = parseFloat(price);
        } else if (saleType === 'auction') {
            if (!startingPrice || !durationValue || !durationUnit || !bidIncrement) {
                return res.status(400).json({ message: 'Starting price, duration value/unit, and bid increment are required for auction sale type' });
            }
            
            try {
                const auctionEndTime = calculateEndTime(durationValue, durationUnit);
                productData.endTime = auctionEndTime; 
            } catch (e) {
                return res.status(400).json({ message: e.message });
            }

            productData.startingPrice = parseFloat(startingPrice);
            productData.bidIncrement = parseFloat(bidIncrement);
            productData.status = 'available'; // Produk tetap available, tapi...
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
        // PERBAIKAN: Tambahkan 'condition', 'sortBy', dan 'sortOrder' ke dekonstruksi req.query
        const { saleType, categoryId, search, condition, sortBy, sortOrder } = req.query;

        let whereFilter = {
            status: { notIn: ['sold', 'unavailable'] }
        };

        // --- FILTERING ---
        if (saleType) {
            whereFilter.saleType = saleType;
        }
        
        // LOGIKA BARU: Terapkan filter kondisi jika ada
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
            // Gunakan harga yang sesuai dengan tipe penjualan
            const field = saleType === 'auction' ? 'startingPrice' : 'price';
            
            // Default order adalah 'desc' (tertinggi ke terendah) jika tidak ada sortOrder
            const order = (sortOrder && sortOrder.toLowerCase() === 'asc') ? 'asc' : 'desc';
            
            orderByClause = { [field]: order };
        } 
        
        const products = await prisma.product.findMany({
            where: whereFilter,
            orderBy: orderByClause, // Terapkan sorting baru
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


// --- PERUBAHAN 1: getMyProducts ---
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
        const product = await prisma.product.findFirst({ where: { id: parseInt(id), sellerId: sellerId } });
        if (!product) return res.status(404).json({ message: 'Product not found or you are not the owner.' });
        
        // --- PERBAIKAN DI SINI ---
        const isTimeExpired = new Date() > new Date(product.endTime);
        const canReAuction = product.status === 'cancelled_by_buyer' || isTimeExpired;

        if (!canReAuction) {
            return res.status(400).json({ message: 'Only auctions that have ended or been cancelled can be re-auctioned.' });
        }
        // --- AKHIR PERBAIKAN ---
        
        const newEndTime = calculateEndTime(durationValue, durationUnit);
        await prisma.$transaction(async (tx) => {
            await tx.bid.deleteMany({ where: { productId: parseInt(id) } });
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