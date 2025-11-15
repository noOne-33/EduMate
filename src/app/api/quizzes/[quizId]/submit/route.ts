import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Question from '@/models/Question';
import QuizAttempt from '@/models/QuizAttempt';
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

export async function POST(req: NextRequest, { params }: { params: { quizId: string } }) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { courseId, answers } = await req.json();

    if (!courseId || !answers) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Get all questions with correct answers for the quiz
    const questions = await Question.find({ quiz: params.quizId });

    let correctCount = 0;
    questions.forEach((question, index) => {
      // Find the user's answer for this question. answers is an object like { [questionId]: answerIndex }
      const userAnswerIndex = answers[question._id];
      if (userAnswerIndex !== undefined && userAnswerIndex === question.correctAnswer) {
        correctCount++;
      }
    });

    const score = (correctCount / questions.length) * 100;
    
    // Store selected answer indexes in the order of the questions
    const answerIndexes = questions.map(q => answers[q._id] ?? -1);

    const newAttempt = new QuizAttempt({
      quiz: params.quizId,
      user: user.id,
      course: courseId,
      answers: answerIndexes,
      score: Math.round(score),
    });

    await newAttempt.save();

    return NextResponse.json({
      message: 'Quiz submitted successfully!',
      score: newAttempt.score,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
    }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ message: 'You have already attempted this quiz.' }, { status: 409 });
    }
    console.error('Quiz submission error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
