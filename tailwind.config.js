'use strict';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#070b10',
          900: '#0b1118',
          850: '#0f1720',
          800: '#131d27',
          700: '#1c2a37',
          600: '#2a3a49',
        },
        brand: {
          50: '#fff4ed',
          100: '#ffe6d5',
          200: '#ffc9aa',
          300: '#ffa374',
          400: '#ff8a4c',
          500: '#ff6b2c',
          600: '#f2551a',
          700: '#c93f0d',
          800: '#a0340f',
          900: '#812d10',
        },
        lime: {
          400: '#a3e635',
          500: '#84cc16',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        glow: '0 18px 60px -18px rgba(255, 107, 44, 0.55)',
        card: '0 24px 70px -30px rgba(0, 0, 0, 0.9)',
      },
      backgroundImage: {
        'radial-brand':
          'radial-gradient(circle at 20% 10%, rgba(255,107,44,0.18), transparent 45%), radial-gradient(circle at 85% 0%, rgba(245,158,11,0.12), transparent 40%)',
        'card-sheen':
          'linear-gradient(140deg, rgba(255,255,255,0.08), rgba(255,255,255,0) 45%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
