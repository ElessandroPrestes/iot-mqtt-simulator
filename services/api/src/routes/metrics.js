const router = require('express').Router();
const { register } = require('../services/metricsService');

router.get('/', async (req, res, next) => {
  try {
    const metrics = await register.metrics();
    res.set('Content-Type', register.contentType);
    res.end(metrics);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
