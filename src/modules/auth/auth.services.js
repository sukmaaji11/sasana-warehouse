import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const register = async (data) => {
  const { name, email, password, role, locationId } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('Email sudah digunakan');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      locationId,
    },
  });

  return user;
};

export const login = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('User tidak ditemukan');
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    throw new Error('Password salah');
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      locationId: user.locationId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    },
  );

  const { password: _, ...safeUser } = user;

  return {
    token,
    user: safeUser,
  };
};

export const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      location: true,
    },
  });

  const { password, ...safeUser } = user;

  return safeUser;
};
