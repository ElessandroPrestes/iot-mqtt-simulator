/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0A0E1A',
          card:    '#111827',
          hover:   '#1C2333',
        },
        border: {
          DEFAULT: '#1E2D40',
          muted:   '#152030',
        },
        normal:   { DEFAULT: '#10B981', muted: '#064E3B' },
        warning:  { DEFAULT: '#FFB800', muted: '#451A00' },
        critical: { DEFAULT: '#FF3B3B', muted: '#450A0A' },
        accent:   { DEFAULT: '#00D4FF', muted: '#0C3040' },
        ink: {
          DEFAULT: '#E2E8F0',
          muted:   '#64748B',
          dim:     '#334155',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Inter"', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        card:             '0 4px 24px rgba(0, 0, 0, 0.4)',
        'glow-warning':   '0 0 20px rgba(255, 184, 0, 0.2)',
        'glow-critical':  '0 0 24px rgba(255, 59, 59, 0.35)',
        'glow-accent':    '0 0 20px rgba(0, 212, 255, 0.15)',
        'glow-normal':    '0 0 16px rgba(16, 185, 129, 0.15)',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        card: '0.75rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink':      'blink 1.2s step-start infinite',
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-in':   'slideIn 0.25s ease-out',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
      gridTemplateColumns: {
        'dashboard': 'var(--sidebar-width, 280px) 1fr',
        'sensors':   'repeat(auto-fill, minmax(240px, 1fr))',
        'charts':    'repeat(auto-fill, minmax(380px, 1fr))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
