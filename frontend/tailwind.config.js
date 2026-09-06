/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12172B',
        paper: '#FBFAF7',
        teal: {
          DEFAULT: '#2F6F62',
          dark: '#234F45',
          light: '#E4EEEC',
        },
        amber: {
          DEFAULT: '#C98A3B',
          light: '#F5E8D4',
        },
        slateink: '#5B6472',
        body: '#1B1F27',
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
