const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lessonId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

lessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

lessonProgressSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('LessonProgress', lessonProgressSchema);
