/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        vermelho: '#D6332B',
        verde: '#7CB342',
        amarelo: '#F5C400',
        creme: '#FBF7EF',
      },
    },
  },
  plugins: [],
};
