import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Question from '@/models/Question';
import Quiz from '@/models/Quiz';
import Course from '@/models/Course';
import { cookies } from 'next/headers';
import * as jose from 'jose';

async function verifyAuthorized(token: string | undefined, quizId: string) {
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret) as { payload: { name: string, role?: string } };
    
    await dbConnect();
    const quiz = await Quiz.findById(quizId).populate('course');
    if (!quiz) return false;

    const course = await Course.findById(quiz.course).lean();
    if (!course) return false;

    if (payload.role === 'admin') return true;
    if (payload.role === 'instructor' && course.instructor === payload.name) return true;
    
    return false;
  } catch {
    return false;
  }
}

// PUT handler to update a question
export async function PUT(req: NextRequest, { params }: { params: { quizId: string, questionId: string } }) {
  const token = cookies().get('token')?.value;
  const authorized = await verifyAuthorized(token, params.quizId);
  if (!authorized) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    const body = await req.json();

    const updatedQuestion = await Question.findByIdAndUpdate(
      params.questionId,
      body,
      { new: true, runValidators: true }
    );

    if (!updatedQuestion) {
      return NextResponse.json({ message: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Question updated successfully', question: updatedQuestion }, { status: 200 });

  } catch (error: any) {
    console.error('Question update error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

// DELETE handler to delete a question
export async function DELETE(req: NextRequest, { params }: { params: { quizId: string, questionId: string } }) {
  const token = cookies().get('token')?.value;
  const authorized = await verifyAuthorized(token, params.quizId);
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