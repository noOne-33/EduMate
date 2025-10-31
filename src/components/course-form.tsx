'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { ICourse } from '@/models/Course';
import { ICategory } from '@/models/Category';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { IUser } from '@/models/User';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  instructor: z.string().min(1, 'Instructor is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  imageId: z.string().min(1, 'Image ID is required'),
  duration: z.string().min(1, 'Duration is required'),
  price: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().min(0, 'Price must be a positive number')
  ),
  rating: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().min(0).max(5, 'Rating must be between 0 and 5')
  ),
  url: z.string().url().optional().or(z.literal('')),
  youtubeUrl: z.string().url().optional().or(z.literal('')),
});

type CourseFormProps = {
  course?: ICourse;
};

export default function CourseForm({ course }: CourseFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [instructors, setInstructors] = useState<IUser[]>([]);

  const isEditing = !!course;
  
  useEffect(() => {
    async function fetchData() {
      try {
        const [catResponse, instResponse] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch('/api/instructors')
        ]);

        if (!catResponse.ok) throw new Error('Failed to fetch categories');
        const catData = await catResponse.json();
        setCategories(catData);

        if (!instResponse.ok) throw new Error('Failed to fetch instructors');
        const instData = await instResponse.json();
        setInstructors(instData);

      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load required data for the form.',
        });
      }
    }
    fetchData();
  }, [toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: course?.title || '',
      instructor: course?.instructor || '',
      description: course?.description || '',
      category: course?.category || '',
      imageId: course?.imageId || 'course-1',
      duration: course?.duration || '',
      price: course?.price || 0,
      rating: course?.rating || 0,
      url: course?.url || '',
      youtubeUrl: course?.youtubeUrl || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const url = isEditing ? `/api/courses/${course._id}` : '/api/courses';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      toast({
        title: `Course ${isEditing ? 'updated' : 'created'}`,
        description: `The course "${values.title}" has been successfully ${isEditing ? 'updated' : 'created'}.`,
      });
      router.push('/admin/courses');
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
    <div className="container py-12">
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>{isEditing ? 'Edit Course' : 'Add New Course'}</CardTitle>
                <CardDescription>
                Fill out the form below to {isEditing ? 'update the' : 'add a new'} course.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Web Development Bootcamp" {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="instructor"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Instructor</FormLabel>
                                 <FormControl>
                                    <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" disabled={isLoading || instructors.length === 0}>
                                        <option value="" disabled>Select an instructor</option>
                                        {instructors.map(inst => (
                                            <option key={inst._id} value={inst.name}>{inst.name}</option>
                                        ))}
                                    </select>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Enter a detailed course description..." {...field} disabled={isLoading} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Category</FormLabel>
                                 <FormControl>
                                    <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" disabled={isLoading || categories.length === 0}>
                                        <option value="" disabled>Select a category</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="imageId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Image ID</FormLabel>
                                <FormControl>
                                    <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        {PlaceHolderImages.map(img => (
                                            <option key={img.id} value={img.id}>{img.id} ({img.description})</option>
                                        ))}
                                    </select>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className="grid md:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="duration"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Duration</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. 12.5 hours" {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Price (BDT)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" placeholder="e.g. 1500" {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="rating"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Rating</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.1" placeholder="e.g. 4.7" {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Course URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://example.com/course" {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="youtubeUrl"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>YouTube URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://youtube.com/watch?v=..." {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                            {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Course' : 'Create Course')}
                        </Button>
                    </div>
                </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  );
}
