/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4A3B78",
          dark: "#392C5E",
          light: "#EDE9F5",
        },
        background: "#F7F5FA",
        surface: "#FFFFFF",
        border: "#E5E1F0",
        text: {
          primary: "#2A2140",
          secondary: "#8B85A0",
          onBrand: "#FFFFFF",
        },
        success: "#16A34A",
        error: "#DC2626",
      },
      fontFamily: {
        heading: ["Fredoka", "sans-serif"],
        body: ["Nunito", "sans-serif"],
      },
    },
  },
};
