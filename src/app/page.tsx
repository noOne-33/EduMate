import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import CourseCard from '@/components/course-card';
import { courses } from '@/lib/courses';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import PersonalizedRecommendations from '@/components/personalized-recommendations';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background') as ImagePlaceholder;
  const featuredCourses = courses.slice(0, 3);

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[560px] w-full">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            data-ai-hint={heroImage.imageHint}
            priority
          />
        )}
        <div className="relative z-10 flex h-full flex-col items-center justify-center bg-black/50 text-center p-4">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl font-headline">
            Unlock Your Potential
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-neutral-200">
            Discover a world of knowledge with thousands of online courses. Learn new skills, advance your career, and pursue your passions.
          </p>
          <Button asChild className="mt-8 bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg">
            <Link href="/courses">Explore Courses</Link>
          </Button>
        </div>
      </section>

      {/* Featured Courses */}
      <section id="featured-courses" className="py-12 md:py-24 lg:py-32">
        <div className="container">
          <h2 className="text-3xl font-bold tracking-tight text-center font-headline">
            Featured Courses
          </h2>
          <p className="mt-4 text-center text-muted-foreground">
            Hand-picked courses to help you get started on your learning journey.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Personalized Recommendations */}
      <section id="recommendations" className="py-12 md:py-24 lg:py-32 bg-primary/20">
        <div className="container">
          <h2 className="text-3xl font-bold tracking-tight text-center font-headline">
            Just for You
          </h2>
          <p className="mt-4 text-center text-muted-foreground">
            AI-powered recommendations based on your interests.
          </p>
          <div className="mt-8 max-w-2xl mx-auto">
            <PersonalizedRecommendations />
          </div>
        </div>
      </section>
    </>
  );
}
