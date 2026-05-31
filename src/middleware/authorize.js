export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Role ${req.user.role} tidak memiliki akses`,
      });
    }

    next();
  };
};
