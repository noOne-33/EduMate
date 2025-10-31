
import { Suspense } from 'react';
import dbConnect from '@/lib/mongodb';
import Course from '@/models/Course';
import Category from '@/models/Category';
import { Skeleton } from '@/components/ui/skeleton';
import CoursesClient from '@/components/courses-client';
import type { ICourse } from '@/models/Course';
import type { ICategory } from '@/models/Category';

async function getCoursesData() {
  await dbConnect();
  try {
    const courses = await Course.find({}).sort({ title: 1 }).lean();
    const categories = await Category.find({}).sort({ name: 1 }).lean();
    return { 
      courses: JSON.parse(JSON.stringify(courses)) as ICourse[], 
      categories: JSON.parse(JSON.stringify(categories)) as ICategory[]
    };
  } catch (error) {
    console.error("Failed to fetch courses or categories:", error);
    return { courses: [], categories: [] };
  }
}

function CoursesSkeleton() {
    return (
        <div className="container py-12">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-6 w-1/4 mt-2" />
            <div className="mt-8 grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default async function CoursesPage() {
    const { courses, categories } = await getCoursesData();

    return (
        <Suspense fallback={<CoursesSkeleton />}>
            <CoursesClient courses={courses} categories={categories} />
        </Suspense>
    );
}
