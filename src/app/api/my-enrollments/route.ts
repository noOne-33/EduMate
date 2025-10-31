
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Enrollment from '@/models/Enrollment';
import { cookies } from 'next/headers';
import * as jose from 'jose';

// Helper function to get the current user from the token
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

// GET handler for fetching enrollments for the logged-in student
export async function GET(req: NextRequest) {
    const user = await getUser();
    if (!user || user.role !== 'student') {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    try {
        await dbConnect();
        // Find enrollments for the user and populate the associated course details
        const enrollments = await Enrollment.find({ user: user.id })
            .populate({
                path: 'course',
                model: 'Course',
                select: 'title instructor' // Select only the fields you need
            })
            .sort({ createdAt: -1 })
            .lean(); // Use .lean() for faster, plain JS object results

        return NextResponse.json(JSON.parse(JSON.stringify(enrollments)), { status: 200 });
    } catch (error) {
        console.error('Failed to fetch enrollments:', error);
        return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
    }
}
