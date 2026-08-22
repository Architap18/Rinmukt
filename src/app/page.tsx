'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-lg shadow-amber-600/30 animate-pulse">
        <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12c3-4 6 4 9 0s6 4 7 0" />
          <path d="M4 16c3-4 6 4 9 0s6 4 7 0" opacity="0.6" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Opening Rinmukht...</h2>
        <p className="text-sm text-muted-foreground font-medium">Preparing your financial overview</p>
      </div>
    </div>
  );
}
