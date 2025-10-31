import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Lecture from '@/models/Lecture';
import Course from '@/models/Course';
import { cookies } from 'next/headers';
import * as jose from 'jose';

// Helper to verify instructor or admin
async function verifyAuthorized(token: string | undefined, courseId: string) {
  if (!token) return { authorized: false, payload: null };
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret) as { payload: { id: string; name: string, role?: string } };

    if (payload.role === 'admin') {
      return { authorized: true, payload };
    }
    
    if (payload.role === 'instructor') {
        await dbConnect();
        const course = await Course.findById(courseId).lean();
        if (course && course.instructor === payload.name) {
             return { authorized: true, payload };
        }
    }
    
    return { authorized: false, payload: null };
  } catch (e) {
    return { authorized: false, payload: null };
  }
}

// GET all lectures for a course
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const lectures = await Lecture.find({ course: params.id }).sort({ order: 1 });
        return NextResponse.json(lectures, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch lectures:', error);
        return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
    }
}


// POST a new lecture to a course
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = cookies().get('token')?.value;
  const { authorized } = await verifyAuthorized(token, params.id);

  if (!authorized) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    const body = await req.json();
    const { title, type, content } = body;

    if (!title || !type || !content) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    // Get the highest order number and add 1
    const lastLecture = await Lecture.findOne({ course: params.id }).sort({ order: -1 });
    const newOrder = lastLecture ? lastLecture.order + 1 : 1;

    const newLecture = new Lecture({
      course: params.id,
      title,
      type,
      content,
      order: newOrder,
    });

    await newLecture.save();

    return NextResponse.json({ message: 'Lecture created successfully', lecture: newLecture }, { status: 201 });
  } catch (error) {
    console.error('Lecture creation error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
