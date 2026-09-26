/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0a0a',
          card: '#111111',
          subtle: '#1a1a1a',
          elevated: '#161616',
        },
        border: {
          DEFAULT: '#2a2a2a',
          light: '#333333',
        },
        gold: {
          DEFAULT: '#c9a84c',
          light: '#e2c07a',
          dark: '#9a7a30',
          muted: 'rgba(201, 168, 76, 0.12)',
        },
        surface: {
          text: '#f0f0f0',
          muted: '#a0a0a0',
          dim: '#606060',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['var(--font-serif)', '"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        gold: '0 0 20px rgba(201, 168, 76, 0.15)',
        card: '0 4px 20px rgba(0, 0, 0, 0.6)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) both',
        slideInRight: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) both',
        scaleIn: 'scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) both',
      },
    },
  },
  plugins: [],
};
