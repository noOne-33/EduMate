import Link from 'next/link';
import { BookOpen, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import UserNav from './user-nav';
import { Button } from './ui/button';

type User = {
  id: string;
  name: string;
  role?: string;
} | null;

type HeaderProps = {
  user: User;
};

export default function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-accent" />
            <span className="font-bold font-headline">EduMate</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <form action="/courses">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  name="q"
                  placeholder="Search courses..."
                  className="pl-9"
                />
              </div>
            </form>
          </div>
          <nav className="flex items-center space-x-2">
            {user ? (
              <UserNav user={user} />
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
