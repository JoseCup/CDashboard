module.exports = function requireCompanyAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'company_admin') {
        return res.status(403).json({ message: 'Company admin only' });
    }
    next();
};