const mongoose = require('mongoose');

// ── Option sub-schema ──────────────────────────────────────────────────────────
const optionSchema = new mongoose.Schema(
  {
    text:      { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
optionSchema.virtual('id').get(function () { return this._id.toHexString(); });

// ── Question sub-schema ────────────────────────────────────────────────────────
const questionSchema = new mongoose.Schema(
  {
    text:    { type: String, required: true },
    category: { type: String, default: 'General' },
    options: { type: [optionSchema], default: [] },
    order:   { type: Number, default: 0 },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
questionSchema.virtual('id').get(function () { return this._id.toHexString(); });

// ── QuizReward sub-schema ──────────────────────────────────────────────────────
const quizRewardSchema = new mongoose.Schema(
  {
    attempt1: { type: Number, default: 100 },
    attempt2: { type: Number, default: 75 },
    attempt3: { type: Number, default: 50 },
    attempt4: { type: Number, default: 25 },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true }, _id: false }
);

// ── Quiz main schema ───────────────────────────────────────────────────────────
const quizSchema = new mongoose.Schema(
  {
    courseId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title:     { type: String, required: true },
    isFinal:   { type: Boolean, default: false },
    questions: { type: [questionSchema], default: [] },
    rewards:   { type: quizRewardSchema, default: null },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

quizSchema.virtual('id').get(function () { return this._id.toHexString(); });

module.exports = mongoose.model('Quiz', quizSchema);
