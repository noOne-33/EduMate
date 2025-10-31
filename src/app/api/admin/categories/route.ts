import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
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

// GET handler for fetching all categories
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const categories = await Category.find({}).sort({ name: 1 });
        return NextResponse.json(categories, { status: 200 });
    } catch (error) {
        console.error('Category fetch error:', error);
        return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
    }
}


// POST handler for creating a new category
export async function POST(req: NextRequest) {
  const token = cookies().get('token')?.value;
  const isAdmin = await verifyAdmin(token);

  if (!isAdmin) {
    return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
  }

  try {
    await dbConnect();
    const body = await req.json();
    
    if (!body.name) {
        return NextResponse.json({ message: 'Category name is required' }, { status: 400 });
    }

    const existingCategory = await Category.findOne({ name: body.name });
    if (existingCategory) {
        return NextResponse.json({ message: 'Category with this name already exists' }, { status: 409 });
    }

    const newCategory = new Category({ name: body.name });
    await newCategory.save();

    return NextResponse.json({ message: 'Category created successfully', category: newCategory }, { status: 201 });
  } catch (error) {
    console.error('Category creation error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
