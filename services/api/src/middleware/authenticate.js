const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev';

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
  }
}

module.exports = authenticate;
