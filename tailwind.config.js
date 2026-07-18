/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15101C",
        panel: "#1B1523",
        line: "#332B45",
        amber: "#FFB13B",
        teal: "#4DD8C4",
        magenta: "#FF4D8D",
        muted: "#9088A6",
      },
    },
  },
  plugins: [],
};
