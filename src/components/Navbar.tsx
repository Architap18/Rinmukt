'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Sun, Moon, PlusCircle, LayoutDashboard, Table, Calendar, LogOut, ShieldAlert } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/debts', label: 'Comparison Table', icon: Table },
    { href: '/plan', label: 'Payoff Plan', icon: Calendar },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-md transition-transform group-hover:scale-105">
            <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current fill-none" strokeWidth="2.5">
              <path d="M4 12c3-4 6 4 9 0s6 4 7 0" />
              <path d="M4 16c3-4 6 4 9 0s6 4 7 0" opacity="0.6" />
            </svg>
          </div>
          <div>
            <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
              Rin<span className="text-primary">mukt</span>
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Informal Debt Normalizer
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions & Profile */}
        <div className="flex items-center gap-3">
          <Link
            href="/debts/new"
            className="flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Add Debt</span>
          </Link>

          {/* Light / Dark Mode Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-muted transition-colors"
              title="Toggle theme mode"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          )}

          {user && (
            <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-border">
              <span className="text-xs font-semibold text-foreground">{user.name}</span>
              <button
                onClick={handleLogout}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
