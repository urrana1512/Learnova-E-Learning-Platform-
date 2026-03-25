const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  }
}, { timestamps: true });

// Prevent duplicate wishlist entries
wishlistSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
