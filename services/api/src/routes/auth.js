const express = require('express');
const jwt = require('jsonwebtoken');
const { successResponse } = require('../utils/responseFormatter');
const router = express.Router();

router.post('/login', (req, res, next) => {
  try {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'admin123';
    const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev';

    if (username === adminUser && password === adminPass) {
      const token = jwt.sign({ username, role: 'admin' }, secret, { expiresIn: '8h' });
      return res.json(successResponse({ token }, 'Login successful'));
    }
    
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
