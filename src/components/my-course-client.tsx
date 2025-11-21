'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ClipboardList, Youtube, FileText, Link as LinkIcon, ListVideo, Send, CheckCircle, Bell, HelpCircle, ArrowLeft, Award } from 'lucide-react';
import type { ICourse } from '@/models/Course';
import type { ILecture } from '@/models/Lecture';
import type { IAssignment } from '@/models/Assignment';
import type { ISubmission } from '@/models/Submission';
import { IQuiz } from '@/models/Quiz';
import { IQuestion } from '@/models/Question';
import { IQuizAttempt } from '@/models/QuizAttempt';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Badge } from './ui/badge';
import { IAnnouncement } from '@/models/Announcement';
import { format } from 'date-fns';
import { Progress } from './ui/progress';
import { Label } from './ui/label';

type MyCourseClientProps = {
    course: ICourse;
    lectures: ILecture[];
    assignments: IAssignment[];
    submissions: ISubmission[];
    announcements: IAnnouncement[];
    quizzes: IQuiz[];
    quizAttempts: IQuizAttempt[];
};

const iconMap = {
  youtube: <Youtube className="h-5 w-5 text-red-500" />,
  pdf: <FileText className="h-5 w-5 text-blue-500" />,
  url: <LinkIcon className="h-5 w-5 text-gray-500" />,
};

const submissionFormSchema = z.object({
  submissionType: z.enum(['url', 'file']),
  submissionUrl: z.string().optional().nullable(),
  submissionFile: z.any().optional().nullable(),
}).refine(data => {
    if (data.submissionType === 'url') {
        return z.string().url().safeParse(data.submissionUrl).success;
    }
    return true;
}, {
    message: "A valid URL is required.",
    path: ['submissionUrl'],
}).refine(data => {
    if (data.submissionType === 'file') {
        return data.submissionFile && data.submissionFile.length > 0;
    }
    return true;
}, {
    message: "A file is required.",
    path: ['submissionFile'],
});

