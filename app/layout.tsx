import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/lib/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'LifeOS AI - The AI Operating System That Never Forgets',
  description:
    'LifeOS is an AI-powered operating system that continuously understands your entire digital life. Every interaction becomes connected memory in an evolving knowledge graph.',
  keywords: [
    'AI',
    'knowledge graph',
    'memory',
    'personal assistant',
    'productivity',
    'life os',
    'cognitive AI',
  ],
  authors: [{ name: 'LifeOS AI' }],
  openGraph: {
    title: 'LifeOS AI - The AI Operating System That Never Forgets',
    description:
      'Build your permanent knowledge base. Every interaction, document, and idea becomes connected memory.',
    type: 'website',
    locale: 'en_US',
    siteName: 'LifeOS AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LifeOS AI',
    description: 'The AI Operating System That Never Forgets',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
