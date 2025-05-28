
"use client"; // For useRouter

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <header className="text-center mb-12">
        <div className="inline-block p-4 rounded-xl bg-card shadow-lg mb-6">
           <Image
            src="/minas.teste.ico" 
            alt="MINAS TESTE SOLUÇÕES Logo"
            width={150} 
            height={150} 
            className="rounded-md"
            priority
            />
        </div>
        <h1 className="text-5xl font-bold mb-2 tracking-tight">MINAS TESTE SOLUÇÕES</h1>
        <p className="text-xl text-foreground/80">SOLUÇÕES EM HIDRÁULICA E AUTOMAÇÃO</p>
      </header>

      <main className="text-center">
        <Link href="/dashboard" passHref>
          <Button size="lg" className="px-12 py-6 text-lg rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            Iniciar
          </Button>
        </Link>
      </main>

      <footer className="absolute bottom-8 text-center text-foreground/70 text-sm">
        <p>&copy; {new Date().getFullYear()} MINAS TESTE SOLUÇÕES. All rights reserved.</p>
      </footer>
    </div>
  );
}
