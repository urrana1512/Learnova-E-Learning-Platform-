const Announcement = require('../models/Announcement');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Notification = require('../models/Notification');

const createAnnouncement = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, content, type } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Check if user is instructor or admin
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only instructors can post announcements' });
    }

    const announcement = new Announcement({
      courseId,
      title,
      content,
      type
    });

    await announcement.save();

    // Trigger Notifications for all enrolled students
    const enrollments = await Enrollment.find({ courseId });
    const notificationPromises = enrollments.map(e => {
      return new Notification({
        userId: e.userId,
        title: `New Announcement in ${course.title}`,
        message: title,
        type: 'COURSE_UPDATE',
        meta: { courseId, announcementId: announcement._id }
      }).save();
    });
    
    await Promise.all(notificationPromises);

    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create announcement' });
  }
};

const getCourseAnnouncements = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Optional: Check if user is enrolled or instructor/admin
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const isInstructor = course.instructorId.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    const enrollment = await Enrollment.findOne({ userId: req.user.id, courseId });

    if (!isInstructor && !isAdmin && !enrollment) {
      return res.status(403).json({ message: 'Access denied. Please enroll to see announcements.' });
    }

    const announcements = await Announcement.find({ courseId }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id).populate('courseId');
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    if (announcement.courseId.instructorId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Announcement.findByIdAndDelete(id);
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete announcement' });
  }
};

module.exports = { createAnnouncement, getCourseAnnouncements, deleteAnnouncement };
