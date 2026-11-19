/* Кубия — service worker. Версия кэша меняется при каждом релизе (VERSION). */
const VERSION='1.0.1';
const CACHE='kubia-'+VERSION;
const ASSETS=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'];
self.addEventListener('install',e=>{
 e.waitUntil(caches.open(CACHE).then(c=>Promise.all(ASSETS.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{/* необязательный файл */})))));
});
self.addEventListener('activate',e=>{
 e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('kubia-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',e=>{
 const r=e.request;
 if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 if(r.mode==='navigate'){
  e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));}return res;}).catch(()=>caches.match('./index.html').then(m=>m||caches.match('./'))));
  return;
 }
 e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));}return res;})));
});
