/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        error: "#ff4444",
        warning: "#ffbb33",
        success: "#00C851",
        masala: {
          50: "#f6f6f6",
          100: "#e7e7e7",
          200: "#d1d1d1",
          300: "#b0b0b0",
          400: "#888888",
          500: "#6d6d6d",
          600: "#5d5d5d",
          700: "#4f4f4f",
          800: "#474747",
          900: "#3d3d3d",
          950: "#262626",
        },
      },
      outlineColor: {
        error: "#ff4444",
        warning: "#ffbb33",
        success: "#00C851",
      },
      zIndex: {
        tooltip: "1000",
      },
    },
  },
  plugins: [],
};
