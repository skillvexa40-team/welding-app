/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./www/**/*.{html,js}"
  ],
  theme: {
    extend: {
      fontFamily: {
        urdu: ['"Noto Nastaliq Urdu"', 'serif']
      },
      colors: {
        primary: '#0f172a',
        accent: '#2563eb'
      }
    }
  },
  plugins: []
}