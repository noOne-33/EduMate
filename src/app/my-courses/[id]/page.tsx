import MyCourseClient from '@/components/my-course-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import * as jose from 'jose';
import { Lock } from 'lucide-react';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
// FIX 1: Import ISubmission interface explicitly
import { IAnnouncement } from '@/models/Announcement';
import { IAssignment } from '@/models/Assignment';
import { ILecture } from '@/models/Lecture';
import { IQuiz } from '@/models/Quiz';
import { IQuizAttempt } from '@/models/QuizAttempt';
import { ISubmission } from '@/models/Submission';

async function getCourseData(courseId: string, userId: string) {
  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return null;
    }

    const courseData = await Course.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(courseId) } },
      {
        $lookup: {
          from: 'lectures',
          localField: '_id',
          foreignField: 'course',
          as: 'lectures',
          pipeline: [{ $sort: { order: 1 } }],
        },
      },
      {
        $lookup: {
          from: 'assignments',
          localField: '_id',
          foreignField: 'course',
          as: 'assignments',
          pipeline: [{ $sort: { assignmentNumber: 1 } }],
        },
      },
      {
        $lookup: {
          from: 'quizzes',
          localField: '_id',
          foreignField: 'course',
          as: 'quizzes',
          pipeline: [{ $sort: { createdAt: 1 } }],
        },
      },
      {
        $lookup: {
          from: 'submissions',
          let: { courseId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$course', '$$courseId'] },
                    { $eq: ['$user', new mongoose.Types.ObjectId(userId)] },
                  ],
                },
              },
            },
          ],
          as: 'submissions',
        },
      },
      {
        $lookup: {
          from: 'quizattempts',
          let: { courseId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$course', '$$courseId'] },
                    { $eq: ['$user', new mongoose.Types.ObjectId(userId)] },
                  ],
                },
              },
            },
          ],
          as: 'quizAttempts',
        },
      },
      {
        $lookup: {
          from: 'announcements',
          localField: '_id',
          foreignField: 'course',
          as: 'announcements',
          pipeline: [{ $sort: { createdAt: -1 } }],
        },
      },
      { $limit: 1 },
    ]);

    if (courseData.length === 0) {
      return null;
    }

    const course = courseData[0];

    // Aggregation returns plain objects, so we need to manually convert ObjectIds to strings
    const sanitize = (obj: any) => JSON.parse(JSON.stringify(obj));

    return sanitize({
      course,
      lectures: course.lectures as ILecture[],
      assignments: course.assignments as IAssignment[],
      quizzes: course.quizzes as IQuiz[],
      submissions: course.submissions as ISubmission[], // Now ISubmission is defined
      quizAttempts: course.quizAttempts as IQuizAttempt[],
      announcements: course.announcements as IAnnouncement[],
    });
  } catch (error) {
    console.error('Failed to fetch course data:', error);
    return null;
  }
}

async function getUser() {
  // FIX 2: Await cookies() (Required in Next.js 15)
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as { id: string; name: string; role?: string };
  } catch {
    return null;
  }
}

async function verifyEnrollment(
  userId: string,
  courseId: string
): Promise<boolean> {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return false;
  }
  const enrollment = await Enrollment.findOne({
    user: userId,
    course: courseId,
    status: 'approved',
  });
  return !!enrollment;
}

// FIX 3: Params is a Promise in Next.js 15
export default async function MyCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params; // Resolve params
  const user = await getUser();

  if (!user) {
    notFound();
  }

  const isEnrolled = await verifyEnrollment(user.id, resolvedParams.id);

  if (!isEnrolled) {
    return (
      <div className="container py-12 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Lock /> Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              You are not enrolled in this course or your enrollment is still
              pending.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = await getCourseData(resolvedParams.id, user.id);

  if (!data) {
    notFound();
  }

  const {
    course,
    lectures,
    assignments,
    submissions,
    announcements,
    quizzes,
    quizAttempts,
  } = data;

  return (
    <div className="container py-12">
      <MyCourseClient
        course={course}
        lectures={lectures}
        assignments={assignments}
        submissions={submissions}
        announcements={announcements}
        quizzes={quizzes}
        quizAttempts={quizAttempts}
      />
    </div>
  );
}
