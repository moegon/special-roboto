import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        atlas: {
          primary: "#1E90FF",
          surface: "#101827",
          accent: "#38BDF8"
        }
      }
    }
  },
  plugins: []
} satisfies Config;
