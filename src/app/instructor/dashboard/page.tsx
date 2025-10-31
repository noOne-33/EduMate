import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import type { ICourse } from '@/models/Course';

async function getInstructorCourses(instructorName: string): Promise<ICourse[]> {
  await dbConnect();
  try {
    const courses = await Course.find({ instructor: instructorName }).sort({ title: 1 }).lean();
    return JSON.parse(JSON.stringify(courses));
  } catch (error) {
    console.error("Failed to fetch instructor courses:", error);
    return [];
  }
}

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

export default async function InstructorDashboardPage() {
  const user = await getUser();

  if (!user || user.role !== 'instructor') {
    return (
      <div className="container py-12">
        <p>You are not authorized to view this page.</p>
      </div>
    );
  }

  const courses = await getInstructorCourses(user.name);

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-8">Instructor Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
          <CardDescription>A list of all your assigned courses. Select a course to manage its content.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length > 0 ? courses.map((course) => (
                <TableRow key={course._id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell>{course.category}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/instructor/courses/${course._id}`}>
                        <Eye className="mr-2" />
                        Manage Course
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={3} className="text-center">You have not been assigned to any courses yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
