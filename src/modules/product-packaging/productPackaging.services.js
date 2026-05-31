import prisma from '../../config/prisma.js';

export const getAll = async () => {
  return prisma.productPackaging.findMany({
    include: {
      product: true,
      packaging: true,
    },
  });
};

export const getByProduct = async (productId) => {
  return prisma.productPackaging.findMany({
    where: {
      productId: Number(productId),
    },
    include: {
      packaging: true,
    },
  });
};

export const create = async (data) => {
  return prisma.productPackaging.create({
    data: {
      productId: data.productId,
      packagingId: data.packagingId,
      ratio: data.ratio || 1,
    },
  });
};

export const update = async (id, data) => {
  return prisma.productPackaging.update({
    where: {
      id: Number(id),
    },
    data: {
      packagingId: data.packagingId,
      ratio: data.ratio,
    },
  });
};

export const remove = async (id) => {
  return prisma.productPackaging.delete({
    where: {
      id: Number(id),
    },
  });
};
