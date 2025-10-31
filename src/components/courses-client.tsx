
'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import CourseCard from '@/components/course-card';
import { ICourse } from '@/models/Course';
import { ICategory } from '@/models/Category';
import { Button } from './ui/button';

type CoursesClientProps = {
    courses: ICourse[];
    categories: ICategory[];
}

export default function CoursesClient({ courses, categories }: CoursesClientProps) {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const categoryQuery = searchParams.get('category') || 'All';

    const filteredCourses = useMemo(() => {
        let filtered = courses;

        if (categoryQuery && categoryQuery !== 'All') {
            filtered = filtered.filter(course =>
                course.category.toLowerCase() === categoryQuery.toLowerCase()
            );
        }

        if (query) {
            filtered = filtered.filter(course =>
                course.title.toLowerCase().includes(query.toLowerCase()) ||
                course.description.toLowerCase().includes(query.toLowerCase()) ||
                course.instructor.toLowerCase().includes(query.toLowerCase())
            );
        }

        return filtered;
    }, [query, courses, categoryQuery]);

    // Create a new URL search params object to manage state
    const createQueryString = (name: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(name, value);
        return params.toString();
    };

    return (
        <div className="container py-12">
            <h1 className="text-4xl font-bold tracking-tight font-headline">
                {query ? `Search results for "${query}"` : 'All Courses'}
            </h1>
            <p className="mt-2 text-muted-foreground">
                {filteredCourses.length} courses found.
            </p>

            <div className="mt-8 flex items-center gap-2 flex-wrap">
                <a href={`?${createQueryString('category', 'All')}`}>
                    <Button variant={categoryQuery === 'All' ? 'default' : 'outline'}>
                        All
                    </Button>
                </a>
                {categories.map(category => (
                    <a key={category._id} href={`?${createQueryString('category', category.name)}`}>
                        <Button variant={categoryQuery === category.name ? 'default' : 'outline'}>
                            {category.name}
                        </Button>
                    </a>
                ))}
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCourses.length > 0 ? (
                    filteredCourses.map(course => (
                        <CourseCard key={course._id} course={{...course, id: course._id}} />
                    ))
                ) : (
                    <p>No courses match your search criteria.</p>
                )}
            </div>
        </div>
    );
}

