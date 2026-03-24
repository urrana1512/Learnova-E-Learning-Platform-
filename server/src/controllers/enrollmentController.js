const { sendLearnerEnrollmentEmail, sendInstructorEnrollmentEmail } = require('../utils/email');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const Payment = require('../models/Payment');
const LessonProgress = require('../models/LessonProgress');

const enroll = async (req, res) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.accessRule === 'ON_PAYMENT' && !req.body.simulated) {
      return res.status(403).json({ message: 'This course requires payment. Please use the payment gateway.' });
    }

    const learner = await User.findById(req.user.id);
    const instructor = await User.findById(course.instructorId);

    const existing = await Enrollment.findOne({ userId: req.user.id, courseId });
    if (existing) return res.status(409).json({ message: 'Already enrolled' });

    // Sequential operations (replacing Prisma transaction)
    const orderId = 'FREE-' + Math.floor(1000 + Math.random() * 9000);
    await new Payment({
      userId: req.user.id,
      courseId,
      amount: 0,
      method: 'FREE_ACCESS',
      orderId,
      status: 'SUCCESS',
    }).save();

    const enrollment = await new Enrollment({ userId: req.user.id, courseId }).save();
    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate('courseId')
      .lean({ virtuals: true });
    const enrollmentResult = { ...populatedEnrollment, course: populatedEnrollment.courseId };

    // Asynchronous Communication Dispatch (Background)
    (async () => {
      try {
        await Promise.all([
          sendLearnerEnrollmentEmail({
            learnerEmail: learner.email,
            learnerName: learner.name,
            courseName: course.title,
            instructorName: instructor?.name || 'Curriculum Lead',
            courseId: course.id,
          }),
          sendInstructorEnrollmentEmail({
            instructorEmail: instructor?.email,
            instructorName: instructor?.name,
            learnerName: learner.name,
            learnerEmail: learner.email,
            courseName: course.title,
            amount: 0,
            orderId: 'FREE-CAPTURE-' + Math.floor(1000 + Math.random() * 9000),
          }),
        ]);
        console.log(`[ENROLL_HUB] Intelligence tokens dispatched for free acquisition: ${learner.email}`);
      } catch (commError) {
        console.error('[ENROLL_HUB_FAILURE] Communication collapsed:', commError.message);
      }
    })();

    res.status(201).json(enrollmentResult);
  } catch (error) {
    console.error('enroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.user.id })
      .populate({
        path: 'courseId',
        populate: { path: 'instructorId', select: 'name' },
      })
      .sort({ enrolledAt: -1 })
      .lean({ virtuals: true });

    const result = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = enrollment.courseId;
        const { Lesson } = require('../models/Lesson') || { Lesson: require('../models/Lesson') };
        const LessonModel = require('../models/Lesson');
        const lessonIds = (await LessonModel.find({ courseId: course._id }).select('_id').lean()).map((l) => l._id);
        const completedCount = await LessonProgress.countDocuments({
          userId: req.user.id,
          lessonId: { $in: lessonIds },
          isCompleted: true,
        });
        return {
          ...enrollment,
          id: enrollment._id.toString(),
          course: {
            ...course,
            id: course._id.toString(),
            instructor: course.instructorId,
            lessons: lessonIds.map((id) => ({ id: id.toString() })),
          },
          completedLessons: completedCount,
          totalLessons: lessonIds.length,
        };
      })
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const completeCourse = async (req, res) => {
  try {
    const courseId = req.params.id || req.params.courseId;
    const existing = await Enrollment.findOne({ userId: req.user.id, courseId }).populate('courseId');
    if (!existing) return res.status(404).json({ message: 'Enrollment not found' });
    if (existing.status === 'COMPLETED') return res.json({ enrollment: existing, pointsEarned: 0 });

    const pointsEarned = 0;

    existing.status = 'COMPLETED';
    existing.completedAt = new Date();
    await existing.save();

    const updatedUser = await require('../models/User').findById(req.user.id).select('totalPoints');

    res.json({ enrollment: existing, pointsEarned, totalPoints: updatedUser.totalPoints });
  } catch (error) {
    console.error('completeCourse error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateTimeSpent = async (req, res) => {
  try {
    const { deltaSeconds } = req.body;
    const courseId = req.params.courseId || req.params.id;

    const existing = await Enrollment.findOne({ userId: req.user.id, courseId });
    if (!existing) return res.status(404).json({ message: 'Enrollment not found' });

    existing.timeSpent = (existing.timeSpent || 0) + Math.max(0, parseInt(deltaSeconds) || 0);
    await existing.save();

    res.json(existing);
  } catch (error) {
    console.error('updateTimeSpent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { enroll, getMyEnrollments, completeCourse, updateTimeSpent };
