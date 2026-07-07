import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#404040",
        muted: "#595959",
        line: "#D9D9D9",
        paper: "#F1F1F1",
        blue: "#0C4E98",
        blue2: "#0F60A9",
        gold: "#C19A66",
        gold2: "#B69B80",
        oxblood: "#A10000",
        logo: "#E61800"
      },
      fontFamily: {
        sans: ["Arial", "Microsoft YaHei", "sans-serif"],
        mono: ["Consolas", "Menlo", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
