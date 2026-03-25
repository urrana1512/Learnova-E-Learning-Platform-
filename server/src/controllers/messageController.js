const Message = require('../models/Message');
const Notification = require('../models/Notification');

const messageController = {
  // Send a message
  send: async (req, res) => {
    try {
      const { receiverId, courseId, content, attachments } = req.body;
      const senderId = req.user.id;

      // Check restrictions
      const senderDoc = await require('../models/User').findById(senderId);
      const receiverDoc = await require('../models/User').findById(receiverId);
      
      if (!receiverDoc) return res.status(404).json({ message: 'Recipient not found' });

      // Rules:
      // Instructors and Admins can message anyone (unless blocked).
      // Students can message other students ONLY if they are FRIENDS.
      // Students can message Instructors ONLY if they FOLLOW them.
      
      // 1. Check if Blocked
      const BlockedUser = require('../models/BlockedUser');
      const isBlocked = await BlockedUser.findOne({
        $or: [
          { blocker: senderId, blocked: receiverId },
          { blocker: receiverId, blocked: senderId }
        ]
      });
      if (isBlocked) return res.status(403).json({ success: false, message: 'Communication blocked.' });

      // 2. Role-based restrictions
      if (senderDoc.role === 'LEARNER') {
        if (receiverDoc.role === 'INSTRUCTOR') {
          const Follow = require('../models/Follow');
          const isFollowing = await Follow.findOne({ followerId: senderId, followingId: receiverId });
          if (!isFollowing) {
            return res.status(403).json({ success: false, message: 'You must follow the instructor to message them.' });
          }
        } else if (receiverDoc.role === 'LEARNER') {
          const Friend = require('../models/Friend');
          const areFriends = await Friend.findOne({
            $or: [
              { user1: senderId, user2: receiverId },
              { user1: receiverId, user2: senderId }
            ]
          });
          if (!areFriends) {
            return res.status(403).json({ success: false, message: 'You can only message students who are your friends.' });
          }
        }
      }

      const message = new Message({
        sender: senderId,
        receiver: receiverId,
        courseId,
        content,
        attachments
      });

      await message.save();
      await message.populate('sender', 'name avatar');
      
      // Real-time emit & Persistent Notification
      try {
        const { sendToUser } = require('../services/socketService');
        sendToUser(receiverId, 'new_message', message);

        // Also create a persistent notification in the activity feed
        const notif = await new Notification({
          userId: receiverId,
          type: 'MESSAGE',
          message: `New message from ${senderDoc.name}`,
          link: `/chat`
        }).save();
        sendToUser(receiverId, 'new_notification', notif);
      } catch (err) {
        console.error('Socket/Notif emit error:', err);
      }

      res.status(201).json({
        success: true,
        data: message
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get conversation history between two users for a specific course
  getConversation: async (req, res) => {
    try {
      let { userId, courseId } = req.params;
      const currentUserId = req.user.id;
      
      // Handle the string "null" from the frontend
      const targetCourseId = (courseId === "null" || courseId === "undefined" || !courseId) ? null : courseId;

      const messages = await Message.find({
        courseId: targetCourseId,
        $or: [
          { sender: currentUserId, receiver: userId },
          { sender: userId, receiver: currentUserId }
        ]
      })
      .sort({ createdAt: 1 })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar');

      res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get list of active conversations for a user
  getChats: async (req, res) => {
    try {
      const mongoose = require('mongoose');
      const currentUserId = new mongoose.Types.ObjectId(req.user.id);

      // Group by user and course to find recent chats
      const chats = await Message.aggregate([
        {
          $match: {
            $or: [{ sender: currentUserId }, { receiver: currentUserId }]
          }
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: {
              user: { $cond: [{ $eq: ['$sender', currentUserId] }, '$receiver', '$sender'] },
              course: '$courseId'
            },
            lastMessage: { $first: '$$ROOT' },
            unreadCount: { 
              $sum: { $cond: [{ $and: [{ $eq: ['$receiver', currentUserId] }, { $eq: ['$isRead', false] }] }, 1, 0] } 
            }
          }
        },
        { $sort: { 'lastMessage.createdAt': -1 } }
      ]);

      // Populate user and course details (simplified)
      const populatedChats = await Message.populate(chats, [
        { path: 'lastMessage.sender', select: 'name avatar' },
        { path: 'lastMessage.receiver', select: 'name avatar' },
        { path: '_id.user', select: 'name avatar', model: 'User' },
        { path: '_id.course', select: 'title thumbnail', model: 'Course' }
      ]);

      res.status(200).json({
        success: true,
        data: populatedChats
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Mark messages as read
  markAsRead: async (req, res) => {
    try {
      const { senderId, courseId } = req.params;
      const receiverId = req.user.id;

      const targetCourseId = (courseId === "null" || courseId === "undefined" || !courseId) ? null : courseId;

      await Message.updateMany(
        { sender: senderId, receiver: receiverId, courseId: targetCourseId, isRead: false },
        { $set: { isRead: true } }
      );

      res.status(200).json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Upload an attachment
  uploadAttachment: async (req, res) => {
    try {
      if (!req.files || !req.files.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const file = req.files.file;
      const isImage = file.mimetype.startsWith('image/');
      const folder = isImage ? 'learnova/chat/images' : 'learnova/chat/files';
      
      const { uploadToCloudinary } = require('../utils/cloudinary');
      const result = await uploadToCloudinary(file, folder);

      res.status(200).json({
        success: true,
        data: {
          url: result.secure_url,
          name: file.name,
          type: isImage ? 'IMAGE' : 'FILE'
        }
      });
    } catch (error) {
       console.error('Upload error:', error);
       res.status(500).json({ success: false, message: error.message });
    }
  },

  // Broadcast to all followers
  broadcast: async (req, res) => {
    try {
      const { content, attachments, courseId } = req.body;
      const instructorId = req.user.id;

      if (req.user.role !== 'INSTRUCTOR' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Only instructors can broadcast' });
      }

      const Follow = require('../models/Follow');
      const Notification = require('../models/Notification');
      const followers = await Follow.find({ followingId: instructorId }).select('followerId').lean();

      if (followers.length === 0) {
        return res.status(200).json({ success: true, message: 'No followers to broadcast to.' });
      }

      const followerIds = followers.map(f => f.followerId);
      const instructor = await require('../models/User').findById(instructorId).select('name avatar');

      // 1. Create Messages for each (Optional: or just one global notification?)
      // The user said "message or reply or broadcast", so we'll do both message and notification for high visibility.
      const messages = followerIds.map(fid => ({
        sender: instructorId,
        receiver: fid,
        courseId,
        content: `[BROADCAST] ${content}`,
        attachments
      }));

      await Message.insertMany(messages);

      // 2. Create Notifications
      const notifications = followerIds.map(fid => ({
        userId: fid,
        type: 'MESSAGE',
        message: `${instructor.name} sent a broadcast message.`,
        link: `/chat`
      }));

      await Notification.insertMany(notifications);

      // 3. Socket broadcast (iterate for now as socketService is 1-to-1)
      const { sendToUser } = require('../services/socketService');
      followerIds.forEach(fid => {
        sendToUser(fid.toString(), 'new_broadcast', {
          sender: instructor,
          content,
          courseId
        });
      });

      res.status(201).json({
        success: true,
        message: `Broadcast sent to ${followers.length} followers.`
      });
    } catch (error) {
      console.error('Broadcast error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Targeted Broadcast — Send message to all students ENROLLED in a specific course
  broadcastToCourse: async (req, res) => {
    try {
      const { courseId, content, attachments } = req.body;
      const instructorId = req.user.id;

      if (!courseId) return res.status(400).json({ message: 'Course ID is required for targeted broadcast.' });

      // Verify instructor owns the course
      const Course = require('../models/Course');
      const course = await Course.findOne({ _id: courseId, instructorId });
      if (!course) return res.status(403).json({ message: 'You can only broadcast to your own courses.' });

      // Find all students enrolled in this course
      const Enrollment = require('../models/Enrollment');
      const enrollments = await Enrollment.find({ courseId }).select('userId').lean();

      if (enrollments.length === 0) {
        return res.status(200).json({ success: true, message: 'No students enrolled in this course.' });
      }

      const studentIds = enrollments.map(e => e.userId);
      const instructor = await require('../models/User').findById(instructorId).select('name avatar');

      // Create Messages
      const messages = studentIds.map(sid => ({
        sender: instructorId,
        receiver: sid,
        courseId,
        content: `[COURSE ANNOUNCEMENT: ${course.title}] ${content}`,
        attachments
      }));

      await Message.insertMany(messages);

      // Create Notifications
      const Notification = require('../models/Notification');
      const notifications = studentIds.map(sid => ({
        userId: sid,
        type: 'MESSAGE',
        message: `${instructor.name} posted an update in ${course.title}.`,
        link: `/chat`
      }));

      await Notification.insertMany(notifications);

      // Socket Emit
      const { sendToUser } = require('../services/socketService');
      studentIds.forEach(sid => {
        sendToUser(sid.toString(), 'new_broadcast', {
          sender: instructor,
          content,
          courseId,
          courseName: course.title
        });
      });

      res.status(201).json({
        success: true,
        message: `Broadcast dispatched to ${enrollments.length} students in ${course.title}.`
      });
    } catch (error) {
       console.error('Targeted broadcast error:', error);
       res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = messageController;
