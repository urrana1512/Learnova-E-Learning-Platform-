const Bookmark = require('../models/Bookmark');

const addBookmark = async (req, res) => {
  try {
    const { courseId, lessonId } = req.body;
    const userId = req.user.id;

    const bookmark = await Bookmark.create({ userId, courseId, lessonId });
    res.status(201).json(bookmark);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Lesson already bookmarked' });
    res.status(500).json({ message: 'Failed to add bookmark' });
  }
};

const removeBookmark = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;

    await Bookmark.findOneAndDelete({ userId, lessonId });
    res.json({ message: 'Bookmark removed' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove bookmark' });
  }
};

const getBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.query;
    
    const query = { userId };
    if (courseId) query.courseId = courseId;

    const bookmarks = await Bookmark.find(query).lean();
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookmarks' });
  }
};

module.exports = { addBookmark, removeBookmark, getBookmarks };
