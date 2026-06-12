import prisma from '../../config/prisma.js';

export const getUsers = async (role) => {
  return prisma.user.findMany({
    where: role
      ? {
          role,
        }
      : {},

    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      locationId: true,
    },

    orderBy: {
      name: 'asc',
    },
  });
};

export const getUserById = async (id) => {
  return prisma.user.findUnique({
    where: {
      id: Number(id),
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      locationId: true,
    },
  });
};
