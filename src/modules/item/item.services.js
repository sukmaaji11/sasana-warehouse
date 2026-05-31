import prisma from '../../config/prisma.js';

export const getItems = async (type) => {
  const where = {};

  if (type) {
    where.type = type;
  }

  return prisma.item.findMany({
    where,
    orderBy: {
      name: 'asc',
    },
  });
};

export const getItemById = async (id) => {
  return prisma.item.findUnique({
    where: {
      id: Number(id),
    },
  });
};

export const createItem = async (data) => {
  return prisma.item.create({
    data: {
      sku: data.sku,
      name: data.name,
      type: data.type,
      baseUnit: data.baseUnit,
    },
  });
};

export const updateItem = async (id, data) => {
  return prisma.item.update({
    where: {
      id: Number(id),
    },
    data: {
      sku: data.sku,
      name: data.name,
      type: data.type,
      baseUnit: data.baseUnit,
    },
  });
};

export const deleteItem = async (id) => {
  return prisma.item.delete({
    where: {
      id: Number(id),
    },
  });
};
