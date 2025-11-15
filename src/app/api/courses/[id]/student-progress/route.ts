import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Enrollment from '@/models/Enrollment';
import Assignment from '@/models/Assignment';
import Submission from '@/models/Submission';
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

// GET handler for fetching student progress for a specific course
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const token = cookies().get('token')?.value;
    const authorized = await verifyAuthorized(token, params.id);

    if (!authorized) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    try {
        await dbConnect();
        const courseId = params.id;

        // 1. Get all approved enrollments and populate student info
        const enrollments = await Enrollment.find({ course: courseId, status: 'approved' })
            .populate({
                path: 'user',
                select: 'name email'
            })
            .lean();

        // Extract just the user objects that are not null
        const students = enrollments.map(e => e.user).filter(user => user != null);

        // 2. Get all assignments for the course
        const assignments = await Assignment.find({ course: courseId }).select('name assignmentNumber').lean();

        // 3. Get all submissions for the course, including the content
        const submissions = await Submission.find({ course: courseId }).lean();

        return NextResponse.json({ 
            students: JSON.parse(JSON.stringify(students)), 
            assignments: JSON.parse(JSON.stringify(assignments)), 
            submissions: JSON.parse(JSON.stringify(submissions)), 
        }, { status: 200 });

    } catch (error) {
        console.error('Failed to fetch student progress:', error);
        return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
    }
}
