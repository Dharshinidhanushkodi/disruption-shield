/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        card: "#12121a",
        accent: {
          blue: "#00d2ff",
          purple: "#9d50bb",
          neon: "#39ff14"
        }
      },
      boxShadow: {
        'neon-blue': '0 0 5px #00d2ff, 0 0 20px #00d2ff',
        'neon-purple': '0 0 5px #9d50bb, 0 0 20px #9d50bb',
      }
    },
  },
  plugins: [],
}
