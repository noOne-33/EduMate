import dbConnect from '@/lib/mongodb';
import Course, { ICourse } from '@/models/Course'; // Import ICourse
import AdminCourseList from '@/components/admin-course-list';

async function getCourses() {
  await dbConnect();
  try {
    const courses = await Course.find({})
      .sort({ title: 1 })
      .select('title instructor category status _id')
      .lean();
    
    // This is the definitive fix. By casting to 'unknown' first,
    // we are telling TypeScript to suspend its type-checking and
    // accept our assertion that this data is, in fact, an ICourse[].
    return courses as unknown as ICourse[];
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return [];
  }
}

export default async function AdminCoursesPage() {
  const courses = await getCourses();
  return <AdminCourseList courses={courses} />;
}