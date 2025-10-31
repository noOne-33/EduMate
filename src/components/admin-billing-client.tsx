'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import type { IEnrollment } from '@/models/Enrollment';
import type { IUser } from '@/models/User';
import type { ICourse } from '@/models/Course';

type PopulatedEnrollment = Omit<IEnrollment, 'user' | 'course'> & {
  user: Pick<IUser, 'name' | 'email'>;
  course: Pick<ICourse, 'title'>;
};

export default function AdminBillingClient({ enrollments: initialEnrollments }: { enrollments: PopulatedEnrollment[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState(initialEnrollments);
  const [loadingState, setLoadingState] = useState<{ id: string | null; type: 'approving' | 'rejecting' | null }>({ id: null, type: null });

  const handleAction = async (enrollmentId: string, action: 'approve' | 'reject') => {
    setLoadingState({ id: enrollmentId, type: action === 'approve' ? 'approving' : 'rejecting' });
    try {
      const response = await fetch(`/api/admin/enrollments/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || `Failed to ${action} enrollment`);
      }
      toast({
        title: 'Success',
        description: `Enrollment has been ${action}d.`,
      });
      // Update the status of the enrollment in the local state
      setEnrollments(prev =>
        prev.map(e => (e._id === enrollmentId ? { ...e, status: action === 'approve' ? 'approved' : 'rejected' } : e))
      );
      router.refresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoadingState({ id: null, type: null });
    }
  };

  const getStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="container py-12">
      <Card>
        <CardHeader>
          <CardTitle>Billing & Enrollments</CardTitle>
          <CardDescription>
            Review and manage all student course enrollment requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>bKash Number</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => (
                <TableRow key={enrollment._id}>
                  <TableCell>
                    <div className="font-medium">{enrollment.user.name}</div>
                    <div className="text-sm text-muted-foreground">{enrollment.user.email}</div>
                  </TableCell>
                  <TableCell>{enrollment.course.title}</TableCell>
                  <TableCell>{enrollment.bkashNumber}</TableCell>
                  <TableCell>{enrollment.transactionId}</TableCell>
                  <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                  <TableCell className="text-right">
                    {enrollment.status === 'pending' ? (
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleAction(enrollment._id, 'approve')}
                          disabled={loadingState.id === enrollment._id}
                        >
                          {loadingState.id === enrollment._id && loadingState.type === 'approving' ? (
                            <><Clock className="mr-2 h-4 w-4 animate-spin" /> Approving...</>
                          ) : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(enrollment._id, 'reject')}
                          disabled={loadingState.id === enrollment._id}
                        >
                           {loadingState.id === enrollment._id && loadingState.type === 'rejecting' ? (
                            <><Clock className="mr-2 h-4 w-4 animate-spin" /> Rejecting...</>
                          ) : "Reject"}
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Processed</span>
                    )}
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
