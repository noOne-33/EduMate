import CourseForm from '@/components/course-form';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import { notFound } from 'next/navigation';

async function getCourse(id: string) {
  try {
    await dbConnect();
    const course = await Course.findById(id).lean();
    if (!course) {
      return null;
    }
    return JSON.parse(JSON.stringify(course));
  } catch (error) {
    // If the ID format is invalid, findById will throw an error
    console.error("Failed to fetch course:", error);
    return null;
  }
}

export default async function EditCoursePage({ params }: { params: { id: string } }) {
  const course = await getCourse(params.id);

  if (!course) {
    notFound();
  }

  return <CourseForm course={course} />;
}
