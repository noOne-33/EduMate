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

// PUT handler to update an assignment
export async function PUT(req: NextRequest, { params }: { params: { id: string, assignmentId: string } }) {
  const token = cookies().get('token')?.value;
  const { authorized } = await verifyAuthorized(token, params.id);

  if (!authorized) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    const body = await req.json();

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      params.assignmentId,
      body,
      { new: true, runValidators: true }
    );

    if (!updatedAssignment) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Assignment updated successfully', assignment: updatedAssignment }, { status: 200 });

  } catch (error: any) {
    if (error.code === 11000) {
        return NextResponse.json({ message: 'An assignment with this number already exists for this course.' }, { status: 409 });
    }
    console.error('Assignment update error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

// DELETE handler to delete an assignment
export async function DELETE(req: NextRequest, { params }: { params: { id: string, assignmentId: string } }) {
  const token = cookies().get('token')?.value;
  const { authorized } = await verifyAuthorized(token, params.id);

  if (!authorized) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    const deletedAssignment = await Assignment.findByIdAndDelete(params.assignmentId);

    if (!deletedAssignment) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Assignment deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Assignment deletion error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
