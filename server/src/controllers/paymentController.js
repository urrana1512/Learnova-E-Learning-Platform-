const { sendLearnerPurchaseEmail, sendInstructorEnrollmentEmail } = require('../utils/email');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');

const fakeProcessPayment = async (req, res) => {
  try {
    const { courseId, amount, method, last4 } = req.body;
    const userId = req.user.id;

    // 1. Verify existence and rules with instructor discovery
    const course = await Course.findById(courseId).populate('instructorId', 'id name email').lean({ virtuals: true });
    if (!course) return res.status(404).json({ message: 'Curriculum not discovered' });

    // 2. Fetch Learner Identity
    const learner = await User.findById(userId);
    if (!learner) return res.status(404).json({ message: 'Learner identity not found' });

    if (course.accessRule !== 'ON_PAYMENT' && course.accessRule !== 'OPEN') {
      return res.status(400).json({ message: 'Invalid acquisition rule' });
    }

    // 2. Already enrolled?
    const existing = await Enrollment.findOne({ userId, courseId });
    if (existing) return res.status(409).json({ message: 'Already mastered this curriculum' });

    // 3. Generate Simulated Order ID: LRN-XXXX
    const orderId = `LRN-${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Sequential: Create Payment & Enrollment (replacing Prisma transaction)
    const payment = await new Payment({
      userId,
      courseId,
      amount: parseFloat(amount),
      method,
      last4: last4 || null,
      orderId,
      status: 'SUCCESS',
    }).save();

    await new Enrollment({ userId, courseId, status: 'YET_TO_START' }).save();

    res.status(201).json({
      success: true,
      message: 'Acquisition finalized',
      orderId: payment.orderId,
      paymentId: payment.id,
      method: payment.method,
      amount: payment.amount,
      courseTitle: course.title,
    });

    // 5. Asynchronous Communication Dispatch (Background)
    (async () => {
      try {
        const instructor = course.instructorId;
        await Promise.all([
          sendLearnerPurchaseEmail({
            learnerEmail: learner.email,
            learnerName: learner.name,
            courseName: course.title,
            instructorName: instructor?.name,
            amount: payment.amount,
            orderId: payment.orderId,
            courseId: course.id,
          }),
          sendInstructorEnrollmentEmail({
            instructorEmail: instructor?.email,
            instructorName: instructor?.name,
            learnerName: learner.name,
            learnerEmail: learner.email,
            courseName: course.title,
            amount: payment.amount,
            orderId: payment.orderId,
          }),
        ]);
        console.log(`[COMM_HUB] Intelligence tokens dispatched for ${learner.email} and ${instructor?.email}`);
      } catch (commError) {
        console.error('[COMM_HUB_FAILURE] Settlement communication collapsed:', commError.message);
      }
    })();
  } catch (error) {
    console.error('SIM_PAYMENT_ERROR:', error);
    res.status(500).json({ message: 'Acquisition synchronization failure' });
  }
};

const getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .populate('courseId')
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });
    const result = payments.map((p) => ({ ...p, course: p.courseId }));
    res.json({ success: true, payments: result });
  } catch (error) {
    res.status(500).json({ message: 'Ledger retrieval failure' });
  }
};

const getInstructorPayments = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'ADMIN') {
      // Find courseIds for this instructor
      const instructorCourseIds = await Course.find({ instructorId: req.user.id }).distinct('_id');
      query = { courseId: { $in: instructorCourseIds } };
    }

    const payments = await Payment.find(query)
      .populate('courseId', 'id title coverImage instructorId')
      .populate('userId', 'id name email')
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    const result = payments.map((p) => ({ ...p, course: p.courseId, user: p.userId }));
    res.json({ success: true, payments: result });
  } catch (error) {
    res.status(500).json({ message: 'Revenue ledger retrieval failure' });
  }
};

const getPaymentStats = async (req, res) => {
  try {
    let matchStage = { status: 'SUCCESS' };
    if (req.user.role !== 'ADMIN') {
      const instructorCourseIds = await Course.find({ instructorId: req.user.id }).distinct('_id');
      matchStage = { ...matchStage, courseId: { $in: instructorCourseIds } };
    }

    const payments = await Payment.find(matchStage).select('amount createdAt').lean();

    const dailyRevenue = payments.reduce((acc, curr) => {
      const date = curr.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + curr.amount;
      return acc;
    }, {});

    res.json({ success: true, dailyRevenue });
  } catch (error) {
    console.error('STATS_ERROR:', error);
    res.status(500).json({ message: 'Intelligence aggregation failure' });
  }
};

module.exports = { fakeProcessPayment, getUserPayments, getInstructorPayments, getPaymentStats };
