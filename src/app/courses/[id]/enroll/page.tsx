import EnrollmentForm from '@/components/enrollment-form';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import mongoose from 'mongoose';
import { courses as localCourses } from '@/lib/courses';
import type { ICourse } from '@/models/Course';

async function getCourse(id: string) {
    // Check if the ID is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
        try {
            await dbConnect();
            const dbCourse = await Course.findById(id).lean();
            if (dbCourse) {
                // Manually add 'id' property for consistency
                return JSON.parse(JSON.stringify({ ...dbCourse, id: dbCourse._id.toString() })) as ICourse & { id: string };
            }
        } catch (error) {
            console.error("Failed to fetch course from DB:", error);
            // Fall through to check local courses
        }
    }
    
    // If not a valid ObjectId or not found in DB, check local courses
    const localCourse = localCourses.find(c => c.id === id);
    if (localCourse) {
        // The structure of localCourse already matches what we need
        return localCourse as unknown as ICourse & { id: string };
    }
    
    return null;
}


async function getUser() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as { id: string; name: string; email: string, role?: string };
  } catch {
    return null;
  }
}

export default async function EnrollPage({ params }: { params: { id: string } }) {
  const user = await getUser();
  const course = await getCourse(params.id);

  if (!course) {
    notFound();
  }
  
  if (!user) {
      return (
          <div className="container py-12 text-center">
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2"><AlertCircle /> Please Log In</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">You need to be logged in to enroll in a course.</p>
                    <Button asChild>
                        <Link href={`/login?redirect=/courses/${course.id}/enroll`}>Log In</Link>
                    </Button>
                </CardContent>
            </Card>
          </div>
      )
  }

  return (
    <div className="container py-12">
        <EnrollmentForm course={course} user={user} />
    </div>
  );
}
