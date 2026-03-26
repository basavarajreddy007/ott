const express = require('express');
const multer = require('multer');
const {
    getVideos,
    getVideo,
    createVideo,
    updateVideo,
    deleteVideo,
    searchVideos,
    getVideosByUser
} = require('../controllers/videoController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }
});

router.get('/search', searchVideos);
router.get('/user/:email', getVideosByUser);

router
    .route('/')
    .get(getVideos)
    .post(protect, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), createVideo);

router
    .route('/:id')
    .get(getVideo)
    .put(protect, authorize('admin'), updateVideo)
    .delete(protect, authorize('admin'), deleteVideo);

module.exports = router;
