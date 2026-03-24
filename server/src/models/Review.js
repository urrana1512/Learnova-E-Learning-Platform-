const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    rating:   { type: Number, required: true },
    text:     { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ userId: 1, courseId: 1 }, { unique: true });

reviewSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Review', reviewSchema);
