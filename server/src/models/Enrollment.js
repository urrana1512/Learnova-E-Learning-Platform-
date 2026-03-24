const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    enrolledAt:  { type: Date, default: Date.now },
    startedAt:   { type: Date, default: null },
    completedAt: { type: Date, default: null },
    timeSpent:   { type: Number, default: 0 },
    status:      { type: String, enum: ['YET_TO_START', 'IN_PROGRESS', 'COMPLETED'], default: 'YET_TO_START' },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

enrollmentSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);
