import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Question from '@/models/Question';
import Course from '@/models/Course';
import { cookies } from 'next/headers';
import * as jose from 'jose';

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

export async function DELETE(req: NextRequest, { params }: { params: { id: string, questionId: string } }) {
  const token = cookies().get('token')?.value;
  const { authorized } = await verifyAuthorized(token, params.id);

  if (!authorized) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    const deletedQuestion = await Question.findByIdAndDelete(params.questionId);

    if (!deletedQuestion) {
      return NextResponse.json({ message: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Question deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Question deletion error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
