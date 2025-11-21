'use server';

import Certificate from '@/components/certificate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dbConnect from '@/lib/mongodb';
import { AlertCircle } from 'lucide-react';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

// Import models normally
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import Quiz from '@/models/Quiz';
import QuizAttempt from '@/models/QuizAttempt';
import Submission from '@/models/Submission';

// --- ADD THESE INTERFACES ---
interface ICourse {
  _id: string;
  title: string;
  status: string;
  instructor: string;
}

interface IUser {
  _id: string;
  name: string;
  email: string;
}

interface IEnrollment {
  _id: string;
  course: string;
  user: IUser; // Because we populate 'user'
  status: string;
}
// ----------------------------

async function getCertificateData(courseId: string, userId: string) {
  try {
    await dbConnect();

    // Cast the result to the Interface (or null)
    const course = (await Course.findById(
      courseId
    ).lean()) as unknown as ICourse | null;

    if (!course) {
      return { eligible: false, data: null, error: 'Course not found.' };
    }

    // Now TypeScript knows 'status' exists on 'course'
    if (course.status !== 'completed') {
      return {
        eligible: false,
        data: null,
        error:
          'This course has not been officially marked as completed by the administrator.',
      };
    }

    // Cast the result to the Enrollment Interface
    const enrollment = (await Enrollment.findOne({
      course: courseId,
      user: userId,
      status: 'approved',
    })
      .populate('user')
      .lean()) as unknown as IEnrollment | null;

    // Now TypeScript knows 'user' exists and has a 'name'
    if (!enrollment || !enrollment.user?.name) {
      return {
        eligible: false,
        data: null,
        error: 'User enrollment not found.',
      };
    }

    const assignments = await Assignment.find({ course: courseId }).lean();
    const quizzes = await Quiz.find({ course: courseId }).lean();
    const submissions = await Submission.find({
      course: courseId,
      user: userId,
    }).lean();
    const quizAttempts = await QuizAttempt.find({
      course: courseId,
      user: userId,
    }).lean();

    const allCourseworkComplete =
      submissions.length >= assignments.length &&
      quizAttempts.length >= quizzes.length;

    if (!allCourseworkComplete) {
      return {
        eligible: false,
        data: null,
        error:
          'You have not completed all assignments and quizzes for this course.',
      };
    }

    // Handle dates (Assuming Mongoose documents have generic types for these arrays if not typed explicitly)
    let completionDate = new Date(0);

    // Explicitly casting s and a to 'any' to avoid date comparison errors if models aren't typed
    submissions.forEach((s: any) => {
      if (new Date(s.submittedAt) > completionDate)
        completionDate = new Date(s.submittedAt);
    });
    quizAttempts.forEach((a: any) => {
      if (new Date(a.submittedAt) > completionDate)
        completionDate = new Date(a.submittedAt);
    });

    return {
      eligible: true,
      data: {
        studentName: enrollment.user.name, // No longer need 'as any'
        courseName: course.title,
        instructorName: course.instructor,
        completionDate: completionDate.toISOString(),
        verificationId: enrollment._id.toString(),
      },
      error: null,
    };
  } catch (error) {
    console.error('Failed to check certificate eligibility:', error);
    return {
      eligible: false,
      data: null,
      error: 'An error occurred while checking your eligibility.',
    };
  }
}

import { jwtVerify } from 'jose';

async function getUser() {
  // 1. Await the cookies() function (Required for Next.js 15)
  const cookieStore = await cookies();

  // 2. Retrieve the token value
  const token = cookieStore.get('token')?.value;

  // 3. If no token exists, return null immediately
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

    // 4. Verify the token using jose
    const { payload } = await jwtVerify(token, secret);

    // 5. Return the payload typed correctly
    return payload as { id: string; name: string; role?: string };
  } catch (error) {
    // Return null if verification fails (expired/invalid token)
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

export default async function CertificatePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUser();

  if (!user) {
    notFound();
  }

  const isEnrolled = await verifyEnrollment(user.id, params.id);
  if (!isEnrolled) {
    notFound();
  }

  const { eligible, data, error } = await getCertificateData(
    params.id,
    user.id
  );

  if (!eligible || !data) {
    return (
      <div className="container py-12 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <AlertCircle /> Not Yet Eligible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Certificate
      studentName={data.studentName}
      courseName={data.courseName}
      instructorName={data.instructorName}
      completionDate={data.completionDate}
      verificationId={data.verificationId}
    />
  );
}
