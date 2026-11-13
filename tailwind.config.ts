import type { Config } from 'tailwindcss'

// VoluForge palette, shared with the Expo app (mobile/src/ui/theme.tsx).
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F8F5ED',
        paper: '#FFFDF8',
        ink: '#191B16',
        muted: '#5E6257',
        line: '#DEDCD2',
        soft: '#ECEBE1',
        ember: { DEFAULT: '#DB582C', dark: '#B9461F' },
        sage: '#DDEBCB',
        forest: '#3D5736',
        peach: '#F3D7C3',
        sky: '#DBE7EC',
        danger: '#AD3429',
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'sans-serif'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      maxWidth: { page: '1160px' },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
export default config
