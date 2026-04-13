const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { processPayment } = require('../controllers/paymentController');

router.post('/', protect, processPayment);

module.exports = router;
