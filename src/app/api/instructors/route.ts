import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';
import * as jose from 'jose';

// Helper function to verify user is authenticated (could be admin or instructor creating a course)
async function verifyAuthenticated(token: string | undefined) {
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    await jose.jwtVerify(token, secret);
    return true; // For now, any authenticated user can fetch instructors
  } catch {
    return false;
  }
}

// GET handler for fetching all active instructors
export async function GET(req: NextRequest) {
    const token = cookies().get('token')?.value;
    const isAuthenticated = await verifyAuthenticated(token);

    if (!isAuthenticated) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
    
    try {
        await dbConnect();
        const instructors = await User.find({ role: 'instructor', status: 'active' }).sort({ name: 1 }).lean();
        return NextResponse.json(instructors, { status: 200 });
    } catch (error) {
        console.error('Instructor fetch error:', error);
        return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
    }
}
