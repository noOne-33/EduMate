'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { IQuiz } from '@/models/Quiz';
import { IQuestion } from '@/models/Question';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash, PlusCircle, HelpCircle, X, Check, BookCopy } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from './ui/dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

const quizFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

const questionFormSchema = z.object({
  questionText: z.string().min(1, 'Question text is required'),
  options: z.array(z.object({ text: z.string().min(1, 'Option text cannot be empty') })).min(2, 'At least two options are required'),
  correctAnswer: z.coerce.number().min(0, 'A correct answer must be selected'),
});

type QuizManagerProps = {
  courseId: string;
  initialQuizzes: IQuiz[];
  isCompleted: boolean;
};

export default function QuizManager({ courseId, initialQuizzes, isCompleted }: QuizManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState(initialQuizzes);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<IQuiz | null>(null);
  const [editingQuestionsOf, setEditingQuestionsOf] = useState<IQuiz | null>(null);
  const [questions, setQuestions] = useState<IQuestion[]>([]);

  const quizForm = useForm<z.infer<typeof quizFormSchema>>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: { title: '', description: '' },
  });
  
  const questionForm = useForm<z.infer<typeof questionFormSchema>>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: { questionText: '', options: [{ text: '' }, { text: '' }], correctAnswer: -1 },
  });

  const { fields, append, remove } = useFieldArray({
    control: questionForm.control,
    name: "options",
  });

  const handleAddNewQuiz = () => {
    setEditingQuiz(null);
    quizForm.reset({ title: '', description: '' });
    setIsFormVisible(true);
  };
  
  const handleEditQuiz = (quiz: IQuiz) => {
    setEditingQuiz(quiz);
    quizForm.reset({ title: quiz.title, description: quiz.description });
    setIsFormVisible(true);
  };

  const handleCancelQuizForm = () => {
    setIsFormVisible(false);
    setEditingQuiz(null);
    quizForm.reset();
  };

  const onQuizSubmit = async (values: z.infer<typeof quizFormSchema>) => {
    const url = editingQuiz ? `/api/courses/${courseId}/quizzes/${editingQuiz._id}` : `/api/courses/${courseId}/quizzes`;
    const method = editingQuiz ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, courseId }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to save quiz');

      toast({ title: `Quiz ${editingQuiz ? 'updated' : 'created'}` });

      if (editingQuiz) {
        setQuizzes(quizzes.map(q => q._id === editingQuiz._id ? result.quiz : q));
      } else {
        setQuizzes([result.quiz, ...quizzes]);
      }
      
      handleCancelQuizForm();
      router.refresh();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
     try {
      const response = await fetch(`/api/courses/${courseId}/quizzes/${quizId}`, { method: 'DELETE' });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to delete quiz');
      }
      toast({ title: 'Quiz Deleted' });
      setQuizzes(quizzes.filter(q => q._id !== quizId));
      router.refresh();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };
  
  const handleManageQuestions = async (quiz: IQuiz) => {
    setEditingQuestionsOf(quiz);
    try {
        const response = await fetch(`/api/courses/${courseId}/quizzes/${quiz._id}/questions`);
        if (!response.ok) throw new Error('Failed to fetch questions');
        const data = await response.json();
        setQuestions(data);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }

  const onQuestionSubmit = async (values: z.infer<typeof questionFormSchema>) => {
    if (!editingQuestionsOf) return;
    try {
        const response = await fetch(`/api/courses/${courseId}/quizzes/${editingQuestionsOf._id}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        toast({ title: 'Question added' });
        setQuestions([...questions, result.question]);
        questionForm.reset({ questionText: '', options: [{ text: '' }, { text: '' }], correctAnswer: -1 });

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }
  
  const handleDeleteQuestion = async (questionId: string) => {
    if (!editingQuestionsOf) return;
    try {
        await fetch(`/api/courses/${courseId}/quizzes/${editingQuestionsOf._id}/questions/${questionId}`, { method: 'DELETE' });
        toast({ title: 'Question deleted' });
        setQuestions(questions.filter(q => q._id !== questionId));
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Quizzes</CardTitle>
          <CardDescription>Create and manage quizzes for your students.</CardDescription>
        </div>
         {!isFormVisible && !isCompleted && (
          <Button onClick={handleAddNewQuiz}><PlusCircle className="mr-2" /> New Quiz</Button>
        )}
      </CardHeader>
      <CardContent>
        {isFormVisible ? (
          <div className="p-4 border rounded-lg">
             <h3 className="text-lg font-medium mb-4">{editingQuiz ? 'Edit Quiz' : 'New Quiz'}</h3>
             <Form {...quizForm}>
                <form onSubmit={quizForm.handleSubmit(onQuizSubmit)} className="space-y-6">
                    <FormField control={quizForm.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Quiz Title</FormLabel><FormControl><Input placeholder="e.g., Chapter 1 Review" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={quizForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="Describe the quiz..." {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={handleCancelQuizForm}>Cancel</Button>
                        <Button type="submit">{editingQuiz ? 'Update Quiz' : 'Create Quiz'}</Button>
                    </div>
                </form>
             </Form>
          </div>
        ) : (
          <Dialog open={!!editingQuestionsOf} onOpenChange={(isOpen) => !isOpen && setEditingQuestionsOf(null)}>
            <div className="space-y-4">
              {quizzes.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                      {quizzes.map(quiz => (
                          <AccordionItem value={quiz._id} key={quiz._id}>
                               <div className="flex items-center justify-between w-full">
                                  <AccordionTrigger className="flex-1 text-left">
                                      <span className="font-medium">{quiz.title}</span>
                                  </AccordionTrigger>
                                  <div className="flex items-center gap-2 ml-4">
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm" onClick={() => handleManageQuestions(quiz)}>
                                          <BookCopy className="mr-2"/> Manage Questions
                                      </Button>
                                    </DialogTrigger>
                                    {!isCompleted && (
                                      <>
                                        <Button variant="ghost" size="icon" onClick={() => handleEditQuiz(quiz)}><Pencil className="h-4 w-4" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash className="h-4 w-4" /></Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the quiz and all its questions. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteQuiz(quiz._id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                      </>
                                    )}
                                  </div>
                              </div>
                              <AccordionContent>
                                  <p className="text-sm text-muted-foreground">{quiz.description || "No description provided."}</p>
                              </AccordionContent>
                          </AccordionItem>
                      ))}
                  </Accordion>
              ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">No quizzes yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first quiz.</p>
                </div>
              )}
            </div>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Manage Questions for: {editingQuestionsOf?.title}</DialogTitle>
                <DialogDescription>Add, remove, or edit questions for this quiz.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-8 flex-1 overflow-hidden">
               {!isCompleted && (
                <div className="p-4 border rounded-lg flex flex-col">
                   <h3 className="text-lg font-semibold mb-4">Add New Question</h3>
                   <Form {...questionForm}>
                     <form onSubmit={questionForm.handleSubmit(onQuestionSubmit)} className="space-y-4">
                        <FormField control={questionForm.control} name="questionText" render={({ field }) => (<FormItem><FormLabel>Question</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div>
                          <FormLabel>Options</FormLabel>
                          <div className="space-y-2 mt-2">
                           <RadioGroup onValueChange={(val) => questionForm.setValue('correctAnswer', parseInt(val))} value={questionForm.watch('correctAnswer')?.toString()}>
                            {fields.map((field, index) => (
                              <FormField key={field.id} control={questionForm.control} name={`options.${index}.text`} render={({ field: optionField }) => (
                                <FormItem className="flex items-center gap-2">
                                  <FormControl><RadioGroupItem value={index.toString()} /></FormControl>
                                  <Input {...optionField} placeholder={`Option ${index + 1}`} />
                                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><X className="h-4 w-4"/></Button>
                                </FormItem>
                              )}/>
                            ))}
                            </RadioGroup>
                            <FormMessage>{questionForm.formState.errors.options?.message || questionForm.formState.errors.options?.root?.message}</FormMessage>
                          </div>
                          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ text: '' })}><PlusCircle className="mr-2"/> Add Option</Button>
                        </div>
                        <FormField control={questionForm.control} name="correctAnswer" render={({ field }) => (<FormItem className="hidden"><FormMessage /></FormItem>)} />
                        <Button type="submit" className="w-full">Add Question</Button>
                     </form>
                   </Form>
                </div>
               )}
                <div className={`p-4 border rounded-lg overflow-y-auto ${isCompleted ? 'col-span-2' : ''}`}>
                    <h3 className="text-lg font-semibold mb-4">Existing Questions</h3>
                    <div className="space-y-2">
                      {questions.length > 0 ? questions.map((q, qIndex) => (
                        <div key={q._id} className="p-3 border rounded-md">
                          <div className="flex justify-between items-start">
                             <p className="font-medium flex-1">{qIndex + 1}. {q.questionText}</p>
                            {!isCompleted && <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteQuestion(q._id)}><Trash className="h-4 w-4"/></Button>}
                          </div>
                          <ul className="mt-2 space-y-1 text-sm">
                            {q.options.map((opt, oIndex) => (
                              <li key={oIndex} className={`flex items-center gap-2 ${q.correctAnswer === oIndex ? 'text-green-600 font-semibold' : ''}`}>
                                {q.correctAnswer === oIndex ? <Check className="h-4 w-4" /> : <X className="h-4 w-4 text-transparent"/>}
                                {opt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )) : <p className="text-sm text-muted-foreground text-center mt-8">No questions yet.</p>}
                    </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
