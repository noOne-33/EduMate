'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { IFaq } from '@/models/Faq';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash, PlusCircle, Bot } from 'lucide-react';
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
} from "@/components/ui/accordion";

const faqFormSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
});

type AdminChatbotClientProps = {
  initialFaqs: IFaq[];
};

export default function AdminChatbotClient({ initialFaqs }: AdminChatbotClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [faqs, setFaqs] = useState(initialFaqs);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingFaq, setEditingFaq] = useState<IFaq | null>(null);

  const form = useForm<z.infer<typeof faqFormSchema>>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: {
      question: '',
      answer: '',
    },
  });

  const handleAddNew = () => {
    setEditingFaq(null);
    form.reset({
      question: '',
      answer: '',
    });
    setIsFormVisible(true);
  };

  const handleEdit = (faq: IFaq) => {
    setEditingFaq(faq);
    form.reset(faq);
    setIsFormVisible(true);
  };
  
  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingFaq(null);
    form.reset();
  }

  const onSubmit = async (values: z.infer<typeof faqFormSchema>) => {
    const url = editingFaq
      ? `/api/admin/faqs/${editingFaq._id}`
      : `/api/admin/faqs`;
    const method = editingFaq ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save FAQ');
      }

      toast({
        title: `FAQ ${editingFaq ? 'updated' : 'created'}`,
        description: `The FAQ has been saved.`,
      });

      if (editingFaq) {
        setFaqs(faqs.map(f => f._id === editingFaq._id ? result.faq : f));
      } else {
        setFaqs([result.faq, ...faqs]);
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
  
  const handleDelete = async (faqId: string) => {
    try {
        const response = await fetch(`/api/admin/faqs/${faqId}`, {
            method: 'DELETE',
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to delete FAQ');
        }
        toast({
            title: 'FAQ Deleted',
            description: 'The FAQ has been permanently removed.',
        });
        setFaqs(faqs.filter(f => f._id !== faqId));
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
    <div className="container py-12">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                <CardTitle>Chatbot Training</CardTitle>
                <CardDescription>Manage the questions and answers the chatbot uses.</CardDescription>
                </div>
                {!isFormVisible && (
                <Button onClick={handleAddNew}><PlusCircle className="mr-2" /> Add FAQ</Button>
                )}
            </CardHeader>
            <CardContent>
                {isFormVisible ? (
                <div className="p-4 border rounded-lg">
                    <h3 className="text-lg font-medium mb-4">{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</h3>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="question"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Question</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., How do I enroll?" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="answer"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Answer</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Provide the answer to the question." {...field} rows={5}/>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                                <Button type="submit">{editingFaq ? 'Update FAQ' : 'Create FAQ'}</Button>
                            </div>
                        </form>
                    </Form>
                </div>
                ) : (
                <div className="space-y-4">
                    {faqs.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map(faq => (
                                <AccordionItem value={faq._id} key={faq._id}>
                                    <div className="flex items-center justify-between w-full">
                                        <AccordionTrigger className="flex-1 text-left">
                                            <span className="font-medium">{faq.question}</span>
                                        </AccordionTrigger>
                                        <div className="flex items-center gap-2 ml-4">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(faq)}>
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
                                                            This will permanently delete the FAQ. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(faq._id)}
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
                                          <p style={{ whiteSpace: 'pre-wrap' }}>{faq.answer}</p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                        <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No FAQs yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Get started by training your chatbot.</p>
                    </div>
                    )}
                </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
