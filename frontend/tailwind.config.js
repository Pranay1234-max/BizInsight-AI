/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5b4df2',
        background: '#f8fafc',
        sidebar: '#ffffff'
      }
    },
  },
  plugins: [],
}
