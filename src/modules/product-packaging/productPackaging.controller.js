import * as service from './productPackaging.services.js';

export const getAll = async (req, res) => {
  try {
    const data = await service.getAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getByProduct = async (req, res) => {
  try {
    const data = await service.getByProduct(req.params.productId);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const data = await service.create(req.body);

    res.status(201).json({
      message: 'Mapping berhasil dibuat',
      data,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

export const update = async (req, res) => {
  try {
    const data = await service.update(req.params.id, req.body);

    res.json({
      message: 'Mapping berhasil diupdate',
      data,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

export const remove = async (req, res) => {
  try {
    await service.remove(req.params.id);

    res.json({
      message: 'Mapping berhasil dihapus',
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};
