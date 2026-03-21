/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#065A82',
        teal: '#1C7293',
        midnight: '#21295C',
        'light-blue': '#F0F7FF',
      },
    },
  },
  plugins: [],
}
