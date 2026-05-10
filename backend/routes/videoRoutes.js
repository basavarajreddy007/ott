const express = require('express');
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

router.get('/search', searchVideos);
router.get('/user/:email', getVideosByUser);
router.post('/subscribe/:creatorId', protect, subscribeToCreator);

router.get('/', getVideos);
router.post('/', protect, createVideo);

router.get('/:id', optionalProtect, getVideo);
router.put('/:id', protect, updateVideo);
router.delete('/:id', protect, deleteVideo);

router.patch('/:id/thumbnail', protect, updateThumbnail);
router.post('/:id/like', protect, likeVideo);
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);

module.exports = router;
