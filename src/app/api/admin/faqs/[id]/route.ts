import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Faq from '@/models/Faq';
import { cookies } from 'next/headers';
import * as jose from 'jose';

// Helper function to verify admin role from a token
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

// PUT handler for updating an FAQ
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = cookies().get('token')?.value;
  const isAdmin = await verifyAdmin(token);

  if (!isAdmin) {
    return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
  }

  try {
    await dbConnect();
    const body = await req.json();
    const { id } = params;

    const updatedFaq = await Faq.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    if (!updatedFaq) {
      return NextResponse.json({ message: 'FAQ not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'FAQ updated successfully', faq: updatedFaq }, { status: 200 });
  } catch (error) {
    console.error('FAQ update error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

// DELETE handler for deleting an FAQ
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = cookies().get('token')?.value;
  const isAdmin = await verifyAdmin(token);

  if (!isAdmin) {
    return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
  }

  try {
    await dbConnect();
    const { id } = params;

    const deletedFaq = await Faq.findByIdAndDelete(id);

    if (!deletedFaq) {
      return NextResponse.json({ message: 'FAQ not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'FAQ deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('FAQ deletion error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
