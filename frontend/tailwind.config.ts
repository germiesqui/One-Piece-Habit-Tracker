import type { Config } from 'tailwindcss'
 
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Parchment palette
        parchment: {
          50:  '#fdfaf3',
          100: '#f9f1dc',
          200: '#f2e0b0',
          300: '#e8c97a',
          400: '#dcaf45',
          500: '#c9952e',
          600: '#a87422',
          700: '#86591a',
          800: '#6b4516',
          900: '#553614',
        },
        // Deep sea teal
        sea: {
          50:  '#edfafa',
          100: '#d5f5f6',
          200: '#afe6ea',
          300: '#75d0d9',
          400: '#38b2bf',
          500: '#1e919e',
          600: '#1a7585',
          700: '#1b5f6d',
          800: '#1d4e5a',
          900: '#1c4049',
        },
        // Wanted poster rust/red
        wanted: {
          50:  '#fff5f0',
          100: '#ffe8dc',
          200: '#ffd0b8',
          300: '#ffad87',
          400: '#ff7d4d',
          500: '#f75528',
          600: '#e33a12',
          700: '#bc2d0f',
          800: '#952714',
          900: '#7a2415',
        },
        // Ink dark
        ink: {
          50:  '#f4f4f0',
          100: '#e5e4dc',
          200: '#cccabd',
          300: '#aaa795',
          400: '#8b8774',
          500: '#726e5c',
          600: '#5a5748',
          700: '#48453a',
          800: '#3c3a31',
          900: '#2a2820',
          950: '#1a1914',
        },
      },
      fontFamily: {
        display: ['"Cinzel Decorative"', 'serif'],
        heading: ['"Cinzel"', 'serif'],
        body: ['"Crimson Pro"', 'serif'],
        mono: ['"Courier Prime"', 'monospace'],
      },
      backgroundImage: {
        'parchment-texture': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'parchment': '0 2px 8px rgba(42, 40, 32, 0.12), 0 1px 3px rgba(42, 40, 32, 0.08)',
        'parchment-lg': '0 8px 32px rgba(42, 40, 32, 0.16), 0 2px 8px rgba(42, 40, 32, 0.10)',
        'inset-parchment': 'inset 0 1px 4px rgba(42, 40, 32, 0.10)',
        'wanted': '4px 4px 0px rgba(42, 40, 32, 0.25)',
      },
      borderRadius: {
        'sm': '2px',
        DEFAULT: '4px',
        'md': '6px',
        'lg': '8px',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'stamp': {
          '0%':   { opacity: '0', transform: 'scale(1.4) rotate(-8deg)' },
          '60%':  { opacity: '1', transform: 'scale(0.95) rotate(1deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in':  'fade-in 0.4s ease-out forwards',
        'slide-up': 'slide-up 0.5s ease-out forwards',
        'stamp':    'stamp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'shimmer':  'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
 
export default config