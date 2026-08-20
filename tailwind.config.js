/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        border: 'var(--border)',
        // Semantic non-alarming urgency colors
        urgency: {
          low: {
            bg: 'var(--urgency-low-bg)',
            text: 'var(--urgency-low-text)',
            border: 'var(--urgency-low-border)',
          },
          medium: {
            bg: 'var(--urgency-medium-bg)',
            text: 'var(--urgency-medium-text)',
            border: 'var(--urgency-medium-border)',
          },
          high: {
            bg: 'var(--urgency-high-bg)',
            text: 'var(--urgency-high-text)',
            border: 'var(--urgency-high-border)',
          },
        },
        // Social weight colors
        social: {
          high: 'var(--social-high)',
          medium: 'var(--social-medium)',
          low: 'var(--social-low)',
        }
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'sans-serif'],
        display: ['var(--font-fraunces)', 'serif'],
      },
    },
  },
  plugins: [],
};
