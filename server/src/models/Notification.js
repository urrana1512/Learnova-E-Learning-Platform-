const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type:    { type: String, enum: ['INFO', 'SUCCESS', 'FOLLOW', 'MESSAGE', 'SOCIAL'], default: 'INFO' },
    message: { type: String, required: true },
    link:    { type: String, default: null },
    read:    { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

notificationSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Notification', notificationSchema);
