import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /** Semantic accent — use `orange-*` in UI; this is for programmatic reference */
        primary: '#10b981', // emerald accent
        secondary: '#f59e0b',
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      fontFamily: {
        sans: [
          'Avenir Next',
          'SF Pro Display',
          'Segoe UI',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      spacing: {
        safe: '1rem',
      },
      boxShadow: {
        glass:
          '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        'glass-lg':
          '0 24px 48px -12px rgba(0, 0, 0, 0.55), 0 12px 24px -8px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'glow-sm': '0 0 24px -4px rgba(16, 185, 129, 0.35)',
        'glow-md': '0 0 40px -6px rgba(16, 185, 129, 0.45)',
        nav: '0 4px 24px rgba(0, 0, 0, 0.35), inset 0 -1px 0 rgba(255, 255, 255, 0.06)',
      },
      backgroundImage: {
        'gradient-radial-accent':
          'radial-gradient(ellipse 80% 60% at 50% -30%, rgba(249, 115, 22, 0.16), transparent 55%)',
        'gradient-radial-side':
          'radial-gradient(ellipse 50% 70% at 100% 40%, rgba(52, 211, 153, 0.08), transparent 50%)',
        'grid-subtle':
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '72px 72px',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}

export default config
