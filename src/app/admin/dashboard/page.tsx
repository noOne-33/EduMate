import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import AdminDashboardClient from '@/components/admin-dashboard-client';

async function getDashboardData() {
  await dbConnect();
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalInstructors = await User.countDocuments({ role: 'instructor', status: 'active' });
    const totalCourses = await Course.countDocuments({});
    const pendingInstructors = await User.find({ role: 'instructor', status: 'pending' }).lean();

    
    // Revenue and other data points are static for now
    // as the corresponding models/collections don't exist.
    return {
      totalStudents,
      totalInstructors,
      totalCourses,
      pendingInstructors: JSON.parse(JSON.stringify(pendingInstructors)), // Serialize for client component
      totalRevenue: 150231.89, // Static
      revenueLastMonthPercent: 20.1, // Static
      studentsLastMonthPercent: 12, // Static
      instructorsLastMonthCount: 5, // Static
      coursesLastMonthCount: 30, // Static
    };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    // Return default/zero values in case of a DB error
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
    };
  }
}


export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  
  return <AdminDashboardClient data={data} />;
}
