import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="bg-muted/40">
      <div className="container py-12">
          <h1 className="text-3xl font-bold tracking-tight font-headline mb-8">Dashboard</h1>
          <Card>
              <CardHeader>
                  <CardTitle>Welcome!</CardTitle>
                  <CardDescription>This is your protected dashboard.</CardDescription>
              </CardHeader>
              <CardContent>
                  <p>You have successfully logged in and can now access this page.</p>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
