const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    courseId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title:         { type: String, required: true },
    type:          { type: String, enum: ['VIDEO', 'DOCUMENT', 'IMAGE', 'QUIZ'], required: true },
    videoUrl:      { type: String, default: null },
    duration:      { type: Number, default: null },
    fileUrl:       { type: String, default: null },
    allowDownload: { type: Boolean, default: false },
    description:   { type: String, default: null },
    order:         { type: Number, default: 0 },
    quizId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', default: null },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

lessonSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Lesson', lessonSchema);
