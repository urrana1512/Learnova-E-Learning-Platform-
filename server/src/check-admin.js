const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('./models/User');

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const admin = await User.findOne({ email: 'learnova@gmail.com' }).lean();
    if (admin) {
      console.log('ADMIN USER FOUND:', JSON.stringify(admin, null, 2));
    } else {
      console.log('ADMIN USER NOT FOUND. Creating one...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('learnova@123', 10);
      const newAdmin = await new User({
        name: 'Admin Learnova',
        email: 'learnova@gmail.com',
        password: hashedPassword,
        role: 'ADMIN',
        isVerified: true
      }).save();
      console.log('NEW ADMIN CREATED:', newAdmin.email);
    }

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkAdmin();
