'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Users, CheckCircle, XCircle, FileText, Link as LinkIcon, Eye } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { IAssignment } from '@/models/Assignment';
import type { IUser } from '@/models/User';
import type { ISubmission } from '@/models/Submission';

type Student = Pick<IUser, 'name' | 'email' | '_id'>;
type Assignment = Pick<IAssignment, '_id' | 'name' | 'assignmentNumber'>;
type Submission = ISubmission & { _id: string };

type StudentProgressData = {
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
};

type StudentProgressManagerProps = {
  courseId: string;
};

export default function StudentProgressManager({ courseId }: StudentProgressManagerProps) {
  const { toast } = useToast();
  const [progressData, setProgressData] = useState<StudentProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [grade, setGrade] = useState('');

  useEffect(() => {
    const fetchStudentProgress = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/courses/${courseId}/student-progress`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch student progress data.");
        }
        data.assignments.sort((a: Assignment, b: Assignment) => a.assignmentNumber - b.assignmentNumber);
        setProgressData(data);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudentProgress();
  }, [courseId, toast]);
  
  const getStudentSubmission = (studentId: string, assignmentId: string): Submission | undefined => {
    return progressData?.submissions.find(sub => sub.user.toString() === studentId.toString() && sub.assignment.toString() === assignmentId.toString());
  }

  const handleGradeSubmit = async () => {
    if (!selectedSubmission || !grade) return;
    setIsGrading(true);
    try {
        const response = await fetch(`/api/submissions/${selectedSubmission._id}/grade`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grade }),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to submit grade.');
        }

        toast({ title: 'Success', description: 'Grade saved successfully.' });

        // Update local state
        setProgressData(prev => {
            if (!prev) return null;
            const updatedSubmissions = prev.submissions.map(sub =>
                sub._id === selectedSubmission._id ? result.submission : sub
            );
            return { ...prev, submissions: updatedSubmissions };
        });

        setSelectedSubmission(null);
        setGrade('');

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsGrading(false);
    }
  }

  const renderSubmissionContent = (submission: Submission) => {
    if (submission.submissionUrl) {
      return (
        <a href={submission.submissionUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-accent hover:underline">
          <LinkIcon /> View Submission Link
        </a>
      );
    }
    if (submission.submissionDataUri) {
      return (
        <div className="w-full h-[60vh]">
          <iframe src={submission.submissionDataUri} width="100%" height="100%" title="PDF Submission" />
        </div>
      );
    }
    return <p>No content found for this submission.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Progress</CardTitle>
        <CardDescription>Track and review assignment submissions for all enrolled students.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : progressData && progressData.students.length > 0 ? (
          <Dialog open={!!selectedSubmission} onOpenChange={(isOpen) => { if (!isOpen) setSelectedSubmission(null); }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Email Address</TableHead>
                  {progressData.assignments.map(assignment => (
                      <TableHead key={assignment._id} className="text-center">#{assignment.assignmentNumber}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {progressData.students.map((student) => {
                  return (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                       {progressData.assignments.map(assignment => {
                         const submission = getStudentSubmission(student._id, assignment._id);
                         return (
                          <TableCell key={assignment._id} className="text-center">
                              {submission ? (
                                  submission.status === 'graded' ? (
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm" onClick={() => { setSelectedSubmission(submission); setGrade(submission.grade || ''); }}>
                                          {submission.grade}
                                      </Button>
                                    </DialogTrigger>
                                  ) : (
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="icon" onClick={() => { setSelectedSubmission(submission); setGrade(''); }}>
                                          <CheckCircle className="h-5 w-5 text-green-500" />
                                      </Button>
                                    </DialogTrigger>
                                  )
                              ) : (
                                  <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                              )}
                          </TableCell>
                         );
                       })}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
             <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Review Submission</DialogTitle>
                <DialogDescription>
                  Viewing assignment submission. You can add or update the grade below.
                </DialogDescription>
              </DialogHeader>
              {selectedSubmission ? (
                <div>
                  <div className="my-4 p-2 border rounded-md min-h-[50vh]">
                     {renderSubmissionContent(selectedSubmission)}
                  </div>
                  <div className="grid gap-2">
                      <Label htmlFor="grade">Grade</Label>
                      <Input
                        id="grade"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        placeholder="e.g., A+ or 95/100"
                        disabled={isGrading}
                      />
                  </div>
                </div>
              ) : <p>Loading submission...</p>}
               <DialogFooter>
                    <Button variant="outline" onClick={() => setSelectedSubmission(null)} disabled={isGrading}>
                        Close
                    </Button>
                    <Button onClick={handleGradeSubmit} disabled={isGrading || !grade}>
                        {isGrading ? 'Saving...' : 'Save Grade'}
                    </Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium">No students enrolled</h3>
            <p className="mt-1 text-sm text-muted-foreground">Student progress will appear here once they are approved.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
