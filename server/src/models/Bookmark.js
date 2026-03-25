const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  }
}, { timestamps: true });

// Ensure a user can only bookmark a specific lesson once
bookmarkSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
