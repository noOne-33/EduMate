import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import * as z from 'zod';
import jwt from 'jsonwebtoken';

// Define the schema for signup
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  role: z.enum(['student', 'instructor']),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
});

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.errors }, { status: 400 });
    }

    const { name, email, password, role } = validation.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      // Set status to pending if the role is instructor
      status: role === 'instructor' ? 'pending' : 'active',
    });
    await newUser.save();
    
    // For instructors, don't log them in automatically.
    // Send a message that their application is under review.
    if (role === 'instructor') {
      return NextResponse.json({ message: 'Registration successful! Your instructor application is under review by our team. You will be notified upon approval.' }, { status: 201 });
    }

    const tokenPayload = { id: newUser._id, name: newUser.name, role: newUser.role, status: newUser.status };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: '1h' });
    
    const response = NextResponse.json({ message: 'User created successfully', user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } });
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
