#!/usr/bin/env node
/**
 * Minimal static file server for local development.
 *
 * Port 4173 is deliberate: the Gatita API allowlists that origin, so requests
 * made from http://localhost:4173 are accepted. Serving on any other port
 * makes the browser block cross-origin API calls.
 *
 *   node serve.js           # http://localhost:4173
 *   PORT=5000 node serve.js # override if you need to
 */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const url = require("node:url");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, {
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(body);
};

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url || "/");
  let pathname = decodeURIComponent(parsed.pathname || "/");
  if (pathname.endsWith("/")) pathname += "index.html";

  const target = path.join(ROOT, path.normalize(pathname).replace(/^(\.\.[/\\])+/, ""));
  if (!target.startsWith(ROOT)) {
    send(res, 403, "Forbidden", { "Content-Type": "text/plain" });
    return;
  }

  fs.stat(target, (err, stats) => {
    if (err || !stats.isFile()) {
      const fallback = path.join(ROOT, "404.html");
      fs.readFile(fallback, (fallbackErr, html) => {
        send(res, 404, fallbackErr ? "Not found" : html, {
          "Content-Type": "text/html; charset=utf-8",
        });
      });
      return;
    }
    fs.readFile(target, (readErr, data) => {
      if (readErr) {
        send(res, 500, "Server error", { "Content-Type": "text/plain" });
        return;
      }
      send(res, 200, data, {
        "Content-Type": MIME[path.extname(target).toLowerCase()] || "application/octet-stream",
      });
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Gatita dev server running at http://localhost:${PORT}`);
  console.log("Port 4173 is required so the API accepts browser requests.");
});
