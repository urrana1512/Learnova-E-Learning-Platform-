const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let token = '';

async function testAnnouncements() {
  try {
    console.log('--- Testing Announcements API ---');

    // 1. Login as Admin
    console.log('1. Logging in as Admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@learnova.com',
      password: 'adminpassword'
    });
    token = loginRes.data.accessToken;
    const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Get any course ID
    console.log('2. Fetching courses...');
    const coursesRes = await axios.get(`${API_URL}/courses`, axiosConfig);
    if (!coursesRes.data.length) throw new Error('No courses found to test with');
    const courseId = coursesRes.data[0].id;
    console.log(`Using Course ID: ${courseId}`);

    // 3. Post an announcement
    console.log('3. Posting announcement...');
    const postRes = await axios.post(`${API_URL}/courses/${courseId}/announcements`, {
      title: 'Automated Test Announcement',
      content: 'This is a test announcement from the verification script.',
      type: 'INFO'
    }, axiosConfig);
    const annId = postRes.data.id;
    console.log('Announcement posted:', annId);

    // 4. Fetch announcements
    console.log('4. Fetching announcements...');
    const listRes = await axios.get(`${API_URL}/courses/${courseId}/announcements`, axiosConfig);
    const found = listRes.data.find(a => a.id === annId);
    if (found) {
      console.log('✅ Announcement found in list');
    } else {
      throw new Error('Announcement NOT found in list');
    }

    // 5. Delete announcement
    console.log('5. Deleting announcement...');
    await axios.delete(`${API_URL}/announcements/${annId}`, axiosConfig);
    console.log('✅ Announcement deleted');

    console.log('--- All Tests Passed ✅ ---');
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
  }
}

testAnnouncements();
