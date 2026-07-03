import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#0F2F17',
          900: '#1B5E20',
          700: '#2E7D32',
          500: '#43A047',
        },
        acid: '#76FF03',
        ink: '#1A2E1C',
        sage: {
          50: '#F4F7F4',
          100: '#EAF1E9',
          200: '#DDE8DD',
          400: '#8FAF8F',
        },
        amber: { 600: '#F9A825', 50: '#FFF8E1' },
        plum: { 600: '#6A1B9A', 50: '#F3E5F5' },
        sky: { 600: '#0288D1', 50: '#E3F2FD' },
        rose: { 600: '#E53935', 50: '#FDECEA' },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(27, 94, 32, 0.08)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
