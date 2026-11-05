/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      spacing: {
        '25': '100px',
        '30': '120px',
        '50': '200px',
      },
    },
  },
  plugins: [],
}