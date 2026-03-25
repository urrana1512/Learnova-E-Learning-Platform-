const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Course = require('./models/Course');
const Lesson = require('./models/Lesson');
const Attachment = require('./models/Attachment');

async function checkCourse(id) {
  try {
    console.log('Connecting to:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const course = await Course.findById(id).lean();
    console.log('COURSE DATA:', JSON.stringify(course, null, 2));

    const lessons = await Lesson.find({ courseId: id }).lean();
    console.log('LESSONS DATA:', JSON.stringify(lessons, null, 2));

    const lessonIds = lessons.map(l => l._id);
    const attachments = await Attachment.find({ lessonId: { $in: lessonIds } }).lean();
    console.log('ATTACHMENTS DATA:', JSON.stringify(attachments, null, 2));

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkCourse('69c16c5ab104c5c560f1b863');
