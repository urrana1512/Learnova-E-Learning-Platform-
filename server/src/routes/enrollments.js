const express = require('express');
const router = express.Router();
const { enroll, getMyEnrollments, completeCourse, updateTimeSpent } = require('../controllers/enrollmentController');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/role');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const LessonProgress = require('../models/LessonProgress');
const Notification = require('../models/Notification');

router.post('/', authenticate, enroll);
router.get('/my', authenticate, getMyEnrollments);
router.put('/:courseId/complete', authenticate, completeCourse);
router.put('/:courseId/time', authenticate, updateTimeSpent);

// GET /api/enrollments/course/:courseId/attendees — instructor or admin only
router.get('/course/:courseId/attendees', authenticate, requireRole('INSTRUCTOR', 'ADMIN'), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ courseId: req.params.courseId })
      .populate('userId', 'id name email avatar totalPoints role')
      .sort({ enrolledAt: -1 })
      .lean({ virtuals: true });

    const lessonIds = await Lesson.find({ courseId: req.params.courseId }).distinct('_id');

    const enriched = await Promise.all(
      enrollments.map(async (e) => {
        const user = e.userId;
        const completed = await LessonProgress.countDocuments({
          userId: user._id,
          lessonId: { $in: lessonIds },
          isCompleted: true,
        });
        const total = lessonIds.length;
        return {
          id: e._id.toString(),
          userId: user.id || user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          totalPoints: user.totalPoints,
          enrolledAt: e.enrolledAt,
          completedAt: e.completedAt,
          status: e.status,
          timeSpent: e.timeSpent,
          lessonsCompleted: completed,
          totalLessons: total,
          progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error('[Attendees] Error:', err);
    res.status(500).json({ message: 'Failed to fetch attendees' });
  }
});

// POST /api/enrollments/course/:courseId/invite — instructor invites a learner by email
router.post('/course/:courseId/invite', authenticate, requireRole('INSTRUCTOR', 'ADMIN'), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (req.user.role !== 'ADMIN' && course.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not the instructor of this course' });
    }

    const learner = await User.findOne({ email: email.toLowerCase().trim() });
    if (!learner) return res.status(404).json({ message: `No user found with email: ${email}` });
    if (!learner.isActive) return res.status(400).json({ message: 'This user account is disabled' });

    const existing = await Enrollment.findOne({ userId: learner._id, courseId: req.params.courseId });
    if (existing) return res.status(409).json({ message: `${learner.name} is already enrolled in this course` });

    const enrollment = await new Enrollment({ userId: learner._id, courseId: req.params.courseId }).save();

    await new Notification({
      userId: learner._id,
      message: `${req.user.name} invited you to join: ${course.title}`,
      link: `/courses/${req.params.courseId}`,
    }).save();

    console.log(`[Invite] ${req.user.email} invited ${learner.email} to course ${req.params.courseId}`);
    res.status(201).json({
      message: `✅ ${learner.name} has been enrolled successfully`,
      user: { id: learner.id, name: learner.name, email: learner.email, avatar: learner.avatar },
      enrolledAt: enrollment.enrolledAt,
    });
  } catch (err) {
    console.error('[Invite] Error:', err);
    res.status(500).json({ message: 'Failed to invite learner' });
  }
});

// DELETE /api/enrollments/course/:courseId/invite/:userId — instructor removes a learner
router.delete('/course/:courseId/invite/:userId', authenticate, requireRole('INSTRUCTOR', 'ADMIN'), async (req, res) => {
  try {
    const { courseId, userId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (req.user.role !== 'ADMIN' && course.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await Enrollment.findOneAndDelete({ userId, courseId });

    // Also delete lesson progress for this user in this course
    const lessonIds = await Lesson.find({ courseId }).distinct('_id');
    await LessonProgress.deleteMany({ userId, lessonId: { $in: lessonIds } });

    await new Notification({
      userId,
      message: `${req.user.name} removed your access to: ${course.title}`,
    }).save();

    res.json({ message: 'User removed from course' });
  } catch (err) {
    console.error('[Remove Enrollment] Error:', err);
    res.status(500).json({ message: 'Failed to remove user' });
  }
});

module.exports = router;
