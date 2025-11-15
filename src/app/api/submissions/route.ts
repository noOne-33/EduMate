import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Submission from '@/models/Submission';
import Enrollment from '@/models/Enrollment';
import { cookies } from 'next/headers';
import * as jose from 'jose';

// Helper function to get the current user
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

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await req.json();
    const { courseId, assignmentId, submissionUrl, submissionDataUri } = body;

    if (!courseId || !assignmentId || (!submissionUrl && !submissionDataUri)) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Verify the user is enrolled and approved for the course
    const enrollment = await Enrollment.findOne({ user: user.id, course: courseId, status: 'approved' });
    if (!enrollment) {
        return NextResponse.json({ message: 'You are not enrolled in this course.' }, { status: 403 });
    }
    
    const submissionData: any = {
      course: courseId,
      assignment: assignmentId,
      user: user.id,
    };

    if (submissionUrl) {
      submissionData.submissionUrl = submissionUrl;
    } else if (submissionDataUri) {
      submissionData.submissionDataUri = submissionDataUri;
    }

    const newSubmission = new Submission(submissionData);

    await newSubmission.save();

    return NextResponse.json({ message: 'Assignment submitted successfully!', submission: newSubmission }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ message: 'You have already submitted this assignment.' }, { status: 409 });
    }
    console.error('Submission error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}