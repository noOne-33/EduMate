import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ExternalLink, GraduationCap } from 'lucide-react';

export default function ChatbotEdmatePage() {
  return (
    <div className="container py-12">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-accent" />
            Chatbot-EduMate Training Guidelines
          </CardTitle>
          <CardDescription>
            Instructions for retraining and updating the chatbot model on Botpress.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">How to Update the Chatbot Knowledge Base</h3>
            <p className="text-muted-foreground">
              The chatbot's knowledge and responses are managed directly within the Botpress platform. To add, remove, or modify the frequently asked questions (FAQs) that the chatbot can answer, you must update its Knowledge Base.
            </p>
          </div>
          
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-semibold">Step-by-Step Guide:</h4>
            <ul className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Click the "Go to Botpress Studio" button below to open the knowledge base editor.</li>
              <li>You will see a list of existing questions and answers. You can edit or delete any of them.</li>
              <li>To add a new FAQ, click the "Add" or similar button and enter the new question and its corresponding answer.</li>
              <li>Once you have finished making changes, Botpress will automatically save and retrain the model. There is no need for a manual "save" or "publish" step for the knowledge base.</li>
              <li>Test the chatbot on the live website to ensure your changes are reflected.</li>
            </ul>
          </div>

          <div>
            <Button asChild>
              <Link href="https://studio.botpress.cloud/43f2c90a-999d-4619-a6bf-b841afd6a40f/kb/kb_01K9Z1T8HBJMP1YRNB4PJKE4MP" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Go to Botpress Studio
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
