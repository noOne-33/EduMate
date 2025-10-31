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

// GET all quizzes for a course
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const quizzes = await Quiz.find({ course: params.id }).sort({ createdAt: 1 });
        return NextResponse.json(quizzes, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch quizzes:', error);
        return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
    }
}

// POST a new quiz to a course
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = cookies().get('token')?.value;
  const authorized = await verifyAuthorized(token, params.id);
  if (!authorized) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    const body = await req.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const newQuiz = new Quiz({
      course: params.id,
      title,
      description,
    });

    await newQuiz.save();

    return NextResponse.json({ message: 'Quiz created successfully', quiz: newQuiz }, { status: 201 });
  } catch (error) {
    console.error('Quiz creation error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}