export default function MyCourseClient({ course, lectures, assignments, submissions, announcements, quizzes, quizAttempts }: MyCourseClientProps) {
  const [activeLecture, setActiveLecture] = useState<ILecture | null>(lectures?.[0] || null);
  const [selectedAssignment, setSelectedAssignment] = useState<IAssignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  // Quiz state
  const [takingQuiz, setTakingQuiz] = useState<IQuiz | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<IQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; correctAnswers: number; totalQuestions: number; } | null>(null);

  const form = useForm<z.infer<typeof submissionFormSchema>>({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      submissionType: 'url',
      submissionUrl: '',
      submissionFile: null,
    },
  });

  const submissionType = form.watch('submissionType');

  // Certificate Eligibility Logic
  const totalAssignments = assignments.length;
  const totalQuizzes = quizzes.length;
  const completedAssignments = submissions.length;
  const completedQuizzes = quizAttempts.length;
  const allCourseworkComplete = completedAssignments >= totalAssignments && completedQuizzes >= totalQuizzes;
  const isCertificateEligible = allCourseworkComplete && course.status === 'completed';

  const totalTasks = totalAssignments + totalQuizzes;
  const completedTasks = completedAssignments + completedQuizzes;
  const courseProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;


  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
  }
  
  const getSubmissionForAssignment = (assignmentId: string) => {
    return submissions.find(s => s.assignment.toString() === assignmentId.toString());
  }
  
  const getAttemptForQuiz = (quizId: string) => {
      return quizAttempts.find(a => a.quiz.toString() === quizId.toString());
  }

  const handleSubmission = async (values: z.infer<typeof submissionFormSchema>) => {
      if (!selectedAssignment) return;
      setIsSubmitting(true);

      try {
          let submissionData: any = {
              courseId: course._id,
              assignmentId: selectedAssignment._id,
          };

          if (values.submissionType === 'url') {
              submissionData.submissionUrl = values.submissionUrl;
          } else if (values.submissionType === 'file' && values.submissionFile?.[0]) {
              const file = values.submissionFile[0];
              if (file.type !== 'application/pdf') {
                  throw new Error('Only PDF files are allowed.');
              }
              const dataUri = await fileToBase64(file);
              submissionData.submissionDataUri = dataUri;
          }
          
          const response = await fetch('/api/submissions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(submissionData),
          });

          const result = await response.json();
          if (!response.ok) {
              throw new Error(result.message || 'Failed to submit assignment');
          }
          toast({
              title: 'Success',
              description: 'Your assignment has been submitted.',
          });

          setSelectedAssignment(null);
          form.reset();
          router.refresh();
      } catch (error: any) {
           toast({
              variant: 'destructive',
              title: 'Error',
              description: error.message,
          });
      } finally {
          setIsSubmitting(false);
      }
  };
  
  const startQuiz = async (quiz: IQuiz) => {
      setTakingQuiz(quiz);
      setQuizResult(null);
      setQuizAnswers({});
      try {
          const response = await fetch(`/api/quizzes/${quiz._id}/questions`);
          const questions = await response.json();
          if (!response.ok) throw new Error(questions.message);
          setQuizQuestions(questions);
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: `Could not load quiz: ${error.message}` });
          setTakingQuiz(null);
      }
  };

  const handleAnswerChange = (questionId: string, answerIndex: number) => {
      setQuizAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  }

  const submitQuiz = async () => {
    if (!takingQuiz) return;
    setIsSubmitting(true);
    try {
        const response = await fetch(`/api/quizzes/${takingQuiz._id}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId: course._id, answers: quizAnswers }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        toast({ title: 'Quiz Submitted!', description: `You scored ${result.score}%.`});
        setQuizResult(result);
        // Don't setTakingQuiz to null here, so we can show the results screen
        router.refresh();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const resetQuizState = () => {
      setTakingQuiz(null);
      setQuizQuestions([]);
      setQuizAnswers({});
      setQuizResult(null);
  }

  const renderLectureContent = (lecture: ILecture) => {
    if (lecture.type === 'youtube') {
      const videoId = lecture.content.split('v=')[1]?.split('&')[0];
      if (videoId) {
        return (
          <div className="aspect-video">
            <iframe
              className="w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={lecture.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        );
      }
    }
    return <p>This lecture content can be accessed at: <a href={lecture.content} target="_blank" rel="noopener noreferrer" className="text-accent underline">{lecture.content}</a></p>
  }
  
  const renderQuizContent = () => {
      if (quizResult) {
          return (
              <div className="text-center p-8">
                  <h2 className="text-2xl font-bold">Quiz Complete!</h2>
                  <p className="text-muted-foreground mt-2">You have completed the quiz.</p>
                  <div className="my-8">
                      <p className="text-4xl font-bold">{quizResult.score}%</p>
                      <p className="text-muted-foreground">You answered {quizResult.correctAnswers} out of {quizResult.totalQuestions} questions correctly.</p>
                  </div>
                   <Button onClick={resetQuizState}><ArrowLeft className="mr-2"/> Back to Course Content</Button>
              </div>
          )
      }

      return (
        <div className='space-y-6'>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={resetQuizState}><ArrowLeft/></Button>
                <h2 className="text-xl font-bold">Taking Quiz: {takingQuiz?.title}</h2>
            </div>
            <Form {...form}>
                <form onSubmit={e => e.preventDefault()}>
                    {quizQuestions.map((q, index) => (
                        <div key={q._id} className="p-4 border rounded-lg mb-4">
                            <p className="font-medium">{index + 1}. {q.questionText}</p>
                            <RadioGroup 
                                className="mt-4 space-y-2" 
                                onValueChange={(val) => handleAnswerChange(q._id, parseInt(val))}
                                value={quizAnswers[q._id]?.toString()}
                            >
                                {q.options.map((option, i) => (
                                    <FormItem key={i} className="flex items-center space-x-3 space-y-0">
                                        <FormControl><RadioGroupItem value={i.toString()} /></FormControl>
                                        <FormLabel className="font-normal">{option}</FormLabel>
                                    </FormItem>
                                ))}
                            </RadioGroup>
                        </div>
                    ))}
                </form>
            </Form>
            <Button onClick={submitQuiz} disabled={isSubmitting || Object.keys(quizAnswers).length !== quizQuestions.length} className="w-full">
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
        </div>
      )
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    {takingQuiz ? renderQuizContent() : (
                        activeLecture ? (
                            <div className='space-y-4'>
                                <h2 className="text-xl font-bold">{activeLecture.title}</h2>
                                {renderLectureContent(activeLecture)}
                            </div>
                        ) : (
                            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                <ListVideo className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-2 text-sm font-medium">No lecture selected</h3>
                                <p className="mt-1 text-sm text-muted-foreground">Select a lecture from the list to begin.</p>
                            </div>
                        )
                    )}
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle>Course Content</CardTitle>
                    <div className="mt-2">
                        <Label className="text-sm text-muted-foreground">Progress</Label>
                        <Progress value={courseProgress} className="h-2 mt-1" />
                        <p className="text-xs text-muted-foreground mt-1">{completedTasks} of {totalTasks} items completed</p>
                    </div>
                </CardHeader>
                <CardContent>
                    {isCertificateEligible && (
                        <Button asChild className="w-full mb-4 bg-accent hover:bg-accent/90">
                            <Link href={`/my-courses/${course._id}/certificate`}>
                                <Award className="mr-2"/> View Certificate
                            </Link>
                        </Button>
                    )}
                    <Tabs defaultValue="lectures" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="lectures"><BookOpen /></TabsTrigger>
                            <TabsTrigger value="assignments"><ClipboardList /></TabsTrigger>
                            <TabsTrigger value="quizzes"><HelpCircle /></TabsTrigger>
                            <TabsTrigger value="announcements"><Bell /></TabsTrigger>
                        </TabsList>
                        <TabsContent value="lectures" className="mt-4">
                           <div className="space-y-2">
                             {lectures.length > 0 ? lectures.map(lecture => (
                                <button key={lecture._id} onClick={() => { setActiveLecture(lecture); resetQuizState(); }} className={`w-full text-left p-3 rounded-md flex items-center gap-3 transition-colors ${activeLecture?._id === lecture._id ? 'bg-accent/20' : 'hover:bg-muted'}`}>
                                    {iconMap[lecture.type]}
                                    <span className="flex-1">{lecture.title}</span>
                                </button>
                             )) : <p className="text-sm text-muted-foreground">No lectures available.</p>}
                           </div>
                        </TabsContent>
                        <TabsContent value="assignments" className="mt-4">
                           <Dialog open={!!selectedAssignment} onOpenChange={(isOpen) => {if (!isOpen) setSelectedAssignment(null)}}>
                           <Accordion type="single" collapsible className="w-full">
                                {assignments.map(assignment => {
                                    const submission = getSubmissionForAssignment(assignment._id);
                                    return (
                                        <AccordionItem value={assignment._id} key={assignment._id}>
                                            <AccordionTrigger>
                                               <div className="flex items-center gap-2">
                                                    {submission ? <CheckCircle className="h-4 w-4 text-green-500" /> : <CheckCircle className="h-4 w-4 text-muted-foreground" />}
                                                    <span>#{assignment.assignmentNumber}: {assignment.name}</span>
                                               </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="prose prose-sm max-w-none text-muted-foreground mb-4">
                                                    <p>{assignment.description}</p>
                                                    <p className="font-semibold mt-4">Instructions:</p>
                                                    <p style={{ whiteSpace: 'pre-wrap' }}>{assignment.instructions}</p>
                                                </div>
                                                {submission ? (
                                                    submission.status === 'graded' ? (
                                                        <Badge>Grade: {submission.grade}</Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="flex items-center gap-2">
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                            Submitted
                                                        </Badge>
                                                    )
                                                ) : (
                                                    <DialogTrigger asChild>
                                                        <Button onClick={() => setSelectedAssignment(assignment)}><Send className="mr-2"/> Submit Assignment</Button>
                                                    </DialogTrigger>
                                                )}
                                            </AccordionContent>
                                        </AccordionItem>
                                    )
                                })}
                           </Accordion>
                           {assignments.length === 0 && <p className="text-sm text-muted-foreground">No assignments for this course.</p>}
                           <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Submit: {selectedAssignment?.name}</DialogTitle>
                                    <DialogDescription>
                                        Choose your submission method below.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(handleSubmission)} className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="submissionType"
                                            render={({ field }) => (
                                                <FormItem className="space-y-3">
                                                <FormLabel>Submission Type</FormLabel>
                                                <FormControl>
                                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                            <FormControl><RadioGroupItem value="url" /></FormControl>
                                                            <FormLabel className="font-normal">URL</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                            <FormControl><RadioGroupItem value="file" /></FormControl>
                                                            <FormLabel className="font-normal">PDF Upload</FormLabel>
                                                        </FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        
                                        {submissionType === 'url' ? (
                                             <FormField
                                                control={form.control}
                                                name="submissionUrl"
                                                render={({ field }) => (
                                                    <FormItem>
                                                    <FormLabel>Submission URL</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://..." {...field} value={field.value ?? ''} />
                                                    </FormControl>
                                                    <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ) : (
                                            <FormField
                                                control={form.control}
                                                name="submissionFile"
                                                render={({ field: { value, onChange, ...fieldProps } }) => (
                                                    <FormItem>
                                                    <FormLabel>PDF File</FormLabel>
                                                    <FormControl>
                                                        <Input type="file" accept="application/pdf" onChange={(e) => onChange(e.target.files)} {...fieldProps} />
                                                    </FormControl>
                                                    <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button>
                                            </DialogClose>
                                            <Button type="submit" disabled={isSubmitting}>
                                                {isSubmitting ? 'Submitting...' : 'Submit'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                           </DialogContent>
                           </Dialog>
                        </TabsContent>
                         <TabsContent value="quizzes" className="mt-4">
                            <div className="space-y-2">
                                {quizzes.length > 0 ? quizzes.map(quiz => {
                                    const attempt = getAttemptForQuiz(quiz._id);
                                    return (
                                        <div key={quiz._id} className="p-3 border rounded-md flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                 {attempt ? <CheckCircle className="h-4 w-4 text-green-500" /> : <CheckCircle className="h-4 w-4 text-muted-foreground" />}
                                                 <div>
                                                    <p className="font-medium">{quiz.title}</p>
                                                    {attempt && <p className="text-sm text-muted-foreground">Score: {attempt.score}%</p>}
                                                 </div>
                                            </div>
                                            {!attempt && (
                                                <Button size="sm" onClick={() => startQuiz(quiz)}>Start Quiz</Button>
                                            )}
                                        </div>
                                    )
                                }) : <p className="text-sm text-muted-foreground">No quizzes available for this course.</p>}
                            </div>
                        </TabsContent>
                         <TabsContent value="announcements" className="mt-4">
                            <div className="space-y-4">
                                {announcements.length > 0 ? (
                                    announcements.map(announcement => (
                                        <div key={announcement._id} className="p-4 border rounded-lg">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-semibold">{announcement.title}</h4>
                                                <p className="text-xs text-muted-foreground">{format(new Date(announcement.createdAt), 'PP p')}</p>
                                            </div>
                                            <p className="mt-2 text-sm text-muted-foreground" style={{ whiteSpace: 'pre-wrap' }}>{announcement.content}</p>
                                        </div>
                                    ))
                                ) : (
                                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                    <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-2 text-sm font-medium">No announcements yet</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">The instructor hasn't posted any announcements.</p>
                                </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
             </Card>
        </div>
    </div>
  );
}
