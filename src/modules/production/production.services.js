import prisma from '../../config/prisma.js';

export const createProduction = async (data, userId) => {
  if (data.qtyGood < 0) {
    throw new Error('Qty good tidak valid');
  }

  if (data.qtyReject < 0) {
    throw new Error('Qty reject tidak valid');
  }

  if (data.qtyGood === 0 && data.qtyReject === 0) {
    throw new Error('Qty produksi tidak boleh kosong');
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.item.findUnique({
      where: {
        id: data.productId,
      },
    });

    if (!product) {
      throw new Error('Produk tidak ditemukan');
    }

    if (product.type !== 'FINISHED_GOOD') {
      throw new Error('Hanya FINISHED_GOOD yang dapat diproduksi');
    }

    const location = await tx.location.findUnique({
      where: {
        id: data.locationId,
      },
    });

    if (!location) {
      throw new Error('Lokasi tidak ditemukan');
    }

    const user = await tx.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    const mapping = await tx.productPackaging.findFirst({
      where: {
        productId: data.productId,
      },
    });

    if (!mapping) {
      throw new Error('Mapping packaging tidak ditemukan');
    }

    const packagingConsume = data.qtyGood + data.qtyReject;

    const packagingStock = await tx.stock.findFirst({
      where: {
        itemId: mapping.packagingId,
        locationId: data.locationId,
      },
    });

    if (!packagingStock) {
      throw new Error('Stock packaging tidak ditemukan');
    }

    if (packagingStock.qty < packagingConsume) {
      throw new Error('Stock packaging tidak cukup');
    }

    await tx.stock.update({
      where: {
        id: packagingStock.id,
      },
      data: {
        qty: {
          decrement: packagingConsume,
        },
      },
    });

    const finishedStock = await tx.stock.findFirst({
      where: {
        itemId: data.productId,
        locationId: data.locationId,
      },
    });

    if (finishedStock) {
      await tx.stock.update({
        where: {
          id: finishedStock.id,
        },
        data: {
          qty: {
            increment: data.qtyGood,
          },
        },
      });
    } else {
      await tx.stock.create({
        data: {
          itemId: data.productId,
          locationId: data.locationId,
          qty: data.qtyGood,
        },
      });
    }

    const production = await tx.production.create({
      data: {
        locationId: data.locationId,

        productId: data.productId,

        qtyGood: data.qtyGood,

        qtyReject: data.qtyReject,

        notes: data.notes,

        createdById: userId,
      },
    });

    await tx.stockMovement.create({
      data: {
        itemId: mapping.packagingId,

        qty: packagingConsume,

        type: 'PRODUCTION_CONSUME',

        fromLocationId: data.locationId,
      },
    });

    await tx.stockMovement.create({
      data: {
        itemId: data.productId,

        qty: data.qtyGood,

        type: 'PRODUCTION_RESULT',

        toLocationId: data.locationId,
      },
    });

    return production;
  });
};

export const getProductions = async () => {
  return prisma.production.findMany({
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

export const getProductionById = async (id) => {
  return prisma.production.findUnique({
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
