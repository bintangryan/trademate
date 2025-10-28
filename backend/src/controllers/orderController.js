import prisma from '../lib/prisma.js';

export const createOrder = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { paymentMethod, shippingMethod, itemIds } = req.body; 

        if (!itemIds || itemIds.length === 0) {
            return res.status(400).json({ message: 'Pilih setidaknya satu item untuk checkout.' });
        }
        
        const newOrder = await prisma.$transaction(async (tx) => {
            const selectedItems = await tx.cartItem.findMany({
                where: { id: { in: itemIds.map(id => parseInt(id)) }, cart: { userId } },
                include: { product: true }
            });

            if (selectedItems.length !== itemIds.length) {
                throw new Error("Beberapa item tidak ditemukan di keranjang Anda.");
            }

            let totalAmount = 0;
            const productIdsToUpdate = [];
            for (const item of selectedItems) {
                if (item.product.status !== 'available' && item.product.status !== 'reserved') {
                    throw new Error(`Maaf, produk "${item.product.name}" sudah tidak tersedia.`);
                }
                totalAmount += parseFloat(item.agreedPrice);
                productIdsToUpdate.push(item.productId);
            }

            const createdOrder = await tx.order.create({
                data: {
                    buyerId: userId,
                    finalAmount: totalAmount,
                    status: 'payment_pending', 
                    paymentMethod,
                    shippingMethod,
                    items: { create: selectedItems.map(item => ({
                        productId: item.productId,
                        agreedPrice: item.agreedPrice,
                        quantity: item.quantity,
                    }))}
                },
            });

            await tx.product.updateMany({
                where: { id: { in: productIdsToUpdate } },
                data: { status: 'sold' },
            });
            
            // --- PERBAIKAN DI SINI ---
            // Tolak semua tawaran lain yang masih aktif untuk produk yang terjual
            await tx.offer.updateMany({
                where: {
                    productId: { in: productIdsToUpdate },
                    status: { in: ['pending', 'countered', 'accepted'] }
                },
                data: { status: 'declined' }
            });
            // --- AKHIR PERBAIKAN ---

            await tx.cartItem.deleteMany({
                where: { productId: { in: productIdsToUpdate } },
            });

            return createdOrder;
        }, { maxWait: 10000, timeout: 15000 });

        res.status(201).json({ message: 'Order berhasil dibuat!', order: newOrder });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(400).json({ message: error.message || 'Gagal membuat pesanan.' });
    }
};


export const getOrdersBySeller = async (req, res) => {
    try {
        const sellerId = req.user.userId;
        if (req.user.role !== 'seller') return res.status(403).json({ message: 'Forbidden' });
        
        const orderItems = await prisma.orderItem.findMany({
            where: { product: { sellerId: sellerId } },
            select: { orderId: true },
            distinct: ['orderId']
        });
        
        const orderIds = orderItems.map(oi => oi.orderId);
        if (orderIds.length === 0) return res.status(200).json({ orders: [] });
        
        const orders = await prisma.order.findMany({
            where: { id: { in: orderIds } },
            orderBy: { createdAt: 'desc' },
            include: {
                // Sertakan semua detail yang dibutuhkan
                items: { 
                    include: { 
                        product: {
                            include: { // Gunakan include untuk mengambil semua field + relasi
                                images: { // Sertakan gambar
                                    take: 1 // Ambil 1 gambar
                                }
                            } 
                        } 
                    } 
                },
                buyer: { 
                    select: { 
                        email: true, 
                        profile: { select: { fullName: true, address: true } } 
                    } 
                }
            }
        });
        res.status(200).json({ orders });
    } catch (error) {
        console.error('Get orders by seller error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

export const getOrdersByBuyer = async (req, res) => {
    try {
        const buyerId = req.user.userId;
        const orders = await prisma.order.findMany({
            where: { buyerId: buyerId },
            orderBy: { createdAt: 'desc' },
            include: {
                // Sertakan semua detail yang dibutuhkan
                items: {
                    include: {
                        product: {
                            include: {
                                images: {
                                    take: 1 // Ambil 1 gambar untuk preview
                                },
                                seller: {
                                    select: {
                                        email: true,
                                        profile: { select: { storeName: true } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        res.status(200).json({ orders });
    } catch (error) {
        console.error('Get orders by buyer error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body; 
        const sellerId = req.user.userId;

        if (req.user.role !== 'seller') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        const validStatuses = ['paid', 'shipped', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }

        const updatedOrder = await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({ 
                where: { id: parseInt(orderId) },
                include: { items: { include: { product: true } } } 
            });

            if (!order) throw new Error('Order not found.');

            const isSellerOfAnyProduct = order.items.some(item => item.product.sellerId === sellerId);
            if (!isSellerOfAnyProduct) throw new Error('Forbidden: You are not the seller for this order.');
            
            if (order.status === 'completed' || order.status === 'cancelled') {
                 throw new Error(`Cannot change status of a ${order.status} order.`);
            }

            if (status === 'completed') {
                const productIdsToUpdate = order.items.map(item => item.product.id);
                await tx.product.updateMany({
                    where: { id: { in: productIdsToUpdate } },
                    data: { status: 'sold' }
                });
            }
            
            return await tx.order.update({
                where: { id: parseInt(orderId) },
                data: { status },
            });
        },
        // --- PERBAIKAN DI SINI ---
        {
          maxWait: 10000, // Waktu tunggu koneksi
          timeout: 15000, // Waktu eksekusi transaksi
        });
        // --- AKHIR PERBAIKAN ---

        res.status(200).json({ message: `Order status updated to ${status}.`, order: updatedOrder });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(400).json({ message: error.message || 'Failed to update order status.' });
    }
};