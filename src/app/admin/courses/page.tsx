import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import AdminCourseList from '@/components/admin-course-list';

async function getCourses() {
  await dbConnect();
  try {
    const courses = await Course.find({}).sort({ title: 1 }).lean();
    return JSON.parse(JSON.stringify(courses));
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return [];
  }
}

export default async function AdminCoursesPage() {
  const courses = await getCourses();
  return <AdminCourseList courses={courses} />;
}
