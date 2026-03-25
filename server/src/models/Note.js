const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
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
  },
  content: {
    type: String,
    required: true
  }
}, { timestamps: true });

// A user can have multiple notes for a lesson (e.g. at different timestamps), 
// but for simplicity we'll just allow one primary note per lesson for now.
noteSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

module.exports = mongoose.model('Note', noteSchema);
