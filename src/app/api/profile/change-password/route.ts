
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import * as z from 'zod';
import { cookies } from 'next/headers';
import * as jose from 'jose';

const passwordSchema = z.object({
    oldPassword: z.string(),
    newPassword: z.string().min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


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

export async function PUT(req: NextRequest) {
  const userSession = await getUser();
  if (!userSession) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }
  
  try {
    await dbConnect();
    const body = await req.json();

    const validation = passwordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.errors }, { status: 400 });
    }

    const { oldPassword, newPassword } = validation.data;
    
    // Fetch user with password
    const user = await User.findById(userSession.id).select('+password');
    if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
        return NextResponse.json({ message: 'Incorrect old password' }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Invalidate the session by clearing the cookie
    const response = NextResponse.json({ message: 'Password updated successfully' });
    response.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0),
        path: '/',
    });

    return response;

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
