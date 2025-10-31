import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Enrollment from '@/models/Enrollment';
import { cookies } from 'next/headers';
import * as jose from 'jose';

// Helper function to verify admin role
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

export async function POST(req: NextRequest) {
  const token = cookies().get('token')?.value;
  const isAdmin = await verifyAdmin(token);

  if (!isAdmin) {
    return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
  }

  try {
    const { enrollmentId } = await req.json();
    if (!enrollmentId) {
      return NextResponse.json({ message: 'Enrollment ID is required' }, { status: 400 });
    }

    await dbConnect();
    
    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      { status: 'rejected' },
      { new: true } // Return the updated document
    );

    if (!updatedEnrollment) {
      return NextResponse.json({ message: 'Enrollment not found' }, { status: 404 });
    }

    // In a real app, you might trigger an email notification to the user here

    return NextResponse.json({ message: 'Enrollment rejected successfully', enrollment: updatedEnrollment }, { status: 200 });

  } catch (error) {
    console.error('Enrollment rejection error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
