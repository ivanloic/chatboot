/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f6efe7",
        ink: {
          900: "#111111",
          700: "#4a4a4a",
        },
        copper: {
          500: "#b56a2e",
          600: "#995f26",
        },
      },
    },
  },
  plugins: [],
}

