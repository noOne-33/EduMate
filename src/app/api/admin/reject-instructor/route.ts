import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';
import * as jose from 'jose';

export async function POST(req: NextRequest) {
  // 1. Verify user is an admin
  const token = cookies().get('token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret) as { payload: { id: string; name: string, role?: string } };
    
    if (payload.role !== 'admin') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    // 2. Get instructorId from request
    const { instructorId } = await req.json();
    if (!instructorId) {
      return NextResponse.json({ message: 'Instructor ID is required' }, { status: 400 });
    }

    await dbConnect();
    
    // 3. Delete the user with the given ID
    const deletedUser = await User.findByIdAndDelete(instructorId);

    if (!deletedUser) {
      return NextResponse.json({ message: 'Instructor not found' }, { status: 404 });
    }

    // 4. Return success response
    return NextResponse.json({ message: 'Instructor rejected and removed successfully' }, { status: 200 });

  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
        return NextResponse.json({ message: 'Session expired. Please log in again.' }, { status: 401 });
    }
    console.error('Rejection error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
