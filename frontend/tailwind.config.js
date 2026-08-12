/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#116857",
          dark: "#0C4F42",
          light: "#DCEEE9",
        },
        background: "#F5F3EE",
        surface: "#FFFFFF",
        border: "#E2DFD6",

        text: {
          primary: "#1F2937",
          secondary: "#6B7280",
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
