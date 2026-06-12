import * as userService from './user.service.js';

export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;

    const data = await userService.getUsers(role);

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const data = await userService.getUserById(req.params.id);

    if (!data) {
      return res.status(404).json({
        error: 'User tidak ditemukan',
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
