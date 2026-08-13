self.addEventListener('push', (event) => {
  if (!event.data) return
  const payload = event.data.json()

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/logo.png',
      badge: '/logo.png',
      data: { url: payload.url || '/admin/guests' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/admin/guests'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const exact = clients.find((c) => c.url.includes(url))
      if (exact && 'focus' in exact) return exact.focus()

      // App is already open on a different page -- navigate that window
      // to the exact request instead of leaving it where it was.
      const existing = clients[0]
      if (existing && 'navigate' in existing) {
        return existing.navigate(url).then((c) => c && c.focus())
      }

      if (self.clients.openWindow) return self.clients.openWindow(url)
    }),
  )
})
