import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const password = await bcrypt.hash('123456', 10);

await prisma.stock.deleteMany();
await prisma.productUnit.deleteMany();
await prisma.productPackaging.deleteMany();

await prisma.distribution.deleteMany();
await prisma.production.deleteMany();

await prisma.shipmentItem.deleteMany();
await prisma.shipment.deleteMany();

await prisma.packagingInbound.deleteMany();

await prisma.user.deleteMany();
await prisma.location.deleteMany();
await prisma.item.deleteMany();
async function createUnits(productId, baseUnit, renteng, dus) {
  const units = [
    {
      productId,
      unitName: baseUnit,
      multiplier: 1,
    },
  ];

  if (renteng) {
    units.push({
      productId,
      unitName: 'RENTENG',
      multiplier: renteng,
    });

    units.push({
      productId,
      unitName: 'DUS',
      multiplier: renteng * dus,
    });
  } else {
    units.push({
      productId,
      unitName: 'DUS',
      multiplier: dus,
    });
  }

  await prisma.productUnit.createMany({
    data: units,
  });
}

async function main() {
  console.log('Start seeding...');

  // const getId = (sku) => items.find((i) => i.sku === sku).id;

  // LOCATIONS
  const gudang = await prisma.location.create({
    data: {
      name: 'Gudang Packaging',
      type: 'GUDANG_PACKAGING',
    },
  });

  const cilacap = await prisma.location.create({
    data: {
      name: 'Pabrik Cilacap',
      type: 'PABRIK',
    },
  });

  const kemranjen = await prisma.location.create({
    data: {
      name: 'Pabrik Kemranjen',
      type: 'PABRIK',
    },
  });

  // USER
  await prisma.user.createMany({
    data: [
      {
        name: 'Super Owner',
        email: 'owner@mail.com',
        password,
        role: 'SUPER_OWNER',
      },
      {
        name: 'Admin Gudang',
        email: 'gudang@mail.com',
        password,
        role: 'ADMIN_GUDANG',
        locationId: gudang.id,
      },
      {
        name: 'Owner Cilacap',
        email: 'cilacap@mail.com',
        password,
        role: 'OWNER_PABRIK',
        locationId: cilacap.id,
      },
      {
        name: 'Owner Kemranjen',
        email: 'kemranjen@mail.com',
        password,
        role: 'OWNER_PABRIK',
        locationId: kemranjen.id,
      },
      {
        name: 'Driver 1',
        email: 'driver@mail.com',
        password,
        role: 'DRIVER',
      },
    ],
  });

  // PACKAGING
  const packagingData = [
    ['PKG-001', 'Sachet Dragon SN', 'SACHET'],
    ['PKG-002', 'Sachet Herbal 35', 'SACHET'],
    ['PKG-003', 'Sachet Herbal 100', 'SACHET'],
    ['PKG-004', 'Sachet Bima', 'SACHET'],
    ['PKG-005', 'Sachet Monster', 'SACHET'],
    ['PKG-006', 'Sachet Super Rontox', 'SACHET'],
    ['PKG-007', 'Sachet Magic Blue', 'SACHET'],
    ['PKG-008', 'Sachet Magic Green', 'SACHET'],
    ['PKG-009', 'Sachet Dragon Merpati', 'SACHET'],
    ['PKG-010', 'Botol Dopping', 'BOTOL'],
    ['PKG-011', 'Karton Monster Grow', 'KARTON'],
    ['PKG-012', 'Sachet Magic Blue Bird', 'SACHET'],
    ['PKG-013', 'Sachet Magic Green Bird', 'SACHET'],
    ['PKG-014', 'Sachet Turun Urat', 'SACHET'],
    ['PKG-015', 'Botol Salep SN', 'BOTOL'],
  ];
  const packagingMap = {};

  for (const item of packagingData) {
    const created = await prisma.item.create({
      data: {
        sku: item[0],
        name: item[1],
        type: 'PACKAGING',
        baseUnit: item[2],
      },
    });

    packagingMap[item[1]] = created;
  }

  // FINISHED GOOD
  const products = [
    {
      sku: 'FG-001',
      name: 'Dragon SN',
      packaging: 'Sachet Dragon SN',
      unit: 'SACHET',
      renteng: 10,
      dus: 16,
    },

    {
      sku: 'FG-002',
      name: 'Herbal SN 35 Gram',
      packaging: 'Sachet Herbal 35',
      unit: 'SACHET',
      renteng: 10,
      dus: 20,
    },

    {
      sku: 'FG-003',
      name: 'Herbal SN 100 Gram',
      packaging: 'Sachet Herbal 100',
      unit: 'SACHET',
      renteng: null,
      dus: 50,
    },

    {
      sku: 'FG-004',
      name: 'Bima Power',
      packaging: 'Sachet Bima',
      unit: 'SACHET',
      renteng: 10,
      dus: 50,
    },

    {
      sku: 'FG-005',
      name: 'Monster Pro',
      packaging: 'Sachet Monster',
      unit: 'SACHET',
      renteng: 10,
      dus: 36,
    },

    {
      sku: 'FG-006',
      name: 'Super Rontox',
      packaging: 'SACHET',
      packaging: 'Sachet Super Rontox',
      unit: 'SACHET',
      renteng: 20,
      dus: 20,
    },

    {
      sku: 'FG-007',
      name: 'Magic Blue',
      packaging: 'Sachet Magic Blue',
      unit: 'SACHET',
      renteng: 10,
      dus: 20,
    },

    {
      sku: 'FG-008',
      name: 'Magic Green',
      packaging: 'Sachet Magic Green',
      unit: 'SACHET',
      renteng: 10,
      dus: 20,
    },

    {
      sku: 'FG-009',
      name: 'Dragon Merpati',
      packaging: 'Sachet Dragon Merpati',
      unit: 'SACHET',
      renteng: 10,
      dus: 36,
    },

    {
      sku: 'FG-010',
      name: 'Dopping Dewa',
      packaging: 'Botol Dopping',
      unit: 'BOTOL',
      renteng: null,
      dus: 10,
    },

    {
      sku: 'FG-011',
      name: 'Monster Grow',
      packaging: 'Karton Monster Grow',
      unit: 'KARTON',
      renteng: null,
      dus: 10,
    },

    {
      sku: 'FG-012',
      name: 'Magic Blue Bird',
      packaging: 'Sachet Magic Blue Bird',
      unit: 'SACHET',
      renteng: 10,
      dus: 20,
    },

    {
      sku: 'FG-013',
      name: 'Magic Green Bird',
      packaging: 'Sachet Magic Green Bird',
      unit: 'SACHET',
      renteng: 10,
      dus: 20,
    },

    {
      sku: 'FG-014',
      name: 'Turun Urat',
      packaging: 'Sachet Turun Urat',
      unit: 'SACHET',
      renteng: 10,
      dus: 20,
    },

    {
      sku: 'FG-015',
      name: 'Salep SN',
      packaging: 'Botol Salep SN',
      unit: 'BOTOL',
      renteng: null,
      dus: 10,
    },
  ];
  for (const p of products) {
    const product = await prisma.item.create({
      data: {
        sku: p.sku,
        name: p.name,
        type: 'FINISHED_GOOD',
        baseUnit: p.unit,
      },
    });

    await prisma.productPackaging.create({
      data: {
        productId: product.id,
        packagingId: packagingMap[p.packaging].id,
        ratio: 1,
      },
    });

    await createUnits(product.id, p.unit, p.renteng, p.dus);
  }

  // Initial Stock
  const packagingItems = await prisma.item.findMany({
    where: {
      type: 'PACKAGING',
    },
  });

  await prisma.stock.createMany({
    data: packagingItems.map((item) => ({
      itemId: item.id,
      locationId: gudang.id,
      qty: 10000,
    })),
  });

  console.log('✅ Seed selesai');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
