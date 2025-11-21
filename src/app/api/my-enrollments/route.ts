import dbConnect from '@/lib/mongodb'; // Ensure this path matches your file structure
import Course from '@/models/Course'; // Essential: Registers the "Course" schema for population
import Enrollment from '@/models/Enrollment';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to get the current user from the token
async function getUser() {
  // FIX: 'cookies()' returns a Promise in Next.js 15, so we must await it.
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

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
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    await dbConnect();

    // Prevent tree-shaking: ensure Course model is recognized
    if (!Course) console.log('Loading Course model...');

    // Find enrollments for the user and populate the associated course details
    const enrollments = await Enrollment.find({ user: user.id })
      .populate({
        path: 'course',
        model: 'Course',
        select: 'title instructor', // Select only the fields you need
      })
      .sort({ createdAt: -1 })
      .lean(); // Use .lean() for faster, plain JS object results

    return NextResponse.json(JSON.parse(JSON.stringify(enrollments)), {
      status: 200,
    });
  } catch (error) {
    console.error('Failed to fetch enrollments:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
