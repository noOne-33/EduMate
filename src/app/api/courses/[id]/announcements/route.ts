import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import Course from '@/models/Course';
import { cookies } from 'next/headers';
import * as jose from 'jose';

// Helper to verify instructor or admin
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

// GET all announcements for a course
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const announcements = await Announcement.find({ course: params.id }).sort({ createdAt: -1 });
        return NextResponse.json(announcements, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch announcements:', error);
        return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
    }
}

// POST a new announcement to a course
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = cookies().get('token')?.value;
  const { authorized } = await verifyAuthorized(token, params.id);

  if (!authorized) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    const body = await req.json();
    const { title, content } = body;

    if (!title || !content) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const newAnnouncement = new Announcement({
      course: params.id,
      title,
      content,
    });

    await newAnnouncement.save();
    
    // In a real-world scenario, you would trigger emails or notifications to students here

    return NextResponse.json({ message: 'Announcement sent successfully', announcement: newAnnouncement }, { status: 201 });
  } catch (error) {
    console.error('Announcement creation error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
