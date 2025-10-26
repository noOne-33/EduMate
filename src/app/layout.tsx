import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { cookies } from 'next/headers';
import * as jose from 'jose';

export const metadata: Metadata = {
  title: 'EduMate - Unlock Your Potential',
  description: 'Discover a world of knowledge with thousands of online courses.',
};

async function getUser() {
  const tokenCookie = cookies().get('token')?.value;
  if (!tokenCookie) {
    return null;
  }
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(tokenCookie, secret);
    return payload as { id: string; name: string; role?: string };
  } catch (e) {
    // This is expected if the token is invalid or expired
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();

  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <Header user={user} />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
