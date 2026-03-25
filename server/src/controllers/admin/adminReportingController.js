const Enrollment = require('../../models/Enrollment');
const Lesson = require('../../models/Lesson');
const Announcement = require('../../models/Announcement');
const Course = require('../../models/Course');
const Payment = require('../../models/Payment');
const User = require('../../models/User');

const getReporting = async (req, res) => {
  try {
    const { status } = req.query;

    // Build enrollment query
    let enrollmentQuery = {};
    if (req.user.role !== 'ADMIN') {
      const instructorCourseIds = await Course.find({ instructorId: req.user.id }).distinct('_id');
      enrollmentQuery.courseId = { $in: instructorCourseIds };
    }
    if (status) enrollmentQuery.status = status;

    const enrollments = await Enrollment.find(enrollmentQuery)
      .populate('userId', 'id name email')
      .populate({
        path: 'courseId',
        select: 'id title instructorId',
      })
      .sort({ enrolledAt: -1 })
      .lean({ virtuals: true });

    // Add completion percentage
    const result = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = enrollment.courseId;
        const lessonIds = await Lesson.find({ courseId: course._id }).distinct('_id');
        const completedCount =
          lessonIds.length > 0
            ? await LessonProgress.countDocuments({
                userId: enrollment.userId._id || enrollment.userId,
                lessonId: { $in: lessonIds },
                isCompleted: true,
              })
            : 0;
        const percent = lessonIds.length > 0 ? Math.round((completedCount / lessonIds.length) * 100) : 0;
        return {
          ...enrollment,
          user: enrollment.userId,
          course: { ...course, lessons: lessonIds.map((id) => ({ id: id.toString() })) },
          completedLessons: completedCount,
          totalLessons: lessonIds.length,
          completionPercent: percent,
        };
      })
    );

    // Platform Level Aggregation
    const courseQuery = req.user.role === 'ADMIN' ? {} : { instructorId: req.user.id };
    const totalCourses = await Course.countDocuments(courseQuery);
    const reviewQuery = req.user.role === 'ADMIN' ? {} : { courseId: { $in: await Course.find(courseQuery).distinct('_id') } };
    const totalReviews = await Review.countDocuments(reviewQuery);

    // Revenue Intelligence
    let paymentQuery = { status: 'SUCCESS' };
    if (req.user.role !== 'ADMIN') {
      const instructorCourseIds = await Course.find({ instructorId: req.user.id }).distinct('_id');
      paymentQuery.courseId = { $in: instructorCourseIds };
    }
    const paymentAgg = await Payment.aggregate([
      { $match: paymentQuery },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = paymentAgg[0]?.total || 0;

    let totalNetworkUsers = 0;
    if (req.user.role === 'ADMIN') {
      totalNetworkUsers = await User.countDocuments();
    }

    const total = result.length;
    const yetToStart = result.filter((e) => e.status === 'YET_TO_START').length;
    const inProgress = result.filter((e) => e.status === 'IN_PROGRESS').length;
    const completed = result.filter((e) => e.status === 'COMPLETED').length;

    res.json({
      enrollments: result,
      stats: { total, yetToStart, inProgress, completed },
      platform: { totalCourses, totalReviews, totalRevenue, totalNetworkUsers, totalEnrollments: total },
    });
  } catch (error) {
    console.error('getReporting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getReporting };
