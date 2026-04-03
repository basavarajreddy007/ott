const express = require('express');
const multer = require('multer');
const {
    getVideos,
    getVideo,
    createVideo,
    updateVideo,
    deleteVideo,
    searchVideos,
    getVideosByUser,
    updateThumbnail,
    likeVideo,
    addComment,
    deleteComment,
    subscribeToCreator
} = require('../controllers/videoController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }
});

router.get('/search', searchVideos);
router.get('/user/:email', getVideosByUser);
router.post('/subscribe/:creatorId', protect, subscribeToCreator);

router
    .route('/')
    .get(getVideos)
    .post(protect, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), createVideo);

router
    .route('/:id')
    .get(getVideo)
    .put(protect, updateVideo)
    .delete(protect, deleteVideo);

router.patch('/:id/thumbnail', protect, upload.single('thumbnail'), updateThumbnail);
router.post('/:id/like', protect, likeVideo);
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);

module.exports = router;
