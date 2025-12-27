import type { Notification } from '~/types'

export const useNotifications = () => {
  const { data: notifications, refresh } = useFetch<Notification[]>('/api/notifications', {
    lazy: true,
    server: false
  })

  const unreadCount = computed(() => {
    if (!notifications.value) return 0
    return notifications.value.filter((n) => !n.isRead).length
  })

  async function markAsRead(id: string) {
    await $fetch(`/api/notifications/${id}/read`, { method: 'POST' })
    await refresh()
  }

  async function markAllAsRead() {
    await $fetch('/api/notifications/read-all', { method: 'POST' })
    await refresh()
  }

  return {
    notifications,
    unreadCount,
    refresh,
    markAsRead,
    markAllAsRead
  }
}
