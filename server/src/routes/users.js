const express = require('express');
const mongoose = require('mongoose');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/role');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const LessonProgress = require('../models/LessonProgress');
const QuizAttempt = require('../models/QuizAttempt');
const Review = require('../models/Review');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const Follow = require('../models/Follow');

const router = express.Router();

// GET /api/users — Admin: list all users
router.get('/', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean({ virtuals: true });

    const result = await Promise.all(
      users.map(async (u) => {
        const [enrollments, courses, reviews, quizAttempts] = await Promise.all([
          Enrollment.countDocuments({ userId: u._id }),
          Course.countDocuments({ instructorId: u._id }),
          Review.countDocuments({ userId: u._id }),
          QuizAttempt.countDocuments({ userId: u._id }),
        ]);
        return {
          ...u,
          id: u._id.toString(),
          _count: { enrollments, courses, reviews, quizAttempts },
        };
      })
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/:id/toggle-status — Admin: ban/unban user
router.patch('/:id/toggle-status', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ message: 'Cannot ban yourself' });
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).lean({ virtuals: true });
    res.json(user);
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/:id — Admin: full user purge
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) return res.status(400).json({ message: 'Cannot delete yourself' });

    // Sequential cleanup (replacing Prisma atomic transaction)
    // 1. Cleanup Learner Footprint
    await LessonProgress.deleteMany({ userId: id });
    await QuizAttempt.deleteMany({ userId: id });
    await Review.deleteMany({ userId: id });
    await Enrollment.deleteMany({ userId: id });
    await Payment.deleteMany({ userId: id });

    // 2. Cleanup Social & Communication Discovery
    await Notification.deleteMany({ userId: id });
    await Follow.deleteMany({ $or: [{ followerId: id }, { followingId: id }] });

    // 3. Cleanup Instructor Footprint (courses)
    await Course.deleteMany({ instructorId: id });

    // 4. Final: User Dissolution
    await User.findByIdAndDelete(id);

    console.log(`[PURGE_STATION] User ${id} dissolution finalized successfully.`);
    res.json({ success: true, message: 'User and all associated signatures purged.' });
  } catch (error) {
    console.error('[PURGE_FAILURE] User dissolution collapsed:', error.message);
    res.status(500).json({
      message: 'Failed to purge user. They may have active curriculum associations that require manual oversight.',
      details: error.message,
    });
  }
});

// GET /api/users/me/notifications
router.get('/me/notifications', authenticate, async (req, res) => {
  try {
    const notifs = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean({ virtuals: true });
    res.json(notifs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// PATCH /api/users/me/notifications/read
router.patch('/me/notifications/read', authenticate, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

// POST /api/users/:id/follow — Toggle follow
router.post('/:id/follow', authenticate, async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ message: 'Cannot follow yourself' });

    const existing = await Follow.findOne({ followerId: req.user.id, followingId: req.params.id });

    if (existing) {
      await Follow.findByIdAndDelete(existing._id);
      return res.json({ following: false });
    }

    await new Follow({ followerId: req.user.id, followingId: req.params.id }).save();
    res.json({ following: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id/profile — Public profile
router.get('/:id/profile', async (req, res) => {
  try {
    const profile = await User.findById(req.params.id)
      .select('id name avatar role totalPoints createdAt')
      .lean({ virtuals: true });

    if (!profile) return res.status(404).json({ message: 'User not found' });

    const [followerCount, followingCount] = await Promise.all([
      Follow.countDocuments({ followingId: req.params.id }),
      Follow.countDocuments({ followerId: req.params.id }),
    ]);

    let isFollowing = false;
    let isOwner = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        if (decoded && decoded.id) {
          if (decoded.id === req.params.id) {
            isOwner = true;
          } else {
            const f = await Follow.findOne({ followerId: decoded.id, followingId: req.params.id });
            isFollowing = !!f;
          }
        }
      } catch (e) {}
    }

    const courses = await Course.find({ instructorId: req.params.id }).lean({ virtuals: true });
    const coursesWithCounts = await Promise.all(
      courses.map(async (c) => {
        const [enrollments, lessons, reviews] = await Promise.all([
          Enrollment.countDocuments({ courseId: c._id }),
          require('../models/Lesson').countDocuments({ courseId: c._id }),
          Review.countDocuments({ courseId: c._id }),
        ]);
        return { ...c, id: c._id.toString(), _count: { enrollments, lessons, reviews } };
      })
    );

    res.json({
      profile: {
        ...profile,
        _count: { followers: followerCount, following: followingCount },
      },
      courses: coursesWithCounts,
      isFollowing,
      isOwner,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
