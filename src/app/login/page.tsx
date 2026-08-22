'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, KeyRound, Mail, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@rinmukht.in');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg">
            <svg viewBox="0 0 24 24" className="w-8 h-8 stroke-current fill-none" strokeWidth="2.5">
              <path d="M4 12c3-4 6 4 9 0s6 4 7 0" />
              <path d="M4 16c3-4 6 4 9 0s6 4 7 0" opacity="0.6" />
            </svg>
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground">
            Welcome to Rinmukht
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground font-medium">
            Compare informal debts on equal footing with Effective Annual Cost (True Yearly Cost).
          </p>
        </div>

        {/* Demo Credentials Callout */}
        <div className="rounded-2xl bg-amber-500/10 p-4 border border-amber-500/20 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Instant Demo Ready
          </div>
          <p>
            Log in with demo credentials: <strong className="font-mono font-bold">demo@rinmukht.in</strong> / <strong className="font-mono font-bold">password123</strong> (pre-seeded with varied informal debts).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-card p-6 shadow-sm border border-border space-y-4">
          {error && (
            <div className="rounded-xl bg-destructive/10 p-3 text-xs sm:text-sm font-bold text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm sm:text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                placeholder="demo@rinmukht.in"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm sm:text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 py-3.5 text-base font-bold text-white shadow-md transition-all min-h-[48px] disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In to Rinmukht
              </>
            )}
          </button>

          <p className="text-center text-xs sm:text-sm text-muted-foreground pt-2">
            Don't have an account?{' '}
            <Link href="/signup" className="font-bold text-amber-600 hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
