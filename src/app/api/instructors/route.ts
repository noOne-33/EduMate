import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

async function verifyAuthenticated(token: string | undefined) {
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    await jose.jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  // FIX: Await cookies() here
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const isAuthenticated = await verifyAuthenticated(token);

  if (!isAuthenticated) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    await dbConnect();
    const instructors = await User.find({
      role: 'instructor',
      status: 'active',
    })
      .sort({ name: 1 })
      .lean();
    return NextResponse.json(instructors, { status: 200 });
  } catch (error) {
    console.error('Instructor fetch error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
