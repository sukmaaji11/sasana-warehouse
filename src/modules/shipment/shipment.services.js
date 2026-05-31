import prisma from '../../config/prisma.js';

export const createShipment = async (data) => {
  return prisma.$transaction(async (tx) => {
    const fromLocation = await tx.location.findUnique({
      where: {
        id: data.fromLocationId,
      },
    });

    if (!fromLocation) {
      throw new Error('Lokasi asal tidak ditemukan');
    }

    const toLocation = await tx.location.findUnique({
      where: {
        id: data.toLocationId,
      },
    });

    if (!toLocation) {
      throw new Error('Lokasi tujuan tidak ditemukan');
    }

    const shipment = await tx.shipment.create({
      data: {
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        status: 'CREATED',
      },
    });

    if (data.items?.length) {
      await tx.shipmentItem.createMany({
        data: data.items.map((item) => ({
          shipmentId: shipment.id,
          itemId: item.itemId,
          qty: item.qty,
        })),
      });
    }

    return tx.shipment.findUnique({
      where: {
        id: shipment.id,
      },
      include: {
        fromLocation: true,
        toLocation: true,
        items: {
          include: {
            item: true,
          },
        },
      },
    });
  });
};

export const getShipments = async () => {
  return prisma.shipment.findMany({
    include: {
      fromLocation: true,
      toLocation: true,
      driver: true,
      items: {
        include: {
          item: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const getShipmentById = async (id) => {
  return prisma.shipment.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      fromLocation: true,
      toLocation: true,
      driver: true,
      items: {
        include: {
          item: true,
        },
      },
      stockMovements: true,
    },
  });
};

export const assignDriver = async (shipmentId, driverId) => {
  const shipment = await prisma.shipment.findUnique({
    where: {
      id: Number(shipmentId),
    },
  });

  if (!shipment) {
    throw new Error('Shipment tidak ditemukan');
  }

  if (shipment.status !== 'CREATED') {
    throw new Error('Shipment tidak bisa diassign');
  }

  return prisma.shipment.update({
    where: {
      id: Number(shipmentId),
    },
    data: {
      driverId,
      status: 'ASSIGNED',
    },
    include: {
      driver: true,
    },
  });
};

export const pickupShipment = async (shipmentId) => {
  return prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUnique({
      where: {
        id: Number(shipmentId),
      },
      include: {
        items: true,
      },
    });

    if (!shipment) {
      throw new Error('Shipment tidak ditemukan');
    }

    if (shipment.status !== 'ASSIGNED') {
      throw new Error('Shipment belum diassign');
    }

    for (const item of shipment.items) {
      const stock = await tx.stock.findFirst({
        where: {
          itemId: item.itemId,
          locationId: shipment.fromLocationId,
        },
      });

      if (!stock) {
        throw new Error(`Stock item ${item.itemId} tidak ditemukan`);
      }

      if (stock.qty < item.qty) {
        throw new Error(`Stock item ${item.itemId} tidak cukup`);
      }

      await tx.stock.update({
        where: {
          id: stock.id,
        },
        data: {
          qty: {
            decrement: item.qty,
          },
        },
      });

      await tx.stockMovement.create({
        data: {
          itemId: item.itemId,
          qty: item.qty,
          type: 'SHIPMENT_OUT',

          fromLocationId: shipment.fromLocationId,

          toLocationId: shipment.toLocationId,

          shipmentId: shipment.id,
        },
      });
    }

    return tx.shipment.update({
      where: {
        id: shipment.id,
      },
      data: {
        status: 'PICKED_UP',
      },
    });
  });
};

export const receiveShipment = async (shipmentId) => {
  return prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUnique({
      where: {
        id: Number(shipmentId),
      },
      include: {
        items: true,
      },
    });

    if (!shipment) {
      throw new Error('Shipment tidak ditemukan');
    }

    if (shipment.status !== 'PICKED_UP') {
      throw new Error('Shipment belum dipickup');
    }

    for (const item of shipment.items) {
      const stock = await tx.stock.findFirst({
        where: {
          itemId: item.itemId,
          locationId: shipment.toLocationId,
        },
      });

      if (stock) {
        await tx.stock.update({
          where: {
            id: stock.id,
          },
          data: {
            qty: {
              increment: item.qty,
            },
          },
        });
      } else {
        await tx.stock.create({
          data: {
            itemId: item.itemId,
            locationId: shipment.toLocationId,
            qty: item.qty,
          },
        });
      }

      await tx.stockMovement.create({
        data: {
          itemId: item.itemId,
          qty: item.qty,
          type: 'SHIPMENT_IN',

          fromLocationId: shipment.fromLocationId,

          toLocationId: shipment.toLocationId,

          shipmentId: shipment.id,
        },
      });
    }

    return tx.shipment.update({
      where: {
        id: shipment.id,
      },
      data: {
        status: 'RECEIVED',
      },
    });
  });
};
