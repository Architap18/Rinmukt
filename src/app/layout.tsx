import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Karza Untangler — Informal Debt Normalizer & Payoff Planner',
  description: 'Normalize informal debts in India (moneylenders, shopkeepers, relatives, chit funds, BNPL) into Effective Annual Cost and generate action payoff plans.',
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
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-border bg-card py-6 text-center text-xs text-muted-foreground">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>Karza Untangler — Grounded, Deterministic Financial Clarity for Informal Debt.</p>
              <p className="font-mono">Pure Financial Math Engine v1.0 • No LLM Financial Approximations</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
