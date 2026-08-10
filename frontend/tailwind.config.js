/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6C5DD3",
          dark: "#5B4BC4",
          light: "#EDEBFB",
        },
        background: "#F5F4FA",
        surface: "#FFFFFF",
        border: "#E5E3F5",

        text: {
          primary: "#1E1B39",
          secondary: "#8B8AA3",
          onBrand: "#FFFFFF",
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
