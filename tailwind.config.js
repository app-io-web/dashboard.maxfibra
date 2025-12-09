/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#FEFCFB",
          500: "#1282A2",
          700: "#034078",
          800: "#001F54",
          900: "#0A1128",
        },
      },
    },
  },
  plugins: [],
};
