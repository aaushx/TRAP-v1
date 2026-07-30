import type { Config } from 'tailwindcss'

const config: Config = {
  // Files to scan for class names (PurgeCSS)
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],

  // Class-based dark mode — toggled by adding 'dark' class to <html>
  darkMode: 'class',

  theme: {
    extend: {
      // ── Font Families ─────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['Geist', 'JetBrains Mono', 'Menlo', 'monospace'],
      },

      // ── TRAP Design System Colors ─────────────────────────
      colors: {
        // Background layers
        'bg-base':    'var(--color-bg-base)',
        'bg-surface': 'var(--color-bg-surface)',
        'bg-overlay': 'var(--color-bg-overlay)',
        'bg-card':    'var(--color-bg-card)',
        'bg-container':         'var(--color-bg-container)',
        'bg-container-low':     'var(--color-bg-container-low)',
        'bg-container-high':    'var(--color-bg-container-high)',
        'bg-container-highest': 'var(--color-bg-container-highest)',

        // Brand colors
        'primary':    'var(--color-brand-primary)',
        'secondary':  'var(--color-brand-secondary)',

        // Dynamic fallback mapping for old brand color references (Violet -> Charcoal / Red)
        'violet': {
          50:  '#fbf9f8',
          100: '#f5f3f3',
          200: '#efeded',
          300: '#e4e2e2',
          400: 'var(--color-brand-primary)', // Maps to Charcoal #111111
          500: 'var(--color-brand-primary)',
          600: '#000000',
          700: '#000000',
          800: '#000000',
          900: '#000000',
          950: '#000000',
        },

        // Semantic colors
        'success': 'var(--color-success)',
        'warning': 'var(--color-warning)',
        'error':   'var(--color-error)',
        'info':    'var(--color-info)',

        // Difficulty colors (from design system)
        'difficulty-easy':   'var(--color-easy)',
        'difficulty-medium': 'var(--color-medium)',
        'difficulty-hard':   'var(--color-hard)',

        // Text hierarchy
        'text-primary':   'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary':  'var(--color-text-tertiary)',
        'text-disabled':  'var(--color-text-disabled)',

        // Border colors
        'border-subtle':  'var(--color-border-subtle)',
        'border-default': 'var(--color-border-default)',
        'border-strong':  'var(--color-border-strong)',
      },

      // ── Spacing ───────────────────────────────────────────
      spacing: {
        '4.5': '1.125rem',
        '18':  '4.5rem',
        '88':  '22rem',
      },

      // ── Border Radius ─────────────────────────────────────
      borderRadius: {
        'xl':  'var(--radius-lg)',
        '2xl': 'var(--radius-xl)',
        '3xl': 'var(--radius-2xl)',
      },

      // ── Box Shadows ───────────────────────────────────────
      boxShadow: {
        'glow-violet': 'none',
        'glow-sm':     'none',
        'card':        'var(--shadow-card)',
        'card-hover':  'none',
      },

      // ── Animations ────────────────────────────────────────
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      // ── Backdrop Blur ─────────────────────────────────────
      backdropBlur: {
        'xs': '4px',
      },
    },
  },

  plugins: [],
}

export default config
