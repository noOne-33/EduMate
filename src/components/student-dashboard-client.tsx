
'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ICourse } from '@/models/Course';
import { AlertCircle, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';

type PopulatedEnrollment = {
  _id: string;
  course: ICourse & { _id: string }; // Course is populated
  status: 'pending' | 'approved' | 'rejected';
};

export default function StudentDashboardClient({ user }: { user: { id: string } }) {
  const [enrollments, setEnrollments] = useState<PopulatedEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchEnrollments() {
      try {
        const response = await fetch('/api/my-enrollments');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch enrollments');
        }
        setEnrollments(data);
      } catch (err: any) {
        setError(err.message);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err.message,
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchEnrollments();
  }, [toast]);

  const approvedCourses = enrollments.filter(e => e.status === 'approved').map(e => e.course);
  const pendingCourses = enrollments.filter(e => e.status === 'pending').map(e => e.course);

  if (isLoading) {
    return (
        <div className="container py-12">
            <h1 className="text-3xl font-bold tracking-tight font-headline mb-8">My Courses</h1>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
        </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12 text-center">
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2"><AlertCircle /> Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive">{error}</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-8">My Dashboard</h1>

      {/* Enrolled Courses */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>My Enrolled Courses</CardTitle>
          <CardDescription>Courses you are currently enrolled in. Click to access materials.</CardDescription>
        </CardHeader>
        <CardContent>
          {approvedCourses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {approvedCourses.map(course => (
                <Card key={course._id}>
                    <CardHeader>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <CardDescription>by {course.instructor}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href={`/my-courses/${course._id}`}>
                                <BookOpen className="mr-2" /> Access Course
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <h3 className="text-sm font-medium">You are not enrolled in any courses yet.</h3>
                <Button asChild variant="link" className="mt-2">
                    <Link href="/courses">Explore Courses</Link>
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Pending Courses */}
       {pendingCourses.length > 0 && (
         <Card>
            <CardHeader>
            <CardTitle>Pending Enrollments</CardTitle>
            <CardDescription>These courses are awaiting approval from an administrator.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {pendingCourses.map(course => (
                        <div key={course._id} className="p-3 border rounded-md flex justify-between items-center">
                            <span>{course.title}</span>
                            <span className="text-sm text-muted-foreground">Pending Approval</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
