const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title:        { type: String, required: true },
    description:  { type: String, default: null },
    coverImage:   { type: String, default: null },
    tags:         { type: [String], default: [] },
    isPublished:  { type: Boolean, default: false },
    visibility:   { type: String, enum: ['EVERYONE', 'SIGNED_IN'], default: 'EVERYONE' },
    accessRule:   { type: String, enum: ['OPEN', 'ON_INVITATION', 'ON_PAYMENT'], default: 'OPEN' },
    price:        { type: Number, default: null },
    website:      { type: String, default: null },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rewardXP:     { type: Number, default: 500 },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

courseSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Course', courseSchema);
