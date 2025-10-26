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
import { BookOpen, DollarSign, Users, Activity, CheckCircle, Star, UserCheck, Clock, XCircle } from 'lucide-react';
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

const enrollmentData = [
  { name: 'Jan', enrollments: 65 },
  { name: 'Feb', enrollments: 59 },
  { name: 'Mar', enrollments: 80 },
  { name: 'Apr', enrollments: 81 },
  { name: 'May', enrollments: 56 },
  { name: 'Jun', enrollments: 55 },
  { name: 'Jul', enrollments: 40 },
];

const revenueData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 5000 },
    { name: 'Apr', revenue: 4500 },
    { name: 'May', revenue: 6000 },
    { name: 'Jun', revenue: 5500 },
    { name: 'Jul', revenue: 7000 },
];

const courseCompletionData = [
    { name: 'Completed', value: 75, fill: '#82ca9d' },
    { name: 'In Progress', value: 25, fill: '#FAAC4B' },
];

const recentTransactions = [
    { id: 'txn_1', user: 'alex.d@example.com', course: 'Web Development Bootcamp', amount: 19.99, date: '2023-10-26' },
    { id: 'txn_2', user: 'mia.w@example.com', course: 'The Ultimate Drawing Course', amount: 15.99, date: '2023-10-26' },
    { id: 'txn_3', user: 'liam.p@example.com', course: 'Pianoforall', amount: 25.00, date: '2023-10-25' },
    { id: 'txn_4', user: 'olivia.c@example.com', course: 'Digital Marketing Course', amount: 22.50, date: '2023-10-25' },
];

type Instructor = {
    _id: string;
    name: string;
    email: string;
    createdAt: string;
}

type AdminDashboardClientProps = {
  data: {
    totalStudents: number;
    totalInstructors: number;
    totalCourses: number;
    pendingInstructors: Instructor[];
    totalRevenue: number;
    revenueLastMonthPercent: number;
    studentsLastMonthPercent: number;
    instructorsLastMonthCount: number;
    coursesLastMonthCount: number;
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
      // Refresh data by filtering out the approved instructor
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
              +{data.studentsLastMonthPercent}% from last month
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
              +{data.instructorsLastMonthCount} from last month
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
              +{data.coursesLastMonthCount} new courses this month
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
            <div className="text-2xl font-bold">${data.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              +{data.revenueLastMonthPercent}% from last month
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
            <CardDescription>Daily new enrollments.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={enrollmentData}>
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
            <CardDescription>Monthly revenue trends.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
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
                  <CardTitle>Course Completion Rate</CardTitle>
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

          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">573</div>
                  <p className="text-xs text-muted-foreground">Currently online</p>
              </CardContent>
          </Card>
          
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Course Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">4.6/5.0</div>
                  <p className="text-xs text-muted-foreground">Across all courses</p>
              </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
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
              {recentTransactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell>{txn.user}</TableCell>
                  <TableCell>{txn.course}</TableCell>
                  <TableCell>${txn.amount.toFixed(2)}</TableCell>
                  <TableCell>{txn.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
          </CardHeader>
          <CardContent className="mt-4">
               <div className="flex items-center justify-between p-2 mt-2">
                  <p className="text-sm text-green-500 flex items-center"><CheckCircle className="h-4 w-4 mr-2"/>All systems are operational.</p>
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
