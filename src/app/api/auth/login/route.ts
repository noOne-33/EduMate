import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import * as z from 'zod';
import jwt from 'jsonwebtoken';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.errors }, { status: 400 });
    }

    const { email, password } = validation.data;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
    
    // Check if instructor account is approved
    if (user.role === 'instructor' && user.status === 'pending') {
        return NextResponse.json({ message: 'Your instructor account is pending approval.' }, { status: 403 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
    
    const tokenPayload = { id: user._id, name: user.name, role: user.role, status: user.status };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: '1h' });
    
    const response = NextResponse.json({ message: 'Login successful', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
