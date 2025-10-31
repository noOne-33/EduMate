import { notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import Lecture from '@/models/Lecture';
import Assignment from '@/models/Assignment';
import Quiz from '@/models/Quiz';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ClipboardList, HelpCircle } from 'lucide-react';
import LectureManager from '@/components/lecture-manager';
import AssignmentManager from '@/components/assignment-manager';
import QuizManager from '@/components/quiz-manager';
import type { ILecture } from '@/models/Lecture';
import type { IAssignment } from '@/models/Assignment';
import type { IQuiz } from '@/models/Quiz';

async function getCourse(id: string) {
  try {
    await dbConnect();
    const course = await Course.findById(id).lean();
    if (!course) {
      return null;
    }
    return JSON.parse(JSON.stringify(course));
  } catch (error) {
    console.error("Failed to fetch course:", error);
    return null;
  }
}

async function getUser() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as { id: string; name: string; role?: string };
  } catch {
    return null;
  }
}

async function getLectures(courseId: string): Promise<ILecture[]> {
    try {
        await dbConnect();
        const lectures = await Lecture.find({ course: courseId }).sort({ order: 1 }).lean();
        return JSON.parse(JSON.stringify(lectures));
    } catch (error) {
        console.error("Failed to fetch lectures:", error);
        return [];
    }
}

async function getAssignments(courseId: string): Promise<IAssignment[]> {
    try {
        await dbConnect();
        const assignments = await Assignment.find({ course: courseId }).sort({ assignmentNumber: 1 }).lean();
        return JSON.parse(JSON.stringify(assignments));
    } catch (error) {
        console.error("Failed to fetch assignments:", error);
        return [];
    }
}

async function getQuizzes(courseId: string): Promise<IQuiz[]> {
    try {
        await dbConnect();
        const quizzes = await Quiz.find({ course: courseId }).sort({ createdAt: 1 }).lean();
        return JSON.parse(JSON.stringify(quizzes));
    } catch (error) {
        console.error("Failed to fetch quizzes:", error);
        return [];
    }
}

export default async function ManageCoursePage({ params }: { params: { id: string } }) {
  const user = await getUser();
  const course = await getCourse(params.id);

  if (!course) {
    notFound();
  }
  
  // Security check: ensure the logged-in user is the instructor for this course or an admin
  if (!user || (user.role !== 'admin' && user.name !== course.instructor)) {
     return (
      <div className="container py-12">
        <p>You are not authorized to manage this course.</p>
      </div>
    );
  }

  const lectures = await getLectures(course._id);
  const assignments = await getAssignments(course._id);
  const quizzes = await getQuizzes(course._id);

  return (
    <div className="container py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Manage: {course.title}</CardTitle>
          <CardDescription>Use the tabs below to manage lectures, assignments, and quizzes for this course.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="lectures" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="lectures">
                        <BookOpen className="mr-2"/> Lectures
                    </TabsTrigger>
                    <TabsTrigger value="assignments">
                        <ClipboardList className="mr-2"/> Assignments
                    </TabsTrigger>
                    <TabsTrigger value="quizzes">
                        <HelpCircle className="mr-2"/> Quizzes
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="lectures">
                    <LectureManager courseId={course._id} initialLectures={lectures} />
                </TabsContent>
                <TabsContent value="assignments">
                    <AssignmentManager courseId={course._id} initialAssignments={assignments} />
                </TabsContent>
                <TabsContent value="quizzes">
                   <QuizManager courseId={course._id} initialQuizzes={quizzes} />
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}