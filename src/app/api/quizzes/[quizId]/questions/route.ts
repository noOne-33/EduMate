import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Question from '@/models/Question';
import { cookies } from 'next/headers';
import * as jose from 'jose';

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

// GET handler for fetching quiz questions for a student (without answers)
export async function GET(req: NextRequest, { params }: { params: { quizId: string } }) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    await dbConnect();
    // Fetch questions but exclude the correctAnswer field
    const questions = await Question.find({ quiz: params.quizId }).select('-correctAnswer');
    return NextResponse.json(questions, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch quiz questions:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
