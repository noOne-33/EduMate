'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import type { ICourse } from '@/models/Course';

const bdPhoneNumberRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;

const formSchema = z.object({
  contactNumber: z.string().regex(bdPhoneNumberRegex, 'Please enter a valid Bangladesh phone number.'),
  bkashNumber: z.string().regex(bdPhoneNumberRegex, 'Please enter a valid bKash number.'),
  transactionId: z.string().min(5, 'Transaction ID is required.'),
});

type EnrollmentFormProps = {
  course: ICourse;
  user: {
      id: string;
      name: string;
      email: string;
  }
};

export default function EnrollmentForm({ course, user }: EnrollmentFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactNumber: '',
      bkashNumber: '',
      transactionId: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, courseId: course._id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      toast({
        title: 'Request Submitted',
        description: data.message,
      });
      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Operation Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
      <Card className="max-w-2xl mx-auto">
          <CardHeader>
              <CardTitle>Enroll in: {course.title}</CardTitle>
              <CardDescription>
              Please complete your payment via bKash and fill out the form below.
              </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>bKash Payment Instructions</AlertTitle>
                <AlertDescription>
                   <p className="font-mono text-sm">
                        1. Go to your bKash App and select 'Send Money'.<br/>
                        2. Enter the number: <strong>+8801234567890</strong><br/>
                        3. Enter the amount: <strong>{course.price} BDT</strong><br/>
                        4. Note down the <strong>Transaction ID (TrxID)</strong>.
                   </p>
                </AlertDescription>
            </Alert>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 mt-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="contactNumber" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Your Contact Number</FormLabel>
                        <FormControl><Input placeholder="+8801..." {...field} disabled={isLoading} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="bkashNumber" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Your bKash Number</FormLabel>
                        <FormControl><Input placeholder="Number you paid from" {...field} disabled={isLoading} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="transactionId" render={({ field }) => (
                    <FormItem>
                    <FormLabel>bKash Transaction ID (TrxID)</FormLabel>
                    <FormControl><Input placeholder="e.g., 9A4B1CD2E3" {...field} disabled={isLoading} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )} />
                
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                        {isLoading ? 'Submitting...' : 'Submit Enrollment'}
                    </Button>
                </div>
            </form>
            </Form>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">Other payment methods (card, etc.) will be available soon.</p>
          </CardFooter>
      </Card>
  );
}
