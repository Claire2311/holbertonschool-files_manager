const express = require('express');

const router = express.Router();

const AppControllers = require('../controllers/AppController');

router.get('/status', AppControllers.getStatus);
router.get('/stats', AppControllers.getStats);

module.exports = router;
