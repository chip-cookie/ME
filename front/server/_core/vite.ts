import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: {
      ...serverOptions,
      // Disable proxy in middleware mode — Express handles /api routing
      proxy: undefined,
    },
    appType: "custom",
  });

  app.use(vite.middlewares);

  // Catch-all: serve index.html for any non-API route (SPA fallback)
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();

    const url = req.originalUrl;

    const clientTemplate = path.resolve(
      import.meta.dirname,
      "../..",
      "client",
      "index.html"
    );

    fs.promises
      .readFile(clientTemplate, "utf-8")
      .then((template) => {
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`
        );
        return vite.transformIndexHtml(url, template);
      })
      .then((page) => {
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      })
      .catch((e) => {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      });
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist")
      : path.resolve(import.meta.dirname);
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // SPA fallback: serve index.html for any non-API, non-file route
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
