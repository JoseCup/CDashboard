module.exports = function requirePlatformAdmin(req, res, next) {
  if (!req.user || req.user.isPlatformAdmin !== true) {
    return res.status(403).json({ message: 'Platform admin only' });
  }
  next();
};
