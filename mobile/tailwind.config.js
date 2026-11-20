/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        marcona: {
          red: "#B91C1C",
          blue: "#1E3A8A",
          gold: "#D97706",
          green: "#15803D",
        },
      },
    },
  },
  plugins: [],
};
