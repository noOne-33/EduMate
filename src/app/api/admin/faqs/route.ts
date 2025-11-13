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

// GET handler for fetching all FAQs
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const faqs = await Faq.find({}).sort({ createdAt: -1 });
        return NextResponse.json(faqs, { status: 200 });
    } catch (error) {
        console.error('FAQ fetch error:', error);
        return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
    }
}


// POST handler for creating a new FAQ
export async function POST(req: NextRequest) {
  const token = cookies().get('token')?.value;
  const isAdmin = await verifyAdmin(token);

  if (!isAdmin) {
    return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
  }

  try {
    await dbConnect();
    const body = await req.json();
    
    if (!body.question || !body.answer) {
        return NextResponse.json({ message: 'Question and answer are required' }, { status: 400 });
    }

    const existingFaq = await Faq.findOne({ question: body.question });
    if (existingFaq) {
        return NextResponse.json({ message: 'A FAQ with this question already exists' }, { status: 409 });
    }

    const newFaq = new Faq({ question: body.question, answer: body.answer });
    await newFaq.save();

    return NextResponse.json({ message: 'FAQ created successfully', faq: newFaq }, { status: 201 });
  } catch (error) {
    console.error('FAQ creation error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
