import * as dashboardService from './dashboard.services.js';

export const getDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getDashboard(req.user);

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
