'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Dashboard />
      </main>
      <footer className="border-t border-border bg-card py-6 text-center text-xs text-muted-foreground transition-colors mt-12">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium">
            Rinmukt — Simple, Trustworthy Informal Debt Register.
          </p>
          <p className="text-muted-foreground font-mono text-[11px]">
            Step 1 • Manual Debt Management Engine
          </p>
        </div>
      </footer>
    </div>
  );
}
