self.addEventListener("push", (event) => {
  let payload = {}

  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = {}
  }

  const title = typeof payload.title === "string" ? payload.title : "New customer message"
  const body = typeof payload.body === "string" ? payload.body : "Open Questions to review the latest message."

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/apple-icon.png",
      badge: "/icon-light-32x32.png",
      data: { url: "/admin/questions" },
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const targetUrl = new URL("/admin/questions", self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windowClients) => {
      for (const client of windowClients) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.navigate(targetUrl)
          return client.focus()
        }
      }

      return self.clients.openWindow(targetUrl)
    }),
  )
})
