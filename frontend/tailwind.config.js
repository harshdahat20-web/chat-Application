/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4A5A3A",
          dark: "#3A4830",
          light: "#DCE3D0",
        },
        background: "#F5F0E4",
        surface: "#FFFFFF",
        border: "#E8DFC8",
        accent: "#F5C518",

        text: {
          primary: "#1C1C1A",
          secondary: "#6B6B60",
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
