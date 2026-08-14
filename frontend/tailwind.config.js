/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2F6FED",
          dark: "#1D4FC4",
          light: "#E4EDFC",
        },
        background: "#EAF2FB",
        surface: "#FFFFFF",
        border: "#D7E3F0",
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
