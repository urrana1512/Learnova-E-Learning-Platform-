const { uploadToCloudinary } = require('../utils/cloudinary');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Follow = require('../models/Follow');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Review = require('../models/Review');
const Attachment = require('../models/Attachment');
const mongoose = require('mongoose');

// Helper: convert ObjectId to string safely
const toStr = (id) => (id ? id.toString() : null);

// GET /api/courses - list courses (admin/instructor sees their own)
const getCourses = async (req, res) => {
  try {
    const query = req.user.role === 'ADMIN' ? {} : { instructorId: req.user.id };
    const courses = await Course.find(query)
      .populate('instructorId', 'id name email')
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    // Get lessons and enrollment counts per course
    const result = await Promise.all(
      courses.map(async (c) => {
        const lessons = await Lesson.find({ courseId: c._id }).select('id duration').lean({ virtuals: true });
        const enrollmentCount = await Enrollment.countDocuments({ courseId: c._id });
        const totalDuration = lessons.reduce((acc, l) => acc + (l.duration || 0), 0);
        return {
          ...c,
          id: c._id.toString(),
          instructor: c.instructorId,
          lessons,
          enrollments: Array(enrollmentCount).fill({}),
          _count: { lessons: lessons.length, enrollments: enrollmentCount },
          totalDuration,
        };
      })
    );
    res.json(result);
  } catch (error) {
    console.error('getCourses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/courses/public - public course list (respects visibility)
const getPublicCourses = async (req, res) => {
  try {
    const baseQuery = { isPublished: true };

    if (!req.user) {
      baseQuery.visibility = 'EVERYONE';
      baseQuery.accessRule = { $ne: 'ON_INVITATION' };

      const courses = await Course.find(baseQuery)
        .populate('instructorId', 'id name')
        .sort({ createdAt: -1 })
        .lean({ virtuals: true });

      const result = await Promise.all(
        courses.map(async (c) => {
          const lessons = await Lesson.find({ courseId: c._id }).select('duration').lean();
          const lessonCount = lessons.length;
          const enrollmentCount = await Enrollment.countDocuments({ courseId: c._id });
          const quizCount = await Quiz.countDocuments({ courseId: c._id });
          const reviews = await Review.find({ courseId: c._id }).select('rating').lean();
          const totalDuration = lessons.reduce((acc, l) => acc + (l.duration || 0), 0);
          return {
            ...c,
            id: c._id.toString(),
            instructor: c.instructorId,
            _count: { lessons: lessonCount, enrollments: enrollmentCount, quizzes: quizCount },
            reviews,
            totalDuration,
          };
        })
      );
      return res.json(result);
    }

    // Authenticated users
    const invitedEnrollments = await Enrollment.find({
      userId: req.user.id,
      courseId: {
        $in: await Course.find({ isPublished: true, accessRule: 'ON_INVITATION' }).distinct('_id'),
      },
    }).select('courseId').lean();
    const enrolledInvitedIds = invitedEnrollments.map((e) => e.courseId.toString());

    if (req.user.role === 'LEARNER') {
      baseQuery.visibility = 'EVERYONE';
    }

    let accessFilter;
    if (enrolledInvitedIds.length > 0) {
      accessFilter = {
        $or: [
          { accessRule: { $ne: 'ON_INVITATION' } },
          { accessRule: 'ON_INVITATION', _id: { $in: enrolledInvitedIds.map(id => new mongoose.Types.ObjectId(id)) } },
        ],
      };
    } else {
      accessFilter = { accessRule: { $ne: 'ON_INVITATION' } };
    }

    const courses = await Course.find({ ...baseQuery, ...accessFilter })
      .populate('instructorId', 'id name')
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    const result = await Promise.all(
      courses.map(async (c) => {
        const lessons = await Lesson.find({ courseId: c._id }).select('duration').lean();
        const enrollmentCount = await Enrollment.countDocuments({ courseId: c._id });
        const quizCount = await Quiz.countDocuments({ courseId: c._id });
        const reviews = await Review.find({ courseId: c._id }).select('rating').lean();
        const totalDuration = lessons.reduce((acc, l) => acc + (l.duration || 0), 0);
        return {
          ...c,
          id: c._id.toString(),
          instructor: c.instructorId,
          _count: { lessons: lessons.length, enrollments: enrollmentCount, quizzes: quizCount },
          reviews,
          totalDuration,
        };
      })
    );
    res.json(result);
  } catch (error) {
    console.error('[getPublicCourses]', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/courses - create course
const createCourse = async (req, res) => {
  try {
    const { title, rewardXP } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const course = await new Course({
      title,
      instructorId: req.user.id,
      rewardXP: parseInt(rewardXP) || 500,
    }).save();
    res.status(201).json(course);
  } catch (error) {
    console.error('createCourse error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/courses/:id - get course details
const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructorId', 'id name email')
      .lean({ virtuals: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const lessons = await Lesson.find({ courseId: course._id })
      .sort({ order: 1 })
      .lean({ virtuals: true });

    // Populate attachments per lesson
    const lessonsWithAttachments = await Promise.all(
      lessons.map(async (l) => {
        const attachments = await Attachment.find({ lessonId: l._id }).lean({ virtuals: true });
        return { ...l, attachments };
      })
    );

    const quizzes = await Quiz.find({ courseId: course._id }).lean({ virtuals: true });
    const enrollmentCount = await Enrollment.countDocuments({ courseId: course._id });

    const formattedLessons = lessonsWithAttachments.map(l => ({
      ...l,
      id: l._id.toString(),
      attachments: l.attachments.map(a => ({ ...a, id: a._id.toString() }))
    }));

    res.json({
      ...course,
      id: course._id.toString(),
      instructor: course.instructorId,
      lessons: formattedLessons,
      quizzes: quizzes.map(q => ({ ...q, id: q._id.toString() })),
      _count: { enrollments: enrollmentCount },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/courses/:id - update course
const updateCourse = async (req, res) => {
  try {
    const { title, description, tags, website, visibility, accessRule, price, isPublished, rewardXP } = req.body;
    let coverImage;

    if (req.files && req.files.coverImage) {
      const result = await uploadToCloudinary(req.files.coverImage, 'learnova/covers');
      coverImage = result.secure_url;
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : JSON.parse(tags || '[]');
    if (website !== undefined) updateData.website = website;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (accessRule !== undefined) updateData.accessRule = accessRule;
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null;
    if (isPublished !== undefined) updateData.isPublished = isPublished === 'true' || isPublished === true;
    if (rewardXP !== undefined) updateData.rewardXP = parseInt(rewardXP) || 500;
    if (coverImage) updateData.coverImage = coverImage;

    const course = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('instructorId', 'id name email')
      .lean({ virtuals: true });

    if (!course) return res.status(404).json({ message: 'Course not found' });

    res.json({
      ...course,
      id: course._id.toString(),
      instructor: course.instructorId,
    });
  } catch (error) {
    console.error('updateCourse error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// DELETE /api/courses/:id
const deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/courses/:id/publish - toggle publish status
const togglePublish = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    course.isPublished = !course.isPublished;
    await course.save();
    const updated = course.toJSON();

    // Notify followers if publishing
    if (updated.isPublished) {
      const instructor = await User.findById(updated.instructorId);
      const followers = await Follow.find({ followingId: updated.instructorId });
      if (instructor && followers.length > 0) {
        const notifications = followers.map((f) => ({
          userId: f.followerId,
          message: `${instructor.name} compiled a new course: ${updated.title}!`,
          link: `/courses/${updated.id}`,
        }));
        await Notification.insertMany(notifications);
      }
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/courses/:id/detail - course detail with learner's progress
const getCourseDetail = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructorId', 'id name')
      .lean({ virtuals: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Get lessons with attachments and quiz
    const rawLessons = await Lesson.find({ courseId: course._id })
      .sort({ order: 1 })
      .lean({ virtuals: true });

    const lessons = await Promise.all(
      rawLessons.map(async (l) => {
        const attachments = await Attachment.find({ lessonId: l._id }).lean({ virtuals: true });
        let quiz = null;
        if (l.quizId) {
          quiz = await Quiz.findById(l.quizId).lean({ virtuals: true });
        }
        return { ...l, attachments, quiz };
      })
    );

    const quizzes = await Quiz.find({ courseId: course._id }).lean({ virtuals: true });
    const reviews = await Review.find({ courseId: course._id })
      .populate('userId', 'id name avatar')
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });
    const enrollmentCount = await Enrollment.countDocuments({ courseId: course._id });

    if (!req.user) {
      if (course.accessRule === 'ON_INVITATION') {
        return res.status(403).json({ message: 'This course is invitation-only' });
      }
    }

    let enrollment = null;
    let lessonProgress = [];
    let quizAttempts = [];
    let isFollowing = false;

    if (req.user) {
      enrollment = await Enrollment.findOne({ userId: req.user.id, courseId: course._id }).lean({ virtuals: true });

      if (
        course.accessRule === 'ON_INVITATION' &&
        !enrollment &&
        req.user.role !== 'ADMIN' &&
        toStr(course.instructorId?._id || course.instructorId) !== req.user.id
      ) {
        return res.status(403).json({ message: 'This course is invitation-only. Ask the instructor to invite you.' });
      }

      const lessonIds = rawLessons.map((l) => l._id);
      const quizIds = quizzes.map((q) => q._id);

      lessonProgress = await Lesson.find({ _id: { $in: lessonIds } })
        .lean({ virtuals: true })
        .then(() =>
          require('../models/LessonProgress').find({
            userId: req.user.id,
            lessonId: { $in: lessonIds },
          }).lean({ virtuals: true })
        );

      quizAttempts = await QuizAttempt.find({ userId: req.user.id, quizId: { $in: quizIds } })
        .sort({ attemptNo: -1 })
        .lean({ virtuals: true });

      const follow = await Follow.findOne({ followerId: req.user.id, followingId: toStr(course.instructorId?._id || course.instructorId) });
      if (follow) isFollowing = true;
    }

    const quizIds = quizzes.map((q) => q._id);
    const allAttempts = await QuizAttempt.find({ quizId: { $in: quizIds } })
      .populate('userId', 'id name avatar')
      .sort({ score: -1, timeTaken: 1 })
      .lean({ virtuals: true });

    const userMap = new Map();
    for (const a of allAttempts) {
      const uid = toStr(a.userId?._id || a.userId);
      if (!userMap.has(uid)) userMap.set(uid, a);
    }
    const leaderboard = Array.from(userMap.values()).slice(0, 3);

    const totalDuration = rawLessons.reduce((acc, l) => acc + (l.duration || 0), 0);

    const formattedLessons = lessons.map(l => ({
      ...l,
      id: l._id.toString(),
      attachments: l.attachments.map(a => ({ ...a, id: a._id.toString() })),
      quiz: l.quiz ? { ...l.quiz, id: l.quiz._id.toString() } : null
    }));

    res.json({
      course: {
        ...course,
        id: course._id.toString(),
        instructor: course.instructorId,
        lessons: formattedLessons,
        quizzes: quizzes.map(q => ({ ...q, id: q._id.toString() })),
        reviews: reviews.map((r) => ({ ...r, id: r._id.toString(), user: r.userId })),
        _count: { enrollments: enrollmentCount },
        totalDuration,
      },
      enrollment,
      lessonProgress,
      quizAttempts,
      leaderboard,
      isFollowing,
    });
  } catch (error) {
    console.error('getCourseDetail error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCourses, getPublicCourses, createCourse, getCourse, updateCourse, deleteCourse, togglePublish, getCourseDetail };
