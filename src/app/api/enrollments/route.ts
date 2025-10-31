import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Enrollment from '@/models/Enrollment';
import { cookies } from 'next/headers';
import * as jose from 'jose';

// Helper function to get the current user
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

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }
  
  if (user.role !== 'student') {
      return NextResponse.json({ message: 'Only students can enroll' }, { status: 403 });
  }

  try {
    await dbConnect();
    const body = await req.json();
    
    // Basic validation
    const { courseId, contactNumber, bkashNumber, transactionId } = body;
    if (!courseId || !contactNumber || !bkashNumber || !transactionId) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const newEnrollment = new Enrollment({
      user: user.id,
      course: courseId,
      contactNumber,
      paymentMethod: 'bkash', // hardcoded for now
      bkashNumber,
      transactionId,
      status: 'pending',
    });

    await newEnrollment.save();

    return NextResponse.json({ message: 'Enrollment request submitted successfully. You will be notified upon approval.' }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) { // Handle duplicate key error for the unique index
        return NextResponse.json({ message: 'You have already submitted an enrollment request for this course.' }, { status: 409 });
    }
    console.error('Enrollment creation error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
