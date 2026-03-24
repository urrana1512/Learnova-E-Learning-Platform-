const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    type:     { type: String, required: true },
    url:      { type: String, required: true },
    name:     { type: String, required: true },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

attachmentSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Attachment', attachmentSchema);
