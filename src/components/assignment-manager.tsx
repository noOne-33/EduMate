'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { IAssignment } from '@/models/Assignment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash, PlusCircle, ClipboardList } from 'lucide-react';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const assignmentFormSchema = z.object({
  assignmentNumber: z.coerce.number().min(1, 'Assignment number is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  additionalFiles: z.string().url().optional().or(z.literal('')),
});

type AssignmentManagerProps = {
  courseId: string;
  initialAssignments: IAssignment[];
};

export default function AssignmentManager({ courseId, initialAssignments }: AssignmentManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState(initialAssignments);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<IAssignment | null>(null);

  const form = useForm<z.infer<typeof assignmentFormSchema>>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      assignmentNumber: assignments.length + 1,
      name: '',
      description: '',
      instructions: '',
      additionalFiles: '',
    },
  });

  const handleAddNew = () => {
    setEditingAssignment(null);
    form.reset({
        assignmentNumber: assignments.length + 1,
        name: '',
        description: '',
        instructions: '',
        additionalFiles: '',
    });
    setIsFormVisible(true);
  };

  const handleEdit = (assignment: IAssignment) => {
    setEditingAssignment(assignment);
    form.reset(assignment);
    setIsFormVisible(true);
  };
  
  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingAssignment(null);
    form.reset();
  }

  const onSubmit = async (values: z.infer<typeof assignmentFormSchema>) => {
    const url = editingAssignment
      ? `/api/courses/${courseId}/assignments/${editingAssignment._id}`
      : `/api/courses/${courseId}/assignments`;
    const method = editingAssignment ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save assignment');
      }

      toast({
        title: `Assignment ${editingAssignment ? 'updated' : 'created'}`,
        description: `The assignment "${values.name}" has been saved.`,
      });

      if (editingAssignment) {
        setAssignments(assignments.map(a => a._id === editingAssignment._id ? result.assignment : a));
      } else {
        setAssignments([...assignments, result.assignment].sort((a, b) => a.assignmentNumber - b.assignmentNumber));
      }
      
      handleCancel();
      router.refresh();

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };
  
  const handleDelete = async (assignmentId: string) => {
    try {
        const response = await fetch(`/api/courses/${courseId}/assignments/${assignmentId}`, {
            method: 'DELETE',
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to delete assignment');
        }
        toast({
            title: 'Assignment Deleted',
            description: 'The assignment has been permanently removed.',
        });
        setAssignments(assignments.filter(a => a._id !== assignmentId));
        router.refresh();
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message,
        });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Assignments</CardTitle>
          <CardDescription>Create, edit, and manage course assignments.</CardDescription>
        </div>
         {!isFormVisible && (
          <Button onClick={handleAddNew}><PlusCircle className="mr-2" /> Add Assignment</Button>
        )}
      </CardHeader>
      <CardContent>
        {isFormVisible ? (
          <div className="p-4 border rounded-lg">
             <h3 className="text-lg font-medium mb-4">{editingAssignment ? 'Edit Assignment' : 'Add New Assignment'}</h3>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="assignmentNumber"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Assignment Number</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 1" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Assignment Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Research Paper" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Briefly describe the assignment." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="instructions"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Instructions</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Provide detailed instructions for the student." {...field} rows={6} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="additionalFiles"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Additional Files URL (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="https://example.com/files/rubric.pdf" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                        <Button type="submit">{editingAssignment ? 'Update Assignment' : 'Create Assignment'}</Button>
                    </div>
                </form>
             </Form>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {assignments.map(assignment => (
                        <AccordionItem value={assignment._id} key={assignment._id}>
                             <div className="flex items-center justify-between w-full">
                                <AccordionTrigger className="flex-1 text-left">
                                    <span className="font-medium">#{assignment.assignmentNumber}: {assignment.name}</span>
                                </AccordionTrigger>
                                <div className="flex items-center gap-2 ml-4">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(assignment)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the assignment. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(assignment._id)}
                                                    className="bg-destructive hover:bg-destructive/90"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                            <AccordionContent>
                                <div className="prose prose-sm max-w-none text-muted-foreground">
                                    <p className="font-semibold">Description:</p>
                                    <p>{assignment.description}</p>
                                    <p className="font-semibold mt-4">Instructions:</p>
                                    <p style={{ whiteSpace: 'pre-wrap' }}>{assignment.instructions}</p>
                                    {assignment.additionalFiles && (
                                        <div className="mt-4">
                                            <p className="font-semibold">Additional Files:</p>
                                            <a href={assignment.additionalFiles} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                                                View Files
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
              <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first assignment.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
