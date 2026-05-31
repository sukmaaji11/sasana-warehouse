import * as itemService from './item.services.js';

export const getItems = async (req, res) => {
  try {
    const { type } = req.query;

    const items = await itemService.getItems(type);

    res.json(items);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const getItemById = async (req, res) => {
  try {
    const item = await itemService.getItemById(req.params.id);

    res.json(item);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const createItem = async (req, res) => {
  try {
    const item = await itemService.createItem(req.body);

    res.status(201).json({
      message: 'Item berhasil dibuat',
      item,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

export const updateItem = async (req, res) => {
  try {
    const item = await itemService.updateItem(req.params.id, req.body);

    res.json({
      message: 'Item berhasil diupdate',
      item,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

export const deleteItem = async (req, res) => {
  try {
    await itemService.deleteItem(req.params.id);

    res.json({
      message: 'Item berhasil dihapus',
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};
