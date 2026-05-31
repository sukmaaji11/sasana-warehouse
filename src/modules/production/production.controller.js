import * as productionService from './production.services.js';

export const createProduction = async (req, res) => {
  try {
    const production = await productionService.createProduction(
      req.body,
      req.user.id,
    );

    res.status(201).json({
      message: 'Produksi berhasil dicatat',
      data: production,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

export const getProductions = async (req, res) => {
  try {
    const data = await productionService.getProductions();

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const getProductionById = async (req, res) => {
  try {
    const data = await productionService.getProductionById(req.params.id);

    if (!data) {
      return res.status(404).json({
        error: 'Produksi tidak ditemukan',
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
