import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": { target: "http://127.0.0.1:3001", changeOrigin: false },
    },
    fs: {
      deny: [
        ".env",
        ".env.*",
        "*.{crt,pem}",
        "**/.git/**",
        fileURLToPath(new URL("./data/**", import.meta.url)),
        "**/*.sqlite*",
        "**/*.csv",
      ],
    },
  },
});
