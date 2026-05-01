const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
    getStats,
    getAllUsers,
    updateUserRole,
    updateUserPlan,
    deleteUser,
    getAllVideos,
    updateVideo,
    deleteVideo,
    getAllRequests,
    deleteRequest
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats',                  getStats);
router.get('/users',                  getAllUsers);
router.patch('/users/:id/role',       updateUserRole);
router.patch('/users/:id/plan',       updateUserPlan);
router.delete('/users/:id',           deleteUser);
router.get('/videos',                 getAllVideos);
router.put('/videos/:id',             updateVideo);
router.delete('/videos/:id',          deleteVideo);
router.get('/requests',               getAllRequests);
router.delete('/requests/:id',        deleteRequest);

module.exports = router;
