/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: '#0F1F33',
        teal: '#0B6B58',
        'teal-light': '#4FD1B5',
        paper: '#F6F4EE',
        card: '#FDFCF8',
        border: '#E1DDD0',
        amber: '#E9A93B',
        slate: '#3B4A5C',
      },
      fontFamily: {
        heading: ['"Source Serif 4"', 'Georgia', 'serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}