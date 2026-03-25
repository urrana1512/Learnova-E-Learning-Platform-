const Review = require('../models/Review');
const User = require('../models/User');
const Course = require('../models/Course');
const Notification = require('../models/Notification');

const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ courseId: req.params.courseId })
      .populate('userId', 'id name avatar')
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });
    const result = reviews.map((r) => ({ ...r, user: r.userId }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createReview = async (req, res) => {
  try {
    const { rating, text } = req.body;
    if (!rating) return res.status(400).json({ message: 'Rating is required' });

    const existing = await Review.findOne({ userId: req.user.id, courseId: req.params.courseId });
    const pointsEarned = 0; // No XP for reviews per user request

    const review = await Review.findOneAndUpdate(
      { userId: req.user.id, courseId: req.params.courseId },
      { rating: parseInt(rating), text: text || null },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('userId', 'id name avatar').lean({ virtuals: true });

    const updatedUser = await User.findById(req.user.id).select('totalPoints');

    // Notify Instructor
    (async () => {
      try {
        const course = await Course.findById(req.params.courseId).select('title instructorId');
        if (course) {
          const learner = await User.findById(req.user.id).select('name');
          const notif = await new Notification({
            userId: course.instructorId,
            type: 'REVIEW',
            message: `${learner.name} left a ${rating}-star review for ${course.title}!`,
            link: `/admin/courses/${course.id}/edit`
          }).save();

          const { sendToUser } = require('../services/socketService');
          sendToUser(course.instructorId.toString(), 'new_notification', notif);
        }
      } catch (err) {
        console.error('Review notification error:', err);
      }
    })();

    res.status(201).json({
      review: { ...review, user: review.userId },
      pointsEarned,
      totalPoints: updatedUser.totalPoints,
    });
  } catch (error) {
    console.error('createReview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getReviews, createReview };
