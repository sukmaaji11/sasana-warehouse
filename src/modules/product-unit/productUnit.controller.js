import * as productUnitService from './productUnit.services.js';

export const getAll = async (req, res) => {
  try {
    const data = await productUnitService.getAll();

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const getByProduct = async (req, res) => {
  try {
    const data = await productUnitService.getByProduct(req.params.productId);

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const create = async (req, res) => {
  try {
    const data = await productUnitService.create(req.body);

    res.status(201).json({
      message: 'Product unit berhasil dibuat',
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
    const data = await productUnitService.update(req.params.id, req.body);

    res.json({
      message: 'Product unit berhasil diupdate',
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
    await productUnitService.remove(req.params.id);

    res.json({
      message: 'Product unit berhasil dihapus',
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};
