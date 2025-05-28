
import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google'; // Corrected import
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Added Toaster

const geistSans = Geist({ // Corrected variable name
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({ // Corrected variable name
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MINAS TESTE SOLUÇÕES', // Updated title
  description: 'Soluções em Hidráulica e Automação.', // Updated description
  manifest: '/manifest.json',
  themeColor: '#da731b',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MinasTeste',
    // startupImage: [], // Você pode adicionar imagens de inicialização para dispositivos Apple aqui
  },
  icons: {
    apple: '/icons/icon-192x192.png', // Ícone para dispositivos Apple
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
