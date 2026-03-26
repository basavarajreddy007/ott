const express = require('express');
const { getUsers, getUserByEmail, updateUserByEmail } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, getUsers);
router.get('/:email', getUserByEmail);
router.put('/:email', protect, updateUserByEmail);
router.patch('/:email', protect, updateUserByEmail);

module.exports = router;
