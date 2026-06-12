/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/client/**/*.{html,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: '#1E9E52',
        triondaRed: '#E5342B',
        triondaBlue: '#2F6BD8',
        triondaGold: '#D9A521'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
