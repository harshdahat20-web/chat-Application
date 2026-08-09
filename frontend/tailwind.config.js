/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#C4746B',
          dark: '#A85E56',
          light: '#F0E0DD',
        },
        background: '#FAF6F5',
        surface: '#FFFFFF',
        border: '#E8DAD7',

        text: {
          primary: '#332B29',
          secondary: '#8C7D79',
          onBrand: '#FFFFFF',
        },

        success: '#6B8E5A',
        error: '#B5453C',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
}