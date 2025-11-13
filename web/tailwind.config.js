/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef5ff',
          100: '#fce8ff',
          200: '#f9d0fe',
          300: '#f5a8fc',
          400: '#ee75f8',
          500: '#e13eef',
          600: '#c920d0',
          700: '#a716a8',
          800: '#8a1589',
          900: '#71166e',
          950: '#4d024a',
        },
      }
    },
  },
  plugins: [],
}

