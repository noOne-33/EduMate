import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import { cookies } from 'next/headers';
import * as jose from 'jose';

// Helper function to verify admin role from a token
async function verifyAdmin(token: string | undefined) {
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret) as { payload: { role?: string } };
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

// POST handler to mark a course as completed
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // THE FIX: We must 'await' the cookies() function call.
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const isAdmin = await verifyAdmin(token);

  if (!isAdmin) {
    return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
  }

  try {
    await dbConnect();

    // OPTIMIZATION: Use a single, atomic 'findByIdAndUpdate' operation.
    // 'new: true' ensures the updated document is returned.
    const updatedCourse = await Course.findByIdAndUpdate(
      params.id,
      { status: 'completed' },
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Since the frontend client component doesn't need a Mongoose document,
    // we can return a lean object. This is good practice.
    return NextResponse.json({ message: 'Course marked as completed', course: updatedCourse.toObject() }, { status: 200 });

  } catch (error) {
    console.error('Course completion error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}