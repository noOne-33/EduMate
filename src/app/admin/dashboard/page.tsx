
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import AdminDashboardClient from '@/components/admin-dashboard-client';
import { format } from 'date-fns';

async function getDashboardData() {
  await dbConnect();
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalInstructors = await User.countDocuments({ role: 'instructor', status: 'active' });
    const totalCourses = await Course.countDocuments({});
    const pendingInstructors = await User.find({ role: 'instructor', status: 'pending' }).lean();

    // Revenue calculation
    const approvedEnrollments = await Enrollment.find({ status: 'approved' }).populate('course', 'price').lean();
    const totalRevenue = approvedEnrollments.reduce((acc, e) => acc + ((e.course as any)?.price || 0), 0);
    
    // Recent enrollments for "Recent Transactions"
    const recentEnrollments = await Enrollment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'email')
      .populate('course', 'title price')
      .lean();
    
    const formattedRecentTransactions = recentEnrollments.map(txn => ({
      ...txn,
      createdAt: format(new Date(txn.createdAt), 'PP'), // Format date on the server
    }));


    // Data for charts
    const monthlyEnrollments = await Enrollment.aggregate([
        { $match: { createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } } },
        { $group: { 
            _id: { $month: "$createdAt" },
            enrollments: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
    ]);
    
    const monthlyRevenue = await Enrollment.aggregate([
        { $match: { status: 'approved', createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } } },
        {
          $lookup: {
            from: 'courses',
            localField: 'course',
            foreignField: '_id',
            as: 'courseDetails'
          }
        },
        { $unwind: '$courseDetails' },
        { $group: {
            _id: { $month: "$createdAt" },
            revenue: { $sum: "$courseDetails.price" }
        }},
        { $sort: { _id: 1 } }
    ]);
    
    const courseStatusCounts = await Course.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Simplified stats for now
    const studentsLastMonth = await User.countDocuments({ role: 'student', createdAt: { $gte: oneMonthAgo } });
    const studentsPreviousMonth = await User.countDocuments({ role: 'student', createdAt: { $gte: twoMonthsAgo, $lt: oneMonthAgo } });

    const getPercentageChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    return {
      totalStudents,
      totalInstructors,
      totalCourses,
      pendingInstructors: JSON.parse(JSON.stringify(pendingInstructors)),
      totalRevenue,
      studentsLastMonthPercent: getPercentageChange(studentsLastMonth, studentsPreviousMonth),
      recentTransactions: JSON.parse(JSON.stringify(formattedRecentTransactions)),
      monthlyEnrollments,
      monthlyRevenue,
      courseStatusCounts,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return {
      totalStudents: 0,
      totalInstructors: 0,
      totalCourses: 0,
      pendingInstructors: [],
      totalRevenue: 0,
      studentsLastMonthPercent: 0,
      recentTransactions: [],
      monthlyEnrollments: [],
      monthlyRevenue: [],
      courseStatusCounts: [],
    };
  }
}


export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  
  return <AdminDashboardClient data={data} />;
}
