// Minimal static file server for the Next.js static export in out/.
// Handles clean URLs: /x -> /x.html -> /x/index.html, else 404.html.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "out");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const safe = path.normalize(clean).replace(/^(\.\.[/\\])+/, "");
  const candidates = [
    path.join(ROOT, safe),
    path.join(ROOT, safe + ".html"),
    path.join(ROOT, safe, "index.html"),
  ];
  for (const c of candidates) {
    try {
      if (fs.statSync(c).isFile()) return c;
    } catch { /* next */ }
  }
  return null;
}

export function startServer(port = 4173) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const file = resolveFile(req.url || "/");
      if (!file) {
        const notFound = path.join(ROOT, "404.html");
        const body = fs.existsSync(notFound) ? fs.readFileSync(notFound) : Buffer.from("not found");
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end(body);
        return;
      }
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      res.end(fs.readFileSync(file));
    });
    server.listen(port, "127.0.0.1", () => resolve({ server, port }));
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.QA_PORT || 4173);
  startServer(port).then(({ port }) => console.log(`qa server on http://127.0.0.1:${port}`));
}
