
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BookOpen, DollarSign, Users, Activity, CheckCircle, Star, UserCheck, Clock, XCircle, Pencil } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, getMonth } from 'date-fns';

type Instructor = {
    _id: string;
    name: string;
    email: string;
    createdAt: string;
}

type RecentTransaction = {
    _id: string;
    user: { email: string };
    course: { title: string, price: number };
    createdAt: string;
}

type MonthlyData = {
    _id: number;
    enrollments?: number;
    revenue?: number;
}

type CourseStatus = {
    _id: 'active' | 'completed';
    count: number;
}

type AdminDashboardClientProps = {
  data: {
    totalStudents: number;
    totalInstructors: number;
    totalCourses: number;
    pendingInstructors: Instructor[];
    totalRevenue: number;
    studentsLastMonthPercent: number;
    recentTransactions: RecentTransaction[];
    monthlyEnrollments: MonthlyData[];
    monthlyRevenue: MonthlyData[];
    courseStatusCounts: CourseStatus[];
  };
};

export default function AdminDashboardClient({ data: initialData }: AdminDashboardClientProps) {
  const [data, setData] = useState(initialData);
  const [loadingState, setLoadingState] = useState<{ id: string | null; type: 'approving' | 'rejecting' | null }>({ id: null, type: null });
  const { toast } = useToast();
  const router = useRouter();

  const handleApproveInstructor = async (instructorId: string) => {
    setLoadingState({ id: instructorId, type: 'approving' });
    try {
      const response = await fetch('/api/admin/approve-instructor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to approve instructor');
      }
      toast({
        title: 'Success',
        description: 'Instructor has been approved.',
      });
      setData(prevData => ({
          ...prevData,
          pendingInstructors: prevData.pendingInstructors.filter(inst => inst._id !== instructorId),
          totalInstructors: prevData.totalInstructors + 1,
      }));
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

  const handleRejectInstructor = async (instructorId: string) => {
    setLoadingState({ id: instructorId, type: 'rejecting' });
    try {
        const response = await fetch('/api/admin/reject-instructor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instructorId }),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to reject instructor');
        }
        toast({
            title: 'Success',
            description: 'Instructor has been rejected.',
        });
        setData(prevData => ({
            ...prevData,
            pendingInstructors: prevData.pendingInstructors.filter(inst => inst._id !== instructorId),
        }));
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

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const last6Months = [...Array(6)].map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return { month: monthNames[d.getMonth()], monthId: d.getMonth() + 1 };
  }).reverse();

  const enrollmentChartData = last6Months.map(m => ({
      name: m.month,
      enrollments: data.monthlyEnrollments.find(d => d._id === m.monthId)?.enrollments || 0
  }));

  const revenueChartData = last6Months.map(m => ({
      name: m.month,
      revenue: data.monthlyRevenue.find(d => d._id === m.monthId)?.revenue || 0
  }));
  
  const courseCompletionData = [
    { name: 'Active', value: data.courseStatusCounts.find(s => s._id === 'active')?.count || 0, fill: '#FAAC4B' },
    { name: 'Completed', value: data.courseStatusCounts.find(s => s._id === 'completed')?.count || 0, fill: '#82ca9d' },
  ];


  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalStudents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.studentsLastMonthPercent >= 0 ? '+' : ''}{data.studentsLastMonthPercent.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Instructors
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalInstructors.toLocaleString()}</div>
             <p className="text-xs text-muted-foreground">
                <Link href="/admin/users" className="hover:underline">Manage users</Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCourses.toLocaleString()}</div>
             <p className="text-xs text-muted-foreground">
                <Link href="/admin/courses" className="hover:underline">Manage courses</Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">BDT {data.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
               <Link href="/admin/billing" className="hover:underline">View billing details</Link>
            </p>
          </CardContent>
        </Card>
      </div>

       {data.pendingInstructors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <UserCheck className="text-orange-500" />
                Pending Instructor Approvals
            </CardTitle>
            <CardDescription>
                Review and approve new instructor applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pendingInstructors.map((instructor) => (
                  <TableRow key={instructor._id}>
                    <TableCell>{instructor.name}</TableCell>
                    <TableCell>{instructor.email}</TableCell>
                    <TableCell>{new Date(instructor.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleApproveInstructor(instructor._id)}
                        disabled={loadingState.id === instructor._id}
                      >
                        {loadingState.id === instructor._id && loadingState.type === 'approving' ? (
                            <><Clock className="mr-2 h-4 w-4 animate-spin" /> Approving...</>
                        ) : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectInstructor(instructor._id)}
                        disabled={loadingState.id === instructor._id}
                      >
                        {loadingState.id === instructor._id && loadingState.type === 'rejecting' ? (
                            <><Clock className="mr-2 h-4 w-4 animate-spin" /> Rejecting...</>
                        ) : "Reject"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Enrollment Statistics</CardTitle>
            <CardDescription>New enrollments in the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={enrollmentChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="enrollments" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue in the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `BDT ${value}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
              <CardHeader>
                  <CardTitle>Course Status</CardTitle>
              </CardHeader>
              <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                          <Pie data={courseCompletionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          </Pie>
                          <Tooltip />
                          <Legend />
                      </PieChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>
          
          <Card className="lg:col-span-2">
            <CardHeader>
            <CardTitle>Recent Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {data.recentTransactions.map((txn) => (
                    <TableRow key={txn._id}>
                    <TableCell>{txn.user?.email || 'N/A'}</TableCell>
                    <TableCell>{txn.course?.title || 'N/A'}</TableCell>
                    <TableCell>BDT {txn.course?.price?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>{txn.createdAt}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
