import * as authService from '../auth/auth.services.js';

export const register = async (req, res) => {
  try {
    const user = await authService.register(req.body);

    res.status(201).json({
      message: 'User berhasil dibuat',
      user,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

export const me = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.id);

    res.json(user);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};
