function authorize(...allowedRoles) {
  const roles = new Set(allowedRoles);

  return (req, res, next) => {
    if (!req.user || !roles.has(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          details: [],
        },
      });
    }
    next();
  };
}

module.exports = authorize;
