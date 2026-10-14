var CACHE = "studydrill-v1";
var FILES = [
  "./", "index.html", "Manifest.json", "Icon.svg",
  "English_1.js", "English_2.js", "English_3.js", "English_4.js",
  "Chemistry_1.js", "Chemistry_2.js", "Chemistry_3.js", "Chemistry_4.js",
  "Physics_1.js", "Physics_2.js", "Physics_3.js", "Physics_4.js",
  "Mathematics_1.js", "Mathematics_2.js", "Mathematics_3.js", "Mathematics_4.js",
  "Biology_1.js", "Biology_2.js", "Biology_3.js", "Biology_4.js"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") { return; }
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      return res;
    }).catch(function () { return caches.match(e.request); })
  );
});