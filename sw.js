const CACHE_NAME = 'cubia-cache-v1'; // <--- ВАЖНО: Меняйте эту цифру (v1, v2, v3...) при каждом обновлении игры!
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
  // ... ваши остальные файлы
];

// 1. Установка нового Service Worker
self.addEventListener('install', event => {
  self.skipWaiting(); // Принудительно активируем новый SW, не дожидаясь закрытия вкладок
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// 2. Активация (удаление старого кэша)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // Удаляем старые версии кэша
          }
        })
      );
    }).then(() => {
      self.clients.claim(); // Берем контроль над всеми открытыми вкладками игры
    })
  );
});

// 3. Перехват запросов (Стратегия: сначала сеть, потом кэш)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Если интернет есть, сохраняем свежую версию в кэш
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Если интернета нет, берем из кэша
        return caches.match(event.request);
      })
  );
});
