'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
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
} from "@/components/ui/alert-dialog";
import { CheckCircle } from 'lucide-react';

type CourseCompletionButtonProps = {
    courseId: string;
}

export default function CourseCompletionButton({ courseId }: CourseCompletionButtonProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleComplete = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/instructor/courses/${courseId}/complete`, {
                method: 'POST',
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to mark course as complete');
            }
            toast({
                title: 'Success',
                description: 'Course has been marked as complete. Students can no longer enroll and content is now read-only.',
            });
            router.refresh();
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


    return (
         <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={isLoading}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {isLoading ? 'Updating...' : 'Mark as Complete'}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to complete this course?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. Once completed, you will no longer be able to edit the course content (lectures, assignments, quizzes, etc.).
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleComplete}>
                    Yes, Mark as Complete
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
