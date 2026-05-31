import prisma from '../../config/prisma.js';

export const createDistribution = async (data, userId) => {
  if (data.qty <= 0) {
    throw new Error('Qty harus lebih besar dari 0');
  }

  if (!data.buyerName?.trim()) {
    throw new Error('Buyer wajib diisi');
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    const location = await tx.location.findUnique({
      where: {
        id: data.locationId,
      },
    });

    if (!location) {
      throw new Error('Lokasi tidak ditemukan');
    }

    const product = await tx.item.findUnique({
      where: {
        id: data.productId,
      },
    });

    if (!product) {
      throw new Error('Produk tidak ditemukan');
    }
    if (product.type !== 'FINISHED_GOOD') {
      throw new Error('Hanya FINISHED_GOOD yang dapat didistribusikan');
    }
    if (!['FINISHED_GOOD'].includes(product.type)) {
      throw new Error('Hanya FINISHED_GOOD yang dapat didistribusikan');
    }

    const stock = await tx.stock.findFirst({
      where: {
        itemId: data.productId,
        locationId: data.locationId,
      },
    });

    if (!stock) {
      throw new Error('Stock produk tidak ditemukan');
    }

    if (stock.qty < data.qty) {
      throw new Error('Stock produk tidak cukup');
    }

    await tx.stock.update({
      where: {
        id: stock.id,
      },
      data: {
        qty: {
          decrement: data.qty,
        },
      },
    });

    const distribution = await tx.distribution.create({
      data: {
        locationId: data.locationId,
        productId: data.productId,
        qty: data.qty,
        buyerName: data.buyerName,
        notes: data.notes,
        createdById: userId,
      },
    });

    await tx.stockMovement.create({
      data: {
        itemId: data.productId,
        qty: data.qty,
        type: 'DISTRIBUTION',

        fromLocationId: data.locationId,
      },
    });

    return distribution;
  });
};

export const getDistributions = async () => {
  return prisma.distribution.findMany({
    include: {
      location: true,
      product: true,
      createdBy: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const getDistributionById = async (id) => {
  return prisma.distribution.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      location: true,
      product: true,
      createdBy: true,
    },
  });
};
