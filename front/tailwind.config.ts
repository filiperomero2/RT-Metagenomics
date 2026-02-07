// tailwind.config.js
import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.tsx",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        dark: {
          extend: "dark",
          colors: {
            primary: {
              50: "#ecfffe",
              100: "#d0fdfc",
              200: "#a6fbfb",
              300: "#69f5f7",
              400: "#25e6eb",
              500: "#09c9d1",
              600: "#0ba0af",
              700: "#10808e",
              800: "#166774",
              900: "#175562",
              DEFAULT: "#10808e",
              foreground: "#ffffff",
            },
            secondary: {
              DEFAULT: "#E08843"
            },
            focus: "#0ba0af",
          },
        },
        light: {
          extend: "light",
          colors: {
            primary: {
              50: "#ecfffe",
              100: "#d0fdfc",
              200: "#a6fbfb",
              300: "#69f5f7",
              400: "#25e6eb",
              500: "#09c9d1",
              600: "#0ba0af",
              700: "#10808e",
              800: "#166774",
              900: "#175562",
              DEFAULT: "#10808e",
              foreground: "#ffffff",
            },
            focus: "#0ba0af",
          },
        },
      },
    }),
  ],
};
