import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';

const SECRET = 'SECRET_KEY_SASANA';
const app = express();
app.use(cors());
const prisma = new PrismaClient();

//////////////////////////
// Middleware
//////////////////////////
const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  const token = auth.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalid' });
  }
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
app.use(express.json());

//////////////////////////
// ROOT
//////////////////////////

app.get('/', (req, res) => {
  res.send('🚀 Sasana Warehouse API Running');
});

//////////////////////////
// INBOUND (Supplier → Gudang)
//////////////////////////

app.post('/inbound', async (req, res) => {
  const { itemId, locationId, qty } = req.body;

  try {
    await prisma.$transaction(async (tx) => {
      // update stock
      await tx.stock.upsert({
        where: { itemId_locationId: { itemId, locationId } },
        update: { qty: { increment: qty } },
        create: { itemId, locationId, qty },
      });

      // log movement
      await tx.stockMovement.create({
        data: {
          itemId,
          toLocationId: locationId,
          qty,
          type: 'INBOUND',
          status: 'ACCEPTED',
          refNo: 'IN-' + Date.now(),
        },
      });
    });

    res.json({ message: 'Inbound success' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

//////////////////////////
// CREATE TRANSFER (PENDING)
//////////////////////////

app.post('/transfer', async (req, res) => {
  const { fromLocationId, toLocationId, items } = req.body;
  // items: [{ itemId, qty }]
  const stock = await prisma.stock.findUnique({
    where: {
      itemId_locationId: {
        itemId: itemId,
        locationId: fromLocationId,
      },
    },
  });
  try {
    // 🔍 VALIDASI STOK
    for (const item of items) {
      const stock = await prisma.stock.findUnique({
        where: {
          itemId_locationId: {
            itemId: item.itemId,
            locationId: fromLocationId,
          },
        },
      });

      if (!stock || stock.qty < item.qty) {
        return res.status(400).json({
          error: `Stok tidak cukup untuk item ${item.itemId}`,
        });
      }

      if (fromLocationId === toLocationId) {
        return res.status(400).json({
          error: 'Lokasi asal dan tujuan tidak boleh sama',
        });
      }
    }

    // ✅ kalau lolos semua, baru create
    const order = await prisma.transferOrder.create({
      data: {
        fromLocationId,
        toLocationId,
        status: 'PENDING',
        details: {
          create: items,
        },
      },
      include: { details: true },
    });

    res.json(order);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

//////////////////////////
// ACCEPT TRANSFER
//////////////////////////

app.post('/transfer/:id/accept', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.transferOrder.findUnique({
        where: { id },
        include: { details: true },
      });

      if (!order) throw new Error('Transfer tidak ditemukan');
      if (order.status !== 'PENDING') throw new Error('Sudah diproses');

      for (const d of order.details) {
        const stock = await tx.stock.findUnique({
          where: {
            itemId_locationId: {
              itemId: d.itemId,
              locationId: order.fromLocationId,
            },
          },
        });

        if (!stock || stock.qty < d.qty) {
          throw new Error(`Stok tidak cukup untuk item ${d.itemId}`);
        }

        // kurangi asal
        await tx.stock.update({
          where: {
            itemId_locationId: {
              itemId: d.itemId,
              locationId: order.fromLocationId,
            },
          },
          data: { qty: { decrement: d.qty } },
        });

        // tambah tujuan
        await tx.stock.upsert({
          where: {
            itemId_locationId: {
              itemId: d.itemId,
              locationId: order.toLocationId,
            },
          },
          update: { qty: { increment: d.qty } },
          create: {
            itemId: d.itemId,
            locationId: order.toLocationId,
            qty: d.qty,
          },
        });

        // log movement
        await tx.stockMovement.create({
          data: {
            itemId: d.itemId,
            fromLocationId: order.fromLocationId,
            toLocationId: order.toLocationId,
            qty: d.qty,
            type: 'TRANSFER',
            status: 'ACCEPTED',
            refNo: 'TR-' + order.id,
          },
        });
      }

      await tx.transferOrder.update({
        where: { id },
        data: { status: 'ACCEPTED' },
      });
    });

    res.json({ message: 'Transfer accepted' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

//////////////////////////
// PRODUCTION
//////////////////////////

app.post('/produce', async (req, res) => {
  const { finishedItemId, qty, locationId } = req.body;

  try {
    await prisma.$transaction(async (tx) => {
      const recipe = await tx.productRecipe.findFirst({
        where: { finishedItemId },
        include: { details: true },
      });

      if (!recipe) throw new Error('Recipe tidak ditemukan');

      // kurangi bahan
      for (const d of recipe.details) {
        const stock = await tx.stock.findUnique({
          where: {
            itemId_locationId: {
              itemId: d.rawItemId,
              locationId,
            },
          },
        });

        if (!stock || stock.qty < d.qty * qty) {
          throw new Error(`Bahan tidak cukup untuk item ${d.rawItemId}`);
        }

        await tx.stock.update({
          where: {
            itemId_locationId: {
              itemId: d.rawItemId,
              locationId,
            },
          },
          data: {
            qty: { decrement: d.qty * qty },
          },
        });

        // log bahan keluar
        await tx.stockMovement.create({
          data: {
            itemId: d.rawItemId,
            fromLocationId: locationId,
            qty: d.qty * qty,
            type: 'PROD_OUT',
            status: 'ACCEPTED',
          },
        });
      }

      // tambah produk jadi
      await tx.stock.upsert({
        where: {
          itemId_locationId: {
            itemId: finishedItemId,
            locationId,
          },
        },
        update: { qty: { increment: qty } },
        create: { itemId: finishedItemId, locationId, qty },
      });

      // log produk jadi
      await tx.stockMovement.create({
        data: {
          itemId: finishedItemId,
          toLocationId: locationId,
          qty,
          type: 'PROD_IN',
          status: 'ACCEPTED',
        },
      });
    });

    res.json({ message: 'Produksi berhasil' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

//////////////////////////
// REPORT
//////////////////////////

app.get('/report/stocks', async (req, res) => {
  const data = await prisma.stock.findMany({
    include: {
      item: true,
      location: true,
    },
    orderBy: {
      locationId: 'asc',
    },
  });

  res.json(data);
});

app.get('/report/movements', async (req, res) => {
  const data = await prisma.stockMovement.findMany({
    include: {
      item: true,
      fromLocation: true,
      toLocation: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(data);
});

app.get('/report/production', async (req, res) => {
  const data = await prisma.stockMovement.groupBy({
    by: ['itemId'],
    where: { type: 'PROD_IN' },
    _sum: { qty: true },
  });

  res.json(data);
});

//////////////////////////
// Driver Order
//////////////////////////
app.post('/delivery/assign', async (req, res) => {
  const { transferOrderId, driverId } = req.body;

  try {
    const order = await prisma.transferOrder.findUnique({
      where: { id: transferOrderId },
    });

    if (!order) throw new Error('Transfer tidak ditemukan');
    if (order.status !== 'PENDING') throw new Error('Transfer tidak valid');

    const delivery = await prisma.deliveryOrder.create({
      data: {
        transferOrderId,
        driverId,
        status: 'ASSIGNED',
      },
    });

    res.json(delivery);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post(
  '/delivery/:id/pickup',
  authMiddleware,
  allowRoles('DRIVER'),
  async (req, res) => {
    const id = parseInt(req.params.id);

    try {
      const delivery = await prisma.deliveryOrder.findUnique({
        where: { id },
      });

      if (!delivery) throw new Error('Delivery tidak ditemukan');
      if (delivery.status !== 'ASSIGNED') throw new Error('Tidak bisa pickup');

      await prisma.deliveryOrder.update({
        where: { id },
        data: { status: 'PICKED_UP' },
      });

      res.json({ message: 'Barang sudah diambil driver' });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },
);

app.post(
  '/delivery/:id/deliver',
  authMiddleware,
  allowRoles('DRIVER'),
  async (req, res) => {
    const id = parseInt(req.params.id);

    try {
      await prisma.$transaction(async (tx) => {
        const delivery = await tx.deliveryOrder.findUnique({
          where: { id },
          include: {
            transferOrder: {
              include: { details: true },
            },
          },
        });

        if (!delivery) throw new Error('Delivery tidak ditemukan');
        if (delivery.status !== 'PICKED_UP') throw new Error('Belum pickup');

        const order = delivery.transferOrder;

        for (const d of order.details) {
          const stock = await tx.stock.findUnique({
            where: {
              itemId_locationId: {
                itemId: d.itemId,
                locationId: order.fromLocationId,
              },
            },
          });

          if (!stock || stock.qty < d.qty) {
            throw new Error('Stok tidak cukup saat delivery');
          }

          // 🔻 kurangi gudang
          await tx.stock.update({
            where: {
              itemId_locationId: {
                itemId: d.itemId,
                locationId: order.fromLocationId,
              },
            },
            data: { qty: { decrement: d.qty } },
          });

          // 🔺 tambah tujuan
          await tx.stock.upsert({
            where: {
              itemId_locationId: {
                itemId: d.itemId,
                locationId: order.toLocationId,
              },
            },
            update: { qty: { increment: d.qty } },
            create: {
              itemId: d.itemId,
              locationId: order.toLocationId,
              qty: d.qty,
            },
          });

          // 📜 log movement
          await tx.stockMovement.create({
            data: {
              itemId: d.itemId,
              fromLocationId: order.fromLocationId,
              toLocationId: order.toLocationId,
              qty: d.qty,
              type: 'TRANSFER',
              status: 'ACCEPTED',
              refNo: 'DLV-' + delivery.id,
            },
          });
        }

        // update status delivery
        await tx.deliveryOrder.update({
          where: { id },
          data: { status: 'DELIVERED' },
        });

        // update transfer
        await tx.transferOrder.update({
          where: { id: order.id },
          data: { status: 'ACCEPTED' },
        });
      });

      res.json({ message: 'Delivery selesai & stok terupdate' });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },
);

app.get('/delivery', async (req, res) => {
  try {
    const deliveries = await prisma.deliveryOrder.findMany({
      include: {
        transferOrder: {
          include: {
            details: true,
            fromLocation: true,
            toLocation: true,
          },
        },
        driver: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(deliveries);
  } catch (e) {
    console.error('DELIVERY ERROR:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/delivery/:id/complete', async (req, res) => {
  const id = Number(req.params.id);

  try {
    await prisma.$transaction(async (tx) => {
      const delivery = await tx.deliveryOrder.findUnique({
        where: { id },
        include: {
          transferOrder: {
            include: { details: true },
          },
        },
      });

      if (!delivery) throw new Error('Delivery tidak ditemukan');
      if (delivery.status !== 'PICKED_UP')
        throw new Error('Belum sampai gudang');

      const order = delivery.transferOrder;

      for (const d of order.details) {
        // TAMBAH STOCK KE GUDANG TUJUAN
        await tx.stock.upsert({
          where: {
            itemId_locationId: {
              itemId: d.itemId,
              locationId: order.toLocationId,
            },
          },
          update: {
            qty: { increment: d.qty },
          },
          create: {
            itemId: d.itemId,
            locationId: order.toLocationId,
            qty: d.qty,
          },
        });

        // LOG
        await tx.stockMovement.create({
          data: {
            itemId: d.itemId,
            fromLocationId: order.fromLocationId,
            toLocationId: order.toLocationId,
            qty: d.qty,
            type: 'TRANSFER',
            status: 'COMPLETED',
            refNo: `RCV-${delivery.id}`,
          },
        });
      }

      // UPDATE STATUS
      await tx.deliveryOrder.update({
        where: { id },
        data: { status: 'DELIVERED' },
      });

      await tx.transferOrder.update({
        where: { id: order.id },
        data: { status: 'ACCEPTED' },
      });
    });

    res.json({ message: 'Barang diterima & stok masuk' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/warehouse/incoming', async (req, res) => {
  const { locationId } = req.query;

  const data = await prisma.deliveryOrder.findMany({
    where: {
      status: 'PICKED_UP',
      transferOrder: {
        toLocationId: Number(locationId),
      },
    },
    include: {
      transferOrder: {
        include: {
          details: true,
          fromLocation: true,
          toLocation: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(data);
});
//////////////////////////
// USER
//////////////////////////
app.post('/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hash,
      role,
    },
  });

  res.json(user);
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return res.status(400).json({ error: 'User tidak ditemukan' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Password salah' });

  const token = jwt.sign({ userId: user.id, role: user.role }, SECRET, {
    expiresIn: '1d',
  });

  res.json({ token, user });
});

app.get('/users', async (req, res) => {
  const { role } = req.query;

  const users = await prisma.user.findMany({
    where: role ? { role } : {},
  });

  res.json(users);
});
//////////////////////////
// GET DATA SERVER
//////////////////////////
app.get('/items', async (req, res) => {
  const data = await prisma.item.findMany();
  res.json(data);
});

app.get('/locations', async (req, res) => {
  const data = await prisma.location.findMany();
  res.json(data);
});

//////////////////////////
// NEW SHIPMENT
//////////////////////////
app.post('/shipment', async (req, res) => {
  try {
    const { fromLocationId, toLocationId, driverId, items } = req.body;

    // =========================
    // VALIDATION
    // =========================
    if (!fromLocationId || !toLocationId || !items?.length) {
      return res.status(400).json({
        error: 'Data shipment tidak lengkap',
      });
    }

    // =========================
    // CHECK STOCK
    // =========================
    for (const i of items) {
      const stock = await prisma.stock.findUnique({
        where: {
          itemId_locationId: {
            itemId: i.itemId,
            locationId: fromLocationId,
          },
        },
      });

      if (!stock || stock.qty < i.qty) {
        return res.status(400).json({
          error: `Stock item ${i.itemId} tidak cukup`,
        });
      }
    }

    // =========================
    // CREATE SHIPMENT
    // =========================
    const shipment = await prisma.shipment.create({
      data: {
        fromLocationId,
        toLocationId,
        driverId,
        status: 'ASSIGNED',

        items: {
          create: items.map((i) => ({
            itemId: i.itemId,
            qty: i.qty,
          })),
        },
      },

      include: {
        items: true,
      },
    });

    // =========================
    // CREATE MOVEMENT LOG
    // =========================
    for (const i of items) {
      await prisma.stockMovement.create({
        data: {
          shipmentId: shipment.id,
          itemId: i.itemId,

          fromLocationId,
          toLocationId,

          qty: i.qty,

          type: 'TRANSFER',
          status: 'PENDING',

          refNo: `SHP-${shipment.id}`,
        },
      });
    }

    res.json({
      message: 'Shipment berhasil dibuat',
      shipment,
    });
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: e.message,
    });
  }
});

app.post('/shipment/:id/pickup', async (req, res) => {
  try {
    const id = Number(req.params.id);

    // =========================
    // GET SHIPMENT
    // =========================
    const shipment = await prisma.shipment.findUnique({
      where: { id },

      include: {
        items: true,
      },
    });

    if (!shipment) {
      return res.status(404).json({
        error: 'Shipment tidak ditemukan',
      });
    }

    // =========================
    // VALIDATE STATUS
    // =========================
    if (shipment.status !== 'ASSIGNED') {
      return res.status(400).json({
        error: 'Shipment belum siap pickup',
      });
    }

    // =========================
    // CHECK STOCK AGAIN
    // =========================
    for (const i of shipment.items) {
      const stock = await prisma.stock.findUnique({
        where: {
          itemId_locationId: {
            itemId: i.itemId,
            locationId: shipment.fromLocationId,
          },
        },
      });

      if (!stock || stock.qty < i.qty) {
        return res.status(400).json({
          error: `Stock item ${i.itemId} tidak cukup`,
        });
      }
    }

    // =========================
    // REDUCE STOCK
    // =========================
    for (const i of shipment.items) {
      await prisma.stock.update({
        where: {
          itemId_locationId: {
            itemId: i.itemId,
            locationId: shipment.fromLocationId,
          },
        },

        data: {
          qty: {
            decrement: i.qty,
          },
        },
      });
    }

    // =========================
    // UPDATE SHIPMENT STATUS
    // =========================
    await prisma.shipment.update({
      where: { id },

      data: {
        status: 'IN_TRANSIT',
      },
    });

    // =========================
    // UPDATE MOVEMENT
    // =========================
    await prisma.stockMovement.updateMany({
      where: {
        shipmentId: id,
      },

      data: {
        status: 'ACCEPTED',
      },
    });

    res.json({
      message: 'Shipment berhasil pickup',
    });
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: e.message,
    });
  }
});

app.post('/shipment/:id/receive', async (req, res) => {
  try {
    const id = Number(req.params.id);

    // =========================
    // GET SHIPMENT
    // =========================
    const shipment = await prisma.shipment.findUnique({
      where: { id },

      include: {
        items: true,
      },
    });

    if (!shipment) {
      return res.status(404).json({
        error: 'Shipment tidak ditemukan',
      });
    }

    // =========================
    // VALIDATE STATUS
    // =========================
    if (shipment.status !== 'IN_TRANSIT') {
      return res.status(400).json({
        error: 'Shipment belum dalam perjalanan',
      });
    }

    // =========================
    // ADD STOCK TO DESTINATION
    // =========================
    for (const i of shipment.items) {
      const existingStock = await prisma.stock.findUnique({
        where: {
          itemId_locationId: {
            itemId: i.itemId,
            locationId: shipment.toLocationId,
          },
        },
      });

      // kalau stock sudah ada
      if (existingStock) {
        await prisma.stock.update({
          where: {
            itemId_locationId: {
              itemId: i.itemId,
              locationId: shipment.toLocationId,
            },
          },

          data: {
            qty: {
              increment: i.qty,
            },
          },
        });
      } else {
        // kalau stock belum ada
        await prisma.stock.create({
          data: {
            itemId: i.itemId,
            locationId: shipment.toLocationId,
            qty: i.qty,
          },
        });
      }
    }

    // =========================
    // UPDATE SHIPMENT STATUS
    // =========================
    await prisma.shipment.update({
      where: { id },

      data: {
        status: 'RECEIVED',
      },
    });

    // =========================
    // COMPLETE MOVEMENT
    // =========================
    await prisma.stockMovement.updateMany({
      where: {
        shipmentId: id,
      },

      data: {
        status: 'COMPLETED',
      },
    });

    res.json({
      message: 'Shipment berhasil diterima',
    });
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: e.message,
    });
  }
});
///////////////////////////////
app.get('/shipment', async (req, res) => {
  try {
    const shipments = await prisma.shipment.findMany({
      include: {
        fromLocation: true,
        toLocation: true,
        driver: true,

        items: {
          include: {
            item: true,
          },
        },

        movements: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(shipments);
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: e.message,
    });
  }
});

app.get('/shipment/driver/:id', async (req, res) => {
  const id = Number(req.params.id);

  const shipments = await prisma.shipment.findMany({
    where: {
      driverId: id,
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

    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(shipments);
});
//////////////////////////
// DFASHBOARD OWNER
//////////////////////////
app.get('/dashboard/owner', async (req, res) => {
  try {
    // =========================
    // TOTAL SHIPMENT
    // =========================
    const totalShipment = await prisma.shipment.count();

    // =========================
    // IN TRANSIT
    // =========================
    const inTransit = await prisma.shipment.count({
      where: {
        status: 'IN_TRANSIT',
      },
    });

    // =========================
    // TOTAL STOCK
    // =========================
    const stocks = await prisma.stock.findMany({
      include: {
        item: true,
        location: true,
      },
    });

    const totalStock = stocks.reduce((sum, s) => sum + s.qty, 0);

    // =========================
    // RECENT SHIPMENT
    // =========================
    const recentShipment = await prisma.shipment.findMany({
      take: 5,

      include: {
        fromLocation: true,
        toLocation: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    // =========================
    // RECENT MOVEMENT
    // =========================
    const recentMovement = await prisma.stockMovement.findMany({
      take: 5,

      include: {
        item: true,
        fromLocation: true,
        toLocation: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      totalShipment,
      inTransit,
      totalStock,

      recentShipment,
      recentMovement,

      stocks,
    });
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: e.message,
    });
  }
});
//////////////////////////
// START SERVER
//////////////////////////

app.listen(5000, () => {
  console.log('🚀 Backend running on http://localhost:5000');
});
