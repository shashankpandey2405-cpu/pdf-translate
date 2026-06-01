/* PDFTrusted — shell cache + network-first navigate with offline fallback. */

const CACHE = "pdftrusted-shell-v14";
const SHELL = [
  "/",
  "/manifest.webmanifest",
  "/logo-96.png",
  "/logo-192.png",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/offline.html",
  "/pdf.worker.min.mjs",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => res)
        .catch(async () => {
          const offline = await caches.match("/offline.html");
          return offline || Response.error();
        }),
    );
    return;
  }

  if (SHELL.some((path) => url.pathname === path || url.pathname.endsWith(path))) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});
