module.exports = function requirePlatformAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'platform_admin') {
    return res.status(403).json({ message: 'Platform admin only' });
  }
  next();
};
