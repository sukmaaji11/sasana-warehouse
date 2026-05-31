import prisma from '../../config/prisma.js';

export const createInbound = async (data) => {
  return prisma.$transaction(async (tx) => {
    const gudang = await tx.location.findFirst({
      where: {
        type: 'GUDANG_PACKAGING',
      },
    });

    if (!gudang) {
      throw new Error('Gudang Packaging tidak ditemukan');
    }

    const inbound = await tx.packagingInbound.create({
      data: {
        itemId: data.itemId,
        qty: data.qty,
        vendorName: data.vendorName,
        notes: data.notes,
      },
    });

    const existingStock = await tx.stock.findFirst({
      where: {
        itemId: data.itemId,
        locationId: gudang.id,
      },
    });

    if (existingStock) {
      await tx.stock.update({
        where: {
          id: existingStock.id,
        },
        data: {
          qty: {
            increment: data.qty,
          },
        },
      });
    } else {
      await tx.stock.create({
        data: {
          itemId: data.itemId,
          locationId: gudang.id,
          qty: data.qty,
        },
      });
    }

    await tx.stockMovement.create({
      data: {
        itemId: data.itemId,
        qty: data.qty,
        type: 'INBOUND',
        toLocationId: gudang.id,
      },
    });

    return inbound;
  });
};

export const getAll = async () => {
  return prisma.packagingInbound.findMany({
    include: {
      item: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const getById = async (id) => {
  return prisma.packagingInbound.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      item: true,
    },
  });
};
