import prisma from '../../config/prisma.js';

export const getLocations = async () => {
  return prisma.location.findMany({
    orderBy: {
      name: 'asc',
    },
  });
};

export const getLocationById = async (id) => {
  return prisma.location.findUnique({
    where: {
      id: Number(id),
    },
  });
};
