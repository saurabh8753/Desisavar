// --- AUTO UPDATE SERVICE WORKER ---

const CACHE_NAME = "desisavar-auto-v1";

// जिन फाइलों को हमेशा cache रखना है
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

// INSTALL → cache + तुरंत activate
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );

  // नया SW तुरंत control ले ले
  self.skipWaiting();
});

// ACTIVATE → पुराने caches delete + control ले
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );

  self.clients.claim();
});

// FETCH STRATEGY:
// 🔹 HTML = network-first (ताकि हमेशा latest मिले)
// 🔹 बाकी = cache-first (तेज़ load)
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // HTML pages
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/index.html")))
    );
    return;
  }

  // Other files (CSS, JS, icons)
  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
      );
    })
  );
});
