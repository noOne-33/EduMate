import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import { cookies } from 'next/headers';
import * as jose from 'jose';

// Helper to verify the user is the assigned instructor or an admin
async function verifyAuthorized(token: string | undefined, courseId: string) {
  if (!token) return false;
  try {
    await dbConnect();
    const course = await Course.findById(courseId).lean();
    if (!course) return false;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret) as { payload: { name: string, role?: string } };
    
    if (payload.role === 'admin') return true;
    if (payload.role === 'instructor' && payload.name === course.instructor) return true;
    
    return false;
  } catch {
    return false;
  }
}

// POST handler to mark a course as completed
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = cookies().get('token')?.value;
  const { id: courseId } = params;

  const isAuthorized = await verifyAuthorized(token, courseId);
  if (!isAuthorized) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    await dbConnect();

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { status: 'completed' },
      { new: true }
    );

    if (!updatedCourse) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Course marked as completed', course: updatedCourse }, { status: 200 });

  } catch (error) {
    console.error('Course completion error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
