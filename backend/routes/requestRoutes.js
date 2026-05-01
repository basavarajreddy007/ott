const express = require('express');
const { createRequest, getRequests } = require('../controllers/requestController');
const { optionalProtect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getRequests);
router.post('/', optionalProtect, createRequest);

module.exports = router;
