const Enrollment = require('../../models/Enrollment');
const Course = require('../../models/Course');
const LessonProgress = require('../../models/LessonProgress');
const QuizAttempt = require('../../models/QuizAttempt');
const User = require('../../models/User');

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get Enrollments and basic counts
    const enrollments = await Enrollment.find({ userId })
      .populate('courseId')
      .lean();

    const inProgress = enrollments.filter(e => e.status === 'IN_PROGRESS').length;
    const completed = enrollments.filter(e => e.status === 'COMPLETED').length;

    // 2. Calculate Total XP and Course Progress
    const user = await User.findById(userId).select('totalPoints');
    
    // 3. Get Recent Activity (Module completions + Quiz attempts)
    const recentProgress = await LessonProgress.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate({
        path: 'lessonId',
        select: 'title type',
        populate: { path: 'courseId', select: 'title' }
      })
      .lean();

    const recentQuizzes = await QuizAttempt.find({ userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate({
        path: 'quizId',
        select: 'title',
        populate: { path: 'courseId', select: 'title' }
      })
      .lean();

    const activity = [
      ...recentProgress.map(p => ({
        id: p._id,
        title: p.lessonId?.title || 'Unknown Module',
        course: p.lessonId?.courseId?.title || 'Unknown Course',
        type: p.lessonId?.type || 'CONTENT',
        date: p.updatedAt,
        isCompleted: p.isCompleted,
        score: null
      })),
      ...recentQuizzes.map(q => ({
        id: q._id,
        title: q.quizId?.title || 'Knowledge Check',
        course: q.quizId?.courseId?.title || 'Unknown Course',
        type: 'QUIZ',
        date: q.createdAt,
        isCompleted: q.score >= 70,
        score: q.score
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

    // 4. Recommendations
    const enrolledCourseIds = enrollments.map(e => e.courseId?._id);
    const recommendations = await Course.find({ 
      _id: { $nin: enrolledCourseIds },
      isPublished: true 
    })
    .sort({ createdAt: -1 })
    .limit(4)
    .populate('instructorId', 'name')
    .lean();

    // 5. Weekly Activity & Streak
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weekProgress = await LessonProgress.find({
      userId,
      updatedAt: { $gte: sevenDaysAgo }
    }).select('updatedAt');

    const streakDays = new Set(weekProgress.map(p => p.updatedAt.toDateString())).size;

    // Weekly XP Breakdown (Mock for now, can be expanded with a dedicated XP log model)
    const weeklyXP = [120, 450, 300, 0, 800, 200, 150]; // Sun-Sat

    // 6. Global Rank
    const totalUsers = await User.countDocuments({ isActive: true });
    const usersWithMorePoints = await User.countDocuments({ totalPoints: { $gt: user.totalPoints || 0 } });
    const rank = usersWithMorePoints + 1;

    res.json({
      stats: {
        totalXP: user.totalPoints || 0,
        enrolled: enrollments.length,
        inProgress,
        completed,
        streak: streakDays,
        rank: `${rank}/${totalUsers}`
      },
      activity,
      weeklyXP,
      recommendations: recommendations.map(c => ({
        ...c,
        id: c._id.toString(),
        instructor: c.instructorId?.name
      })),
      recentCourse: enrollments.length > 0 ? {
        ...enrollments[0].courseId,
        id: enrollments[0].courseId._id.toString(),
        status: enrollments[0].status
      } : null
    });

  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ message: 'Failed to aggregate dashboard metrics' });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find({ role: 'STUDENT', isActive: true })
      .sort({ totalPoints: -1 })
      .limit(10)
      .select('name profileImage totalPoints')
      .lean();

    res.json({ success: true, data: topUsers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to Fetch Leaderboard' });
  }
};

const getLearningInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Aggregate quiz attempts to find scores by question category
    const QuizAttemptModel = require('../../models/QuizAttempt');
    const attempts = await QuizAttemptModel.find({ userId }).populate('quizId').lean();
    
    const performanceMap = {};

    for (const attempt of attempts) {
      if (!attempt.quizId) continue;
      const categories = [...new Set(attempt.quizId.questions?.map(q => q.category) || ['General'])];
      categories.forEach(cat => {
        if (!performanceMap[cat]) performanceMap[cat] = { total: 0, count: 0 };
        performanceMap[cat].total += attempt.score;
        performanceMap[cat].count += 1;
      });
    }

    const insights = Object.keys(performanceMap).map(cat => ({
      category: cat,
      averageScore: Math.round(performanceMap[cat].total / performanceMap[cat].count),
      attempts: performanceMap[cat].count
    }));

    res.json({ success: true, data: insights });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to analyze learning insights' });
  }
};

module.exports = { getDashboardStats, getLeaderboard, getLearningInsights };
