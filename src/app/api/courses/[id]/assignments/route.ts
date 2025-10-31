import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Assignment from '@/models/Assignment';
import Course from '@/models/Course';
import { cookies } from 'next/headers';
import * as jose from 'jose';

async function verifyAuthorized(token: string | undefined, courseId: string) {
  if (!token) return { authorized: false };
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret) as { payload: { id: string; name: string, role?: string } };

    if (payload.role === 'admin') {
      return { authorized: true };
    }
    
    if (payload.role === 'instructor') {
        await dbConnect();
        const course = await Course.findById(courseId).lean();
        if (course && course.instructor === payload.name) {
             return { authorized: true };
        }
    }
    
    return { authorized: false };
  } catch (e) {
    return { authorized: false };
  }
}

// GET all assignments for a course
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const assignments = await Assignment.find({ course: params.id }).sort({ assignmentNumber: 1 });
        return NextResponse.json(assignments, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch assignments:', error);
        return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
    }
}

// POST a new assignment to a course
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = cookies().get('token')?.value;
  const { authorized } = await verifyAuthorized(token, params.id);

  if (!authorized) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    const body = await req.json();
    const { assignmentNumber, name, description, instructions, additionalFiles } = body;

    if (!assignmentNumber || !name || !description || !instructions) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const newAssignment = new Assignment({
      course: params.id,
      assignmentNumber,
      name,
      description,
      instructions,
      additionalFiles,
    });

    await newAssignment.save();

    return NextResponse.json({ message: 'Assignment created successfully', assignment: newAssignment }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
        return NextResponse.json({ message: 'An assignment with this number already exists for this course.' }, { status: 409 });
    }
    console.error('Assignment creation error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
