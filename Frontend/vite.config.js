import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isDemoMode = env.VITE_DEMO_MODE !== "false";

  const config = {
    plugins: [react()],
    preview: {
      port: 4173,
      strictPort: false,
    },
  };

  // Proxy only when explicitly using a real backend
  if (!isDemoMode) {
    const apiTarget = env.VITE_API_PROXY_TARGET || "http://localhost:5104";
    config.server = {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    };
  }

  return config;
});
