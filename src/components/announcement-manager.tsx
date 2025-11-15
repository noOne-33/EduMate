'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { IAnnouncement } from '@/models/Announcement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Send, Bell, Pencil, Trash } from 'lucide-react';
import { format } from 'date-fns';
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


const announcementFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
});

type AnnouncementManagerProps = {
  courseId: string;
  initialAnnouncements: IAnnouncement[];
  isCompleted: boolean;
};

export default function AnnouncementManager({ courseId, initialAnnouncements, isCompleted }: AnnouncementManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<IAnnouncement | null>(null);

  const form = useForm<z.infer<typeof announcementFormSchema>>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const handleAddNew = () => {
    setEditingAnnouncement(null);
    form.reset({ title: '', content: '' });
    setIsFormVisible(true);
  };
  
  const handleEdit = (announcement: IAnnouncement) => {
    setEditingAnnouncement(announcement);
    form.reset({ title: announcement.title, content: announcement.content });
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingAnnouncement(null);
    form.reset();
  };

  const onSubmit = async (values: z.infer<typeof announcementFormSchema>) => {
    const url = editingAnnouncement
      ? `/api/courses/${courseId}/announcements/${editingAnnouncement._id}`
      : `/api/courses/${courseId}/announcements`;
    const method = editingAnnouncement ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save announcement');
      }

      toast({
        title: `Announcement ${editingAnnouncement ? 'updated' : 'sent'}`,
        description: `The announcement "${values.title}" has been saved.`,
      });
      
      if (editingAnnouncement) {
        setAnnouncements(announcements.map(a => a._id === editingAnnouncement._id ? result.announcement : a));
      } else {
        setAnnouncements([result.announcement, ...announcements]);
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

  const handleDelete = async (announcementId: string) => {
    try {
        const response = await fetch(`/api/courses/${courseId}/announcements/${announcementId}`, {
            method: 'DELETE',
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to delete announcement');
        }
        toast({
            title: 'Announcement Deleted',
            description: 'The announcement has been permanently removed.',
        });
        setAnnouncements(announcements.filter(a => a._id !== announcementId));
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
          <CardTitle>Announcements</CardTitle>
          <CardDescription>Send and manage announcements for all students in this course.</CardDescription>
        </div>
         {!isFormVisible && !isCompleted &&(
          <Button onClick={handleAddNew}><PlusCircle className="mr-2" /> New Announcement</Button>
        )}
      </CardHeader>
      <CardContent>
        {isFormVisible ? (
          <div className="p-4 border rounded-lg">
             <h3 className="text-lg font-medium mb-4">{editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}</h3>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Welcome to the course!" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Write your announcement here..." {...field} rows={8}/>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                        <Button type="submit">
                            {editingAnnouncement ? 'Update Announcement' : <><Send className="mr-2" /> Send Announcement</>}
                        </Button>
                    </div>
                </form>
             </Form>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.length > 0 ? (
                announcements.map(announcement => (
                    <div key={announcement._id} className="p-4 border rounded-lg group">
                        <div className="flex justify-between items-start">
                            <h4 className="font-semibold">{announcement.title}</h4>
                           {!isCompleted && (
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(announcement)}>
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
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete this announcement. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDelete(announcement._id)}
                                                className="bg-destructive hover:bg-destructive/90"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                           )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{format(new Date(announcement.createdAt), 'PP p')}</p>
                        <p className="mt-2 text-sm text-muted-foreground" style={{ whiteSpace: 'pre-wrap' }}>{announcement.content}</p>
                    </div>
                ))
            ) : (
              <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Get started by sending your first announcement.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
