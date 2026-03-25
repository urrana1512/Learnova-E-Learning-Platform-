const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../../controllers/learner/learnerController');
const authenticate = require('../../middleware/auth');

router.get('/dashboard-stats', authenticate, getDashboardStats);

module.exports = router;
