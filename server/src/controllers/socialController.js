const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Friend = require('../models/Friend');
const Follow = require('../models/Follow');
const BlockedUser = require('../models/BlockedUser');
const Notification = require('../models/Notification');
const { sendToUser } = require('../services/socketService');

const socialController = {
  // 1. Friend Requests (Student-Student)
  sendFriendRequest: async (req, res) => {
    try {
      const { receiverId } = req.body;
      const senderId = req.user.id;

      if (senderId === receiverId) return res.status(400).json({ message: 'Cannot friend yourself' });

      // Check roles (only Students can be friends)
      const [sender, receiver] = await Promise.all([
        User.findById(senderId),
        User.findById(receiverId)
      ]);

      if (!receiver) return res.status(404).json({ message: 'User not found' });
      if (sender.role !== 'LEARNER' || receiver.role !== 'LEARNER') {
        return res.status(403).json({ message: 'Only students can send friend requests' });
      }

      // Check if blocked
      const isBlocked = await BlockedUser.findOne({
        $or: [
          { blocker: senderId, blocked: receiverId },
          { blocker: receiverId, blocked: senderId }
        ]
      });
      if (isBlocked) return res.status(403).json({ message: 'Communication blocked' });

      // Check if already friends
      const alreadyFriends = await Friend.findOne({
        $or: [
          { user1: senderId, user2: receiverId },
          { user1: receiverId, user2: senderId }
        ]
      });
      if (alreadyFriends) return res.status(400).json({ message: 'Already friends' });

      const request = new FriendRequest({ sender: senderId, receiver: receiverId });
      await request.save();

      // Notification
      const notif = await new Notification({
        userId: receiverId,
        type: 'SOCIAL',
        message: `${sender.name} sent you a friend request!`,
        link: '/social/requests'
      }).save();
      sendToUser(receiverId, 'new_notification', notif);
      sendToUser(receiverId, 'new_friend_request', { sender: { id: sender.id, name: sender.name, avatar: sender.avatar } });

      res.status(201).json({ success: true, data: request });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  respondToRequest: async (req, res) => {
    try {
      const { requestId, status } = req.body; // status: ACCEPTED or REJECTED
      const userId = req.user.id;

      const request = await FriendRequest.findById(requestId).populate('sender', 'name avatar');
      if (!request || request.receiver.toString() !== userId) {
        return res.status(404).json({ message: 'Request not found' });
      }

      if (status === 'ACCEPTED') {
        request.status = 'ACCEPTED';
        await request.save();

        // Create Friendship (ensure user1 < user2 for unique index)
        const [u1, u2] = [request.sender._id, request.receiver].sort();
        await Friend.findOneAndUpdate(
          { user1: u1, user2: u2 },
          { user1: u1, user2: u2 },
          { upsert: true }
        );

        // Notify Sender
        const receiver = await User.findById(userId).select('name');
        const notif = await new Notification({
          userId: request.sender._id,
          type: 'SOCIAL',
          message: `${receiver.name} accepted your friend request!`,
          link: '/social/friends'
        }).save();
        sendToUser(request.sender._id.toString(), 'new_notification', notif);
        sendToUser(request.sender._id.toString(), 'friend_request_accepted', { friendId: userId });
      } else {
        await FriendRequest.findByIdAndDelete(requestId);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getPendingRequests: async (req, res) => {
    try {
      const incoming = await FriendRequest.find({ receiver: req.user.id, status: 'PENDING' })
        .populate('sender', 'id name avatar role email')
        .lean();
      const outgoing = await FriendRequest.find({ sender: req.user.id, status: 'PENDING' })
        .populate('receiver', 'id name avatar role email')
        .lean();
      res.json({ incoming, outgoing });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // 2. Friends List & Favorites
  getFriends: async (req, res) => {
    try {
      const userId = req.user.id;
      const friendships = await Friend.find({
        $or: [{ user1: userId }, { user2: userId }]
      })
      .populate('user1', 'id name avatar role email isOnline lastSeen')
      .populate('user2', 'id name avatar role email isOnline lastSeen')
      .lean();

      const friends = friendships.map(f => {
        const friend = f.user1._id.toString() === userId ? f.user2 : f.user1;
        const isFavorite = f.user1._id.toString() === userId ? f.isFavorite1 : f.isFavorite2;
        return { ...friend, id: friend._id.toString(), isFavorite, friendshipId: f._id };
      });

      res.json(friends);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  toggleFavorite: async (req, res) => {
    try {
      const { friendshipId } = req.body;
      const userId = req.user.id;
      const f = await Friend.findById(friendshipId);
      if (!f) return res.status(404).json({ message: 'Friendship not found' });

      if (f.user1.toString() === userId) f.isFavorite1 = !f.isFavorite1;
      else if (f.user2.toString() === userId) f.isFavorite2 = !f.isFavorite2;
      
      await f.save();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  removeFriend: async (req, res) => {
    try {
      const { friendId } = req.params;
      const userId = req.user.id;
      await Friend.findOneAndDelete({
        $or: [
          { user1: userId, user2: friendId },
          { user1: friendId, user2: userId }
        ]
      });
      // Also delete any existing requests
      await FriendRequest.deleteMany({
        $or: [
          { sender: userId, receiver: friendId },
          { sender: friendId, receiver: userId }
        ]
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // 3. Follow System (Student-Instructor)
  getFollowers: async (req, res) => {
    try {
      const instructorId = req.user.id;
      const followers = await Follow.find({ followingId: instructorId })
        .populate('followerId', 'id name avatar role email isOnline lastSeen')
        .lean();
      res.json(followers.map(f => ({ ...f.followerId, id: f.followerId._id.toString() })));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // 4. Blocking System
  blockUser: async (req, res) => {
    try {
      const { targetId } = req.body;
      const userId = req.user.id;
      if (userId === targetId) return res.status(400).json({ message: 'Cannot block yourself' });

      await new BlockedUser({ blocker: userId, blocked: targetId }).save();
      
      // Remove any existing friendships or follows
      await Promise.all([
        Friend.findOneAndDelete({ $or: [{ user1: userId, user2: targetId }, { user1: targetId, user2: userId }] }),
        Follow.findOneAndDelete({ $or: [{ followerId: userId, followingId: targetId }, { followerId: targetId, followingId: userId }] }),
        FriendRequest.deleteMany({ $or: [{ sender: userId, receiver: targetId }, { sender: targetId, receiver: userId }] })
      ]);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  unblockUser: async (req, res) => {
    try {
      const { targetId } = req.params;
      await BlockedUser.findOneAndDelete({ blocker: req.user.id, blocked: targetId });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getBlockedUsers: async (req, res) => {
    try {
      const blocked = await BlockedUser.find({ blocker: req.user.id })
        .populate('blocked', 'id name avatar role email')
        .lean();
      res.json(blocked.map(b => ({ ...b.blocked, id: b.blocked._id.toString() })));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // 5. Global Search
  searchUsers: async (req, res) => {
    try {
      const { query } = req.query;
      if (!query) return res.json([]);

      const users = await User.find({
        $and: [
          { _id: { $ne: req.user.id } },
          {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { email: { $regex: query, $options: 'i' } }
            ]
          }
        ]
      })
      .select('id name avatar role email isOnline lastSeen bio')
      .limit(20)
      .lean();

      // For each user, determine relationship status with current user
      const results = await Promise.all(users.map(async (u) => {
        const [isFriend, isFollowing, hasRequest, isBlocked] = await Promise.all([
          Friend.findOne({ $or: [{ user1: req.user.id, user2: u._id }, { user1: u._id, user2: req.user.id }] }),
          Follow.findOne({ followerId: req.user.id, followingId: u._id }),
          FriendRequest.findOne({ $or: [{ sender: req.user.id, receiver: u._id }, { sender: u._id, receiver: req.user.id }] }),
          BlockedUser.findOne({ blocker: req.user.id, blocked: u._id })
        ]);

        return {
          ...u,
          id: u._id.toString(),
          relationship: {
            isFriend: !!isFriend,
            isFollowing: !!isFollowing,
            requestStatus: hasRequest ? hasRequest.status : null,
            amSender: hasRequest ? (hasRequest.sender.toString() === req.user.id) : false,
            isBlocked: !!isBlocked
          }
        };
      }));

      res.json(results);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = socialController;
