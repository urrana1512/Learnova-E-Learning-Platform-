const mongoose = require('mongoose');

const followSchema = new mongoose.Schema(
  {
    followerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

followSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Follow', followSchema);
