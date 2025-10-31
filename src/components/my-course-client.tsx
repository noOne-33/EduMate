
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ClipboardList, HelpCircle, Youtube, FileText, Link as LinkIcon, ListVideo } from 'lucide-react';
import type { ICourse } from '@/models/Course';
import type { ILecture } from '@/models/Lecture';
import type { IAssignment } from '@/models/Assignment';
import type { IQuiz } from '@/models/Quiz';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

type MyCourseClientProps = {
    course: ICourse;
    lectures: ILecture[];
    assignments: IAssignment[];
    quizzes: IQuiz[];
};

const iconMap = {
  youtube: <Youtube className="h-5 w-5 text-red-500" />,
  pdf: <FileText className="h-5 w-5 text-blue-500" />,
  url: <LinkIcon className="h-5 w-5 text-gray-500" />,
};

export default function MyCourseClient({ course, lectures, assignments, quizzes }: MyCourseClientProps) {
  const [activeLecture, setActiveLecture] = useState<ILecture | null>(lectures?.[0] || null);

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

  return (
    <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    {activeLecture ? (
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
                    )}
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle>Course Content</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="lectures" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="lectures"><BookOpen /></TabsTrigger>
                            <TabsTrigger value="assignments"><ClipboardList /></TabsTrigger>
                            <TabsTrigger value="quizzes"><HelpCircle /></TabsTrigger>
                        </TabsList>
                        <TabsContent value="lectures" className="mt-4">
                           <div className="space-y-2">
                             {lectures.length > 0 ? lectures.map(lecture => (
                                <button key={lecture._id} onClick={() => setActiveLecture(lecture)} className={`w-full text-left p-3 rounded-md flex items-center gap-3 transition-colors ${activeLecture?._id === lecture._id ? 'bg-accent/20' : 'hover:bg-muted'}`}>
                                    {iconMap[lecture.type]}
                                    <span className="flex-1">{lecture.title}</span>
                                </button>
                             )) : <p className="text-sm text-muted-foreground">No lectures available.</p>}
                           </div>
                        </TabsContent>
                        <TabsContent value="assignments" className="mt-4">
                           <Accordion type="single" collapsible className="w-full">
                                {assignments.map(assignment => (
                                    <AccordionItem value={assignment._id} key={assignment._id}>
                                        <AccordionTrigger>#{assignment.assignmentNumber}: {assignment.name}</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="prose prose-sm max-w-none text-muted-foreground">
                                                <p>{assignment.description}</p>
                                                <p className="font-semibold mt-4">Instructions:</p>
                                                <p style={{ whiteSpace: 'pre-wrap' }}>{assignment.instructions}</p>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                           </Accordion>
                            {assignments.length === 0 && <p className="text-sm text-muted-foreground">No assignments for this course.</p>}
                        </TabsContent>
                        <TabsContent value="quizzes" className="mt-4">
                            <div className="space-y-2">
                                {quizzes.map(quiz => (
                                    <div key={quiz._id} className="p-3 border rounded-md">
                                        <h4 className="font-semibold">{quiz.title}</h4>
                                        <p className="text-sm text-muted-foreground">{quiz.description}</p>
                                        <button className="text-sm text-accent mt-2">Start Quiz</button>
                                    </div>
                                ))}
                                {quizzes.length === 0 && <p className="text-sm text-muted-foreground">No quizzes for this course.</p>}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
             </Card>
        </div>
    </div>
  );
}
