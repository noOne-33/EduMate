
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { redirect } from 'next/navigation';
import ProfileClient from '@/components/profile-client';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import type { IUser } from '@/models/User';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    
    await dbConnect();
    const user = await User.findById(payload.id).lean();
    if (!user) return null;

    return JSON.parse(JSON.stringify(user)) as IUser;

  } catch {
    return null;
  }
}

export default async function ProfilePage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return <ProfileClient user={user} />;
}
