/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        marcona: {
          red: '#B91C1C',
          blue: '#1E3A8A',
          gold: '#D97706',
          green: '#15803D',
        },
      },
    },
  },
  plugins: [],
}
