'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { IUser } from '@/models/User';

const nameFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
});

const passwordFormSchema = z.object({
    oldPassword: z.string().min(1, 'Old password is required.'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters.')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ["confirmPassword"],
});

export default function ProfileClient({ user }: { user: IUser }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isNameLoading, setIsNameLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const nameForm = useForm<z.infer<typeof nameFormSchema>>({
    resolver: zodResolver(nameFormSchema),
    defaultValues: { name: user.name || '' },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  async function onNameSubmit(values: z.infer<typeof nameFormSchema>) {
    setIsNameLoading(true);
    try {
      const response = await fetch('/api/profile/update-name', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast({ title: 'Success', description: 'Your name has been updated.' });
      router.refresh();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsNameLoading(false);
    }
  }
  
  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    setIsPasswordLoading(true);
    try {
        const response = await fetch('/api/profile/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        toast({ title: 'Success', description: 'Your password has been changed. Please log in again.' });
        
        // Log the user out
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsPasswordLoading(false);
    }
  }


  return (
    <div className="container py-12 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Update Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...nameForm}>
            <form onSubmit={nameForm.handleSubmit(onNameSubmit)} className="space-y-4">
              <FormField
                control={nameForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isNameLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isNameLoading}>
                {isNameLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                     <FormField control={passwordForm.control} name="oldPassword" render={({ field }) => (
                        <FormItem><FormLabel>Old Password</FormLabel><FormControl><Input type="password" {...field} disabled={isPasswordLoading} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                        <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} disabled={isPasswordLoading} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                        <FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><Input type="password" {...field} disabled={isPasswordLoading} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <Button type="submit" disabled={isPasswordLoading}>
                        {isPasswordLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}
