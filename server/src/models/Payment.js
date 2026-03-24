const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    amount:   { type: Number, required: true },
    method:   { type: String, required: true },
    last4:    { type: String, default: null },
    orderId:  { type: String, required: true },
    status:   { type: String, default: 'SUCCESS' },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

paymentSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Payment', paymentSchema);
