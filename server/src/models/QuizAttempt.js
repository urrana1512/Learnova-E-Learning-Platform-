const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quizId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    attemptNo:    { type: Number, required: true },
    score:        { type: Number, required: true },
    pointsEarned: { type: Number, default: 0 },
    answers:      { type: mongoose.Schema.Types.Mixed, default: null },
    timeTaken:    { type: Number, default: 0 },
    completedAt:  { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

quizAttemptSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
