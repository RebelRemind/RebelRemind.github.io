import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function rebelRemindDataPlugin() {
  const dataDir = path.resolve(process.cwd(), "data");
  const distDir = path.resolve(process.cwd(), "dist", "data");

  return {
    name: "rebelremind-data-plugin",
    configureServer(server) {
      server.middlewares.use("/data", (req, res, next) => {
        const requestPath = req.url ? req.url.split("?")[0] : "/";
        const filePath = path.join(dataDir, requestPath);

        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          next();
          return;
        }

        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(fs.readFileSync(filePath));
      });
    },
    closeBundle() {
      if (fs.existsSync(dataDir)) {
        fs.mkdirSync(path.dirname(distDir), { recursive: true });
        fs.cpSync(dataDir, distDir, { recursive: true, force: true });
      }

      const distIndex = path.resolve(process.cwd(), "dist", "index.html");
      const dist404 = path.resolve(process.cwd(), "dist", "404.html");

      if (fs.existsSync(distIndex)) {
        fs.copyFileSync(distIndex, dist404);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), rebelRemindDataPlugin()],
});
