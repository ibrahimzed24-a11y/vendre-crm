import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc5fb",
          400: "#36a4f6",
          500: "#0c86eb",
          600: "#026ac8",
          700: "#0355a2",
          800: "#074884",
          900: "#0c3d6e",
          950: "#082649",
        },
      },
    },
  },
  plugins: [],
};
export default config;
