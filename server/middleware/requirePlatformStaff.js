module.exports = function requirePlatformStaff(req, res, next) {
  if (
    !req.user ||
    (req.user.platformRole !== 'ADMIN' &&
     req.user.platformRole !== 'DESIGNER')
  ) {
    return res.status(403).json({ message: 'Platform staff only' });
  }
  next();
};
