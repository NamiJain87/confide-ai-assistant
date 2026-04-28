// ─────────────────────────────────────────────
//  Vite Configuration
// ─────────────────────────────────────────────
// This file tells Vite how to build and serve
// the React frontend.
//
// The `proxy` setting is key:
// Any request from the frontend to /api/...
// is automatically forwarded to the backend
// running on localhost:5000.
// This avoids CORS issues in development.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173, // Frontend runs here: http://localhost:5173
    proxy: {
      // Redirect all /api requests to the backend
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        // Path is forwarded as-is: /api/chat → /api/chat on the backend
      },
    },
  },
});
