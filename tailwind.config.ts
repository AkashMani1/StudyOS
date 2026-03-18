import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
    "./api/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#09111f",
        mist: "#edf3ff",
        aurora: "#8ee3c1",
        ember: "#ff7b54",
        comet: "#5f6fff",
        tide: "#12213d",
        night: "#050816"
      },
      boxShadow: {
        glow: "0 20px 60px -24px rgba(95, 111, 255, 0.45)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(95, 111, 255, 0.22), transparent 30%), radial-gradient(circle at top right, rgba(142, 227, 193, 0.2), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(9,17,31,0.04))"
      }
    }
  },
  plugins: []
};

export default config;
