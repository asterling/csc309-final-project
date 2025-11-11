module.exports = (requiredRole) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = req.user.role;

    const roles = ['regular', 'cashier', 'manager', 'superuser'];
    const userRoleIndex = roles.indexOf(userRole);
    const requiredRoleIndex = roles.indexOf(requiredRole);

    if (userRoleIndex === -1 || requiredRoleIndex === -1 || userRoleIndex < requiredRoleIndex) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    next();
};