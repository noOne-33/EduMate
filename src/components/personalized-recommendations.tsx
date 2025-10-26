import { personalizedCourseRecommendations } from '@/ai/flows/personalized-course-recommendations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

// Mock user history for demonstration purposes. In a real app, this would be dynamic.
const mockUserHistory = `
- Viewed 'Web Development Bootcamp'
- Enrolled in 'The Ultimate Drawing Course'
- Searched for 'javascript tutorials'
- Spent 15 minutes on the 'Photography' category page
`;

export default async function PersonalizedRecommendations() {
  let recommendations: string[] = [];
  let error: string | null = null;

  try {
    const result = await personalizedCourseRecommendations({ userHistory: mockUserHistory });
    recommendations = result.recommendations;
  } catch (e) {
    console.error(e);
    error = "We couldn't generate recommendations for you at this time. Please try again later.";
  }

  return (
    <Card className="bg-background/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="p-2 bg-accent/20 rounded-full">
            <Lightbulb className="h-6 w-6 text-accent" />
          </div>
          <div>
            <CardTitle className="font-headline">AI-Powered Suggestions</CardTitle>
            <CardDescription>Courses we think you'll love, based on your activity.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-destructive">{error}</p>
        ) : (
          <ul className="space-y-3">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-foreground/90">{rec}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
