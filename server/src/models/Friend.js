const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isFavorite1: {
      type: Boolean,
      default: false
    },
    isFavorite2: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual ID
friendSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Ensure a user cannot have multiple friendship records with the same person
// user1 < user2 for consistency (unique constraint)
friendSchema.index({ user1: 1, user2: 1 }, { unique: true });

module.exports = mongoose.model('Friend', friendSchema);
