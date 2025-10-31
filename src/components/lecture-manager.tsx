'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ILecture } from '@/models/Lecture';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash, Youtube, FileText, Link as LinkIcon, PlusCircle, ListVideo } from 'lucide-react';
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

const lectureFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['youtube', 'pdf', 'url'], { required_error: 'Type is required' }),
  content: z.string().min(1, 'Content URL is required').url('Must be a valid URL'),
});

type LectureManagerProps = {
  courseId: string;
  initialLectures: ILecture[];
};

const iconMap = {
  youtube: <Youtube className="h-5 w-5 text-red-500" />,
  pdf: <FileText className="h-5 w-5 text-blue-500" />,
  url: <LinkIcon className="h-5 w-5 text-gray-500" />,
};

export default function LectureManager({ courseId, initialLectures }: LectureManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [lectures, setLectures] = useState(initialLectures);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingLecture, setEditingLecture] = useState<ILecture | null>(null);

  const form = useForm<z.infer<typeof lectureFormSchema>>({
    resolver: zodResolver(lectureFormSchema),
    defaultValues: {
      title: '',
      type: undefined,
      content: '',
    },
  });

  const handleAddNew = () => {
    setEditingLecture(null);
    form.reset();
    setIsFormVisible(true);
  };

  const handleEdit = (lecture: ILecture) => {
    setEditingLecture(lecture);
    form.setValue('title', lecture.title);
    form.setValue('type', lecture.type);
    form.setValue('content', lecture.content);
    setIsFormVisible(true);
  };
  
  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingLecture(null);
    form.reset();
  }

  const onSubmit = async (values: z.infer<typeof lectureFormSchema>) => {
    const url = editingLecture
      ? `/api/courses/${courseId}/lectures/${editingLecture._id}`
      : `/api/courses/${courseId}/lectures`;
    const method = editingLecture ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save lecture');
      }

      toast({
        title: `Lecture ${editingLecture ? 'updated' : 'created'}`,
        description: `The lecture "${values.title}" has been saved.`,
      });

      if (editingLecture) {
        setLectures(lectures.map(l => l._id === editingLecture._id ? result.lecture : l));
      } else {
        setLectures([...lectures, result.lecture]);
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
  
  const handleDelete = async (lectureId: string) => {
    try {
        const response = await fetch(`/api/courses/${courseId}/lectures/${lectureId}`, {
            method: 'DELETE',
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to delete lecture');
        }
        toast({
            title: 'Lecture Deleted',
            description: 'The lecture has been permanently removed.',
        });
        setLectures(lectures.filter(l => l._id !== lectureId));
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
          <CardTitle>Lectures</CardTitle>
          <CardDescription>Create, edit, and reorder course lectures.</CardDescription>
        </div>
         {!isFormVisible && (
          <Button onClick={handleAddNew}><PlusCircle className="mr-2" /> Add Lecture</Button>
        )}
      </CardHeader>
      <CardContent>
        {isFormVisible ? (
          <div className="p-4 border rounded-lg">
             <h3 className="text-lg font-medium mb-4">{editingLecture ? 'Edit Lecture' : 'Add New Lecture'}</h3>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Lecture Title</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Introduction to React" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Lecture Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a lecture type" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="youtube">YouTube Video</SelectItem>
                                    <SelectItem value="pdf">PDF Document</SelectItem>
                                    <SelectItem value="url">Web URL</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Content URL</FormLabel>
                            <FormControl>
                                <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                        <Button type="submit">{editingLecture ? 'Update' : 'Create'}</Button>
                    </div>
                </form>
             </Form>
          </div>
        ) : (
          <div className="space-y-4">
            {lectures.length > 0 ? (
                lectures.map(lecture => (
                    <div key={lecture._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-4">
                            {iconMap[lecture.type]}
                            <span className="font-medium">{lecture.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(lecture)}>
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
                                        This will permanently delete the lecture. This action cannot be undone.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleDelete(lecture._id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                ))
            ) : (
              <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <ListVideo className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No lectures yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first lecture.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
