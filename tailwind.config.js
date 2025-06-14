/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./components/**/*.{vue,js,ts}",
      "./layouts/**/*.{vue,js,ts}",
      "./pages/**/*.{vue,js,ts}",
      "./app.vue",
    ],
    theme: {
      extend: {
        colors: {
          dblue: "#30464C", // Dark Blue
          mblue: "#46616F", // Medium Blue
          lgray: "#A2A8AE", // Light Gray
          lblue: "#87B4B7", // Light Blue
          burntorange: "#B65B33", // Burnt Orange
          tan: "#BDA86A", // Tan
          cream: "#D9D0C4", // Cream
        },
        fontFamily: {
          sans: ["Overpass", "sans-serif"],
          serif: ["Rokkitt", "serif"],
        },
      },
    },
    plugins: [],
  };