
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';
import * as jose from 'jose';

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
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { name } = await req.json();

    if (!name || name.length < 2) {
      return NextResponse.json({ message: 'Name must be at least 2 characters long' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { name: name },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // We need to issue a new token with the updated name
    const tokenPayload = { id: updatedUser._id, name: updatedUser.name, role: updatedUser.role, status: updatedUser.status };
    const token = await new jose.SignJWT(tokenPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(new TextEncoder().encode(process.env.JWT_SECRET!));
    
    const response = NextResponse.json({ message: 'Name updated successfully', user: updatedUser });
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Update name error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
