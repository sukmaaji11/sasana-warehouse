import * as distributionService from './distribution.services.js';

export const createDistribution = async (req, res) => {
  try {
    const data = await distributionService.createDistribution(
      req.body,
      req.user.id,
    );

    res.status(201).json({
      message: 'Distribusi berhasil dicatat',
      data,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

export const getDistributions = async (req, res) => {
  try {
    const data = await distributionService.getDistributions();

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const getDistributionById = async (req, res) => {
  try {
    const data = await distributionService.getDistributionById(req.params.id);

    if (!data) {
      return res.status(404).json({
        error: 'Distribusi tidak ditemukan',
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
