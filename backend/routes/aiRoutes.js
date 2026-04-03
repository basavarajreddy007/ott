const express = require('express');
const { generateScript, analyzeScript } = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/script', protect, generateScript);
router.post('/analyze', protect, analyzeScript);

module.exports = router;
