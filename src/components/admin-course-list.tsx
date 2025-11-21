'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ICourse } from '@/models/Course';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from './ui/badge';
import { CheckCircle } from 'lucide-react';

export default function AdminCourseList({ courses: initialCourses }: { courses: ICourse[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState(initialCourses);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState<string | null>(null);

  const handleDelete = async (courseId: string) => {
    setIsDeleting(courseId);
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete course');
      }
      toast({
        title: 'Success',
        description: 'Course has been deleted.',
      });
      setCourses(courses.filter(c => c._id !== courseId));
      router.refresh(); // Refresh the page to update the list
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleComplete = async (courseId: string) => {
    setIsCompleting(courseId);
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/complete`, {
        method: 'POST',
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to complete course');
      }
      toast({
        title: 'Success',
        description: 'Course marked as completed.',
      });
      setCourses(courses.map(c => c._id === courseId ? result.course : c));
      router.refresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsCompleting(null);
    }
  };

  return (
    <div className="container py-12">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Manage Courses</CardTitle>
                    <CardDescription>
                        Here you can add, edit, or delete courses on the platform.
                    </CardDescription>
                </div>
                <Button asChild>
                    <Link href="/admin/courses/new">Add New Course</Link>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {courses.map((course) => (
                    <TableRow key={course._id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>{course.instructor}</TableCell>
                        <TableCell>{course.category}</TableCell>
                        <TableCell>
                            <Badge variant={course.status === 'active' ? 'secondary' : 'default'} className={course.status === 'active' ? 'bg-green-100 text-green-800' : ''}>
                                {course.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                         <div className="flex items-center justify-end space-x-2">
                            {course.status === 'active' ? (
                                <>
                                  <Button variant="outline" size="sm" asChild>
                                      <Link href={`/admin/courses/edit/${course._id}`}>Edit</Link>
                                  </Button>
                                  <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                          <Button variant="outline" size="sm" disabled={isCompleting === course._id}>
                                              <CheckCircle className="mr-2 h-4 w-4" />
                                              {isCompleting === course._id ? 'Completing...' : 'Complete'}
                                          </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                          <AlertDialogHeader>
                                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                  This will mark the course as completed and prevent new enrollments.
                                              </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleComplete(course._id)}>
                                              Continue
                                              </AlertDialogAction>
                                          </AlertDialogFooter>
                                      </AlertDialogContent>
                                  </AlertDialog>
                                </>
                            ) : null}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={isDeleting === course._id}
                                >
                                  {isDeleting === course._id ? 'Deleting...' : 'Delete'}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the course.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(course._id)}>
                                    Continue
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                         </div>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
