const Note = require('../models/Note');

const upsertNote = async (req, res) => {
  try {
    const { courseId, lessonId, content } = req.body;
    const userId = req.user.id;

    const note = await Note.findOneAndUpdate(
      { userId, lessonId },
      { userId, courseId, lessonId, content },
      { upsert: true, new: true }
    );
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save note' });
  }
};

const deleteNote = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;

    await Note.findOneAndDelete({ userId, lessonId });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete note' });
  }
};

const getNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId, lessonId } = req.query;
    
    const query = { userId };
    if (courseId) query.courseId = courseId;
    if (lessonId) query.lessonId = lessonId;

    const notes = await Note.find(query).lean();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
};

module.exports = { upsertNote, deleteNote, getNotes };
