import prisma from '../../config/prisma.js';

export const getStocks = async () => {
  return prisma.stock.findMany({
    include: {
      item: true,
      location: true,
    },
    orderBy: [
      {
        locationId: 'asc',
      },
      {
        itemId: 'asc',
      },
    ],
  });
};

export const getStockByItem = async (itemId) => {
  return prisma.stock.findMany({
    where: {
      itemId: Number(itemId),
    },
    include: {
      location: true,
      item: true,
    },
  });
};

export const getStockByLocation = async (locationId) => {
  return prisma.stock.findMany({
    where: {
      locationId: Number(locationId),
    },
    include: {
      item: true,
      location: true,
    },
  });
};

export const getMovements = async () => {
  return prisma.stockMovement.findMany({
    include: {
      item: true,
      fromLocation: true,
      toLocation: true,
      shipment: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const getMovementById = async (id) => {
  return prisma.stockMovement.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      item: true,
      fromLocation: true,
      toLocation: true,
      shipment: {
        include: {
          driver: true,
          fromLocation: true,
          toLocation: true,
        },
      },
    },
  });
};
