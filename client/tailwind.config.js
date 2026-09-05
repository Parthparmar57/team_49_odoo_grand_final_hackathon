/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF5F0',
          100: '#FFE8DD',
          200: '#FFC8B3',
          500: '#FF5E1E',
          600: '#E0480C',
          700: '#B83204',
          orange: '#FF5E1E',
          teal: '#06B6D4',
          mint: '#10B981',
          dark: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-orange': '0 20px 50px -10px rgba(255, 94, 30, 0.25)',
        'glow-teal': '0 20px 50px -10px rgba(6, 182, 212, 0.25)',
        'card-soft': '0 10px 40px -15px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 20px 50px -10px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
