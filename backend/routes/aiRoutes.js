const express = require('express');
const { generateScript, analyzeScript } = require('../controllers/aiController');
const router = express.Router();

router.post('/script', generateScript);
router.post('/analyze', analyzeScript);

module.exports = router;
