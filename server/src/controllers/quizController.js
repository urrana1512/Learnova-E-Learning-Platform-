const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');

const getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ courseId: req.params.courseId }).lean({ virtuals: true });
    const result = await Promise.all(
      quizzes.map(async (q) => {
        const attemptCount = await QuizAttempt.countDocuments({ quizId: q._id });
        return { 
          ...q, 
          id: q._id.toString(),
          _count: { attempts: attemptCount } 
        };
      })
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createQuiz = async (req, res) => {
  try {
    const { title, isFinal } = req.body;
    const quiz = await new Quiz({
      courseId: req.params.courseId,
      title,
      isFinal: !!isFinal,
    }).save();
    res.status(201).json({ ...quiz.toJSON(), id: quiz._id.toString() });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).lean({ virtuals: true });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const formattedQuestions = (quiz.questions || []).map(q => ({
      ...q,
      id: q._id.toString(),
      options: (q.options || []).map(o => ({ ...o, id: o._id.toString() }))
    })).sort((a, b) => a.order - b.order);

    let userAttempts = [];
    if (req.user) {
      userAttempts = await QuizAttempt.find({ userId: req.user.id, quizId: req.params.id })
        .sort({ completedAt: -1 })
        .lean({ virtuals: true });
      userAttempts = userAttempts.map(a => ({ ...a, id: a._id.toString() }));
    }

    res.json({ 
      ...quiz, 
      id: quiz._id.toString(),
      questions: formattedQuestions, 
      userAttempts 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { title: req.body.title },
      { new: true }
    ).lean({ virtuals: true });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json({ ...quiz, id: quiz._id.toString() });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteQuiz = async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quiz deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addQuestion = async (req, res) => {
  try {
    const { text, options } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const maxOrder = quiz.questions.length > 0
      ? Math.max(...quiz.questions.map((q) => q.order || 0))
      : 0;

    const newQuestion = {
      text,
      order: maxOrder + 1,
      options: options.map((opt) => ({ text: opt.text, isCorrect: opt.isCorrect })),
    };
    quiz.questions.push(newQuestion);
    await quiz.save();

    const added = quiz.questions[quiz.questions.length - 1];
    const addedObj = added.toJSON ? added.toJSON() : added;
    res.status(201).json({ ...addedObj, id: added._id.toString() });
  } catch (error) {
    console.error('addQuestion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { text, options } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const question = quiz.questions.id(req.params.questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    question.text = text;
    question.options = options.map((opt) => ({ text: opt.text, isCorrect: opt.isCorrect }));
    await quiz.save();

    const updatedObj = question.toJSON ? question.toJSON() : question;
    res.json({ ...updatedObj, id: question._id.toString() });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    quiz.questions.pull({ _id: req.params.questionId });
    await quiz.save();
    res.json({ message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateRewards = async (req, res) => {
  try {
    const { attempt1, attempt2, attempt3, attempt4 } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    quiz.rewards = {
      attempt1: parseInt(attempt1) || 100,
      attempt2: parseInt(attempt2) || 75,
      attempt3: parseInt(attempt3) || 50,
      attempt4: parseInt(attempt4) || 25,
    };
    await quiz.save();
    res.json(quiz.rewards);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const submitAttempt = async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;
    const { id: quizId } = req.params;
    const userId = req.user.id;

    console.log(`[QuizSubmit] Processing quizId=${quizId} for userId=${userId}`);

    const quiz = await Quiz.findById(quizId).lean({ virtuals: true });
    if (!quiz) {
      console.warn(`[QuizSubmit] Quiz not found: ${quizId}`);
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      console.warn(`[QuizSubmit] Quiz has no questions: ${quizId}`);
      return res.json({ score: 0, pointsEarned: 0, totalPoints: req.user.totalPoints || 0, correct: 0, total: 0 });
    }

    // Calculate score — answers keys are question _id strings
    let correct = 0;
    for (const question of quiz.questions) {
      const qId = question._id.toString();
      const selectedOptionId = answers[qId];
      const correctOption = question.options.find((o) => o.isCorrect);
      if (correctOption && selectedOptionId === correctOption._id.toString()) correct++;
    }
    const score = Math.round((correct / quiz.questions.length) * 100) || 0;

    // Get attempt number
    const prevAttempts = await QuizAttempt.countDocuments({ userId, quizId });
    const attemptNo = prevAttempts + 1;

    // One-time XP logic
    const alreadyEarned = await QuizAttempt.findOne({ userId, quizId, pointsEarned: { $gt: 0 } });

    let pointsEarned = 0;
    if (!alreadyEarned && score === 100 && (req.user.role === 'LEARNER' || req.user.role === 'ADMIN')) {
      const rewards = quiz.rewards;
      if (rewards) {
        if (attemptNo === 1) pointsEarned = rewards.attempt1;
        else if (attemptNo === 2) pointsEarned = rewards.attempt2;
        else if (attemptNo === 3) pointsEarned = rewards.attempt3;
        else pointsEarned = rewards.attempt4;
      } else {
        pointsEarned = 10;
      }
    }

    const attempt = await new QuizAttempt({
      userId,
      quizId,
      attemptNo,
      score,
      pointsEarned,
      answers,
      timeTaken: parseInt(timeTaken) || 0,
    }).save();

    // Add points to user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { totalPoints: pointsEarned || 0 } },
      { new: true }
    ).select('totalPoints');

    console.log(`[QuizSubmit] Success: userId=${userId}, score=${score}, pointsEarned=${pointsEarned}`);
    res.json({ attempt, score, pointsEarned, totalPoints: updatedUser.totalPoints, correct, total: quiz.questions.length });
  } catch (error) {
    console.error('[QuizSubmit] FATAL ERROR:', error);
    res.status(500).json({ message: error?.message || 'Server error during submission' });
  }
};

module.exports = { getQuizzes, createQuiz, getQuiz, updateQuiz, deleteQuiz, addQuestion, updateQuestion, deleteQuestion, updateRewards, submitAttempt };
