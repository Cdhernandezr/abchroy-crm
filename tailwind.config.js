/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-panel': '#0D0A35', // Ajusta según tu diseño
        'brand-text': '#FFFFFF',  // Ajusta según tu diseño
      }
    },
  },
  plugins: [],
}