const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendToUser } = require('./socketService');

/**
 * Sends a persistent notification and real-time socket alert to all users with ADMIN role.
 * @param {string} message - The notification message
 * @param {string} link - Navigation link for the notification
 * @param {string} type - Notification type (optional)
 */
const notifyAdmins = async (message, link, type = 'ADMIN_ALERT') => {
  try {
    const admins = await User.find({ role: 'ADMIN' }).select('_id');
    if (admins.length === 0) return;

    const adminIds = admins.map(a => a._id);
    
    // 1. Create persistent database records
    const notifications = adminIds.map(id => ({
      userId: id,
      message,
      link,
      type
    }));
    const savedNotifs = await Notification.insertMany(notifications);

    // 2. Dispatch real-time socket events
    adminIds.forEach((id, index) => {
      sendToUser(id.toString(), 'new_notification', savedNotifs[index]);
    });

    console.log(`[ADMIN_NOTIF] Platform alert dispatched to ${admins.length} administrators.`);
  } catch (error) {
    console.error('[ADMIN_NOTIF_ERROR] Failed to broadcast platform alert:', error.message);
  }
};

module.exports = { notifyAdmins };
