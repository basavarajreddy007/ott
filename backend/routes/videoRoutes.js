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
const { protect, optionalProtect } = require('../middlewares/authMiddleware');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }
});

router.get('/search', searchVideos);
router.get('/user/:email', getVideosByUser);
router.post('/subscribe/:creatorId', protect, subscribeToCreator);

router.get('/', getVideos);
router.post('/', protect, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), createVideo);

router.get('/:id', optionalProtect, getVideo);
router.put('/:id', protect, updateVideo);
router.delete('/:id', protect, deleteVideo);

router.patch('/:id/thumbnail', protect, upload.single('thumbnail'), updateThumbnail);
router.post('/:id/like', protect, likeVideo);
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);

module.exports = router;
