'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, User, Mail, KeyRound, IndianRupee } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [monthlySurplus, setMonthlySurplus] = useState('3000');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, monthlySurplus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
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
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
            Create Your Account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Take control of informal debt with clear, calm financial math.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-card p-6 shadow-sm border border-border space-y-4">
          {error && (
            <div className="rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ramesh Kumar"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Estimated Monthly Surplus (₹)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="number"
                required
                value={monthlySurplus}
                onChange={(e) => setMonthlySurplus(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="3000"
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Amount of spare cash you can allocate towards debt repayment each month.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Account & Start Untangling
              </>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground pt-2">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary underline underline-offset-2">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
