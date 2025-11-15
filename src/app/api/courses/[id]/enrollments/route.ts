import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Enrollment from '@/models/Enrollment';
import User from '@/models/User';
import Course from '@/models/Course';
import { cookies } from 'next/headers';
import * as jose from 'jose';

// Helper to verify instructor or admin
async function verifyAuthorized(token: string | undefined, courseId: string) {
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret) as { payload: { name: string, role?: string } };
    
    if (payload.role === 'admin') return true;

    if (payload.role === 'instructor') {
        await dbConnect();
        const course = await Course.findById(courseId).lean();
        if (course && course.instructor === payload.name) {
             return true;
        }
    }
    return false;
  } catch {
    return false;
  }
}

// GET all approved enrollments for a course (for instructors/admins)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const token = cookies().get('token')?.value;
    const authorized = await verifyAuthorized(token, params.id);

    if (!authorized) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    try {
        await dbConnect();
        const enrollments = await Enrollment.find({ course: params.id, status: 'approved' })
            .populate({
                path: 'user',
                model: User,
                select: 'name email createdAt' // Select specific fields from User
            })
            .sort({ createdAt: -1 });

        return NextResponse.json(enrollments, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch enrollments for course:', error);
        return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
    }
}
