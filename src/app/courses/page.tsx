'use client'

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import CourseCard from '@/components/course-card';
import { courses } from '@/lib/courses';
import { Skeleton } from '@/components/ui/skeleton';

function CoursesContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    const filteredCourses = useMemo(() => {
        if (!query) return courses;
        return courses.filter(course =>
            course.title.toLowerCase().includes(query.toLowerCase()) ||
            course.description.toLowerCase().includes(query.toLowerCase()) ||
            course.instructor.toLowerCase().includes(query.toLowerCase()) ||
            course.category.toLowerCase().includes(query.toLowerCase())
        );
    }, [query]);

    return (
        <div className="container py-12">
            <h1 className="text-4xl font-bold tracking-tight font-headline">
                {query ? `Search results for "${query}"` : 'All Courses'}
            </h1>
            <p className="mt-2 text-muted-foreground">
                {filteredCourses.length} courses found.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCourses.length > 0 ? (
                    filteredCourses.map(course => (
                        <CourseCard key={course.id} course={course} />
                    ))
                ) : (
                    <p>No courses match your search criteria.</p>
                )}
            </div>
        </div>
    );
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

export default function CoursesPage() {
    return (
        <Suspense fallback={<CoursesSkeleton />}>
            <CoursesContent />
        </Suspense>
    );
}
