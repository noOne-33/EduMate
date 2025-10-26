import Image from 'next/image';
import { notFound } from 'next/navigation';
import { courses } from '@/lib/courses';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { Clock, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const course = courses.find(c => c.id === params.id);

  if (!course) {
    notFound();
  }

  const image = PlaceHolderImages.find(img => img.id === course.imageId) as ImagePlaceholder;

  return (
    <div className="container py-12">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h1 className="text-4xl font-bold tracking-tight font-headline mb-2">{course.title}</h1>
          <p className="text-lg text-muted-foreground mb-4">{course.description}</p>
          <div className="flex items-center gap-4 mb-4 text-sm">
            <span>by {course.instructor}</span>
            <Badge variant="secondary">{course.category}</Badge>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span>{course.rating}</span>
            </div>
            <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>123,456 students</span>
            </div>
          </div>

        </div>
        <div className="md:col-span-1">
             <div className="relative h-64 w-full mb-4">
                {image && (
                <Image
                    src={image.imageUrl}
                    alt={image.description}
                    fill
                    className="object-cover rounded-lg"
                    data-ai-hint={image.imageHint}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                )}
            </div>
            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6">
                Enroll Now
            </Button>
        </div>
      </div>
      <div className="mt-12">
        <h2 className="text-2xl font-bold font-headline mb-4">Course Content</h2>
        <p>Details about the course content would go here.</p>
      </div>
    </div>
  );
}
