"use client"; // For useRouter

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CompanyLogoIcon } from '@/components/icons/CompanyLogoIcon';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <header className="text-center mb-12">
        <div className="inline-block p-4 rounded-full bg-card shadow-lg mb-6">
           <Image 
            src="https://placehold.co/100x100.png" 
            alt="Company Logo" 
            width={100} 
            height={100} 
            className="rounded-full"
            data-ai-hint="circuit logo" 
            />
        </div>
        <h1 className="text-5xl font-bold mb-2 tracking-tight">Arduino Data Streamer</h1>
        <p className="text-xl text-foreground/80">Your solution for real-time data monitoring and logging.</p>
      </header>
      
      <main className="text-center">
        <Link href="/dashboard" passHref>
          <Button size="lg" className="px-12 py-6 text-lg rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            ENTER
          </Button>
        </Link>
      </main>

      <footer className="absolute bottom-8 text-center text-foreground/70 text-sm">
        <p>&copy; {new Date().getFullYear()} Arduino Data Systems. All rights reserved.</p>
      </footer>
    </div>
  );
}
