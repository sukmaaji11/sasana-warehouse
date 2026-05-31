import * as stockService from './stock.services.js';

export const getStocks = async (req, res) => {
  try {
    const data = await stockService.getStocks();

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const getStockByLocation = async (req, res) => {
  try {
    const data = await stockService.getStockByLocation(req.params.locationId);

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const getStockByItem = async (req, res) => {
  try {
    const data = await stockService.getStockByItem(req.params.itemId);

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const getMovements = async (req, res) => {
  try {
    const data = await stockService.getMovements();

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const getMovementById = async (req, res) => {
  try {
    const data = await stockService.getMovementById(req.params.id);

    if (!data) {
      return res.status(404).json({
        error: 'Movement tidak ditemukan',
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
