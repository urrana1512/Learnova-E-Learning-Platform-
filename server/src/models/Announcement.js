const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title:    { type: String, required: true },
    content:  { type: String, required: true },
    type:     { type: String, enum: ['INFO', 'ALERT', 'UPDATE'], default: 'INFO' },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

announcementSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Announcement', announcementSchema);
