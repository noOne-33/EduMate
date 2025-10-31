import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Lecture from '@/models/Lecture';
import Course from '@/models/Course';
import { cookies } from 'next/headers';
import * as jose from 'jose';

// Helper to verify instructor or admin
async function verifyAuthorized(token: string | undefined, courseId: string) {
  if (!token) return { authorized: false };
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret) as { payload: { name: string, role?: string } };
    
    if (payload.role === 'admin') return { authorized: true };

    if (payload.role === 'instructor') {
        await dbConnect();
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

// PUT handler to update a lecture
export async function PUT(req: NextRequest, { params }: { params: { id: string, lectureId: string } }) {
  const token = cookies().get('token')?.value;
  const { authorized } = await verifyAuthorized(token, params.id);

  if (!authorized) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    const body = await req.json();
    const { title, type, content } = body;
    
    if (!title || !type || !content) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const updatedLecture = await Lecture.findByIdAndUpdate(
      params.lectureId,
      { title, type, content },
      { new: true }
    );

    if (!updatedLecture) {
      return NextResponse.json({ message: 'Lecture not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lecture updated successfully', lecture: updatedLecture }, { status: 200 });

  } catch (error) {
    console.error('Lecture update error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

// DELETE handler to delete a lecture
export async function DELETE(req: NextRequest, { params }: { params: { id: string, lectureId: string } }) {
  const token = cookies().get('token')?.value;
  const { authorized } = await verifyAuthorized(token, params.id);

  if (!authorized) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    const deletedLecture = await Lecture.findByIdAndDelete(params.lectureId);

    if (!deletedLecture) {
      return NextResponse.json({ message: 'Lecture not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lecture deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Lecture deletion error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
