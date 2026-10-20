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
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        duo: {
          green: '#58cc02',
          darkGreen: '#46a302',
          yellow: '#ffc800',
          darkYellow: '#e5b200',
          orange: '#ff9600',
          blue: '#1cb0f6',
          darkBlue: '#1899d6',
          feather: '#777777',
          border: '#e5e7eb'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      },
      animation: {
        'bounce-subtle': 'bounceSubtle 2.5s infinite ease-in-out',
        'wiggle': 'wiggle 1.2s infinite ease-in-out',
      }
    },
  },
  plugins: [],
}
