/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6FA8DC",
          dark: "#5089C4",
          light: "#EDF4FC",
        },
        background: "#E9EEF4",
        surface: "#F1F4F8",
        border: "#DDE4EC",

        text: {
          primary: "#10304F",
          secondary: "#5A6B7D",
          onBrand: "#10304F",
        },

        success: "#16A34A",
        error: "#DC2626",
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
};
