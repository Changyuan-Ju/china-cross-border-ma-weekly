import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2F2F2F",
        muted: "#595959",
        subtle: "#7A746C",
        line: "#D9D5CE",
        line2: "#C5C5C5",
        paper: "#F4F2EE",
        surface: "#FFFDF9",
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
