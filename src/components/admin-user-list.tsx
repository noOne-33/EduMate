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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { IUser } from '@/models/User';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from './ui/badge';
import { Clock } from 'lucide-react';

export default function AdminUserList({ users: initialUsers }: { users: IUser[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<IUser[]>(initialUsers);
  const [loadingState, setLoadingState] = useState<Record<string, boolean>>({});

  const handleRoleChange = async (userId: string, newRole: 'student' | 'instructor' | 'admin') => {
    setLoadingState(prev => ({ ...prev, [userId]: true }));
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update user role');
      }

      toast({
        title: 'Success',
        description: `User role has been updated to ${newRole}.`,
      });

      // Update the user's role in the local state
      setUsers(currentUsers =>
        currentUsers.map(user =>
          user._id === userId ? { ...user, role: newRole } : user
        )
      );

      router.refresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoadingState(prev => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="container py-12">
      <Card>
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
          <CardDescription>
            View and manage user roles and statuses on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={user.role}
                      onValueChange={(newRole: 'student' | 'instructor' | 'admin') => handleRoleChange(user._id, newRole)}
                      disabled={loadingState[user._id] || user.role === 'admin'}
                    >
                      <SelectTrigger className="w-[140px]">
                         {loadingState[user._id] ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : <SelectValue placeholder="Select role" />}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className={user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
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
