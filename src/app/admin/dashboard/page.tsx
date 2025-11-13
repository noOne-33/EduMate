import AdminDashboardClient from '@/components/admin-dashboard-client';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';

async function getDashboardData() {
  await dbConnect();
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalInstructors = await User.countDocuments({
      role: 'instructor',
      status: 'active',
    });
    const totalCourses = await Course.countDocuments({});
    const pendingInstructors = await User.find({
      role: 'instructor',
      status: 'pending',
    }).lean();

    // Revenue and other data points are static for now
    return {
      totalStudents,
      totalInstructors,
      totalCourses,
      pendingInstructors: JSON.parse(JSON.stringify(pendingInstructors)),
      totalRevenue: 150231.89,
      revenueLastMonthPercent: 20.1,
      studentsLastMonthPercent: 12,
      instructorsLastMonthCount: 5,
      coursesLastMonthCount: 30,
      TrainAndUpdateChatbotModelData:
        'https://studio.botpress.cloud/43f2c90a-999d-4619-a6bf-b841afd6a40f/kb/kb_01K9Z1T8HBJMP1YRNB4PJKE4MP',
    };
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return {
      totalStudents: 0,
      totalInstructors: 0,
      totalCourses: 0,
      pendingInstructors: [],
      totalRevenue: 0,
      revenueLastMonthPercent: 0,
      studentsLastMonthPercent: 0,
      instructorsLastMonthCount: 0,
      coursesLastMonthCount: 0,
      TrainAndUpdateChatbotModelData: '',
    };
  }
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  return <AdminDashboardClient data={data} />;
}
