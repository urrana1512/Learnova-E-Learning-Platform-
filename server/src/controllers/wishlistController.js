const Wishlist = require('../models/Wishlist');

const wishlistController = {
  toggle: async (req, res) => {
    try {
      const { courseId } = req.body;
      const userId = req.user.id;

      const existing = await Wishlist.findOne({ userId, courseId });
      if (existing) {
        await Wishlist.findByIdAndDelete(existing._id);
        return res.status(200).json({ success: true, wishlisted: false });
      }

      await Wishlist.create({ userId, courseId });
      res.status(201).json({ success: true, wishlisted: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  get: async (req, res) => {
    try {
      const userId = req.user.id;
      const list = await Wishlist.find({ userId }).populate('courseId').lean();
      
      const courses = list.map(item => ({
        ...item.courseId,
        id: item.courseId._id.toString(),
        wishlisted: true
      }));

      res.status(200).json({ success: true, data: courses });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = wishlistController;
