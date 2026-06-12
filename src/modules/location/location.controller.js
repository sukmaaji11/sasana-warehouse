import * as locationService from './location.service.js';

export const getLocations = async (req, res) => {
  try {
    const data = await locationService.getLocations();

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const getLocationById = async (req, res) => {
  try {
    const data = await locationService.getLocationById(req.params.id);

    if (!data) {
      return res.status(404).json({
        error: 'Location tidak ditemukan',
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
