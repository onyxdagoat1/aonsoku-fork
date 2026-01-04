/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Dark theme colors (inspired by Spotify/Apple Music)
        primary: {
          DEFAULT: '#6366f1', // Indigo
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          DEFAULT: '#f472b6', // Pink accent
          light: '#f9a8d4',
          dark: '#db2777',
        },
        dark: {
          DEFAULT: '#0a0a0f',
          50: '#1a1a24',
          100: '#12121a',
          200: '#0f0f16',
          300: '#0c0c12',
          400: '#09090e',
          500: '#06060a',
          card: '#16161f',
          surface: '#1e1e2a',
          border: '#2a2a3a',
        },
        light: {
          DEFAULT: '#ffffff',
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          surface: '#ffffff',
          card: '#f8f9fa',
        },
        success: '#22c55e',
        warning: '#eab308',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
