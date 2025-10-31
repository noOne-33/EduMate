import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';
import * as jose from 'jose';

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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = cookies().get('token')?.value;
  const isAdmin = await verifyAdmin(token);

  if (!isAdmin) {
    return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
  }

  try {
    await dbConnect();
    const { id } = params;
    const { role } = await req.json();

    if (!['student', 'instructor', 'admin'].includes(role)) {
        return NextResponse.json({ message: 'Invalid role specified' }, { status: 400 });
    }
    
    // Additional logic to handle changing instructor status if needed
    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const updateData: { role: string, status?: string } = { role };
    
    // If a user is made an instructor and was pending, make them active.
    if (role === 'instructor' && userToUpdate.status === 'pending') {
        updateData.status = 'active';
    }

    const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
    );

    return NextResponse.json({ message: 'User role updated successfully', user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error('User role update error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
