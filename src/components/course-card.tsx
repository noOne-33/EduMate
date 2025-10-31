
import Image from 'next/image';
import Link from 'next/link';
import type { Course } from '@/lib/courses';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Star } from 'lucide-react';
import type { ICourse } from '@/models/Course';

type CourseCardProps = {
  course: (Course | ICourse) & { id: string };
};

export default function CourseCard({ course }: CourseCardProps) {
  const image = PlaceHolderImages.find(img => img.id === course.imageId) as ImagePlaceholder;

  return (
    <Link href={`/courses/${course.id}`} className="group">
      <Card className="flex flex-col h-full overflow-hidden transition-all group-hover:shadow-lg group-hover:-translate-y-1">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            {image && (
              <Image
                src={image.imageUrl}
                alt={image.description}
                fill
                className="object-cover"
                data-ai-hint={image.imageHint}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <Badge variant="outline" className="mb-2">{course.category}</Badge>
          <CardTitle className="text-lg font-headline mb-1 leading-tight group-hover:text-accent">{course.title}</CardTitle>
          <p className="text-sm text-muted-foreground">by {course.instructor}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center text-sm text-muted-foreground border-t mt-auto mx-4 mb-4">
          <div className="flex items-center gap-1 pt-4">
             <span className="font-bold text-lg text-foreground">{course.price > 0 ? `${course.price.toLocaleString()} BDT` : 'Free'}</span>
          </div>
          <div className="flex items-center gap-1 pt-4">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span>{course.rating}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
