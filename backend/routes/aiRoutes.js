const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { scriptChat, scriptAnalyze, saveSession, getSessions, getSession, deleteSession } = require('../controllers/aiController');

const router = express.Router();

router.use(protect);

router.post('/script-chat', scriptChat);
router.post('/script-analyze', scriptAnalyze);
router.get('/sessions', getSessions);
router.post('/sessions', saveSession);
router.get('/sessions/:id', getSession);
router.delete('/sessions/:id', deleteSession);

module.exports = router;
