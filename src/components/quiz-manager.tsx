'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { Pencil, Trash, PlusCircle, HelpCircle, X } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from './ui/radio-group';


const questionSchema = z.object({
  _id: z.string().optional(),
  questionText: z.string().min(1, "Question text is required"),
  options: z.array(z.string().min(1, "Option text cannot be empty")).min(2, "Must have at least two options"),
  correctAnswerIndex: z.coerce.number().min(0, "Please select a correct answer"),
});

const quizFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  questions: z.array(questionSchema).optional(),
});

type QuizManagerProps = {
  courseId: string;
  initialQuizzes: IQuiz[];
};

type FullQuiz = IQuiz & { questions: IQuestion[] };

export default function QuizManager({ courseId, initialQuizzes }: QuizManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<FullQuiz[]>(initialQuizzes.map(q => ({...q, questions: []})));
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<FullQuiz | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | undefined>(undefined);

  const form = useForm<z.infer<typeof quizFormSchema>>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: { title: '', description: '', questions: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const fetchQuestions = async (quizId: string): Promise<IQuestion[]> => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}/questions`);
      if (!response.ok) throw new Error("Failed to fetch questions");
      const questions: IQuestion[] = await response.json();
      setQuizzes(prev => prev.map(q => q._id === quizId ? {...q, questions} : q));
      return questions;
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return [];
    }
  };

  const handleAccordionChange = (value: string | undefined) => {
    setOpenAccordion(value);
    if (value) {
      const quiz = quizzes.find(q => q._id === value);
      if (quiz && quiz.questions.length === 0) {
        fetchQuestions(value);
      }
    }
  };
  
  const handleAddNew = () => {
    setEditingQuiz(null);
    form.reset({ title: '', description: '', questions: [] });
    setIsFormVisible(true);
  };

  const handleEditQuiz = (quiz: FullQuiz) => {
    setEditingQuiz(quiz);
    if (quiz.questions.length === 0) {
      fetchQuestions(quiz._id).then(questions => {
          form.reset({
            title: quiz.title,
            description: quiz.description,
            questions: questions || []
          })
      });
    } else {
       form.reset({
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions || []
      });
    }
    setIsFormVisible(true);
  };
  
  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingQuiz(null);
    form.reset();
  }

  const onQuizSubmit = async (values: z.infer<typeof quizFormSchema>) => {
    const { title, description } = values;
    const url = editingQuiz ? `/api/courses/${courseId}/quizzes/${editingQuiz._id}` : `/api/courses/${courseId}/quizzes`;
    const method = editingQuiz ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      
      toast({ title: `Quiz ${editingQuiz ? 'updated' : 'created'}` });
      
      const savedQuiz = result.quiz;
      const savedQuestions = [];

      // Now save questions
      if (values.questions) {
        for (const questionData of values.questions) {
            const questionUrl = questionData._id
              ? `/api/quizzes/${savedQuiz._id}/questions/${questionData._id}`
              : `/api/quizzes/${savedQuiz._id}/questions`;
            const questionMethod = questionData._id ? 'PUT' : 'POST';
            const qResponse = await fetch(questionUrl, {
                method: questionMethod,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(questionData),
            });
            const qResult = await qResponse.json();
            if (!qResponse.ok) throw new Error(`Failed to save question: ${qResult.message}`);
            savedQuestions.push(qResult.question);
        }
      }

      const finalQuiz = {...savedQuiz, questions: savedQuestions };

      if (editingQuiz) {
        setQuizzes(quizzes.map(q => q._id === editingQuiz._id ? finalQuiz : q));
      } else {
        setQuizzes([...quizzes, finalQuiz]);
      }
      
      handleCancel();
      router.refresh();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error saving quiz', description: error.message });
    }
  };

  const deleteQuiz = async (quizId: string) => {
     try {
        const response = await fetch(`/api/courses/${courseId}/quizzes/${quizId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).message);
        toast({ title: 'Quiz Deleted' });
        setQuizzes(quizzes.filter(q => q._id !== quizId));
        router.refresh();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }

  const deleteQuestion = async (questionId: string | undefined, fieldIndex: number) => {
    // If the question has no ID, it's new and only exists in the form state.
    if (!questionId || !editingQuiz) {
        remove(fieldIndex);
        return;
    }
    try {
        const response = await fetch(`/api/quizzes/${editingQuiz._id}/questions/${questionId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).message);
        toast({ title: 'Question Deleted' });
        remove(fieldIndex);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Quizzes</CardTitle>
          <CardDescription>Create, edit, and manage quizzes.</CardDescription>
        </div>
        {!isFormVisible && <Button onClick={handleAddNew}><PlusCircle className="mr-2" /> Add Quiz</Button>}
      </CardHeader>
      <CardContent>
        {isFormVisible ? (
          <div className="p-4 border rounded-lg">
             <h3 className="text-lg font-medium mb-4">{editingQuiz ? 'Edit Quiz' : 'Add New Quiz'}</h3>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onQuizSubmit)} className="space-y-6">
                    <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Quiz Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    
                    <h4 className="text-md font-medium pt-4 border-t">Questions</h4>
                    {fields.map((field, index) => (
                      <Card key={field.id} className="p-4 relative">
                        <div className="space-y-4">
                          <FormField control={form.control} name={`questions.${index}.questionText`} render={({ field }) => (
                            <FormItem><FormLabel>Question {index + 1}</FormLabel><FormControl><Input {...field} placeholder="Enter the question text" /></FormControl><FormMessage /></FormItem>
                          )}/>
                          <Controller
                              control={form.control}
                              name={`questions.${index}.options`}
                              render={({ field: { value, onChange } }) => (
                                <FormItem><FormLabel>Options</FormLabel>
                                  <div className="space-y-2">
                                    {(value || []).map((option, optIndex) => (
                                      <div key={optIndex} className="flex items-center gap-2">
                                        <Input value={option} onChange={(e) => {
                                            const newOptions = [...(value || [])];
                                            newOptions[optIndex] = e.target.value;
                                            onChange(newOptions);
                                        }} placeholder={`Option ${optIndex + 1}`} />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => onChange((value || []).filter((_, i) => i !== optIndex))}><X className="h-4 w-4"/></Button>
                                      </div>
                                    ))}
                                    <Button type="button" size="sm" variant="outline" onClick={() => onChange([...(value || []), ''])}>Add Option</Button>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                           <Controller
                              control={form.control}
                              name={`questions.${index}.correctAnswerIndex`}
                              render={({ field: { onChange, value } }) => (
                                <FormItem>
                                  <FormLabel>Correct Answer</FormLabel>
                                  <FormControl>
                                    <RadioGroup onValueChange={(val) => onChange(parseInt(val))} value={String(value)} className="space-y-1">
                                      {(form.getValues(`questions.${index}.options`) || []).map((option, optIndex) => (
                                        <FormItem key={optIndex} className="flex items-center space-x-3 space-y-0">
                                          <FormControl><RadioGroupItem value={String(optIndex)} /></FormControl>
                                          <FormLabel className="font-normal">{option || `Option ${optIndex + 1}`}</FormLabel>
                                        </FormItem>
                                      ))}
                                    </RadioGroup>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                        </div>
                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => deleteQuestion((field as any)._id, index)}><Trash className="h-4 w-4"/></Button>
                      </Card>
                    ))}
                    <Button type="button" onClick={() => append({ questionText: '', options: ['', ''], correctAnswerIndex: -1 })}>Add Question</Button>

                    <div className="flex justify-end gap-2 pt-6 border-t">
                        <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                        <Button type="submit">{editingQuiz ? 'Update Quiz' : 'Create Quiz'}</Button>
                    </div>
                </form>
             </Form>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.length > 0 ? (
                <Accordion type="single" collapsible className="w-full" onValueChange={handleAccordionChange} value={openAccordion}>
                    {quizzes.map(quiz => (
                        <AccordionItem value={quiz._id} key={quiz._id}>
                             <div className="flex items-center justify-between w-full">
                                <AccordionTrigger className="flex-1 text-left">
                                    <span className="font-medium">{quiz.title}</span>
                                </AccordionTrigger>
                                <div className="flex items-center gap-2 ml-4">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditQuiz(quiz)}><Pencil className="h-4 w-4" /></Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash className="h-4 w-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the quiz and all its questions.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => deleteQuiz(quiz._id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                            <AccordionContent>
                                <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
                                  <p>{quiz.description}</p>
                                  {quiz.questions?.length > 0 ? (
                                    <ul className="list-decimal pl-5 space-y-2">
                                      {quiz.questions.map((q, i) => (
                                        <li key={q._id || i}>
                                          <strong>{q.questionText}</strong>
                                          <ul className="list-disc pl-5">
                                            {q.options.map((opt, oi) => (
                                              <li key={oi} className={oi === q.correctAnswerIndex ? 'font-bold' : ''}>{opt}</li>
                                            ))}
                                          </ul>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : <p>No questions yet for this quiz. Edit the quiz to add some!</p>}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
              <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No quizzes yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first quiz.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    