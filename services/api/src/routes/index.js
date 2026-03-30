const router = require('express').Router();

router.use('/readings', require('./readings'));
router.use('/sensors',  require('./sensors'));
router.use('/alerts',   require('./alerts'));

module.exports = router;
