const CACHE='nepo-v5';
const ASSETS=['./','./index.html','./manifest.json'];

// ─── INSTALL ───
self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>c.addAll(ASSETS))
      .then(()=>self.skipWaiting())
  );
});

// ─── ACTIVATE ───
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
      ))
      .then(()=>self.clients.claim())
  );
});

// ─── FETCH ───
self.addEventListener('fetch',e=>{
  const url=e.request.url;

  // HTML y navegación: SIEMPRE de la red, con fallback a caché
  if(e.request.mode==='navigate' || url.endsWith('index.html') || url.endsWith('/')){
    e.respondWith(
      fetch(e.request)
        .then(res=>{
          const copia=res.clone();
          caches.open(CACHE).then(c=>c.put(e.request,copia));
          return res;
        })
        .catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')))
    );
    return;
  }

  // Todo lo demás: caché primero, luego red
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match('./index.html')))
  );
});