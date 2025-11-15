import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/models/Submission';
import Course from '@/models/Course';
import { cookies } from 'next/headers';
import * as jose from 'jose';

// Helper to verify instructor or admin for a given submission
async function verifyAuthorized(token: string | undefined, submissionId: string) {
  if (!token) return { authorized: false };
  try {
    await dbConnect();
    const submission = await Submission.findById(submissionId).select('course').lean();
    if (!submission) {
        return { authorized: false }; // Submission not found
    }
    const courseId = submission.course.toString();
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret) as { payload: { name: string, role?: string } };
    
    if (payload.role === 'admin') return { authorized: true };

    if (payload.role === 'instructor') {
        const course = await Course.findById(courseId).lean();
        if (course && course.instructor === payload.name) {
             return { authorized: true };
        }
    }
    return { authorized: false };
  } catch {
    return { authorized: false };
  }
}

// PUT handler to update a submission with a grade
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = cookies().get('token')?.value;
  const { id: submissionId } = params;
  
  const { authorized } = await verifyAuthorized(token, submissionId);

  if (!authorized) {
    return NextResponse.json({ message: 'Unauthorized: You are not the instructor for this course.' }, { status: 403 });
  }

  try {
    const { grade } = await req.json();

    if (typeof grade === 'undefined' || grade.trim() === '') {
        return NextResponse.json({ message: 'Grade is required.' }, { status: 400 });
    }

    const updatedSubmission = await Submission.findByIdAndUpdate(
      submissionId,
      { grade, status: 'graded' },
      { new: true, runValidators: true }
    );

    if (!updatedSubmission) {
      return NextResponse.json({ message: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Grade submitted successfully', submission: updatedSubmission }, { status: 200 });

  } catch (error: any) {
    console.error('Grade submission error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
