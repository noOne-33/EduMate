import StudentDashboardClient from '@/components/student-dashboard-client';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function getUser() {
  // FIX: Add 'await' because cookies() returns a Promise in Next.js 15
  const cookieStore = await cookies();

  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as { id: string; name: string; role?: string };
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const user = await getUser();

  // The middleware should handle redirection for admin and instructor.
  // This page is now primarily for students.
  if (user?.role === 'student') {
    return <StudentDashboardClient user={user} />;
  }

  // Fallback for other roles or if something unexpected happens
  // Redirect to login if not a student and somehow lands here.
  if (user?.role === 'admin') {
    redirect('/admin/dashboard');
  } else if (user?.role === 'instructor') {
    redirect('/instructor/dashboard');
  }

  // If no user, or role is not handled, go to login.
  redirect('/login');
}
