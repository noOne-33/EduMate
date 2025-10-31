import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import { cookies } from 'next/headers';
import * as jose from 'jose';

async function verifyAuthorized(token: string | undefined, courseId: string) {
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret) as { payload: { name: string, role?: string } };
    
    if (payload.role === 'admin') return true;

    if (payload.role === 'instructor') {
        await dbConnect();
        const course = await Course.findById(courseId).lean();
        return course && course.instructor === payload.name;
    }
    return false;
  } catch {
    return false;
  }
}

// PUT handler to update a quiz
export async function PUT(req: NextRequest, { params }: { params: { id: string, quizId: string } }) {
  const token = cookies().get('token')?.value;
  const authorized = await verifyAuthorized(token, params.id);
  if (!authorized) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    const body = await req.json();

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      params.quizId,
      body,
      { new: true, runValidators: true }
    );

    if (!updatedQuiz) {
      return NextResponse.json({ message: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Quiz updated successfully', quiz: updatedQuiz }, { status: 200 });
  } catch (error: any) {
    console.error('Quiz update error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

// DELETE handler to delete a quiz (and its questions)
export async function DELETE(req: NextRequest, { params }: { params: { id: string, quizId: string } }) {
  const token = cookies().get('token')?.value;
  const authorized = await verifyAuthorized(token, params.id);
  if (!authorized) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    // First, delete all questions associated with the quiz
    await Question.deleteMany({ quiz: params.quizId });
    
    // Then, delete the quiz itself
    const deletedQuiz = await Quiz.findByIdAndDelete(params.quizId);

    if (!deletedQuiz) {
      return NextResponse.json({ message: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Quiz and all associated questions deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Quiz deletion error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}