
const CACHE_NAME = "studydrill-offline-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./studydrill-icon-192.png",
  "./studydrill-icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(["./", "./index.html"]);
      await Promise.allSettled(
        APP_FILES.slice(2).map(file => cache.add(file))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(name =>
            name.startsWith("studydrill-offline-") &&
            name !== CACHE_NAME
          )
          .map(name => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin
  ) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        const response = await fetch(request);

        if (response.ok) {
          await cache.put(request, response.clone());
        }

        return response;
      } catch (error) {
        const saved = await cache.match(request);

        if (saved) return saved;

        if (request.mode === "navigate") {
          const homepage = await cache.match("./index.html");
          if (homepage) return homepage;
        }

        return Response.error();
      }
    })()
  );
});
