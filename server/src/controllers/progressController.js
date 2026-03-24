const LessonProgress = require('../models/LessonProgress');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

const markLessonComplete = async (req, res) => {
  try {
    const { lessonId } = req.body;
    const lesson = await Lesson.findById(lessonId).select('courseId type duration').lean({ virtuals: true });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const pointsEarned = 0; // No XP reward for lessons per user request

    const progressResult = await LessonProgress.findOneAndUpdate(
      { userId: req.user.id, lessonId },
      { isCompleted: true, completedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean({ virtuals: true });

    // Update enrollment status to IN_PROGRESS if YET_TO_START
    const enrollment = await Enrollment.findOne({ userId: req.user.id, courseId: lesson.courseId });
    if (enrollment && enrollment.status === 'YET_TO_START') {
      enrollment.status = 'IN_PROGRESS';
      enrollment.startedAt = new Date();
      await enrollment.save();
    }

    // Check if all lessons are completed
    const totalLessons = await Lesson.countDocuments({ courseId: lesson.courseId });

    // Count completed by joining lesson IDs
    const allLessonIds = await Lesson.find({ courseId: lesson.courseId }).distinct('_id');
    const completedLessons = await LessonProgress.countDocuments({
      userId: req.user.id,
      lessonId: { $in: allLessonIds },
      isCompleted: true,
    });

    const updatedUser = await User.findById(req.user.id).select('totalPoints');

    res.json({
      progress: progressResult,
      completedLessons,
      totalLessons,
      allCompleted: completedLessons >= totalLessons,
      pointsEarned,
      totalPoints: updatedUser.totalPoints,
    });
  } catch (error) {
    console.error('markLessonComplete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProgress = async (req, res) => {
  try {
    const { courseId } = req.query;
    let query = { userId: req.user.id };
    if (courseId) {
      const lessonIds = await Lesson.find({ courseId }).distinct('_id');
      query.lessonId = { $in: lessonIds };
    }
    const progress = await LessonProgress.find(query).lean({ virtuals: true });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { markLessonComplete, getProgress };
