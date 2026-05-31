import prisma from '../../config/prisma.js';

export const getAll = async () => {
  return prisma.productUnit.findMany({
    include: {
      product: true,
    },
    orderBy: {
      productId: 'asc',
    },
  });
};

export const getByProduct = async (productId) => {
  return prisma.productUnit.findMany({
    where: {
      productId: Number(productId),
    },
    orderBy: {
      multiplier: 'asc',
    },
  });
};

export const create = async (data) => {
  return prisma.productUnit.create({
    data: {
      productId: data.productId,
      unitName: data.unitName,
      multiplier: data.multiplier,
    },
  });
};

export const update = async (id, data) => {
  return prisma.productUnit.update({
    where: {
      id: Number(id),
    },
    data: {
      unitName: data.unitName,
      multiplier: data.multiplier,
    },
  });
};

export const remove = async (id) => {
  return prisma.productUnit.delete({
    where: {
      id: Number(id),
    },
  });
};
