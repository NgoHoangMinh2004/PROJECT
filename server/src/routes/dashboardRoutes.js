const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');

// Khi ai đó gọi GET / (tương ứng với /api/dashboard ở server.js)
router.get('/', DashboardController.getData);

module.exports = router;