const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    email:       { type: String, required: true, unique: true },
    password:    { type: String, required: true },
    role:        { type: String, enum: ['ADMIN', 'INSTRUCTOR', 'LEARNER'], default: 'LEARNER' },
    isActive:    { type: Boolean, default: true },
    totalPoints: { type: Number, default: 0 },
    avatar:      { type: String, default: null },
    bio:         { type: String, default: '' },
    contactNo:   { type: String, default: '' },
    information: { type: String, default: '' },
    isOnline:    { type: Boolean, default: false },
    lastSeen:    { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual 'id' that mirrors '_id' as a string (keeps existing code working)
userSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('User', userSchema);
