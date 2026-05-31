import prisma from '../../config/prisma.js';

const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);

const getLowPackagingStocks = async () => {
  return prisma.stock.findMany({
    where: {
      item: {
        type: 'PACKAGING',
      },
    },

    include: {
      item: true,
      location: true,
    },

    orderBy: {
      qty: 'asc',
    },

    take: 50,
  });
};

const getDistributionByFactory = async (startOfDay) => {
  const distributions = await prisma.distribution.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
      },
    },

    include: {
      location: true,
    },
  });

  const result = {};

  distributions.forEach((d) => {
    const name = d.location.name;

    result[name] = (result[name] || 0) + d.qty;
  });

  return result;
};

const getProductionByFactory = async (startOfDay) => {
  const productions = await prisma.production.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
      },
    },

    include: {
      location: true,
    },
  });

  const result = {};

  productions.forEach((p) => {
    const name = p.location.name;

    result[name] = (result[name] || 0) + p.qtyGood;
  });

  return result;
};

const getSuperOwnerDashboard = async () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [inbound, production, distribution] = await Promise.all([
    prisma.packagingInbound.aggregate({
      _sum: {
        qty: true,
      },
      where: {
        createdAt: {
          gte: startOfDay,
        },
      },
    }),

    prisma.production.aggregate({
      _sum: {
        qtyGood: true,
      },
      where: {
        createdAt: {
          gte: startOfDay,
        },
      },
    }),

    prisma.distribution.aggregate({
      _sum: {
        qty: true,
      },
      where: {
        createdAt: {
          gte: startOfDay,
        },
      },
    }),
  ]);

  const lowPackagingStocks = await getLowPackagingStocks();
  const productionByFactory = await getProductionByFactory(startOfDay);
  const distributionByFactory = await getDistributionByFactory(startOfDay);
  return {
    role: 'SUPER_OWNER',

    summary: {
      todayInbound: inbound._sum.qty || 0,

      todayProduction: production._sum.qtyGood || 0,

      todayDistribution: distribution._sum.qty || 0,
    },
    lowPackagingStocks,

    productionByFactory,

    distributionByFactory,
  };
};

const getAdminGudangDashboard = async () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const inbound = await prisma.packagingInbound.aggregate({
    _sum: {
      qty: true,
    },
    where: {
      createdAt: {
        gte: startOfDay,
      },
    },
  });

  const created = await prisma.shipment.count({
    where: {
      status: 'CREATED',
    },
  });

  const assigned = await prisma.shipment.count({
    where: {
      status: 'ASSIGNED',
    },
  });

  const pickedUp = await prisma.shipment.count({
    where: {
      status: 'PICKED_UP',
    },
  });

  return {
    role: 'ADMIN_GUDANG',

    summary: {
      todayInbound: inbound._sum.qty || 0,
    },

    shipments: {
      created,
      assigned,
      pickedUp,
    },
  };
};

const getOwnerPabrikDashboard = async (locationId) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const production = await prisma.production.aggregate({
    _sum: {
      qtyGood: true,
      qtyReject: true,
    },
    where: {
      locationId,
      createdAt: {
        gte: startOfDay,
      },
    },
  });

  const distribution = await prisma.distribution.aggregate({
    _sum: {
      qty: true,
    },
    where: {
      locationId,
      createdAt: {
        gte: startOfDay,
      },
    },
  });
  const finishedGoodStocks = await prisma.stock.findMany({
    where: {
      locationId,

      item: {
        type: 'FINISHED_GOOD',
      },
    },

    include: {
      item: true,
    },

    orderBy: {
      qty: 'asc',
    },
  });

  const packagingStocks = await prisma.stock.findMany({
    where: {
      locationId,

      item: {
        type: 'PACKAGING',
      },
    },

    include: {
      item: true,
    },

    orderBy: {
      qty: 'asc',
    },
  });
  return {
    role: 'OWNER_PABRIK',

    summary: {
      todayProduction: production._sum.qtyGood || 0,

      todayReject: production._sum.qtyReject || 0,

      todayDistribution: distribution._sum.qty || 0,
    },

    finishedGoodStocks,
    packagingStocks,
  };
};

const getDriverDashboard = async (userId) => {
  const shipments = await prisma.shipment.findMany({
    where: {
      driverId: userId,
      status: {
        in: ['ASSIGNED', 'PICKED_UP'],
      },
    },
    include: {
      fromLocation: true,
      toLocation: true,
    },
  });

  return {
    role: 'DRIVER',
    shipments,
  };
};

export const getDashboard = async (user) => {
  switch (user.role) {
    case 'SUPER_OWNER':
      return getSuperOwnerDashboard();

    case 'ADMIN_GUDANG':
      return getAdminGudangDashboard();

    case 'OWNER_PABRIK':
      return getOwnerPabrikDashboard(user.locationId);

    case 'DRIVER':
      return getDriverDashboard(user.id);

    default:
      throw new Error('Role tidak dikenali');
  }
};
