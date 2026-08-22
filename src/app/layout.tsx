import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { LanguageProvider } from '@/context/LanguageContext';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Rinmukht — Understand your informal debts in one place',
  description: 'Rinmukht helps households understand and normalize informal debts like moneylenders, kirana stores, relatives, chit funds, and BNPL apps.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-amber-500 selection:text-white font-sans text-[16px] sm:text-[17px] leading-relaxed">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <LanguageProvider>
            <div className="min-h-screen flex flex-col bg-background">
              <Navbar />
              <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                {children}
              </main>
              <footer className="border-t border-border bg-card/60 py-6 text-center text-xs sm:text-sm text-muted-foreground mt-12 transition-colors">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="font-semibold text-foreground/80">
                    Rinmukht — Informal Debt Normalizer & Financial Health Engine
                  </p>
                  <p className="text-muted-foreground font-medium">
                    Ground-truth deterministic debt mathematics for real-world borrowers
                  </p>
                </div>
              </footer>
            </div>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
