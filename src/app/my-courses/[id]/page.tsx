
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import Lecture from '@/models/Lecture';
import Assignment from '@/models/Assignment';
import Quiz from '@/models/Quiz';
import Enrollment from '@/models/Enrollment';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ClipboardList, HelpCircle, Lock } from 'lucide-react';
import type { ILecture } from '@/models/Lecture';
import type { IAssignment } from '@/models/Assignment';
import type { IQuiz } from '@/models/Quiz';
import MyCourseClient from '@/components/my-course-client';

async function getCourseData(courseId: string) {
  try {
    await dbConnect();
    const course = await Course.findById(courseId).lean();
    if (!course) return null;

    const lectures = await Lecture.find({ course: courseId }).sort({ order: 1 }).lean();
    const assignments = await Assignment.find({ course: courseId }).sort({ assignmentNumber: 1 }).lean();
    const quizzes = await Quiz.find({ course: courseId }).sort({ createdAt: 1 }).lean();

    return {
      course: JSON.parse(JSON.stringify(course)),
      lectures: JSON.parse(JSON.stringify(lectures)) as ILecture[],
      assignments: JSON.parse(JSON.stringify(assignments)) as IAssignment[],
      quizzes: JSON.parse(JSON.stringify(quizzes)) as IQuiz[],
    };
  } catch (error) {
    console.error("Failed to fetch course data:", error);
    return null;
  }
}

async function getUser() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as { id: string; name: string; role?: string };
  } catch {
    return null;
  }
}

async function verifyEnrollment(userId: string, courseId: string): Promise<boolean> {
    await dbConnect();
    const enrollment = await Enrollment.findOne({ user: userId, course: courseId, status: 'approved' });
    return !!enrollment;
}

export default async function MyCoursePage({ params }: { params: { id: string } }) {
  const user = await getUser();
  
  if (!user) {
    // This case should be handled by middleware, but as a fallback
    notFound();
  }

  const isEnrolled = await verifyEnrollment(user.id, params.id);

  if (!isEnrolled) {
    return (
      <div className="container py-12 text-center">
         <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2"><Lock /> Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <p>You are not enrolled in this course or your enrollment is still pending.</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  const courseData = await getCourseData(params.id);

  if (!courseData) {
    notFound();
  }

  const { course, lectures, assignments, quizzes } = courseData;

  return (
    <div className="container py-12">
        <MyCourseClient 
            course={course}
            lectures={lectures}
            assignments={assignments}
            quizzes={quizzes}
        />
    </div>
  );
}
