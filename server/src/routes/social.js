const express = require('express');
const router = express.Namespace ? express.Namespace() : express.Router();
const authenticate = require('../middleware/auth');
const socialController = require('../controllers/socialController');

// All social routes require authentication
router.use(authenticate);

// Friend Requests
router.post('/friends/request', socialController.sendFriendRequest);
router.post('/friends/respond', socialController.respondToRequest);
router.get('/friends/pending', socialController.getPendingRequests);
router.get('/friends', socialController.getFriends);
router.post('/friends/favorite', socialController.toggleFavorite);
router.delete('/friends/:friendId', socialController.removeFriend);

// Follow System
router.get('/followers', socialController.getFollowers);

// Blocking System
router.post('/block', socialController.blockUser);
router.delete('/block/:targetId', socialController.unblockUser);
router.get('/blocked', socialController.getBlockedUsers);

// Search
router.get('/search', socialController.searchUsers);

module.exports = router;
