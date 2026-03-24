const { uploadToCloudinary } = require('../utils/cloudinary');
const Lesson = require('../models/Lesson');
const Attachment = require('../models/Attachment');
const Quiz = require('../models/Quiz');

const getLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find({ courseId: req.params.courseId })
      .sort({ order: 1 })
      .lean({ virtuals: true });

    const result = await Promise.all(
      lessons.map(async (l) => {
        const attachments = await Attachment.find({ lessonId: l._id }).lean({ virtuals: true });
        return { 
          ...l, 
          id: l._id.toString(),
          attachments: attachments.map(a => ({ ...a, id: a._id.toString() })) 
        };
      })
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createLesson = async (req, res) => {
  try {
    const { title, type, videoUrl, duration, description, allowDownload, quizId, inlineQuestions } = req.body;
    let fileUrl;
    let autoDuration = null;

    if (req.files && req.files.file) {
      const result = await uploadToCloudinary(req.files.file, 'learnova/lessons');
      fileUrl = result.secure_url;
      if (type === 'VIDEO' && result.duration) {
        autoDuration = Math.round(result.duration / 60);
      }
    }

    // Get max order in course
    const maxLesson = await Lesson.findOne({ courseId: req.params.courseId }).sort({ order: -1 }).select('order').lean();
    const nextOrder = (maxLesson?.order || 0) + 1;

    // Handle inline quiz questions for QUIZ-type lessons
    let resolvedQuizId = quizId || null;
    if (type === 'QUIZ' && inlineQuestions) {
      const questions = JSON.parse(inlineQuestions);
      if (questions && questions.length > 0) {
        if (resolvedQuizId) {
          // Update existing quiz questions
          const quiz = await Quiz.findById(resolvedQuizId);
          if (quiz) {
            quiz.questions = questions.map((q, i) => ({
              text: q.text,
              order: i,
              options: q.options.map((opt) => ({ text: opt.text, isCorrect: opt.isCorrect })),
            }));
            await quiz.save();
          }
        } else {
          // Auto-create a quiz for this module
          const newQuiz = await new Quiz({
            courseId: req.params.courseId,
            title: `${title} — Quiz`,
            questions: questions.map((q, i) => ({
              text: q.text,
              order: i,
              options: q.options.map((opt) => ({ text: opt.text, isCorrect: opt.isCorrect })),
            })),
          }).save();
          resolvedQuizId = newQuiz._id;
        }
      }
    }

    const lesson = await new Lesson({
      courseId: req.params.courseId,
      title,
      type,
      videoUrl: videoUrl || null,
      duration: autoDuration || (duration ? parseInt(duration) || null : null),
      fileUrl: fileUrl || null,
      description: description || null,
      quizId: resolvedQuizId || null,
      allowDownload: allowDownload === 'true' || allowDownload === true,
      order: nextOrder,
    }).save();

    const attachments = await Attachment.find({ lessonId: lesson._id }).lean({ virtuals: true });
    res.status(201).json({ 
      ...lesson.toJSON(), 
      id: lesson._id.toString(), 
      attachments: attachments.map(a => ({ ...a, id: a._id.toString() })) 
    });
  } catch (error) {
    console.error('createLesson error:', error);
    res.status(500).json({ message: error?.message || 'Server error' });
  }
};

const updateLesson = async (req, res) => {
  try {
    const { title, type, videoUrl, duration, description, allowDownload, order, quizId, inlineQuestions } = req.body;
    let fileUrl;
    let autoDuration = null;

    if (req.files && req.files.file) {
      const result = await uploadToCloudinary(req.files.file, 'learnova/lessons');
      fileUrl = result.secure_url;
      if ((type === 'VIDEO' || req.body.type === 'VIDEO') && result.duration) {
        autoDuration = Math.round(result.duration / 60);
      }
    }

    // Handle inline quiz questions
    let resolvedQuizId = quizId || null;
    if (type === 'QUIZ' && inlineQuestions) {
      const questions = JSON.parse(inlineQuestions);
      if (questions && questions.length > 0) {
        if (resolvedQuizId) {
          const quiz = await Quiz.findById(resolvedQuizId);
          if (quiz) {
            quiz.questions = questions.map((q, i) => ({
              text: q.text,
              order: i,
              options: q.options.map((opt) => ({ text: opt.text, isCorrect: opt.isCorrect })),
            }));
            await quiz.save();
          }
        } else {
          const existingLesson = await Lesson.findById(req.params.id);
          const newQuiz = await new Quiz({
            courseId: existingLesson.courseId,
            title: `${title} — Quiz`,
            questions: questions.map((q, i) => ({
              text: q.text,
              order: i,
              options: q.options.map((opt) => ({ text: opt.text, isCorrect: opt.isCorrect })),
            })),
          }).save();
          resolvedQuizId = newQuiz._id;
        }
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
    if (autoDuration) updateData.duration = autoDuration;
    else if (duration !== undefined) updateData.duration = duration ? parseInt(duration) || null : null;
    if (description !== undefined) updateData.description = description;
    if (allowDownload !== undefined) updateData.allowDownload = allowDownload === 'true' || allowDownload === true;
    if (order !== undefined) updateData.order = parseInt(order);
    updateData.quizId = resolvedQuizId;
    if (fileUrl) updateData.fileUrl = fileUrl;
    else if (req.body.deleteFile === 'true' || req.body.deleteFile === true) updateData.fileUrl = null;

    const lesson = await Lesson.findByIdAndUpdate(req.params.id, updateData, { new: true }).lean({ virtuals: true });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    const attachments = await Attachment.find({ lessonId: lesson._id }).lean({ virtuals: true });
    res.json({ 
      ...lesson, 
      id: lesson._id.toString(),
      attachments: attachments.map(a => ({ ...a, id: a._id.toString() })) 
    });
  } catch (error) {
    console.error('updateLesson error:', error?.message, error?.code);
    res.status(500).json({ message: error?.message || 'Server error' });
  }
};

// GET quiz questions for a lesson (to load in editor)
const getLessonQuiz = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).select('quizId').lean();
    if (!lesson?.quizId) return res.json({ questions: [] });
    const quiz = await Quiz.findById(lesson.quizId).lean({ virtuals: true });
    const questions = (quiz?.questions || []).sort((a, b) => a.order - b.order);
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteLesson = async (req, res) => {
  try {
    await Lesson.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lesson deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addAttachment = async (req, res) => {
  try {
    const { type, url, name } = req.body;
    let attachUrl = url;

    if (req.files && req.files.file) {
      const result = await uploadToCloudinary(req.files.file, 'learnova/attachments');
      attachUrl = result.secure_url;
    }

    const attachment = await new Attachment({
      lessonId: req.params.id,
      type: type || 'LINK',
      url: attachUrl,
      name,
    }).save();
    res.status(201).json(attachment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteAttachment = async (req, res) => {
  try {
    await Attachment.findByIdAndDelete(req.params.attachmentId);
    res.json({ message: 'Attachment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getLessons, createLesson, updateLesson, deleteLesson, addAttachment, deleteAttachment, getLessonQuiz };
