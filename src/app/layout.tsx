import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Providers } from '@/components/shared/Providers';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CarrièrePilot — Votre copilote IA pour décrocher le job de vos rêves',
    template: '%s | CarrièrePilot',
  },
  description:
    "Créez un CV optimisé, générez des lettres personnalisées et postulez automatiquement grâce à l'IA. La plateforme SaaS de recherche d'emploi nouvelle génération.",
  keywords: ['recherche emploi', 'CV', 'lettre de motivation', 'IA', 'SaaS', 'matching emploi'],
  authors: [{ name: 'CarrièrePilot' }],
  openGraph: {
    title: 'CarrièrePilot — Votre copilote IA pour décrocher le job de vos rêves',
    description: "Créez un CV optimisé, générez des lettres et postulez automatiquement grâce à l'IA.",
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CarrièrePilot',
    description: "La plateforme SaaS de recherche d'emploi propulsée par l'IA.",
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://carrierepilot.fr'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-body antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                background: '#FFFFFF',
                color: '#1E293B',
                boxShadow: '0 4px 32px rgba(15, 52, 96, 0.12)',
                border: '1px solid #E2E8F0',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
              },
              success: {
                iconTheme: { primary: '#059669', secondary: '#FFFFFF' },
              },
              error: {
                iconTheme: { primary: '#DC2626', secondary: '#FFFFFF' },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
