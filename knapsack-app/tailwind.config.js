/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Epilogue', 'system-ui', 'sans-serif'],
        display: ['Epilogue', 'system-ui', 'sans-serif'],
        mono:    ['Epilogue', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '-0.01em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '-0.01em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.005em' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.005em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.01em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.015em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      colors: {
        knapsack: {
          dark: {
            bg: '#06060a',
            surface: 'rgba(255,255,255,0.035)',
            border: 'rgba(255,255,255,0.08)',
            text: '#eeecf5',
            'text-primary': '#eeecf5',
            'text-secondary': 'rgba(255,255,255,0.65)',
            'text-tertiary': 'rgba(255,255,255,0.45)',
            'text-muted': 'rgba(255,255,255,0.25)',
          },
          light: {
            bg: '#f2f1ed',
            surface: '#ffffff',
            border: 'rgba(0,0,0,0.07)',
            text: '#1a1920',
            'text-primary': '#1a1920',
            'text-secondary': 'rgba(0,0,0,0.6)',
            'text-tertiary': 'rgba(0,0,0,0.45)',
            'text-muted': 'rgba(0,0,0,0.35)',
          },
        },
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
};

