import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
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

// GET all questions for a quiz
export async function GET(req: NextRequest, { params }: { params: { quizId: string } }) {
    try {
        await dbConnect();
        const questions = await Question.find({ quiz: params.quizId });
        return NextResponse.json(questions, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch questions:', error);
        return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
    }
}

// POST a new question to a quiz
export async function POST(req: NextRequest, { params }: { params: { quizId: string } }) {
  const token = cookies().get('token')?.value;
  const authorized = await verifyAuthorized(token, params.quizId);
  if (!authorized) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    const body = await req.json();
    const { questionText, options, correctAnswerIndex } = body;

    if (!questionText || !options || options.length < 2 || correctAnswerIndex === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const newQuestion = new Question({
      quiz: params.quizId,
      questionText,
      options,
      correctAnswerIndex,
    });

    await newQuestion.save();

    return NextResponse.json({ message: 'Question created successfully', question: newQuestion }, { status: 201 });
  } catch (error) {
    console.error('Question creation error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}