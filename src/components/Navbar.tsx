'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/context/LanguageContext';
import { Language, languageNames } from '@/lib/translations';
import { ClearDebtsButton } from '@/components/TrustNotice';
import {
  Sun,
  Moon,
  LayoutDashboard,
  Table,
  Calendar,
  LogOut,
  Menu,
  X,
  Globe,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    { href: '/dashboard', label: t('navOverview') || 'Home', icon: LayoutDashboard },
    { href: '/debts', label: t('navComparison') || 'My Debts', icon: Table },
    { href: '/plan', label: t('navPlan') || 'Payoff Plan', icon: Calendar },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md transition-colors shadow-2xs">
      <div className="mx-auto flex h-16 sm:h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-3 group shrink-0">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-amber-600 text-white font-bold shadow-md shadow-amber-600/20 transition-transform group-hover:scale-105">
            <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12c3-4 6 4 9 0s6 4 7 0" />
              <path d="M4 16c3-4 6 4 9 0s6 4 7 0" opacity="0.6" />
            </svg>
          </div>
          <div>
            <span className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Rin<span className="text-amber-600">mukht</span>
            </span>
            <span className="block text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground font-bold">
              {t('appSubtitle') || 'Debt Freedom Tool'}
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm sm:text-base font-bold transition-all min-h-[44px] ${
                  isActive
                    ? 'bg-amber-600/10 text-amber-600 dark:text-amber-400 border border-amber-600/20 shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Multilingual Selector */}
          <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1.5 rounded-xl border border-border">
            <Globe className="w-4 h-4 text-amber-600 shrink-0" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-xs sm:text-sm font-bold text-foreground focus:outline-none cursor-pointer pr-1 py-1"
              aria-label="Language Selector"
            >
              {Object.entries(languageNames).map(([key, langMeta]) => (
                <option key={key} value={key} className="bg-card text-foreground">
                  {langMeta.native}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Debts */}
          <ClearDebtsButton className="hidden md:inline-flex" />

          {/* Light / Dark Mode Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-muted transition-colors"
              title="Toggle theme mode"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground hover:bg-muted"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1 animate-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-bold transition-all min-h-[52px] ${
                  isActive
                    ? 'bg-amber-600/10 text-amber-600 dark:text-amber-400 border border-amber-600/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2">
            <ClearDebtsButton className="w-full justify-center" />
          </div>
          {user && (
            <div className="pt-2 border-t border-border flex items-center justify-between px-2 mt-2">
              <span className="text-sm font-bold text-foreground truncate max-w-[120px]">{user.name}</span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 py-2 px-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <LogOut className="w-4 h-4" />
                {t('logOut') || 'Log out'}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
